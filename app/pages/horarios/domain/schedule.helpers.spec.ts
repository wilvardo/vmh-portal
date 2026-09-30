import { describe, expect, it } from 'vitest'
import type { ScheduleDay, ScheduleSession, WeekSchedule } from './schedule.interface'
import {
  canOfferBooking,
  collectWeekProfessionals,
  filterWeekByProfessional,
  formatDayHeading,
  formatSessionTime,
  formatWeekRange,
  isWeekEmpty,
  orderDaysFromToday,
  parseWeekSchedule,
  resolveCardState,
  shiftWeek,
  splitEvaluationFirst,
  studioToday
} from './schedule.helpers'

const session = (overrides: Partial<ScheduleSession> = {}): ScheduleSession => ({
  sessionSlotId: 1,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null,
  ...overrides
})

const week = (days: ScheduleDay[], evaluationPending = false): WeekSchedule => ({
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending,
  days
})

const sevenDays = (sessions: ScheduleSession[] = []): ScheduleDay[] =>
  ['05', '06', '07', '08', '09', '10', '11'].map((day, index) => ({
    date: `2026-10-${day}`,
    sessions: index === 0 ? sessions : []
  }))

/** Semana tal como la manda el API, con campos que la pantalla no usa. */
const rawWeek = (): Record<string, unknown> => ({
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending: false,
  cancelWindowMinutes: 120,
  days: sevenDays().map((day, index) => ({
    ...day,
    sessions:
      index === 0
        ? [
            {
              ...session(),
              startsAt: '2026-10-05T13:00:00.000Z',
              canBook: true,
              bookingBlockedBy: null
            }
          ]
        : []
  }))
})

describe('parseWeekSchedule', () => {
  it('acepta la semana del API y descarta lo que la pantalla no usa', () => {
    const parsed = parseWeekSchedule(rawWeek())

    expect(parsed?.days).toHaveLength(7)
    expect(parsed?.days[0]?.sessions[0]).toEqual(session())
  })

  it('una sesion rota invalida la semana entera', () => {
    const raw = rawWeek()
    const days = raw.days as { sessions: Record<string, unknown>[] }[]
    const first = days[0]?.sessions[0]
    if (first !== undefined) first.status = 'quien-sabe'

    expect(parseWeekSchedule(raw)).toBeNull()
  })

  it('una semana que no trae siete dias rompe el contrato', () => {
    expect(parseWeekSchedule({ ...rawWeek(), days: [] })).toBeNull()
  })
})

describe('resolveCardState', () => {
  it('tener reserva gana a cualquier otro estado', () => {
    const mine = session({
      status: 'full',
      myReservation: { reservationId: 3, isCancellable: true }
    })

    expect(resolveCardState(mine)).toBe('mine')
  })

  it('bloqueada y cerrada se muestran como no disponible', () => {
    expect(resolveCardState(session({ status: 'blocked' }))).toBe('unavailable')
    expect(resolveCardState(session({ status: 'closed' }))).toBe('unavailable')
  })

  it('llena y pasada conservan su estado', () => {
    expect(resolveCardState(session({ status: 'full' }))).toBe('full')
    expect(resolveCardState(session({ status: 'past' }))).toBe('past')
  })
})

describe('canOfferBooking', () => {
  it('solo ofrece reservar en una sesion disponible y sin reserva mia', () => {
    expect(canOfferBooking(session())).toBe(true)
    expect(canOfferBooking(session({ status: 'full' }))).toBe(false)
    expect(
      canOfferBooking(session({ myReservation: { reservationId: 3, isCancellable: true } }))
    ).toBe(false)
  })
})

describe('shiftWeek', () => {
  it('avanza y retrocede de lunes a lunes, cruzando meses y anos', () => {
    expect(shiftWeek('2026-10-05', 1)).toBe('2026-10-12')
    expect(shiftWeek('2026-10-05', -1)).toBe('2026-09-28')
    expect(shiftWeek('2026-12-28', 1)).toBe('2027-01-04')
  })
})

describe('studioToday', () => {
  it('toma la fecha de Torreon, no la de UTC', () => {
    // 3:30 UTC del martes es todavia lunes en el estudio.
    expect(studioToday(new Date('2026-10-06T03:30:00.000Z'))).toBe('2026-10-05')
  })
})

describe('orderDaysFromToday', () => {
  it('en la semana actual pone hoy primero y los dias pasados al final', () => {
    const ordered = orderDaysFromToday(sevenDays(), '2026-10-08')

    expect(ordered.map((day) => day.date)).toEqual([
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-05',
      '2026-10-06',
      '2026-10-07'
    ])
  })

  it('en otra semana deja lunes a domingo', () => {
    const days = sevenDays()

    expect(orderDaysFromToday(days, '2026-11-02')).toBe(days)
  })
})

describe('splitEvaluationFirst', () => {
  it('con la evaluacion pendiente, las evaluaciones van aparte y primero', () => {
    const evaluation = session({ sessionSlotId: 9, sessionType: 'evaluation' })
    const split = splitEvaluationFirst(week(sevenDays([session(), evaluation]), true))

    expect(split.evaluations).toEqual([evaluation])
    expect(split.days[0]?.sessions).toEqual([session()])
  })

  it('sin evaluacion pendiente no separa nada', () => {
    const schedule = week(sevenDays([session()]))

    expect(splitEvaluationFirst(schedule)).toEqual({ evaluations: [], days: schedule.days })
  })
})

describe('isWeekEmpty', () => {
  it('una semana sin ninguna sesion todavia no abre', () => {
    expect(isWeekEmpty(week(sevenDays()))).toBe(true)
    expect(isWeekEmpty(week(sevenDays([session()])))).toBe(false)
  })
})

describe('formatos', () => {
  it('escribe el dia sin que la zona del navegador lo corra', () => {
    expect(formatDayHeading('2026-10-05')).toBe('Lunes, 5 de octubre')
  })

  it('escribe el rango de la semana', () => {
    expect(formatWeekRange('2026-10-05', '2026-10-11')).toBe('5 – 11 de octubre')
    expect(formatWeekRange('2026-09-28', '2026-10-04')).toBe('28 de septiembre – 4 de octubre')
  })

  it('toma la hora de pared del estudio tal como llega', () => {
    expect(formatSessionTime('2026-10-05T07:00')).toBe('07:00')
  })
})

describe('agenda por profesional', () => {
  const ana = session({ sessionSlotId: 1, professionalId: 1, professionalName: 'Ana Pérez' })
  const bea = session({ sessionSlotId: 2, professionalId: 2, professionalName: 'Bea Ruiz' })
  const mineWithBea = session({
    sessionSlotId: 3,
    professionalId: 2,
    professionalName: 'Bea Ruiz',
    myReservation: { reservationId: 9, isCancellable: true }
  })

  it('lee con quien es la sesion y deja del estudio la que no lo dice completo', () => {
    const raw = rawWeek()
    const days = raw.days as { sessions: Record<string, unknown>[] }[]
    const first = days[0]?.sessions[0] ?? {}
    days[0] = {
      ...days[0],
      sessions: [
        { ...first, professionalId: 1, professionalName: 'Ana Pérez' },
        { ...first, sessionSlotId: 2, professionalId: 2 }
      ]
    }

    const parsed = parseWeekSchedule(raw)

    expect(parsed?.days[0]?.sessions.map((item) => item.professionalName)).toEqual([
      'Ana Pérez',
      null
    ])
  })

  it('junta a las profesionales de la semana sin repetir', () => {
    expect(collectWeekProfessionals(week(sevenDays([bea, ana, mineWithBea])))).toEqual([
      { id: 1, name: 'Ana Pérez' },
      { id: 2, name: 'Bea Ruiz' }
    ])
  })

  it('acota a la elegida sin esconder mis reservas', () => {
    const filtered = filterWeekByProfessional(week(sevenDays([ana, bea, mineWithBea])), 1)

    expect(filtered.days[0]?.sessions.map((item) => item.sessionSlotId)).toEqual([1, 3])
    expect(filtered.days).toHaveLength(7)
  })

  it('sin eleccion deja la semana como vino', () => {
    const original = week(sevenDays([ana, bea]))

    expect(filterWeekByProfessional(original, null)).toBe(original)
  })
})
