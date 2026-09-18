import type { MembershipDisplayStatus } from './membership.interface'

/** Endpoint del perfil propio en el API. */
export const MY_PROFILE_ENDPOINT = '/users/me'

/**
 * Severidad visual de cada estado.
 *
 * "Por vencer" es aviso y no error: la membresia sigue sirviendo, solo esta por
 * terminarse. "Sin membresia" tampoco es error -nadie hizo nada mal- y por eso
 * va en neutro: es una invitacion, no un reproche.
 */
export const MEMBERSHIP_SEVERITY: Record<MembershipDisplayStatus, string> = {
  activa: 'success',
  'por-vencer': 'warn',
  suspendida: 'warn',
  morosa: 'error',
  vencida: 'secondary',
  'sin-membresia': 'secondary'
}
