import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import type { MyProfileView } from '../domain/membership.interface'

interface UseMyProfileParams {
  /** Lectura del perfil, ya cableada al cliente HTTP. */
  load: () => Promise<MyProfileView>
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
}

interface UseMyProfileReturn {
  /** Perfil y membresia, o `null` mientras no hayan cargado. */
  view: Ref<MyProfileView | null>
  /** Indica si hay una lectura en curso. */
  isLoading: Ref<boolean>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Lee el perfil. */
  refresh: () => Promise<void>
  /** Vuelve a leer el perfil sin parpadeo, tras un aviso en vivo. */
  sync: () => Promise<void>
  /** Reemplaza el perfil con uno recien guardado, sin releerlo. */
  replace: (next: MyProfileView) => void
}

/**
 * Caso de uso del tablero: leer el perfil y su membresia.
 *
 * El error de lectura NO se traga: un tablero vacio y un tablero que fallo se
 * ven igual, y la persona que ve el primero cree que perdio su membresia.
 *
 * @param params Lectura y texto de respaldo.
 * @returns El estado del tablero y sus acciones.
 */
export const useMyProfile = (params: UseMyProfileParams): UseMyProfileReturn => {
  const view = ref<MyProfileView | null>(null)
  const isLoading = ref(false)
  const errorTitle = ref('')

  const refresh = async (): Promise<void> => {
    if (isLoading.value) return

    isLoading.value = true
    errorTitle.value = ''

    try {
      view.value = await params.load()
    } catch (error: unknown) {
      console.error('useMyProfile: no se pudo leer el perfil', error)
      errorTitle.value = extractApiError(error)?.title ?? params.unexpectedTitle
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Vuelve a leer el tablero tras un aviso del canal en vivo: una cancelacion
   * del estudio, una reserva movida desde el mostrador.
   *
   * Sin esqueleto de carga y sin borrar lo que hay si falla. Si todavia no hay
   * tablero -la primera lectura fallo o sigue en curso-, usa la lectura normal.
   *
   * @returns Promesa que resuelve cuando termino, con exito o sin el.
   */
  const sync = async (): Promise<void> => {
    if (isLoading.value) return
    if (view.value === null) {
      await refresh()

      return
    }

    try {
      const next = await params.load()
      if (!isLoading.value) view.value = next
    } catch (error: unknown) {
      console.error('useMyProfile: no se pudo refrescar el perfil en vivo', error)
    }
  }

  const replace = (next: MyProfileView): void => {
    view.value = next
  }

  return { view, isLoading, errorTitle, refresh, sync, replace }
}
