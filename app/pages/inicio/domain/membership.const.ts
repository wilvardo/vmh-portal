import type { MembershipDisplayStatus } from './membership.interface'

/** Endpoint del perfil propio en el API. */
export const MY_PROFILE_ENDPOINT = '/users/me'

/** Idioma con el que el tablero escribe fechas, horas e importes. */
export const DATE_LOCALE = 'es-MX'

/**
 * Severidad visual de cada estado.
 *
 * "Por vencer" es aviso y no error: la membresia sigue sirviendo, solo esta por
 * terminarse. "Sin membresia" tampoco es error -nadie hizo nada mal- y por eso
 * va en neutro: es una invitacion, no un reproche. "Pendiente de pago" va en
 * informativo: el contrato esta firmado y espera su primer cobro; pintarlo como
 * alerta le diria a la persona que algo salio mal.
 */
export const MEMBERSHIP_SEVERITY: Record<MembershipDisplayStatus, string> = {
  activa: 'success',
  'por-vencer': 'warn',
  'pendiente-de-pago': 'info',
  suspendida: 'warn',
  morosa: 'error',
  vencida: 'secondary',
  'sin-membresia': 'secondary'
}
