import type { ApiFetch } from '~/composables/use-api'
import { cancelReservationEndpoint, MY_RESERVATION_ENDPOINT } from '../domain/my-reservation.const'
import { parseMyReservationResult } from '../domain/my-reservation.helpers'
import type { MyReservationResult } from '../domain/my-reservation.interface'

/** Mensaje unico de contrato roto: el API respondio algo que el portal no entiende. */
const CONTRACT_ERROR = 'my-reservations.repository: la respuesta del API no cumple el contrato'

interface BookParams {
  /** Cliente HTTP firmado. */
  apiFetch: ApiFetch
  /** Sesion elegida. */
  sessionSlotId: number
}

interface CancelParams {
  /** Cliente HTTP firmado. */
  apiFetch: ApiFetch
  /** Reserva propia a cancelar. */
  reservationId: number
}

/**
 * Reserva un lugar para el atleta autenticado.
 *
 * Solo manda la sesion: quien reserva lo dice el pase de acceso.
 *
 * @param params Cliente firmado y sesion.
 * @returns La reserva creada.
 * @throws Con el contrato de error del API si la reserva se rechaza.
 */
export const bookMySpot = async (params: BookParams): Promise<MyReservationResult> => {
  const response = await params.apiFetch<{ data: unknown }>(MY_RESERVATION_ENDPOINT.CREATE, {
    method: 'POST',
    body: { sessionSlotId: params.sessionSlotId }
  })

  const result = parseMyReservationResult(response?.data)
  if (result === null) throw new Error(CONTRACT_ERROR)

  return result
}

/**
 * Cancela una reserva propia.
 *
 * @param params Cliente firmado y reserva.
 * @returns La reserva ya cancelada.
 * @throws Con el contrato de error del API: ventana cerrada, ya cancelada o
 *   inexistente.
 */
export const cancelMyReservation = async (params: CancelParams): Promise<MyReservationResult> => {
  const response = await params.apiFetch<{ data: unknown }>(
    cancelReservationEndpoint(params.reservationId),
    { method: 'PATCH' }
  )

  const result = parseMyReservationResult(response?.data)
  if (result === null) throw new Error(CONTRACT_ERROR)

  return result
}
