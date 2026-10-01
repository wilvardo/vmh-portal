import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import type { MyReservationResult } from '~/resources/scripts/domain/my-reservation.interface'
import type { BookingNotice } from '../domain/booking.interface'
import type { ScheduleSession } from '../domain/schedule.interface'

/**
 * Rechazos que son una carrera y no un error: se lleno mientras se decidia, ya
 * estaba reservada desde otra pestana, ya hay otra evaluacion agendada, la
 * sesion empezo o el estudio la cerro. Se avisan en tono informativo.
 */
const RACE_CODES: readonly string[] = [
  API_ERROR_CODE.SLOT_FULL,
  API_ERROR_CODE.ALREADY_RESERVED,
  API_ERROR_CODE.EVALUATION_ALREADY_BOOKED,
  API_ERROR_CODE.SLOT_ALREADY_STARTED,
  API_ERROR_CODE.SLOT_NOT_OPEN
]

interface BookingMessages {
  /** Encabezado del exito. */
  successTitle: string
  /** Cuerpo del exito. */
  successDetail: string
  /** Encabezado cuando el fallo no trae el contrato del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseSessionBookingParams {
  /** Peticion al API, ya cableada. */
  book: (sessionSlotId: number) => Promise<MyReservationResult>
  /** Muestra un aviso. */
  notify: (notice: BookingNotice) => void
  /** Vuelve a pedir la semana: el conteo mostrado siempre es el del servidor. */
  refresh: () => Promise<void>
  /** Textos ya traducidos. */
  messages: BookingMessages
}

interface UseSessionBookingReturn {
  /** Sesion que se esta por reservar, o `null`. */
  selected: Ref<ScheduleSession | null>
  /** El dialogo de confirmacion esta abierto. */
  isOpen: Ref<boolean>
  /** Hay una reserva en curso: bloquea el doble clic. */
  isBooking: Ref<boolean>
  /** Abre la confirmacion para una sesion. */
  open: (session: ScheduleSession) => void
  /** Cierra la confirmacion sin reservar. */
  close: () => void
  /** Reserva la sesion elegida. */
  confirm: () => Promise<void>
}

/**
 * Caso de uso de reservar una sesion desde la semana.
 *
 * El servidor decide todo -evaluacion, membresia, servicio, cupo- y el texto
 * de cada rechazo es el suyo, tal cual: ya dice por que y que sigue. El portal
 * solo decide la salida:
 *
 * - Exito: aviso y semana refrescada. **Nunca** se descuenta un lugar en local
 *   sin confirmar: el numero que se ve es siempre el del servidor.
 * - Cualquier rechazo del API: la semana que se ve esta vieja, porque el API
 *   calcula `canBook` con las mismas reglas con las que rechaza. Se explica, se
 *   cierra y se refresca, asi la tarjeta deja de ofrecer lo que ya no se puede.
 *   Las carreras (llena, ya reservada, ya empezo, cerrada) van en tono
 *   informativo; lo demas, como error.
 * - Fallo sin contrato (red): se explica y el dialogo queda abierto para
 *   reintentar.
 *
 * @param params Peticion, avisos, refresco y textos.
 * @returns El estado del dialogo y sus acciones.
 */
export const useSessionBooking = (params: UseSessionBookingParams): UseSessionBookingReturn => {
  const selected = ref<ScheduleSession | null>(null)
  const isOpen = ref(false)
  const isBooking = ref(false)

  const open = (session: ScheduleSession): void => {
    selected.value = session
    isOpen.value = true
  }

  const close = (): void => {
    if (isBooking.value) return
    isOpen.value = false
  }

  const confirm = async (): Promise<void> => {
    const session = selected.value
    if (session === null || isBooking.value) return

    isBooking.value = true

    try {
      await params.book(session.sessionSlotId)
      params.notify({
        severity: 'success',
        summary: params.messages.successTitle,
        detail: params.messages.successDetail
      })
      isOpen.value = false
      await params.refresh()
    } catch (error: unknown) {
      console.error('useSessionBooking: no se pudo reservar', error)
      const apiError = extractApiError(error)

      if (apiError === null) {
        params.notify({
          severity: 'error',
          summary: params.messages.unexpectedTitle,
          detail: params.messages.unexpectedDetail
        })
        return
      }

      params.notify({
        severity: RACE_CODES.includes(apiError.code) ? 'info' : 'error',
        summary: apiError.title,
        detail: apiError.detail
      })
      isOpen.value = false
      await params.refresh()
    } finally {
      isBooking.value = false
    }
  }

  return { selected, isOpen, isBooking, open, close, confirm }
}
