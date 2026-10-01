import { describe, expect, it } from 'vitest'
import type { ScheduleSession, WeekSchedule } from './schedule.interface'
import {
  buildSiteExitUrl,
  isPersonalBlock,
  resolveBlockExit,
  resolvePersonalBlock
} from './booking-notice.helpers'

const session = (overrides: Partial<ScheduleSession> = {}): ScheduleSession => ({
  sessionSlotId: 1,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAt: '2026-10-05T13:00:00.000Z',
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null,
  canBook: true,
  bookingBlockedBy: null,
  ...overrides
})

const week = (sessions: ScheduleSession[], evaluationPending = false): WeekSchedule => ({
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending,
  cancelWindowMinutes: 120,
  days: ['05', '06', '07', '08', '09', '10', '11'].map((day, index) => ({
    date: `2026-10-${day}`,
    sessions: index === 2 ? sessions : []
  }))
})

const blockedBy = (code: string): ScheduleSession =>
  session({ canBook: false, bookingBlockedBy: code })

describe('isPersonalBlock', () => {
  it('reconoce los rechazos de la persona', () => {
    expect(isPersonalBlock('VMH.RSV.MEMBERSHIP_REQUIRED')).toBe(true)
    expect(isPersonalBlock('VMH.RSV.MEMBERSHIP_NOT_ACTIVE')).toBe(true)
    expect(isPersonalBlock('VMH.RSV.PAYMENT_OVERDUE')).toBe(true)
    expect(isPersonalBlock('VMH.RSV.EVALUATION_REQUIRED')).toBe(true)
  })

  it('los de la sesion, los desconocidos y la ausencia no son de la persona', () => {
    expect(isPersonalBlock('VMH.RSV.SLOT_FULL')).toBe(false)
    expect(isPersonalBlock('VMH.RSV.SERVICE_NOT_INCLUDED')).toBe(false)
    expect(isPersonalBlock('VMH.RSV.ALGO_NUEVO')).toBe(false)
    expect(isPersonalBlock('toString')).toBe(false)
    expect(isPersonalBlock(null)).toBe(false)
  })
})

describe('resolvePersonalBlock', () => {
  it('devuelve el rechazo de la persona aunque otras sesiones tengan el suyo', () => {
    const schedule = week([
      blockedBy('VMH.RSV.SLOT_FULL'),
      blockedBy('VMH.RSV.PAYMENT_OVERDUE'),
      blockedBy('VMH.RSV.PAYMENT_OVERDUE')
    ])

    expect(resolvePersonalBlock(schedule)).toBe('VMH.RSV.PAYMENT_OVERDUE')
  })

  it('sin rechazo de la persona no hay aviso', () => {
    const schedule = week([session(), blockedBy('VMH.RSV.SERVICE_NOT_INCLUDED')])

    expect(resolvePersonalBlock(schedule)).toBeNull()
  })

  it('una semana sin sesiones no tiene aviso', () => {
    expect(resolvePersonalBlock(week([]))).toBeNull()
  })

  it('calla la evaluacion por hacer cuando la seccion de evaluacion ya la pide', () => {
    const schedule = week([blockedBy('VMH.RSV.EVALUATION_REQUIRED')], true)

    expect(resolvePersonalBlock(schedule)).toBeNull()
  })

  it('con la evaluacion ya agendada dice que los entrenamientos esperan', () => {
    const schedule = week([blockedBy('VMH.RSV.EVALUATION_REQUIRED')], false)

    expect(resolvePersonalBlock(schedule)).toBe('VMH.RSV.EVALUATION_REQUIRED')
  })
})

describe('resolveBlockExit', () => {
  it('sin membresia la salida son los planes', () => {
    expect(resolveBlockExit('VMH.RSV.MEMBERSHIP_REQUIRED')).toBe('plans')
  })

  it('con una membresia que no abre la puerta la salida es el estudio', () => {
    expect(resolveBlockExit('VMH.RSV.MEMBERSHIP_NOT_ACTIVE')).toBe('contact')
    expect(resolveBlockExit('VMH.RSV.PAYMENT_OVERDUE')).toBe('contact')
  })

  it('la evaluacion por hacer no tiene salida', () => {
    expect(resolveBlockExit('VMH.RSV.EVALUATION_REQUIRED')).toBeNull()
  })
})

describe('buildSiteExitUrl', () => {
  it('arma el ancla del sitio sin duplicar la diagonal', () => {
    expect(buildSiteExitUrl('https://sitio.test/', 'plans')).toBe('https://sitio.test/#planes')
    expect(buildSiteExitUrl('https://sitio.test', 'contact')).toBe('https://sitio.test/#contacto')
  })

  it('sin sitio configurado no hay enlace', () => {
    expect(buildSiteExitUrl('  ', 'plans')).toBe('')
  })
})
