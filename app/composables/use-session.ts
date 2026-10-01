import {
  logout as logoutRequest,
  refreshSession as refreshSessionRequest
} from '~/resources/scripts/infrastructure/auth.repository'
import {
  clearStoredSession,
  readStoredSession,
  watchStoredSession,
  writeStoredSession
} from '~/resources/scripts/infrastructure/session-storage.repository'
import { runWithSessionLock } from '~/resources/scripts/infrastructure/session-lock.repository'
import { canAccessPortal } from '~/resources/scripts/domain/session.helpers'
import { SESSION_STORAGE_KEY } from '~/resources/scripts/domain/session.const'
import type { AuthSession, AuthUser } from '~/resources/scripts/domain/session.interface'

/**
 * Renovacion en vuelo. Es un singleton de modulo a proposito: varias peticiones
 * que reciben 401 al mismo tiempo deben esperar UN solo intento de renovacion.
 * Si cada una renovara por su cuenta, la segunda usaria un token ya rotado, el
 * API lo leeria como reuso y revocaria toda la familia de la sesion.
 *
 * Cubre una pestaña (un modulo cargado equivale a una pestaña en una SPA). Entre
 * pestañas lo cubre el candado del navegador de `runWithSessionLock`.
 */
let refreshInFlight: Promise<AuthSession | null> | null = null

interface StartSessionParams {
  /** Sesion emitida por el API. */
  session: AuthSession
}

interface SyncAcrossTabsParams {
  /**
   * Otra pestaña cerro la sesion (o la perdio). Quien escucha saca a la persona
   * de las pantallas privadas: lo que se ve ahi ya no le pertenece a nadie.
   */
  onSignedOut?: () => void
}

interface UseSessionReturn {
  /** Sesion viva, o `null` si no hay nadie firmado. */
  session: Ref<AuthSession | null>
  /** Persona autenticada, o `null`. */
  user: ComputedRef<AuthUser | null>
  /** Indica si hay una sesion con acceso al portal. */
  isAuthenticated: ComputedRef<boolean>
  /** Token de acceso vigente, o `null`. */
  accessToken: ComputedRef<string | null>
  /** Guarda la sesion en memoria y en el almacenamiento del navegador. */
  startSession: (params: StartSessionParams) => void
  /** Borra la sesion local sin avisar al servidor. */
  endSession: () => void
  /** Recupera la sesion persistida al arrancar la aplicacion. */
  restoreSession: () => AuthSession | null
  /** Renueva el par de credenciales, con un solo intento simultaneo. */
  renewSession: () => Promise<AuthSession | null>
  /** Cierra sesion en el servidor y localmente. */
  closeSession: () => Promise<void>
  /** Mantiene la sesion sincronizada con las demas pestañas abiertas. */
  syncAcrossTabs: (params?: SyncAcrossTabsParams) => () => void
}

/**
 * Sesion del panel: estado, persistencia y renovacion.
 *
 * Invoca `useRuntimeConfig` porque la URL del API es parte de su razon de ser
 * (excepcion documentada de `architecture.md`); no consume ningun otro hook de
 * presentacion, de modo que puede usarse desde middleware, plugins y slices.
 *
 * @returns El estado de la sesion y las acciones que la modifican.
 */
export const useSession = (): UseSessionReturn => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.BASE_API_PATH as string
  // Misma clave que el almacenamiento del navegador: el estado de Nuxt y lo
  // persistido nombran la misma sesion, y tenerla escrita dos veces es como se
  // acaba con una superficie leyendo la sesion de la otra.
  const session = useState<AuthSession | null>(SESSION_STORAGE_KEY, () => null)

  const user = computed<AuthUser | null>(() => session.value?.user ?? null)
  const accessToken = computed<string | null>(() => session.value?.accessToken ?? null)
  const isAuthenticated = computed<boolean>(() =>
    session.value === null ? false : canAccessPortal(session.value.user.role)
  )

  const startSession = (params: StartSessionParams): void => {
    session.value = params.session
    writeStoredSession({ session: params.session })
  }

  const endSession = (): void => {
    session.value = null
    clearStoredSession()
  }

  const restoreSession = (): AuthSession | null => {
    const stored = readStoredSession()
    session.value = stored
    return stored
  }

  /**
   * Renueva dentro del candado entre pestañas.
   *
   * Lo primero, ya con el candado, es releer el almacenamiento: si otra pestaña
   * renovo mientras esta esperaba, el par guardado ya es otro y se adopta en vez
   * de gastar el token viejo (que el API leeria como reuso). Si otra pestaña
   * cerro sesion, no hay nada que renovar. Si el almacenamiento no responde
   * (modo privado), se sigue con la sesion en memoria.
   *
   * @param stale Sesion con la que esta pestaña recibio el 401.
   * @returns La sesion vigente, o `null` si ya no hay sesion.
   */
  const renewUnderLock = (stale: AuthSession): Promise<AuthSession | null> =>
    runWithSessionLock({
      task: async (): Promise<AuthSession | null> => {
        const latest = readStoredSession() ?? session.value
        if (latest === null) {
          session.value = null
          return null
        }

        if (latest.refreshToken !== stale.refreshToken) {
          session.value = latest
          return latest
        }

        const renewed = await refreshSessionRequest({
          baseUrl,
          refreshToken: latest.refreshToken
        })
        startSession({ session: renewed })
        return renewed
      }
    })

  const renewSession = async (): Promise<AuthSession | null> => {
    const current = session.value
    if (current === null) return null

    // Segunda llamada concurrente: se cuelga del intento ya en vuelo.
    if (refreshInFlight !== null) return refreshInFlight

    refreshInFlight = renewUnderLock(current)
      .catch((error: unknown) => {
        // Token vencido, revocado o detectado como reuso: la sesion murio.
        console.error('useSession: error al renovar la sesion', error)
        endSession()
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })

    return refreshInFlight
  }

  const closeSession = async (): Promise<void> => {
    const current = session.value
    endSession()
    if (current === null) return

    try {
      await logoutRequest({
        baseUrl,
        accessToken: current.accessToken,
        refreshToken: current.refreshToken
      })
    } catch (error: unknown) {
      // La sesion local ya se borro: que el servidor no confirme la revocacion
      // no debe dejar a la persona atrapada dentro del panel.
      console.error('useSession: error al cerrar la sesion en el servidor', error)
    }
  }

  const syncAcrossTabs = (params: SyncAcrossTabsParams = {}): (() => void) =>
    watchStoredSession({
      onChange: (incoming, hadSession) => {
        session.value = incoming
        if (incoming === null && hadSession) params.onSignedOut?.()
      }
    })

  return {
    session,
    user,
    isAuthenticated,
    accessToken,
    startSession,
    endSession,
    restoreSession,
    renewSession,
    closeSession,
    syncAcrossTabs
  }
}
