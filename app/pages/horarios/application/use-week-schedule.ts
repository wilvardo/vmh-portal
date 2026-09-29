import { shiftWeek } from '../domain/schedule.helpers'
import type { WeekSchedule } from '../domain/schedule.interface'

interface UseWeekScheduleParams {
  /** Peticion al API, ya cableada; sin semana, la actual. */
  load: (weekStart?: string) => Promise<WeekSchedule>
  /** Encabezado del fallo de carga, ya traducido. */
  loadErrorTitle: string
}

interface UseWeekScheduleReturn {
  /** Semana cargada, o `null` antes de la primera carga. */
  schedule: Ref<WeekSchedule | null>
  /** Hay una carga en curso. */
  isLoading: Ref<boolean>
  /** Encabezado del error de carga, o cadena vacia. */
  errorTitle: Ref<string>
  /** Vuelve a pedir la semana que se esta viendo. */
  refresh: () => Promise<void>
  /** Semana siguiente. */
  next: () => Promise<void>
  /** Semana anterior. */
  previous: () => Promise<void>
  /** Regresa a la semana en curso. */
  current: () => Promise<void>
}

/**
 * Caso de uso de la semana: cargarla y moverse entre semanas.
 *
 * Ante un error la semana anterior NO se conserva: si se quedara, la persona
 * veria lugares de otra semana con el encabezado de la nueva y reservaria
 * contra datos que no son. El error se dice y se ofrece reintentar.
 *
 * @param params Peticion y texto del error.
 * @returns El estado de la semana y la navegacion.
 */
export const useWeekSchedule = (params: UseWeekScheduleParams): UseWeekScheduleReturn => {
  const schedule = ref<WeekSchedule | null>(null)
  const isLoading = ref(false)
  const errorTitle = ref('')

  // La semana que se pidio por ultima vez. Si esa carga falla, la semana
  // pintada se borra, pero reintentar y moverse siguen partiendo de aqui.
  let requested: string | undefined

  const loadWeek = async (weekStart?: string): Promise<void> => {
    requested = weekStart
    isLoading.value = true
    errorTitle.value = ''

    try {
      schedule.value = await params.load(weekStart)
    } catch (error: unknown) {
      console.error('useWeekSchedule: no se pudo cargar la semana', error)
      schedule.value = null
      errorTitle.value = params.loadErrorTitle
    } finally {
      isLoading.value = false
    }
  }

  const move = async (weeks: number): Promise<void> => {
    const from = schedule.value?.weekStart ?? requested
    await loadWeek(from === undefined ? undefined : shiftWeek(from, weeks))
  }

  return {
    schedule,
    isLoading,
    errorTitle,
    refresh: () => loadWeek(schedule.value?.weekStart ?? requested),
    next: () => move(1),
    previous: () => move(-1),
    current: () => loadWeek()
  }
}
