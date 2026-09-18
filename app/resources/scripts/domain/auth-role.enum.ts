/**
 * Roles del sistema. Espejan `roles.code` del API (contrato de identidad
 * USVMH1783636980000): el portal no inventa roles ni permisos granulares.
 *
 * Estan los cuatro que siembra el API, no solo el que entra al portal. La
 * distincion importa: `parseAuthUser` descarta la sesion completa cuando el rol
 * no figura aqui, asi que omitir uno que el API si devuelve convertiria un
 * "esta cuenta no tiene acceso" en un "tu sesion es invalida". Quien pasa al
 * portal lo decide `PORTAL_ALLOWED_ROLES`, no esta lista.
 */
export const AUTH_ROLE = {
  ADMIN: 'admin',
  ATHLETE: 'athlete',
  COACH: 'coach',
  RECEPTIONIST: 'receptionist'
} as const

/** Rol de una cuenta, tal como lo devuelve el API. */
export type AuthRole = (typeof AUTH_ROLE)[keyof typeof AUTH_ROLE]
