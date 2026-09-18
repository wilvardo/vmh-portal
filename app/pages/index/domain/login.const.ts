/**
 * Expresion de formato de correo. Valida la FORMA antes de gastar una peticion,
 * no la existencia: quien decide si la cuenta existe es el API, y responde igual
 * exista o no (defensa anti enumeracion del spec de autenticacion).
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Largo minimo de contrasena que el formulario exige antes de enviar. */
export const PASSWORD_MIN_LENGTH = 8
