import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openRealtimeConnection } from './realtime.repository'

type Handler = (payload?: unknown) => void

interface SocketOptions {
  path: string
  transports: string[]
  auth: (callback: (data: object) => void) => void
}

const { ioMock, socket } = vi.hoisted(() => {
  const handlers = new Map<string, Handler>()
  const socketDouble = {
    handlers,
    connected: false,
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

const onChange = vi.fn()
const onResync = vi.fn()
const renewToken = vi.fn<() => Promise<string | null>>()
let token: string | null = 'pase-1'

/**
 * Abre una conexion con los dobles de prueba.
 *
 * @returns La conexion abierta.
 */
const open = (): ReturnType<typeof openRealtimeConnection> =>
  openRealtimeConnection({
    baseUrl: '/api',
    pageOrigin: 'https://portal.test',
    readToken: () => token,
    renewToken,
    onChange,
    onResync
  })

/**
 * Opciones con las que se creo el socket.
 *
 * @returns Las opciones del ultimo `io()`.
 */
const socketOptions = (): SocketOptions => {
  const call = ioMock.mock.calls.at(-1) as unknown as [string, SocketOptions]

  return call[1]
}

describe('openRealtimeConnection', () => {
  beforeEach(() => {
    socket.connected = false
    socket.active = true
    token = 'pase-1'
  })

  afterEach(() => {
    vi.clearAllMocks()
    socket.handlers.clear()
  })

  it('se conecta al origen del API por /realtime y solo por websocket', () => {
    open()

    expect(ioMock).toHaveBeenCalledWith('https://portal.test', expect.anything())
    expect(socketOptions().path).toBe('/realtime')
    expect(socketOptions().transports).toEqual(['websocket'])
  })

  it('manda el pase vigente en cada intento de conexion', () => {
    open()
    const received: object[] = []

    socketOptions().auth((data) => received.push(data))
    token = 'pase-2'
    socketOptions().auth((data) => received.push(data))

    expect(received).toEqual([{ token: 'pase-1' }, { token: 'pase-2' }])
  })

  it('sin sesion saluda sin pase', () => {
    token = null
    open()
    const received: object[] = []

    socketOptions().auth((data) => received.push(data))

    expect(received).toEqual([{}])
  })

  it('pide los canales al conectar y otra vez al reconectar', () => {
    const connection = open()
    connection.subscribe('schedule/availability/_private')

    socket.fire('connect')
    socket.fire('connect')

    expect(socket.emit).toHaveBeenCalledTimes(2)
    expect(socket.emit).toHaveBeenLastCalledWith('subscribe', 'schedule/availability/_private')
  })

  it('al reconectar avisa que hay que volver a consultar; al conectar la primera vez no', () => {
    open()

    socket.fire('connect')
    expect(onResync).not.toHaveBeenCalled()

    socket.fire('connect')
    expect(onResync).toHaveBeenCalledTimes(1)
  })

  it('con el socket ya conectado se suscribe en el acto y no repite', () => {
    const connection = open()
    socket.connected = true

    connection.subscribe('schedule/availability/_private')
    connection.subscribe('schedule/availability/_private')

    expect(socket.emit).toHaveBeenCalledTimes(1)
  })

  it('avisa solo de los canales que escucha', () => {
    const connection = open()
    connection.subscribe('schedule/availability/_private')

    socket.fire('change', { channel: 'catalog/plans', payload: {} })
    socket.fire('change', { channel: 'schedule/availability/_private', payload: {} })
    socket.fire('change', 'basura')

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('schedule/availability/_private')
  })

  it('soltar un canal deja de escucharlo y avisa al servidor', () => {
    const connection = open()
    socket.connected = true
    connection.subscribe('schedule/availability/_private')

    connection.unsubscribe('schedule/availability/_private')
    socket.fire('change', { channel: 'schedule/availability/_private', payload: {} })

    expect(socket.emit).toHaveBeenLastCalledWith('unsubscribe', 'schedule/availability/_private')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('un corte de red no renueva la sesion: Socket.IO reintenta solo', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    open()

    socket.fire('connect_error', new Error('websocket error'))

    expect(renewToken).not.toHaveBeenCalled()
  })

  it('un pase rechazado renueva la sesion una vez y vuelve a conectar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renewToken.mockResolvedValue('pase-nuevo')
    open()
    socket.active = false

    socket.fire('connect_error', new Error('unauthorized'))
    socket.fire('connect_error', new Error('unauthorized'))
    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1))

    expect(renewToken).toHaveBeenCalledTimes(1)
  })

  it('si la sesion ya murio no vuelve a conectar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renewToken.mockResolvedValue(null)
    open()
    socket.active = false

    socket.fire('connect_error', new Error('unauthorized'))
    await vi.waitFor(() => expect(renewToken).toHaveBeenCalledTimes(1))

    expect(socket.connect).not.toHaveBeenCalled()
  })

  it('una conexion exitosa rearma la renovacion', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renewToken.mockResolvedValue('pase-nuevo')
    open()
    socket.active = false

    socket.fire('connect_error', new Error('unauthorized'))
    await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledTimes(1))
    socket.fire('connect')
    socket.fire('connect_error', new Error('unauthorized'))

    await vi.waitFor(() => expect(renewToken).toHaveBeenCalledTimes(2))
  })

  it('cerrar desconecta el socket', () => {
    const connection = open()

    connection.close()

    expect(socket.disconnect).toHaveBeenCalledTimes(1)
  })
})
