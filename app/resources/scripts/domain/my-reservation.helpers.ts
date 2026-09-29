import type { MyReservationResult } from './my-reservation.interface'

const KNOWN_TYPES: readonly string[] = ['evaluation', 'training']
const KNOWN_STATUSES: readonly string[] = ['active', 'cancelled']

/**
 * Valida y recorta la respuesta de reservar o cancelar.
 *
 * Descarta lo que el portal no declara: un campo nuevo del API no llega a la
 * pantalla por accidente.
 *
 * @param value Carga `data` de la respuesta.
 * @returns El resultado, o `null` si no cumple el contrato.
 */
export const parseMyReservationResult = (value: unknown): MyReservationResult | null => {
  if (typeof value !== 'object' || value === null) return null

  const { reservationId, sessionSlotId, reservationType, status, startsAt } = value as Record<
    string,
    unknown
  >

  if (typeof reservationId !== 'number' || typeof sessionSlotId !== 'number') return null
  if (typeof reservationType !== 'string' || !KNOWN_TYPES.includes(reservationType)) return null
  if (typeof status !== 'string' || !KNOWN_STATUSES.includes(status)) return null
  if (typeof startsAt !== 'string') return null

  return {
    reservationId,
    sessionSlotId,
    reservationType: reservationType as MyReservationResult['reservationType'],
    status: status as MyReservationResult['status'],
    startsAt
  }
}
