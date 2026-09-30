import { io } from 'socket.io-client'
import {
  REALTIME_CHANGE_EVENT,
  REALTIME_PATH,
  REALTIME_RECONNECTION_DELAY_MAX_MS,
  REALTIME_SUBSCRIBE_EVENT,
  REALTIME_UNSUBSCRIBE_EVENT
} from '../domain/realtime.const'
import type { RealtimeConnection, RealtimeMessage } from '../domain/realtime.interface'

interface OpenRealtimeConnectionParams {
  /** URL base del API (`BASE_API_PATH`); el canal vive en su mismo origen. */
  baseUrl: string
  /** Origen de la pagina, para resolver una URL base relativa. */
  pageOrigin: string
  /** Lee el pase de acceso vigente en el momento de conectar. */
  readToken: () => string | null
  /** Renueva la sesion cuando el servidor rechaza el pase; `null` si murio. */
  renewToken: () => Promise<string | null>
  /** Un canal escuchado anuncio un cambio. */
  onChange: (channel: string) => void
  /** Se recupero la conexion: lo que paso mientras tanto no se anuncio. */
  onResync: () => void
}

/**
 * Distingue un anuncio del servidor de cualquier otra cosa.
 *
 * @param value Lo que llego por el evento de cambio.
 * @returns `true` cuando trae un canal con nombre.
 */
const isRealtimeMessage = (value: unknown): value is RealtimeMessage =>
  typeof value === 'object' &&
  value !== null &&
  'channel' in value &&
  typeof value.channel === 'string'

/**
 * Abre la conexion con el canal de tiempo real del API.
 *
 * Resuelve lo que Socket.IO no resuelve solo:
 *
 * - **Pase en cada intento.** El saludo lleva el pase vigente, leido en el
 *   momento de conectar y no al crear el socket: la sesion se renueva sola y un
 *   pase guardado aqui envejeceria.
 * - **Resuscripcion.** Al reconectar, el servidor ya no recuerda las salas del
 *   socket anterior; se vuelven a pedir todas, y se avisa con `onResync` porque
 *   lo que cambio mientras no habia conexion no se anuncio.
 * - **Pase rechazado.** Si el servidor rechaza el pase, Socket.IO ya no
 *   reintenta por su cuenta. Se renueva la sesion **una sola vez** y se vuelve a
 *   conectar; si vuelve a fallar, se queda quieto hasta que otra conexion
 *   exitosa rearme el intento. Asi un rechazo persistente no se vuelve un ciclo
 *   de renovaciones contra el API.
 *
 * Solo habla el protocolo del canal: suscribirse, soltar y escuchar. No manda
 * nada mas al servidor.
 *
 * @param params Base del API, manejo del pase y a quien avisar.
 * @returns La conexion, lista para suscribir canales.
 * @throws Si la URL base no se puede resolver.
 */
export const openRealtimeConnection = (
  params: OpenRealtimeConnectionParams
): RealtimeConnection => {
  const base = new URL(params.baseUrl, params.pageOrigin)
  const channels = new Set<string>()
  let hasConnected = false
  let canRenew = true

  const socket = io(base.origin, {
    path: REALTIME_PATH,
    transports: ['websocket'],
    reconnectionDelayMax: REALTIME_RECONNECTION_DELAY_MAX_MS,
    auth: (callback) => {
      const token = params.readToken()
      callback(token === null ? {} : { token })
    }
  })

  socket.on('connect', () => {
    canRenew = true
    for (const channel of channels) socket.emit(REALTIME_SUBSCRIBE_EVENT, channel)

    if (hasConnected) params.onResync()
    hasConnected = true
  })

  socket.on(REALTIME_CHANGE_EVENT, (message: unknown) => {
    if (isRealtimeMessage(message) && channels.has(message.channel)) {
      params.onChange(message.channel)
    }
  })

  socket.on('connect_error', (error) => {
    // Con el socket activo, Socket.IO reintenta solo: es la red, no el pase.
    if (socket.active) return

    console.error('realtimeRepository: el canal rechazo el pase de acceso', error)
    if (!canRenew) return
    canRenew = false

    void params
      .renewToken()
      .then((token) => {
        if (token !== null) socket.connect()
      })
      .catch((renewError: unknown) => {
        console.error('realtimeRepository: no se pudo renovar la sesion del canal', renewError)
      })
  })

  return {
    subscribe: (channel) => {
      if (channels.has(channel)) return
      channels.add(channel)
      if (socket.connected) socket.emit(REALTIME_SUBSCRIBE_EVENT, channel)
    },
    unsubscribe: (channel) => {
      if (!channels.delete(channel)) return
      if (socket.connected) socket.emit(REALTIME_UNSUBSCRIBE_EVENT, channel)
    },
    close: () => {
      channels.clear()
      socket.disconnect()
    }
  }
}
