/** Digitos del codigo que manda el API por correo. */
export const CODE_LENGTH = 6

/**
 * Segundos que la pantalla espera antes de ofrecer otro codigo. Espeja el
 * reenvio minimo del API por correo: ofrecerlo antes solo produciria un rechazo
 * por limite de peticiones.
 */
export const RESEND_COOLDOWN_SECONDS = 60

/** Cada cuanto se descuenta la espera del reenvio, en milisegundos. */
export const COOLDOWN_TICK_MS = 1000

/** Orden de los pasos, para decirle a la persona en cual va. */
export const FIRST_ACCESS_STEP_ORDER = ['email', 'code', 'password'] as const
