/**
 * Rutas de las reservas del atleta en `vmh-api` (VMH-28). Cuelgan del perfil
 * propio: la identidad sale del pase de acceso, nunca del cuerpo.
 */
export const MY_RESERVATION_ENDPOINT = {
  /** Semana de sesiones con lugares libres y si se puede reservar cada una. */
  SCHEDULE: '/users/me/schedule',
  /** Reservar un lugar para mi. */
  CREATE: '/users/me/reservations'
} as const

/**
 * Ruta de la cancelacion de una reserva propia.
 *
 * @param reservationId Reserva a cancelar.
 * @returns La ruta lista para pedirse.
 */
export const cancelReservationEndpoint = (reservationId: number): string =>
  `/users/me/reservations/${reservationId}/cancel`
