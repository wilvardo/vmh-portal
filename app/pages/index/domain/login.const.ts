/**
 * Expresion de formato de correo. Valida la FORMA antes de gastar una peticion,
 * no la existencia: quien decide si la cuenta existe es el API, y responde igual
 * exista o no (defensa anti enumeracion del spec de autenticacion).
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Largo minimo de contrasena que el formulario exige antes de enviar. Es el
 * mismo que exige el API y el resto del portal (doce): con ocho aqui, el acceso
 * dejaba pasar lo que ninguna contrasena valida puede ser.
 */
export { PASSWORD_MIN_LENGTH } from '~/resources/scripts/domain/password.const'

/**
 * Pagina de agenda del sitio publico. Quien todavia no tiene cuenta la obtiene
 * agendando su evaluacion: el portal ya no da de alta.
 */
export const BOOKING_SITE_PATH = '/agendar'
