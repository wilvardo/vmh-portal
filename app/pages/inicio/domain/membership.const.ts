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

/**
 * Ancla del contacto del estudio en el inicio del sitio publico. Es la salida
 * que el portal ofrece cuando la decision no es de la persona (una membresia en
 * pausa): el formulario de contacto cae en la bandeja de recepcion.
 */
export const SITE_CONTACT_ANCHOR = '#contacto'

/**
 * Clave de texto de cada modalidad de pago que el portal sabe nombrar. Una
 * modalidad que el API agregue despues no se inventa: la fila no se pinta.
 */
export const PAYMENT_MODE_LABEL_KEY: Readonly<Record<string, string>> = {
  monthly: 'membership_payment_mode_monthly',
  upfront: 'membership_payment_mode_upfront'
}
