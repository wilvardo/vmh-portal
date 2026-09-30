/** Ruta por la que el API sirve el canal de tiempo real. */
export const REALTIME_PATH = '/realtime'

/** Evento con el que el portal pide escuchar un canal. */
export const REALTIME_SUBSCRIBE_EVENT = 'subscribe'

/** Evento con el que el portal deja de escuchar un canal. */
export const REALTIME_UNSUBSCRIBE_EVENT = 'unsubscribe'

/** Evento con el que el servidor anuncia un cambio. */
export const REALTIME_CHANGE_EVENT = 'change'

/**
 * Canal privado de la agenda del API: avisa de cualquier sesion que cambio,
 * entrenamientos incluidos, sin decir cual. Exige sesion al conectar.
 */
export const SCHEDULE_AVAILABILITY_CHANNEL = 'schedule/availability/_private'

/**
 * Espera antes de volver a consultar tras un aviso.
 *
 * Abrir la semana o bloquear un rango llega como una rafaga; esperar medio
 * segundo convierte la rafaga en una sola consulta.
 */
export const REALTIME_REFRESH_DEBOUNCE_MS = 500

/**
 * Tope de espera entre reintentos de conexion.
 *
 * El portal puede quedar abierto en el telefono: se reintenta sin limite, pero cada
 * vez mas espaciado y nunca mas de treinta segundos entre uno y otro.
 */
export const REALTIME_RECONNECTION_DELAY_MAX_MS = 30_000
