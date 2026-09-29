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
    expect(week).not.toHaveProperty('cancelWindowMinutes')
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
