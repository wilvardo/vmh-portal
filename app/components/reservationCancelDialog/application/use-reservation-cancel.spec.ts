import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReservationCancel } from './use-reservation-cancel'

const messages = {
  successTitle: 'Reserva cancelada',
  successDetail: 'Tu lugar quedó libre.',
  unexpectedTitle: 'No se pudo cancelar',
  unexpectedDetail: 'Revisa tu conexión.'
}

const cancelled = {
  reservationId: 7,
  sessionSlotId: 41,
  reservationType: 'training' as const,
  status: 'cancelled' as const,
  startsAt: '2026-10-05T13:00:00.000Z'
}

/**
 * Rechazo con el contrato de error del API.
 *
 * @param code Codigo del rechazo.
 * @param title Encabezado.
 * @param detail Cuerpo.
 * @returns El error tal como lo lanza el cliente HTTP.
 */
const apiRejection = (code: string, title: string, detail: string): unknown => ({
  data: { title, detail, key: 'x', code }
})

describe('useReservationCancel', () => {
  const notify = vi.fn()
  const onSettled = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('cancela, avisa, refresca y cierra', async () => {
    const cancel = vi.fn().mockResolvedValue(cancelled)
    const flow = useReservationCancel({ cancel, notify, onSettled, messages })

    const shouldClose = await flow.confirm(7)

    expect(cancel).toHaveBeenCalledWith(7)
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(shouldClose).toBe(true)
  })

  it('dentro de la ventana muestra el texto del API y no cierra', async () => {
    const cancel = vi
      .fn()
      .mockRejectedValue(
        apiRejection(
          'VMH.RSV.CANCEL_WINDOW_CLOSED',
          'Fuera de la ventana de cancelación',
          'Contacta a recepción.'
        )
      )
    const flow = useReservationCancel({ cancel, notify, onSettled, messages })

    const shouldClose = await flow.confirm(7)

    expect(notify).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Fuera de la ventana de cancelación',
      detail: 'Contacta a recepción.'
    })
    expect(onSettled).not.toHaveBeenCalled()
    expect(shouldClose).toBe(false)
  })

  it('si ya estaba cancelada en otra pestana, refresca en vez de insistir', async () => {
    const cancel = vi
      .fn()
      .mockRejectedValue(
        apiRejection('VMH.RSV.ALREADY_CANCELLED', 'Reserva ya cancelada', 'Ya está libre.')
      )
    const flow = useReservationCancel({ cancel, notify, onSettled, messages })

    const shouldClose = await flow.confirm(7)

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(shouldClose).toBe(true)
  })

  it('sin contrato de error cae al texto propio', async () => {
    const cancel = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const flow = useReservationCancel({ cancel, notify, onSettled, messages })

    await flow.confirm(7)

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: messages.unexpectedTitle })
    )
  })

  it('bloquea el doble clic mientras cancela', async () => {
    let release: (value: typeof cancelled) => void = () => undefined
    const cancel = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )
    const flow = useReservationCancel({ cancel, notify, onSettled, messages })

    const first = flow.confirm(7)
    const second = await flow.confirm(7)
    release(cancelled)
    await first

    expect(second).toBe(false)
    expect(cancel).toHaveBeenCalledTimes(1)
  })
})
