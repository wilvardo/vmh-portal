import {
  applyClockToWeek,
  formatDayHeading,
  formatSessionWhen,
  formatWeekRange,
  isWeekEmpty,
  orderDaysFromToday,
  splitEvaluationFirst,
  studioToday
} from '../domain/schedule.helpers'
import type { ScheduleSession, WeekSchedule } from '../domain/schedule.interface'
import type { SessionLabels, SessionSummary, WeekView } from '../domain/week-view.interface'

interface UseWeekViewParams {
  /** Semana cargada. */
  schedule: Ref<WeekSchedule | null>
  /**
   * Reloj; inyectado para que las pruebas no dependan del dia en que corren.
   * Si lee un estado reactivo, la vista se pone al dia sola con el tiempo.
   */
  now: () => Date
  /** Nombres de las sesiones, ya traducidos. */
  labels: SessionLabels
}

interface UseWeekViewReturn {
  /** La semana lista para pintarse, o `null` sin semana. */
  view: ComputedRef<WeekView | null>
  /** Como se nombra una sesion en una confirmacion. */
  summarize: (session: ScheduleSession) => SessionSummary
}

/**
 * Convierte la semana del API en lo que la pantalla pinta.
 *
 * Tres decisiones de presentacion, ninguna de negocio:
 *
 * - Lo que el API calculo al responder se pone al dia con el reloj: una sesion
 *   que ya empezo deja de ofrecerse y una reserva que entro a la ventana de
 *   cancelacion deja de ofrecer cancelar, con la ventana que publica el API.
 * - Con la evaluacion pendiente, sus sesiones van aparte y primero: quien no la
 *   ha hecho no puede entrenar, y ofrecerle primero la parrilla es mandarlo a
 *   un rechazo seguro.
 * - En la semana actual, hoy va arriba: se abre desde el telefono para ver lo
 *   que viene, no el lunes que ya paso.
 *
 * @param params Semana, reloj y nombres.
 * @returns La vista y el resumen de una sesion.
 */
export const useWeekView = (params: UseWeekViewParams): UseWeekViewReturn => {
  const view = computed<WeekView | null>(() => {
    const loaded = params.schedule.value
    if (loaded === null) return null

    const now = params.now()
    const schedule = applyClockToWeek(loaded, now)
    const today = studioToday(now)
    const split = splitEvaluationFirst(schedule)

    return {
      range: formatWeekRange(schedule.weekStart, schedule.weekEnd),
      evaluationPending: schedule.evaluationPending,
      evaluations: split.evaluations,
      days: orderDaysFromToday(split.days, today).map((day) => ({
        date: day.date,
        heading: formatDayHeading(day.date),
        isToday: day.date === today,
        sessions: day.sessions
      })),
      isEmpty: isWeekEmpty(schedule)
    }
  })

  const summarize = (session: ScheduleSession): SessionSummary => ({
    label:
      session.sessionType === 'evaluation'
        ? params.labels.evaluation
        : (session.serviceName ?? params.labels.training),
    when: formatSessionWhen(session.startsAtLocal),
    professionalName: session.professionalName
  })

  return { view, summarize }
}
