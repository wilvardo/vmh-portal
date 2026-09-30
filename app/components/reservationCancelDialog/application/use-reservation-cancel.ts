import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import type { MyReservationResult } from '~/resources/scripts/domain/my-reservation.interface'
import type { CancelNotice } from '../domain/reservation-cancel-dialog.interface'

/** Rechazos que significan "el estado ya cambio en otra pestana": se refresca. */
const STALE_CODES: readonly string[] = [
  API_ERROR_CODE.ALREADY_CANCELLED,
  API_ERROR_CODE.RESERVATION_NOT_FOUND
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
 * reserva ya estaba cancelada o no existe, el estado cambio en otra pestana y
 * lo que corresponde es refrescar, no insistir.
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
