import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import { LOGIN_REASON } from '~/resources/scripts/domain/session.const'
import { EMAIL_PATTERN, PASSWORD_MIN_LENGTH } from './login.const'
import { LOGIN_ERROR_ACTION, type LoginErrorAction } from './login.enum'

/** Resultado de validar el formulario de acceso antes de mandarlo. */
export interface LoginValidation {
  /** Indica si el formulario puede enviarse. */
  isValid: boolean
  /** Clave del mensaje a mostrar, o cadena vacia si es valido. */
  messageKey: string
}

/**
 * Valida el formulario de acceso antes de gastar una peticion.
 *
 * Es prevencion, no garantia: la decision real es del servidor. La interfaz
 * nunca afirma que una cuenta existe ni que una contrasena es correcta.
 *
 * @param email Correo capturado.
 * @param password Contrasena capturada.
 * @returns El veredicto y la clave del mensaje a mostrar.
 */
export const validateLoginForm = (email: string, password: string): LoginValidation => {
  if (email.trim().length === 0 || password.length === 0) {
    return { isValid: false, messageKey: 'login_error_required' }
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return { isValid: false, messageKey: 'login_error_email_format' }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, messageKey: 'login_error_password_short' }
  }

  return { isValid: true, messageKey: '' }
}

/**
 * Traduce el motivo con el que el panel devolvio a la persona a la pantalla de
 * acceso, a la clave del aviso que debe leer.
 *
 * @param reason Motivo recibido en la ruta.
 * @returns La clave del aviso, o cadena vacia si no hay motivo que explicar.
 */
export const resolveReasonMessageKey = (reason: string | null): string => {
  if (reason === LOGIN_REASON.EXPIRED) return 'login_notice_expired'
  if (reason === LOGIN_REASON.FORBIDDEN) return 'login_notice_forbidden'
  return ''
}

/**
 * Decide que salida ofrecer junto a un rechazo del acceso.
 *
 * Las credenciales invalidas tambien sugieren el primer acceso porque, en la
 * practica, es lo que recibe quien nacio con cuenta y nunca definio contrasena:
 * la suya es aleatoria y no coincide. Se sugiere sin afirmar nada sobre la
 * cuenta, para no romper la respuesta neutra del API.
 *
 * @param code Codigo de error del API, o `null` si el fallo no trajo contrato.
 * @returns La salida a ofrecer.
 */
export const resolveLoginErrorAction = (code: string | null): LoginErrorAction => {
  if (code === API_ERROR_CODE.PASSWORD_NOT_SET) return LOGIN_ERROR_ACTION.FIRST_ACCESS
  if (code === API_ERROR_CODE.INVALID_CREDENTIALS) return LOGIN_ERROR_ACTION.FIRST_ACCESS_HINT
  if (code === API_ERROR_CODE.EMAIL_NOT_VERIFIED) return LOGIN_ERROR_ACTION.RECOVERY
  return LOGIN_ERROR_ACTION.NONE
}
