import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiFetch } from '~/composables/use-api'
import { MY_RESERVATION_ENDPOINT } from '../domain/my-reservation.const'
import { bookMySpot, cancelMyReservation } from './my-reservations.repository'

const result = {
  reservationId: 7,
  sessionSlotId: 41,
  reservationType: 'training',
  status: 'active',
  startsAt: '2026-10-05T13:00:00.000Z'
}

const fetchMock = vi.fn()
const apiFetch = fetchMock as unknown as ApiFetch

describe('repositorio de reservas del atleta', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('reserva mandando solo la sesion', async () => {
    fetchMock.mockResolvedValue({ data: result })

    await expect(bookMySpot({ apiFetch, sessionSlotId: 41 })).resolves.toEqual(result)
    expect(fetchMock).toHaveBeenCalledWith(MY_RESERVATION_ENDPOINT.CREATE, {
      method: 'POST',
      body: { sessionSlotId: 41 }
    })
  })

  it('cancela con PATCH sobre la reserva propia', async () => {
    fetchMock.mockResolvedValue({ data: { ...result, status: 'cancelled' } })

    const cancelled = await cancelMyReservation({ apiFetch, reservationId: 7 })

    expect(cancelled.status).toBe('cancelled')
    expect(fetchMock).toHaveBeenCalledWith('/users/me/reservations/7/cancel', { method: 'PATCH' })
  })

  it('falla ruidoso si la respuesta no cumple el contrato', async () => {
    fetchMock.mockResolvedValue({ data: { ok: true } })

    await expect(bookMySpot({ apiFetch, sessionSlotId: 41 })).rejects.toThrow('contrato')
  })

  it('deja pasar el rechazo del API para que la pantalla lo explique', async () => {
    const rejection = { data: { title: 'La sesión se llenó', code: 'VMH.RSV.SLOT_FULL' } }
    fetchMock.mockRejectedValue(rejection)

    await expect(bookMySpot({ apiFetch, sessionSlotId: 41 })).rejects.toBe(rejection)
  })
})
