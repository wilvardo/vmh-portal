import {
  DATE_LOCALE,
  DAYS_PER_WEEK,
  SESSION_STATUSES,
  SESSION_TYPES,
  STUDIO_TIMEZONE
} from './schedule.const'
import type {
  MySessionReservation,
  ScheduleDay,
  ScheduleProfessional,
  ScheduleSession,
  SessionCardState,
  WeekSchedule
} from './schedule.interface'

/** Forma de una fecha del estudio. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Forma de una hora local del estudio. */
const LOCAL_STAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/**
 * Lee mi reserva de una sesion.
 *
 * @param value Valor crudo.
 * @returns La reserva, `null` si no hay, o `undefined` si rompe el contrato.
 */
const parseMyReservation = (value: unknown): MySessionReservation | null | undefined => {
  if (value === null) return null
  if (typeof value !== 'object') return undefined

  const { reservationId, isCancellable } = value as Record<string, unknown>
  if (typeof reservationId !== 'number' || typeof isCancellable !== 'boolean') return undefined

  return { reservationId, isCancellable }
}

/**
 * Lee con quien es la sesion (D8).
 *
 * Es opcional en el contrato: una respuesta sin estos campos -o con uno solo-
 * se lee como sesion del estudio en lugar de invalidar la semana.
 *
 * @param raw Sesion cruda.
 * @returns El identificador y el nombre, o los dos en nulo.
 */
const readProfessional = (
  raw: Record<string, unknown>
): { professionalId: number | null; professionalName: string | null } => {
  const name = typeof raw.professionalName === 'string' ? raw.professionalName.trim() : ''

  if (typeof raw.professionalId !== 'number' || name === '') {
    return { professionalId: null, professionalName: null }
  }

  return { professionalId: raw.professionalId, professionalName: name }
}

/**
 * Lee una sesion y descarta lo que la pantalla no usa.
 *
 * @param value Valor crudo.
 * @returns La sesion, o `null` si rompe el contrato.
 */
const parseSession = (value: unknown): ScheduleSession | null => {
  if (typeof value !== 'object' || value === null) return null

  const raw = value as Record<string, unknown>
  const myReservation = parseMyReservation(raw.myReservation)

  const isValid =
    typeof raw.sessionSlotId === 'number' &&
    typeof raw.sessionType === 'string' &&
    SESSION_TYPES.includes(raw.sessionType) &&
    (raw.serviceName === null || typeof raw.serviceName === 'string') &&
    typeof raw.startsAtLocal === 'string' &&
    LOCAL_STAMP_PATTERN.test(raw.startsAtLocal) &&
    typeof raw.durationMinutes === 'number' &&
    typeof raw.capacity === 'number' &&
    typeof raw.remaining === 'number' &&
    typeof raw.status === 'string' &&
    SESSION_STATUSES.includes(raw.status) &&
    myReservation !== undefined

  if (!isValid) return null

  return {
    sessionSlotId: raw.sessionSlotId as number,
    sessionType: raw.sessionType as ScheduleSession['sessionType'],
    serviceName: raw.serviceName as string | null,
    ...readProfessional(raw),
    startsAtLocal: raw.startsAtLocal as string,
    durationMinutes: raw.durationMinutes as number,
    capacity: raw.capacity as number,
    remaining: raw.remaining as number,
    status: raw.status as ScheduleSession['status'],
    myReservation
  }
}

/**
 * Lee un dia de la semana.
 *
 * @param value Valor crudo.
 * @returns El dia, o `null` si rompe el contrato.
 */
const parseDay = (value: unknown): ScheduleDay | null => {
  if (typeof value !== 'object' || value === null) return null

  const { date, sessions } = value as Record<string, unknown>
  if (typeof date !== 'string' || !DATE_PATTERN.test(date) || !Array.isArray(sessions)) return null

  const parsed = sessions.map(parseSession)
  if (parsed.some((session) => session === null)) return null

  return { date, sessions: parsed as ScheduleSession[] }
}

/**
 * Valida la semana que manda el API y la recorta a lo que la pantalla usa.
 *
 * Una sesion rota invalida la semana entera: pintar a medias una disponibilidad
 * es peor que decir que no se pudo cargar, porque la persona reservaria contra
 * datos que no son.
 *
 * @param value Carga `data` de la respuesta.
 * @returns La semana, o `null` si no cumple el contrato.
 */
export const parseWeekSchedule = (value: unknown): WeekSchedule | null => {
  if (typeof value !== 'object' || value === null) return null

  const { weekStart, weekEnd, evaluationPending, days } = value as Record<string, unknown>

  if (typeof weekStart !== 'string' || !DATE_PATTERN.test(weekStart)) return null
  if (typeof weekEnd !== 'string' || !DATE_PATTERN.test(weekEnd)) return null
  if (typeof evaluationPending !== 'boolean' || !Array.isArray(days)) return null
  if (days.length !== DAYS_PER_WEEK) return null

  const parsed = days.map(parseDay)
  if (parsed.some((day) => day === null)) return null

  return { weekStart, weekEnd, evaluationPending, days: parsed as ScheduleDay[] }
}

/**
 * Como se pinta una tarjeta.
 *
 * Tener reserva gana a todo: es lo primero que la persona busca en su semana.
 * Bloqueada y cerrada son decisiones distintas del estudio, pero para quien
 * reserva significan lo mismo.
 *
 * @param session Sesion.
 * @returns El estado visual.
 */
export const resolveCardState = (session: ScheduleSession): SessionCardState => {
  if (session.myReservation !== null) return 'mine'
  if (session.status === 'blocked' || session.status === 'closed') return 'unavailable'

  return session.status
}

/**
 * Indica si la tarjeta ofrece reservar.
 *
 * Solo se ofrece en una sesion disponible y sin reserva mia. Si aun asi el
 * atleta no puede -evaluacion pendiente, membresia- el servidor lo rechaza con
 * su causa y su salida, que es la unica fuente de ese texto.
 *
 * @param session Sesion.
 * @returns `true` si se muestra la accion de reservar.
 */
export const canOfferBooking = (session: ScheduleSession): boolean =>
  resolveCardState(session) === 'available'

/**
 * Suma semanas a un lunes sin pasar por zonas horarias.
 *
 * @param weekStart Lunes, `YYYY-MM-DD`.
 * @param weeks Semanas a sumar; negativas para atras.
 * @returns El lunes resultante, `YYYY-MM-DD`.
 */
export const shiftWeek = (weekStart: string, weeks: number): string => {
  const [year, month, day] = weekStart.split('-').map(Number)
  const shifted = new Date(
    Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + weeks * DAYS_PER_WEEK)
  )

  return shifted.toISOString().slice(0, 10)
}

/**
 * Fecha de hoy en el estudio.
 *
 * @param now Momento de referencia.
 * @returns La fecha, `YYYY-MM-DD`.
 */
export const studioToday = (now: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_TIMEZONE }).format(now)

/**
 * Ordena los dias para el telefono: el dia en curso primero.
 *
 * En la semana actual, hoy y lo que falta van arriba y los dias que ya pasaron
 * al final: nadie abre el portal para ver el lunes el jueves. En cualquier otra
 * semana, lunes a domingo.
 *
 * @param days Dias de lunes a domingo.
 * @param today Fecha de hoy en el estudio.
 * @returns Los mismos dias, en el orden en que se muestran.
 */
export const orderDaysFromToday = (days: ScheduleDay[], today: string): ScheduleDay[] => {
  const index = days.findIndex((day) => day.date === today)
  if (index <= 0) return days

  return [...days.slice(index), ...days.slice(0, index)]
}

/**
 * Separa las sesiones de evaluacion para mostrarlas primero.
 *
 * Quien no ha hecho su evaluacion no puede entrenar: ofrecerle primero la
 * parrilla de entrenamiento es mandarlo a un rechazo seguro.
 *
 * @param schedule Semana.
 * @returns Las evaluaciones de la semana y los dias sin ellas; si no hay
 *   evaluacion pendiente, ninguna evaluacion aparte y los dias intactos.
 */
export const splitEvaluationFirst = (
  schedule: WeekSchedule
): { evaluations: ScheduleSession[]; days: ScheduleDay[] } => {
  if (!schedule.evaluationPending) return { evaluations: [], days: schedule.days }

  const evaluations = schedule.days
    .flatMap((day) => day.sessions)
    .filter((session) => session.sessionType === 'evaluation')

  const days = schedule.days.map((day) => ({
    date: day.date,
    sessions: day.sessions.filter((session) => session.sessionType !== 'evaluation')
  }))

  return { evaluations, days }
}

/**
 * Indica si la semana no tiene ni una sesion: todavia no abre.
 *
 * @param schedule Semana.
 * @returns `true` si no hay sesiones en ningun dia.
 */
export const isWeekEmpty = (schedule: WeekSchedule): boolean =>
  schedule.days.every((day) => day.sessions.length === 0)

/**
 * Fecha del estudio como `Date` a medianoche UTC, para formatearla sin que la
 * zona del navegador la corra un dia.
 *
 * @param date Fecha, `YYYY-MM-DD`.
 * @returns La fecha.
 */
const toUtcDate = (date: string): Date => new Date(`${date}T00:00:00.000Z`)

/**
 * Encabezado de un dia: "Lunes, 5 de octubre".
 *
 * Solo la primera letra va en mayuscula: `text-transform: capitalize` la pone
 * en cada palabra ("5 De Octubre"), que en espanol esta mal escrito.
 *
 * @param date Fecha, `YYYY-MM-DD`.
 * @returns El texto.
 */
export const formatDayHeading = (date: string): string => {
  const text = toUtcDate(date).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Rango de la semana: "5 – 11 de octubre" o "28 de septiembre – 4 de octubre".
 *
 * @param weekStart Lunes, `YYYY-MM-DD`.
 * @param weekEnd Domingo, `YYYY-MM-DD`.
 * @returns El texto.
 */
export const formatWeekRange = (weekStart: string, weekEnd: string): string => {
  const sameMonth = weekStart.slice(0, 7) === weekEnd.slice(0, 7)
  const start = toUtcDate(weekStart).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'long' })
  })
  const end = toUtcDate(weekEnd).toLocaleDateString(DATE_LOCALE, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long'
  })

  return `${start} – ${end}`
}

/**
 * Hora de pared del estudio de una sesion: "07:00".
 *
 * @param startsAtLocal Inicio, `YYYY-MM-DDTHH:mm`.
 * @returns La hora.
 */
export const formatSessionTime = (startsAtLocal: string): string => startsAtLocal.slice(11, 16)

/**
 * Dia y hora de una sesion para una confirmacion: "Lunes, 5 de octubre, 07:00".
 *
 * @param startsAtLocal Inicio, `YYYY-MM-DDTHH:mm`.
 * @returns El texto.
 */
export const formatSessionWhen = (startsAtLocal: string): string =>
  `${formatDayHeading(startsAtLocal.slice(0, 10))}, ${formatSessionTime(startsAtLocal)}`

/**
 * Profesionales distintas de la semana, por nombre (D8).
 *
 * La pantalla solo ofrece elegir si hay mas de una.
 *
 * @param schedule Semana cargada.
 * @returns Las profesionales sin repetir.
 */
export const collectWeekProfessionals = (schedule: WeekSchedule): ScheduleProfessional[] => {
  const byId = new Map<number, string>()

  for (const day of schedule.days) {
    for (const session of day.sessions) {
      if (session.professionalId !== null && session.professionalName !== null) {
        byId.set(session.professionalId, session.professionalName)
      }
    }
  }

  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) => first.name.localeCompare(second.name, DATE_LOCALE))
}

/**
 * Deja la semana con las sesiones de la profesional elegida.
 *
 * Mis reservas se quedan siempre, sean con quien sean: esconder una cita propia
 * por un filtro es peor que mostrar una de mas.
 *
 * @param schedule Semana cargada.
 * @param professionalId Profesional elegida; `null` es cualquiera.
 * @returns La semana acotada, con sus siete dias.
 */
export const filterWeekByProfessional = (
  schedule: WeekSchedule,
  professionalId: number | null
): WeekSchedule => {
  if (professionalId === null) return schedule

  return {
    ...schedule,
    days: schedule.days.map((day) => ({
      date: day.date,
      sessions: day.sessions.filter(
        (session) => session.professionalId === professionalId || session.myReservation !== null
      )
    }))
  }
}
