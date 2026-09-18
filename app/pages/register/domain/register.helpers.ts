import {
  EMAIL_PATTERN,
  NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN
} from './register.const'

/** Datos capturados en el formulario de alta. */
export interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  privacyAccepted: boolean
}

/** Resultado de validar la captura. */
export interface RegisterValidation {
  /** Indica si la captura puede enviarse al API. */
  isValid: boolean

  /** Campo que hay que corregir, o cadena vacia si todo esta bien. */
  field: string

  /** Clave del mensaje que corresponde al campo. */
  messageKey: string
}

/** Captura valida, escrita una sola vez. */
const VALID: RegisterValidation = { isValid: true, field: '', messageKey: '' }

/**
 * Valida la captura del alta antes de gastar una peticion.
 *
 * Devuelve el PRIMER problema y en el orden en que los campos aparecen en
 * pantalla: mostrar los seis errores a la vez convierte un formulario en una
 * lista de reproches, y quien corrige uno por uno no los lee igual.
 *
 * @param values Datos capturados.
 * @returns El primer campo a corregir con su mensaje, o la captura como valida.
 */
export const validateRegisterForm = (values: RegisterFormValues): RegisterValidation => {
  if (values.firstName.trim().length < NAME_MIN_LENGTH) {
    return { isValid: false, field: 'firstName', messageKey: 'register_error_first_name' }
  }

  if (values.lastName.trim().length < NAME_MIN_LENGTH) {
    return { isValid: false, field: 'lastName', messageKey: 'register_error_last_name' }
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    return { isValid: false, field: 'email', messageKey: 'register_error_email' }
  }

  if (!PHONE_PATTERN.test(values.phone.trim())) {
    return { isValid: false, field: 'phone', messageKey: 'register_error_phone' }
  }

  if (values.password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, field: 'password', messageKey: 'register_error_password' }
  }

  if (!values.privacyAccepted) {
    return { isValid: false, field: 'privacyAccepted', messageKey: 'register_error_privacy' }
  }

  return VALID
}
