import type { AuthRole } from './auth-role.enum'

/**
 * Persona autenticada, con la forma exacta que devuelve el API en
 * `POST /api/auth/login`, `POST /api/auth/refresh` y `GET /api/auth/me`.
 * El panel no guarda mas datos personales que estos.
 */
export interface AuthUser {
  /** Identificador de la cuenta. */
  id: number
  /** Nombre de pila. */
  firstName: string
  /** Apellidos. */
  lastName: string
  /** Correo con el que inicia sesion. */
  email: string
  /** Rol vigente de la cuenta. */
  role: AuthRole
}

/**
 * Sesion viva del panel: el par de credenciales y la persona a la que
 * pertenecen. Es lo unico que se persiste entre recargas.
 */
export interface AuthSession {
  /** Token de acceso de vida corta que firma cada peticion. */
  accessToken: string
  /** Token de renovacion de un solo uso (el API lo rota en cada refresh). */
  refreshToken: string
  /** Persona dueña de la sesion. */
  user: AuthUser
}
