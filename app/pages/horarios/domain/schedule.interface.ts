/** Estado de una sesion tal como lo manda el API. */
export type SessionStatus = 'available' | 'full' | 'blocked' | 'closed' | 'past'

/** Mi reserva en una sesion. */
export interface MySessionReservation {
  /** Reserva, para cancelarla. */
  reservationId: number
  /** Si todavia la puedo cancelar desde el portal. Lo decide el API. */
  isCancellable: boolean
}

/** Una sesion de la semana, reducida a lo que la pantalla usa. */
export interface ScheduleSession {
  /** Sesion, para reservarla. */
  sessionSlotId: number
  /** Entrenamiento o evaluacion. */
  sessionType: 'evaluation' | 'training'
  /** Servicio de la parrilla; `null` en la parrilla general. */
  serviceName: string | null
  /** Inicio en hora del estudio, `YYYY-MM-DDTHH:mm`. */
  startsAtLocal: string
  /** Duracion en minutos. */
  durationMinutes: number
  /** Cupo. */
  capacity: number
  /** Lugares libres: conteo, nunca nombres. */
  remaining: number
  /** Estado segun el API. */
  status: SessionStatus
  /** Mi reserva aqui, o `null`. */
  myReservation: MySessionReservation | null
}

/** Un dia de la semana. */
export interface ScheduleDay {
  /** Fecha del estudio, `YYYY-MM-DD`. */
  date: string
  /** Sesiones del dia, en orden de inicio. */
  sessions: ScheduleSession[]
}

/** La semana del atleta. */
export interface WeekSchedule {
  /** Lunes, `YYYY-MM-DD`. */
  weekStart: string
  /** Domingo, `YYYY-MM-DD`. */
  weekEnd: string
  /** No ha hecho su evaluacion ni tiene una agendada. */
  evaluationPending: boolean
  /** Los siete dias. */
  days: ScheduleDay[]
}

/**
 * Como se pinta una tarjeta. Bloqueada y cerrada se ven igual ("no
 * disponible"); tener reserva gana a cualquier otro estado.
 */
export type SessionCardState = 'available' | 'full' | 'unavailable' | 'past' | 'mine'
