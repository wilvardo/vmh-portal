/**
 * Una reserva por venir del atleta, tal como la manda el API.
 *
 * El API publica el instante UTC; el portal lo pinta en la zona del estudio,
 * que es donde la persona tiene que presentarse, y no en la de su telefono.
 */
export interface MyUpcomingReservation {
  /** Identificador de la reserva. */
  id: number
  /** Evaluacion inicial o entrenamiento. */
  reservationType: 'evaluation' | 'training'
  /** Inicio de la sesion, instante ISO 8601. */
  startsAt: string
  /** Servicio de la sesion; nulo en la evaluacion y en la parrilla general. */
  serviceName: string | null
  /**
   * Si todavia se cancela desde el portal. Lo decide el API (ventana de
   * cancelacion); el portal solo muestra o esconde la accion.
   */
  isCancellable: boolean
}
