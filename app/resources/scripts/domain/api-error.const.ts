/**
 * Codigos de error de `vmh-api` que el portal trata de forma especial.
 *
 * Solo entran aqui los que cambian lo que la pantalla HACE, no los que solo se
 * muestran: el contrato de error ya trae titulo y detalle en espanol y listos
 * para leerse, asi que reinterpretar un mensaje seria escribirlo dos veces.
 * Un codigo en esta lista significa que hay una accion distinta detras.
 */
export const API_ERROR_CODE = {
  /** La cuenta existe y la contrasena es correcta, pero falta confirmar el correo. */
  EMAIL_NOT_VERIFIED: 'VMH.AUTH.EMAIL_NOT_VERIFIED',

  /** El correo del alta ya pertenece a otra cuenta. */
  EMAIL_TAKEN: 'VMH.AUTH.EMAIL_TAKEN',

  /** El telefono del alta ya pertenece a otra cuenta. */
  PHONE_TAKEN: 'VMH.AUTH.PHONE_TAKEN',

  /** El enlace del correo no existe, vencio o ya se habia usado. */
  TOKEN_INVALID: 'VMH.AUTH.TOKEN_INVALID',
  TOKEN_EXPIRED: 'VMH.AUTH.TOKEN_EXPIRED',
  TOKEN_ALREADY_USED: 'VMH.AUTH.TOKEN_ALREADY_USED'
} as const

/** Codigo de error del API con tratamiento propio en el portal. */
export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE]

/**
 * Formato de correo compartido por las pantallas publicas.
 *
 * Valida la FORMA antes de gastar una peticion, no la existencia: quien decide
 * si ese correo tiene cuenta es el API, y responde igual exista o no.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
