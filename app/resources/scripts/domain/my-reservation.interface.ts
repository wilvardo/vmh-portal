/** Resultado de reservar o cancelar, tal como lo usa el portal. */
export interface MyReservationResult {
  /** Reserva creada o cancelada. */
  reservationId: number
  /** Sesion afectada. */
  sessionSlotId: number
  /** Entrenamiento o evaluacion. */
  reservationType: 'evaluation' | 'training'
  /** Estado en que quedo. */
  status: 'active' | 'cancelled'
  /** Inicio de la sesion, instante UTC. */
  startsAt: string
}
