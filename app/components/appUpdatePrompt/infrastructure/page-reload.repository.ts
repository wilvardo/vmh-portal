/** Parametros de la recarga tras activar una version nueva. */
export interface ReloadAfterSwapParams {
  /** Tope de espera al cambio de controlador, en milisegundos. */
  timeoutMs: number
}

/**
 * Recarga la pagina en cuanto la version nueva del service worker toma el
 * control (`controllerchange`), o al vencer el tope si el evento no llega. Sin
 * navegador o sin service worker no hace nada.
 *
 * @param params Tope de espera.
 * @returns Una promesa que se resuelve al pedir la recarga.
 */
export const reloadAfterSwap = (params: ReloadAfterSwapParams): Promise<void> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      resolve()
      return
    }

    let done = false
    /** Recarga una sola vez, venga del evento o del tope. */
    const reload = (): void => {
      if (done) return
      done = true
      window.location.reload()
      resolve()
    }

    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
    window.setTimeout(reload, params.timeoutMs)
  })
