import { describe, expect, it } from 'vitest'
import type { ScheduleSession, WeekSchedule } from '../domain/schedule.interface'
import { useBookingNotice } from './use-booking-notice'

const messages = {
  notices: {
    'VMH.RSV.EVALUATION_REQUIRED': { title: 'Primero tu evaluación', detail: 'Espera.' },
    'VMH.RSV.MEMBERSHIP_REQUIRED': { title: 'Necesitas membresía', detail: 'Contrata.' },
    'VMH.RSV.MEMBERSHIP_NOT_ACTIVE': { title: 'No activa', detail: 'Regulariza.' },
    'VMH.RSV.PAYMENT_OVERDUE': { title: 'Mensualidad vencida', detail: 'Paga.' }
  },
  exits: { plans: 'Ver planes', contact: 'Escribir al estudio' }
} as const

const session = (bookingBlockedBy: string | null): ScheduleSession => ({
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
  canBook: bookingBlockedBy === null,
  bookingBlockedBy
})

const week = (code: string | null): WeekSchedule => ({
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending: false,
  cancelWindowMinutes: 120,
  days: ['05', '06', '07', '08', '09', '10', '11'].map((day, index) => ({
    date: `2026-10-${day}`,
    sessions: index === 0 ? [session(code)] : []
  }))
})

describe('useBookingNotice', () => {
  it('sin semana no hay aviso', () => {
    const { notice } = useBookingNotice({ schedule: ref(null), siteUrl: '', messages })

    expect(notice.value).toBeNull()
  })

  it('sin bloqueo de la persona no hay aviso', () => {
    const { notice } = useBookingNotice({
      schedule: ref(week(null)),
      siteUrl: 'https://sitio.test',
      messages
    })

    expect(notice.value).toBeNull()
  })

  it('sin membresia nombra la causa y lleva a los planes', () => {
    const { notice } = useBookingNotice({
      schedule: ref(week('VMH.RSV.MEMBERSHIP_REQUIRED')),
      siteUrl: 'https://sitio.test',
      messages
    })

    expect(notice.value).toEqual({
      title: 'Necesitas membresía',
      detail: 'Contrata.',
      exitUrl: 'https://sitio.test/#planes',
      exitLabel: 'Ver planes'
    })
  })

  it('con la mensualidad vencida lleva a escribir al estudio', () => {
    const { notice } = useBookingNotice({
      schedule: ref(week('VMH.RSV.PAYMENT_OVERDUE')),
      siteUrl: 'https://sitio.test',
      messages
    })

    expect(notice.value?.exitUrl).toBe('https://sitio.test/#contacto')
    expect(notice.value?.exitLabel).toBe('Escribir al estudio')
  })

  it('sin sitio configurado dice la causa sin enlace', () => {
    const { notice } = useBookingNotice({
      schedule: ref(week('VMH.RSV.MEMBERSHIP_NOT_ACTIVE')),
      siteUrl: '',
      messages
    })

    expect(notice.value?.title).toBe('No activa')
    expect(notice.value?.exitUrl).toBe('')
    expect(notice.value?.exitLabel).toBe('')
  })

  it('se pone al dia cuando la semana cambia', () => {
    const schedule = ref<WeekSchedule | null>(week('VMH.RSV.PAYMENT_OVERDUE'))
    const { notice } = useBookingNotice({ schedule, siteUrl: '', messages })
    expect(notice.value).not.toBeNull()

    schedule.value = week(null)

    expect(notice.value).toBeNull()
  })
})
