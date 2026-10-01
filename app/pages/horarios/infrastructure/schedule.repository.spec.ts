import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiFetch } from '~/composables/use-api'
import { MY_RESERVATION_ENDPOINT } from '~/resources/scripts/domain/my-reservation.const'
import { fetchMySchedule } from './schedule.repository'

const fetchMock = vi.fn()
const apiFetch = fetchMock as unknown as ApiFetch

const emptyWeek = {
  weekStart: '2026-10-05',
  weekEnd: '2026-10-11',
  evaluationPending: false,
  cancelWindowMinutes: 120,
  servedBy: 'api-7',
  days: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-10-${String(5 + index).padStart(2, '0')}`,
    sessions: []
  }))
}

describe('repositorio de la semana', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('pide la semana indicada y devuelve solo lo que la pantalla usa', async () => {
    fetchMock.mockResolvedValue({ data: emptyWeek })

    const week = await fetchMySchedule({ apiFetch, weekStart: '2026-10-05' })

    expect(fetchMock).toHaveBeenCalledWith(MY_RESERVATION_ENDPOINT.SCHEDULE, {
      query: { weekStart: '2026-10-05' }
    })
    expect(week).not.toHaveProperty('servedBy')
    expect(week.cancelWindowMinutes).toBe(120)
  })

  it('lee de cada sesion si se puede reservar y por que no', async () => {
    const blocked = {
      sessionSlotId: 9,
      sessionType: 'training',
      serviceName: null,
      professionalId: null,
      professionalName: null,
      startsAt: '2026-10-05T13:00:00.000Z',
      startsAtLocal: '2026-10-05T07:00',
      endsAt: '2026-10-05T14:00:00.000Z',
      durationMinutes: 60,
      capacity: 6,
      remaining: 2,
      status: 'available',
      myReservation: null,
      canBook: false,
      bookingBlockedBy: 'VMH.RSV.MEMBERSHIP_REQUIRED'
    }
    fetchMock.mockResolvedValue({
      data: {
        ...emptyWeek,
        days: emptyWeek.days.map((day, index) => ({
          ...day,
          sessions: index === 0 ? [blocked] : []
        }))
      }
    })

    const week = await fetchMySchedule({ apiFetch })
    const session = week.days[0]?.sessions[0]

    expect(session?.canBook).toBe(false)
    expect(session?.bookingBlockedBy).toBe('VMH.RSV.MEMBERSHIP_REQUIRED')
    expect(session?.startsAt).toBe('2026-10-05T13:00:00.000Z')
    expect(session).not.toHaveProperty('endsAt')
  })

  it('sin semana deja que el API devuelva la actual', async () => {
    fetchMock.mockResolvedValue({ data: emptyWeek })

    await fetchMySchedule({ apiFetch })

    expect(fetchMock).toHaveBeenCalledWith(MY_RESERVATION_ENDPOINT.SCHEDULE, { query: {} })
  })

  it('falla ruidoso si la respuesta no cumple el contrato', async () => {
    fetchMock.mockResolvedValue({ data: { days: 'nada' } })

    await expect(fetchMySchedule({ apiFetch })).rejects.toThrow('contrato')
  })
})
