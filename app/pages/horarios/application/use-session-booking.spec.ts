import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScheduleSession } from '../domain/schedule.interface'
import { useSessionBooking } from './use-session-booking'

const messages = {
  successTitle: 'Reserva lista',
  successDetail: 'Te esperamos.',
  unexpectedTitle: 'No se pudo reservar',
  unexpectedDetail: 'Revisa tu conexión.'
}

const session: ScheduleSession = {
  sessionSlotId: 41,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAt: '2026-10-05T13:00:00.000Z',
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 1,
  status: 'available',
  myReservation: null,
  canBook: true,
  bookingBlockedBy: null
}

const booked = {
  reservationId: 7,
  sessionSlotId: 41,
  reservationType: 'training' as const,
  status: 'active' as const,
  startsAt: '2026-10-05T13:00:00.000Z'
}

/**
 * Rechazo con el contrato de error del API.
 *
 * @param code Codigo del rechazo.
 * @returns El error tal como lo lanza el cliente HTTP.
 */
const apiRejection = (code: string): unknown => ({
  data: { title: `Titulo ${code}`, detail: `Detalle ${code}`, key: 'x', code }
})

describe('useSessionBooking', () => {
  const notify = vi.fn()
  const refresh = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('reserva, avisa, cierra y refresca la semana desde el servidor', async () => {
    const book = vi.fn().mockResolvedValue(booked)
    const flow = useSessionBooking({ book, notify, refresh, messages })

    flow.open(session)
    await flow.confirm()

    expect(book).toHaveBeenCalledWith(41)
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(flow.isOpen.value).toBe(false)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('si se lleno mientras decidia, explica con el texto del API y refresca', async () => {
    const book = vi.fn().mockRejectedValue(apiRejection('VMH.RSV.SLOT_FULL'))
    const flow = useSessionBooking({ book, notify, refresh, messages })

    flow.open(session)
    await flow.confirm()

    expect(notify).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Titulo VMH.RSV.SLOT_FULL',
      detail: 'Detalle VMH.RSV.SLOT_FULL'
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it.each(['VMH.RSV.SLOT_ALREADY_STARTED', 'VMH.RSV.SLOT_NOT_OPEN'])(
    'si la sesion %s, cierra, avisa en tono informativo y refresca',
    async (code) => {
      const book = vi.fn().mockRejectedValue(apiRejection(code))
      const flow = useSessionBooking({ book, notify, refresh, messages })

      flow.open(session)
      await flow.confirm()

      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
      expect(flow.isOpen.value).toBe(false)
      expect(refresh).toHaveBeenCalledTimes(1)
    }
  )

  it('una membresia que dejo de estar activa se explica y refresca la semana', async () => {
    const book = vi.fn().mockRejectedValue(apiRejection('VMH.RSV.MEMBERSHIP_NOT_ACTIVE'))
    const flow = useSessionBooking({ book, notify, refresh, messages })

    flow.open(session)
    await flow.confirm()

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Detalle VMH.RSV.MEMBERSHIP_NOT_ACTIVE'
      })
    )
    expect(flow.isOpen.value).toBe(false)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('un fallo de red deja la confirmacion abierta para reintentar', async () => {
    const book = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const flow = useSessionBooking({ book, notify, refresh, messages })

    flow.open(session)
    await flow.confirm()

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ summary: messages.unexpectedTitle })
    )
    expect(flow.isOpen.value).toBe(true)
  })

  it('bloquea el doble clic mientras reserva', async () => {
    let release: (value: typeof booked) => void = () => undefined
    const book = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )
    const flow = useSessionBooking({ book, notify, refresh, messages })

    flow.open(session)
    const first = flow.confirm()
    await flow.confirm()
    release(booked)
    await first

    expect(book).toHaveBeenCalledTimes(1)
  })
})
