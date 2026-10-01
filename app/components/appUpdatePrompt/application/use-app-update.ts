import type { ComputedRef, Ref } from 'vue'
import type { AppUpdateSource } from '../domain/app-update-source.interface'

/** Dependencias del aviso de version nueva. */
export interface AppUpdateParams {
  /** El `$pwa` del modulo, o `undefined` si no hay service worker. */
  source: AppUpdateSource | undefined
  /** Recarga la pagina cuando la version nueva ya tiene el control. */
  reloadAfterSwap: () => Promise<void>
}

/** Estado y acciones del aviso de version nueva. */
export interface AppUpdate {
  /** Si hay que mostrar el aviso. */
  isVisible: ComputedRef<boolean>
  /** Si la version nueva se esta activando. */
  isUpdating: Ref<boolean>
  /** Activa la version nueva y recarga. */
  update: () => Promise<void>
  /** Deja la version actual hasta la proxima vez. */
  dismiss: () => Promise<void>
}

/**
 * Caso de uso del aviso de version nueva del portal.
 *
 * El portal no se actualiza solo a media sesion: recargar a la mitad de una
 * reserva perderia lo que la persona estaba haciendo. Avisa y deja que ella
 * elija el momento. Sin service worker (desarrollo, navegador sin soporte) el
 * aviso simplemente no existe.
 *
 * La recarga no se delega al modulo: con el service worker ya reclamando la
 * pestaña, el modulo activaba la version nueva pero no recargaba y el aviso se
 * quedaba en "Actualizando". Aqui se activa sin recargar y se recarga al cambiar
 * de controlador.
 *
 * @param params Fuente PWA y recarga, inyectadas.
 * @returns El estado y las acciones del aviso.
 */
export const useAppUpdate = (params: AppUpdateParams): AppUpdate => {
  const { source } = params
  const isUpdating = ref<boolean>(false)
  const isVisible = computed<boolean>(() => source?.needRefresh.value === true)

  /** Activa la version en espera; si falla, el aviso sigue ahi para reintentar. */
  const update = async (): Promise<void> => {
    if (!source) return
    isUpdating.value = true
    try {
      await source.updateServiceWorker(false)
      await params.reloadAfterSwap()
    } catch (error) {
      console.error('useAppUpdate: error al activar la version nueva', error)
      isUpdating.value = false
    }
  }

  /** Descarta el aviso hasta la siguiente version publicada. */
  const dismiss = async (): Promise<void> => {
    if (!source) return
    try {
      await source.cancelPrompt()
    } catch (error) {
      console.error('useAppUpdate: error al descartar el aviso', error)
    }
  }

  return { isVisible, isUpdating, update, dismiss }
}
