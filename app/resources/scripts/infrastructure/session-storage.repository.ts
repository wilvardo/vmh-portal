import { SESSION_STORAGE_KEY } from '../domain/session.const'
import { parseAuthSession } from '../domain/session.helpers'
import type { AuthSession } from '../domain/session.interface'

interface WriteSessionParams {
  /** Sesion a persistir. */
  session: AuthSession
}

interface WatchSessionParams {
  /**
   * Se invoca cuando OTRA pestaña cambia la sesion. Recibe la sesion nueva, o
   * `null` si la otra pestaña cerro sesion, y si antes del cambio habia una.
   */
  onChange: (session: AuthSession | null, hadSession: boolean) => void
}

/**
 * Lee la sesion persistida. Un contenido corrupto o de una version anterior se
 * trata como ausencia de sesion, no como error: la persona vuelve a firmar.
 *
 * @returns La sesion guardada, o `null` si no hay ninguna valida.
 */
export const readStoredSession = (): AuthSession | null => {
  // El panel es SPA, pero el guard evita que un prerender o un test sin DOM
  // truene al tocar `localStorage`.
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (raw === null) return null
    return parseAuthSession(JSON.parse(raw))
  } catch (error: unknown) {
    console.error('readStoredSession: error al leer la sesion guardada', error)
    return null
  }
}

/**
 * Persiste la sesion para que sobreviva a una recarga.
 *
 * @param params Sesion a guardar.
 */
export const writeStoredSession = (params: WriteSessionParams): void => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(params.session))
  } catch (error: unknown) {
    // Modo privado o cuota agotada: la sesion sigue viva en memoria, solo no
    // sobrevive a la recarga. No es motivo para tumbar la operacion en curso.
    console.error('writeStoredSession: error al guardar la sesion', error)
  }
}

/** Borra la sesion persistida. */
export const clearStoredSession = (): void => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (error: unknown) {
    console.error('clearStoredSession: error al borrar la sesion guardada', error)
  }
}

/**
 * Escucha los cambios de sesion hechos en OTRA pestaña del mismo navegador.
 *
 * Sin esto, dos pestañas del panel renovarian por su cuenta con el mismo token:
 * la segunda caeria en la deteccion de reuso del API y este revocaria toda la
 * familia de la sesion, cerrandola en ambas. El evento `storage` solo llega a
 * las pestañas que NO escribieron, que es justo lo que se necesita.
 *
 * @param params Callback que recibe la sesion nueva de la otra pestaña.
 * @returns Funcion para dejar de escuchar.
 */
export const watchStoredSession = (params: WatchSessionParams): (() => void) => {
  if (typeof window === 'undefined') return () => undefined

  const handler = (event: StorageEvent): void => {
    if (event.key !== SESSION_STORAGE_KEY) return

    // Se lee del evento y no de la memoria: otro oyente de esta misma pestaña
    // pudo haber vaciado ya la sesion en memoria.
    const hadSession = event.oldValue !== null

    if (event.newValue === null) {
      params.onChange(null, hadSession)
      return
    }

    try {
      params.onChange(parseAuthSession(JSON.parse(event.newValue)), hadSession)
    } catch (error: unknown) {
      console.error('watchStoredSession: error al leer la sesion de otra pestana', error)
      params.onChange(null, hadSession)
    }
  }

  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
