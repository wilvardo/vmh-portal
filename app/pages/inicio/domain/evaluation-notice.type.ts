/**
 * Que dice el aviso de evaluacion del tablero.
 *
 * - `schedule`: no la ha hecho ni la tiene agendada; se le pide agendarla.
 * - `booked`: la tiene agendada; se le recuerda cuando.
 *
 * Si ya esta hecha no hay aviso: el helper devuelve `null`.
 */
export type EvaluationNotice = { kind: 'schedule' } | { kind: 'booked'; startsAt: string }
