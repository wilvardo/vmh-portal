/**
 * Rutas del modulo de autenticacion de `vmh-api` (contrato §11 del spec
 * USVMH1783637280000). Se declaran aqui para que ningun slice escriba una ruta
 * del API a mano.
 */
export const AUTH_ENDPOINT = {
  /** Emite el par de credenciales a partir de correo y contrasena. */
  LOGIN: '/auth/login',
  /** Rota el par de credenciales. El token usado queda invalidado. */
  REFRESH: '/auth/refresh',
  /** Revoca la renovacion vigente de esta sesion. */
  LOGOUT: '/auth/logout',
  /** Devuelve la persona dueña del token de acceso. */
  ME: '/auth/me',
  /**
   * Pide el codigo de primer acceso. Responde lo mismo exista o no la cuenta, y
   * solo emite codigo a cuentas que nunca definieron contrasena.
   */
  FIRST_ACCESS_CODE: '/auth/first-access/code',
  /** Canjea el codigo, fija la contrasena y emite la sesion igual que el login. */
  FIRST_ACCESS: '/auth/first-access',
  /** Pide el enlace para restablecer la contrasena. */
  PASSWORD_RECOVERY: '/auth/password-recovery',
  /** Fija una contrasena nueva a partir del enlace. */
  PASSWORD_RESET: '/auth/password-reset'
} as const
