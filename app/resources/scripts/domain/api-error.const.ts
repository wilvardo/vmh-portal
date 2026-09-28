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

  /** Correo o contrasena incorrectos. El API no distingue cual de los dos. */
  INVALID_CREDENTIALS: 'VMH.AUTH.INVALID_CREDENTIALS',

  /** La cuenta existe pero nunca definio contrasena: le toca el primer acceso. */
  PASSWORD_NOT_SET: 'VMH.AUTH.PASSWORD_NOT_SET',

  /**
   * El codigo de primer acceso no coincide, vencio o se bloqueo por intentos.
   * Los tres regresan a la persona al paso del codigo.
   */
  CODE_INVALID: 'VMH.AUTH.CODE_INVALID',
  CODE_EXPIRED: 'VMH.AUTH.CODE_EXPIRED',
  CODE_LOCKED: 'VMH.AUTH.CODE_LOCKED',

  /**
   * El telefono ya pertenece a otra cuenta.
   *
   * Sale del area USR al corregir el perfil. La clave del area AUTH la emitia
   * el alta publica, ya retirada; la correccion del perfil la sigue aceptando
   * por si el API la reutiliza, y no cuesta nada tenerla.
   */
  PHONE_TAKEN: 'VMH.AUTH.PHONE_TAKEN',
  PROFILE_PHONE_TAKEN: 'VMH.USR.PHONE_TAKEN'
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
