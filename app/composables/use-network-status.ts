import type { Ref } from 'vue'

/** Estado de la conexion del dispositivo, tal como lo reporta el navegador. */
export interface NetworkStatus {
  /** `false` cuando el navegador sabe que no hay red. */
  isOnline: Readonly<Ref<boolean>>
}

/**
 * Sigue si el dispositivo tiene red, para decir "sin conexion" en lugar de
 * mostrar un error generico cuando una peticion falla por falta de red.
 *
 * Es un composable de runtime del navegador (excepcion declarada en
 * `architecture.md`): escuchar `online`/`offline` es su razon de ser. El valor
 * del navegador es optimista -"en linea" puede ser una red sin salida-, asi que
 * solo se usa para elegir que pantalla mostrar, nunca para bloquear una accion:
 * quien decide si algo se pudo es la respuesta del API.
 *
 * @returns El estado reactivo de la conexion.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const isOnline = ref<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine)

  /** Relee el estado que reporta el navegador. */
  const sync = (): void => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    sync()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', sync)
    window.removeEventListener('offline', sync)
  })

  return { isOnline: readonly(isOnline) }
}
