/**
 * Formato de correo. Valida la FORMA antes de gastar una peticion, no la
 * existencia: quien decide si el correo ya tiene cuenta es el API.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Telefono de Mexico a diez digitos, la misma definicion que usa el API. */
export const PHONE_PATTERN = /^\d{10}$/

/**
 * Largo minimo de contrasena. Doce, igual que el API: si el formulario pidiera
 * menos, el rechazo llegaria del servidor despues de que la persona ya creyo
 * haber terminado.
 */
export const PASSWORD_MIN_LENGTH = 12

/** Largo minimo de nombre y apellidos, igual que el API. */
export const NAME_MIN_LENGTH = 2
