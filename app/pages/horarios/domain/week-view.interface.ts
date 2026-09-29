import type { ScheduleSession } from './schedule.interface'

/** Un dia listo para pintarse. */
export interface WeekViewDay {
  /** Fecha, `YYYY-MM-DD`; sirve de llave. */
  date: string
  /** Encabezado: "lunes, 5 de octubre". */
  heading: string
  /** Es hoy en el estudio. */
  isToday: boolean
  /** Sus sesiones. */
  sessions: ScheduleSession[]
}

/** La semana lista para pintarse. */
export interface WeekView {
  /** Rango: "5 – 11 de octubre". */
  range: string
  /** No ha hecho su evaluacion ni tiene una agendada. */
  evaluationPending: boolean
  /** Evaluaciones de la semana, aparte y primero cuando esta pendiente. */
  evaluations: ScheduleSession[]
  /** Dias en el orden en que se muestran. */
  days: WeekViewDay[]
  /** La semana no tiene ni una sesion: todavia no abre. */
  isEmpty: boolean
}

/** Nombres con los que se presenta una sesion en una confirmacion. */
export interface SessionLabels {
  /** Nombre de la evaluacion. */
  evaluation: string
  /** Nombre de un entrenamiento sin servicio. */
  training: string
}

/** Sesion presentada en una confirmacion. */
export interface SessionSummary {
  /** Que es. */
  label: string
  /** Dia y hora del estudio. */
  when: string
}
