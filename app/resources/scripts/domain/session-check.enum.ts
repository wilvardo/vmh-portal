/**
 * Resultado de confirmar contra el API la sesion restaurada al arrancar.
 *
 * `UNVERIFIED` no es un error: sin red o con el servidor caido la sesion
 * guardada se conserva, porque la app instalada debe abrir sin conexion.
 */
export const SESSION_CHECK = {
  /** El API reconoce la sesion y el rol entra al portal. */
  VALID: 'valid',
  /** La cuenta ya no tiene un rol del portal: se revoco y se descarto. */
  FORBIDDEN: 'forbidden',
  /** La sesion murio en el servidor y no se pudo renovar: se descarto. */
  EXPIRED: 'expired',
  /** No se pudo preguntar (sin red, servidor caido): se conserva como esta. */
  UNVERIFIED: 'unverified'
} as const

/** Resultado de confirmar la sesion restaurada. */
export type SessionCheck = (typeof SESSION_CHECK)[keyof typeof SESSION_CHECK]
