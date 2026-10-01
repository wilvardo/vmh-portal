import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import { extractApiError, isAnnouncedGlobally } from '~/resources/scripts/domain/api-error.helpers'
import type { MyReservationResult } from '~/resources/scripts/domain/my-reservation.interface'
import type { CancelNotice } from '../domain/reservation-cancel-dialog.interface'

/**
 * Rechazos que significan que lo que se ve ya no es lo real: la reserva cambio
 * en otra pestana, o el reloj cerro la ventana mientras la persona decidia. Se
 * explican con el texto del API, se cierra el dialogo y se refresca: insistir
 * no cambiaria la respuesta.
 */
const STALE_CODES: readonly string[] = [
  API_ERROR_CODE.ALREADY_CANCELLED,
  API_ERROR_CODE.RESERVATION_NOT_FOUND,
  API_ERROR_CODE.CANCEL_WINDOW_CLOSED
]

interface CancelMessages {
  /** Encabezado del exito. */
  successTitle: string
  /** Cuerpo del exito. */
  successDetail: string
  /** Encabezado cuando el fallo no trae el contrato del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseReservationCancelParams {
  /** Peticion al API, ya cableada. */
  cancel: (reservationId: number, reason: string) => Promise<MyReservationResult>
  /** Muestra un aviso. */
  notify: (notice: CancelNotice) => void
  /** Tras cancelar, o cuando el estado ya habia cambiado: refrescar. */
  onSettled: () => void
  /** Textos ya traducidos. */
  messages: CancelMessages
}

interface UseReservationCancelReturn {
  /** Hay una cancelacion en curso: bloquea el doble clic. */
  isCancelling: Ref<boolean>
  /**
   * Cancela y dice si el dialogo debe cerrarse.
   *
   * Se cierra en exito y cuando el estado ya habia cambiado (no hay nada mas
   * que hacer ahi); se queda abierto en un rechazo que la persona debe leer.
   */
  confirm: (reservationId: number, reason?: string) => Promise<boolean>
}

/**
 * Caso de uso de cancelar una reserva propia.
 *
 * El texto de cada rechazo es el del API, tal cual: la ventana cerrada ya dice
 * "contacta a recepcion". Lo unico que el portal decide es la salida: si la
 * reserva ya estaba cancelada, no existe o ya entro a la ventana, lo que se ve
 * esta viejo y lo que corresponde es refrescar, no insistir. Un fallo de red o
 * del servidor ya lo avisa el cliente HTTP: aqui no se repite.
 *
 * @param params Peticion, avisos, refresco y textos.
 * @returns El estado de la accion y la confirmacion.
 */
export const useReservationCancel = (
  params: UseReservationCancelParams
): UseReservationCancelReturn => {
  const isCancelling = ref(false)

  const confirm = async (reservationId: number, reason = ''): Promise<boolean> => {
    if (isCancelling.value) return false

    isCancelling.value = true

    try {
      await params.cancel(reservationId, reason)
      params.notify({
        severity: 'success',
        summary: params.messages.successTitle,
        detail: params.messages.successDetail
      })
      params.onSettled()
      return true
    } catch (error: unknown) {
      console.error('useReservationCancel: no se pudo cancelar la reserva', error)
      // Red o servidor: el cliente HTTP ya aviso. Queda abierto para reintentar.
      if (isAnnouncedGlobally(error)) return false

      const apiError = extractApiError(error)

      if (apiError !== null && STALE_CODES.includes(apiError.code)) {
        params.notify({ severity: 'info', summary: apiError.title, detail: apiError.detail })
        params.onSettled()
        return true
      }

      params.notify({
        severity: 'error',
        summary: apiError?.title ?? params.messages.unexpectedTitle,
        detail: apiError?.detail ?? params.messages.unexpectedDetail
      })
      return false
    } finally {
      isCancelling.value = false
    }
  }

  return { isCancelling, confirm }
}
