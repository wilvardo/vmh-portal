/** Lo que llega por el canal cuando algo cambia. */
export interface RealtimeMessage {
  /** Canal por el que se anuncio. */
  channel: string
  /** Contenido del anuncio; en la agenda privada viene vacio a proposito. */
  payload: unknown
}

/**
 * Conexion viva con el canal de tiempo real.
 *
 * Es el puerto que usa el composable: no sabe de Socket.IO, solo de canales.
 */
export interface RealtimeConnection {
  /** Empieza a escuchar un canal; repetirlo no duplica nada. */
  subscribe: (channel: string) => void
  /** Deja de escuchar un canal. */
  unsubscribe: (channel: string) => void
  /** Cierra la conexion y suelta todo lo que escuchaba. */
  close: () => void
}
