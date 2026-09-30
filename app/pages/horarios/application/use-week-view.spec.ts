import { describe, expect, it } from 'vitest'
import type { ScheduleSession, WeekSchedule } from '../domain/schedule.interface'
import { useWeekView } from './use-week-view'

const labels = { evaluation: 'Evaluación inicial', training: 'Entrenamiento' }

const training: ScheduleSession = {
  sessionSlotId: 1,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAtLocal: '2026-10-07T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null
}

const evaluation: ScheduleSession = { ...training, sessionSlotId: 2, sessionType: 'evaluation' }

const weekWith = (evaluationPending: boolean): WeekSchedule => ({
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending,
  days: ['05', '06', '07', '08', '09', '10', '11'].map((day) => ({
    date: `2026-10-${day}`,
    sessions: day === '07' ? [training, evaluation] : []
  }))
})

describe('useWeekView', () => {
  it('sin semana no hay vista', () => {
    const { view } = useWeekView({
      schedule: ref(null),
      now: () => new Date('2026-10-07T15:00:00.000Z'),
      labels
    })

    expect(view.value).toBeNull()
  })

  it('con la evaluacion pendiente la pone aparte y pone hoy arriba', () => {
    const { view } = useWeekView({
      schedule: ref(weekWith(true)),
      now: () => new Date('2026-10-07T15:00:00.000Z'),
      labels
    })

    expect(view.value?.evaluations).toEqual([evaluation])
    expect(view.value?.days[0]?.date).toBe('2026-10-07')
    expect(view.value?.days[0]?.isToday).toBe(true)
    expect(view.value?.days[0]?.sessions).toEqual([training])
    expect(view.value?.range).toBe('5 – 11 de octubre')
  })

  it('nombra la sesion para la confirmacion por su tipo o su servicio', () => {
    const { summarize } = useWeekView({ schedule: ref(null), now: () => new Date(), labels })

    expect(summarize(evaluation).label).toBe('Evaluación inicial')
    expect(summarize({ ...training, serviceName: 'Personalizado' }).label).toBe('Personalizado')
    expect(summarize(training).when).toBe('Miércoles, 7 de octubre, 07:00')
  })
})
