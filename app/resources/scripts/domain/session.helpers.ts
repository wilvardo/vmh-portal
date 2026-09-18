import { AUTH_ROLE, type AuthRole } from './auth-role.enum'
import type { AuthSession, AuthUser } from './session.interface'
import { PORTAL_ALLOWED_ROLES, PUBLIC_PATHS } from './session.const'

/** Roles que el API puede devolver, para validar lo que llega por la red. */
const KNOWN_ROLES: readonly string[] = Object.values(AUTH_ROLE)

/**
 * Indica si una ruta puede visitarse sin sesion. Fail-closed: lo que no esta
 * declarado como publico exige sesion.
 *
 * @param path Ruta a evaluar (sin query ni hash).
 * @returns `true` si la ruta es publica.
 */
export const isPublicPath = (path: string): boolean => PUBLIC_PATHS.includes(path)

/**
 * Indica si un rol tiene acceso al portal. Un rol desconocido (o uno que el API
 * agregue mas adelante) se niega: la puerta se abre por lista, no por descarte.
 *
 * @param role Rol de la cuenta, tal como llego del API.
 * @returns `true` si el rol puede entrar al portal.
 */
export const canAccessPortal = (role: string): boolean =>
  PORTAL_ALLOWED_ROLES.includes(role as AuthRole)

/**
 * Valida que un valor cualquiera tenga la forma de la persona autenticada del
 * contrato del API. Se usa sobre datos que vienen de la red o del
 * almacenamiento local, donde nada garantiza la forma.
 *
 * @param value Valor a validar.
 * @returns La persona validada, o `null` si el valor no cumple el contrato.
 */
export const parseAuthUser = (value: unknown): AuthUser | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Partial<Record<keyof AuthUser, unknown>>
  const isValid =
    typeof candidate.id === 'number' &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string' &&
    KNOWN_ROLES.includes(candidate.role)

  if (!isValid) return null

  return {
    id: candidate.id as number,
    firstName: candidate.firstName as string,
    lastName: candidate.lastName as string,
    email: candidate.email as string,
    role: candidate.role as AuthRole
  }
}

/**
 * Valida que un valor cualquiera tenga la forma de una sesion completa. Los
 * campos extra que traiga el origen se descartan.
 *
 * @param value Valor a validar.
 * @returns La sesion validada, o `null` si el valor no cumple el contrato.
 */
export const parseAuthSession = (value: unknown): AuthSession | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as { accessToken?: unknown; refreshToken?: unknown; user?: unknown }
  if (typeof candidate.accessToken !== 'string' || candidate.accessToken.length === 0) return null
  if (typeof candidate.refreshToken !== 'string' || candidate.refreshToken.length === 0) return null

  const user = parseAuthUser(candidate.user)
  if (user === null) return null

  return { accessToken: candidate.accessToken, refreshToken: candidate.refreshToken, user }
}

/**
 * Arma el nombre visible de una persona. Se usa en el encabezado del portal, que
 * es un espacio estrecho: si falta el apellido, no deja un espacio colgando.
 *
 * @param user Persona autenticada.
 * @returns Nombre y apellidos sin espacios sobrantes.
 */
export const buildDisplayName = (user: AuthUser): string =>
  `${user.firstName} ${user.lastName}`.trim().replace(/\s+/g, ' ')

/**
 * Iniciales de la persona para el distintivo del encabezado. Dos letras como
 * maximo, en caja alta.
 *
 * @param user Persona autenticada.
 * @returns Iniciales, o cadena vacia si el nombre no tiene letras.
 */
export const buildInitials = (user: AuthUser): string =>
  buildDisplayName(user)
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
