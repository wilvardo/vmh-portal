import { LOGIN_REASON } from '~/resources/scripts/domain/session.const'
import { EMAIL_PATTERN, PASSWORD_MIN_LENGTH } from './login.const'

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
