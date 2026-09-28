import { API_ERROR_CODE, EMAIL_PATTERN } from '~/resources/scripts/domain/api-error.const'
import { PASSWORD_MIN_LENGTH } from '~/resources/scripts/domain/password.const'
import { CODE_LENGTH, FIRST_ACCESS_STEP_ORDER } from './first-access.const'
import type { FirstAccessStep } from './first-access.enum'
import type { PasswordValidation } from './first-access.type'

/** Codigos de error que devuelven a la persona al paso del codigo. */
const CODE_RETRY_ERRORS: readonly string[] = [
  API_ERROR_CODE.CODE_INVALID,
  API_ERROR_CODE.CODE_EXPIRED,
  API_ERROR_CODE.CODE_LOCKED
]

/**
 * Valida la forma del correo antes de pedir un codigo. No afirma que la cuenta
 * exista: eso lo decide el API, y responde igual en ambos casos.
 *
 * @param email Correo capturado.
 * @returns `true` si tiene forma de correo.
 */
export const isEmailWellFormed = (email: string): boolean => EMAIL_PATTERN.test(email.trim())

/**
 * Limpia lo que la persona escribio o pego en el campo del codigo: deja solo
 * digitos y corta al largo del codigo. Pegar "123 456" desde el correo es lo
 * normal, no un error.
 *
 * @param raw Texto capturado.
 * @returns Solo los digitos, hasta el largo del codigo.
 */
export const sanitizeCode = (raw: string): string => raw.replace(/\D/g, '').slice(0, CODE_LENGTH)

/**
 * Indica si el codigo esta completo.
 *
 * @param code Codigo ya limpio.
 * @returns `true` si tiene exactamente los digitos esperados.
 */
export const isCodeComplete = (code: string): boolean =>
  code.length === CODE_LENGTH && /^\d+$/.test(code)

/**
 * Valida la contrasena nueva con las mismas reglas que la recuperacion: largo
 * minimo del API y que las dos capturas coincidan.
 *
 * @param password Contrasena capturada.
 * @param confirmation Segunda captura.
 * @returns La clave del problema, o cadena vacia si puede enviarse.
 */
export const validateNewPassword = (
  password: string,
  confirmation: string
): PasswordValidation => {
  if (password.length < PASSWORD_MIN_LENGTH) return 'password_short'
  if (password !== confirmation) return 'password_mismatch'
  return ''
}

/**
 * Indica si un rechazo del API se corrige volviendo al paso del codigo
 * (incorrecto, vencido o bloqueado por intentos).
 *
 * @param code Codigo de error del API, o `null` si el fallo no trajo contrato.
 * @returns `true` si la persona debe volver a escribir o pedir el codigo.
 */
export const isCodeRetryError = (code: string | null): boolean =>
  code !== null && CODE_RETRY_ERRORS.includes(code)

/**
 * Posicion de un paso dentro del recorrido, empezando en uno. Alimenta el
 * "Paso 2 de 3" que orienta a la persona.
 *
 * @param step Paso vigente.
 * @returns Su posicion, o `1` si el paso no figura en el orden.
 */
export const resolveStepPosition = (step: FirstAccessStep): number =>
  Math.max(1, FIRST_ACCESS_STEP_ORDER.indexOf(step) + 1)
