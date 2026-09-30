// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { effectScope, nextTick, ref } from 'vue'
import { useRealtime } from './use-realtime'

type Handler = (payload?: unknown) => void

const { ioMock, socket } = vi.hoisted(() => {
  const handlers = new Map<string, Handler>()
  const socketDouble = {
    handlers,
    connected: true,
    active: true,
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn((event: string, handler: Handler) => {
      handlers.set(event, handler)
    }),
    /** Simula un evento que llega del servidor. */
    fire(event: string, payload?: unknown): void {
      handlers.get(event)?.(payload)
    }
  }

  return { ioMock: vi.fn(() => socketDouble), socket: socketDouble }
})

vi.mock('socket.io-client', () => ({ io: ioMock }))

const accessToken = ref<string | null>('pase')
const renewSession = vi.fn()

mockNuxtImport('useSession', () => () => ({ accessToken, renewSession }))

const PRIVATE_CHANNEL = 'schedule/availability/_private'

/**
 * Anuncio del canal privado de la agenda.
 */
const announce = (): void => {
  socket.fire('change', { channel: PRIVATE_CHANNEL, payload: {} })
}

describe('useRealtime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    socket.connected = true
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    socket.handlers.clear()
  })

  it('se suscribe a los canales de la pantalla', () => {
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange: vi.fn() }))

    expect(socket.emit).toHaveBeenCalledWith('subscribe', PRIVATE_CHANNEL)

    scope.stop()
  })

  it('no abre nada mientras no haya canales', () => {
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [], onChange: vi.fn() }))

    expect(ioMock).not.toHaveBeenCalled()

    scope.stop()
  })

  it('junta una rafaga de avisos en una sola consulta', () => {
    const onChange = vi.fn()
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange, debounceMs: 500 }))

    announce()
    announce()
    vi.advanceTimersByTime(300)
    announce()
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(onChange).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('al reconectar vuelve a consultar lo que se perdio', () => {
    const onChange = vi.fn()
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange, debounceMs: 100 }))

    socket.fire('connect')
    socket.fire('connect')
    vi.advanceTimersByTime(100)

    expect(onChange).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('cambia de canales soltando los que ya no quiere', async () => {
    const channels = ref<string[]>([PRIVATE_CHANNEL, 'catalog/plans'])
    const scope = effectScope()
    scope.run(() => useRealtime({ channels, onChange: vi.fn() }))

    channels.value = [PRIVATE_CHANNEL]
    await nextTick()

    expect(socket.emit).toHaveBeenCalledWith('unsubscribe', 'catalog/plans')
    expect(socket.emit).not.toHaveBeenCalledWith('unsubscribe', PRIVATE_CHANNEL)

    scope.stop()
  })

  it('al desmontar cierra la conexion y descarta la consulta pendiente', () => {
    const onChange = vi.fn()
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange, debounceMs: 100 }))

    announce()
    scope.stop()
    vi.advanceTimersByTime(100)

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('manda el pase de la sesion al conectar', () => {
    const scope = effectScope()
    scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange: vi.fn() }))
    const options = (
      ioMock.mock.calls[0] as unknown as [string, { auth: (cb: (data: object) => void) => void }]
    )[1]
    const received: object[] = []

    options.auth((data) => received.push(data))

    expect(received).toEqual([{ token: 'pase' }])

    scope.stop()
  })

  it('si el canal no se puede abrir la pantalla sigue sin el', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    ioMock.mockImplementationOnce(() => {
      throw new Error('sin canal')
    })

    const scope = effectScope()
    expect(() =>
      scope.run(() => useRealtime({ channels: [PRIVATE_CHANNEL], onChange: vi.fn() }))
    ).not.toThrow()

    scope.stop()
  })
})
