/**
 * Salida que el acceso ofrece junto a un rechazo del API. Cambia lo que la
 * pantalla HACE, no lo que dice: el texto del rechazo siempre es el del API.
 */
export const LOGIN_ERROR_ACTION = {
  /** Sin salida adicional. */
  NONE: 'none',
  /**
   * La cuenta nunca definio contrasena: el primer acceso es LA salida y se
   * ofrece destacada.
   */
  FIRST_ACCESS: 'first-access',
  /**
   * Credenciales invalidas. Quien nacio con cuenta desde la agenda o el
   * mostrador tiene una contrasena aleatoria y cae aqui, asi que el primer
   * acceso se sugiere en segundo plano, sin afirmar que la cuenta existe.
   */
  FIRST_ACCESS_HINT: 'first-access-hint',
  /**
   * Correo sin confirmar. Ya no hay enlace de confirmacion: restablecer la
   * contrasena confirma el correo, asi que la salida es la recuperacion.
   */
  RECOVERY: 'recovery'
} as const

/** Salida ofrecida junto a un rechazo del acceso. */
export type LoginErrorAction = (typeof LOGIN_ERROR_ACTION)[keyof typeof LOGIN_ERROR_ACTION]
