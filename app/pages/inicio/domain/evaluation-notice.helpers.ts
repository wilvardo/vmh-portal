import type { EvaluationNotice } from './evaluation-notice.type'
import type { MyUpcomingReservation } from './upcoming-reservation.interface'

/**
 * Decide que aviso de evaluacion lleva el tablero.
 *
 * La evaluacion inicial es la puerta del entrenamiento: mientras no este hecha,
 * el tablero la recuerda. Si ya esta agendada, dice cuando (la mas proxima, que
 * es la primera porque el API las manda ordenadas); si no, pide agendarla. Una
 * vez asentada, el aviso desaparece: no hay nada que hacer con el.
 *
 * @param evaluationCompletedAt Marca de la evaluacion asentada, o `null`.
 * @param reservations Reservas por venir, de la mas proxima a la mas lejana.
 * @returns El aviso, o `null` si no corresponde ninguno.
 */
export const resolveEvaluationNotice = (
  evaluationCompletedAt: string | null,
  reservations: readonly MyUpcomingReservation[]
): EvaluationNotice | null => {
  if (evaluationCompletedAt !== null) return null

  const booked = reservations.find((reservation) => reservation.reservationType === 'evaluation')

  return booked === undefined ? { kind: 'schedule' } : { kind: 'booked', startsAt: booked.startsAt }
}
