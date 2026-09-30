import {
  PAYMENTS_PATH,
  POST_LOGIN_REDIRECT_PATH,
  SCHEDULE_PATH
} from '~/resources/scripts/domain/session.const'
import type { PortalNavItem } from './portal-header.interface'

/**
 * Destinos de la navegacion del portal, en el orden en que se leen.
 *
 * El atleta entra a ver su estado (Inicio), a reservar (Horarios) y a revisar
 * lo que ha pagado (Mis pagos). Cada pantalla nueva entra aqui y no en la
 * plantilla.
 */
export const PORTAL_NAV_ITEMS: readonly PortalNavItem[] = [
  { path: POST_LOGIN_REDIRECT_PATH, labelKey: 'portal_header_nav_home' },
  { path: SCHEDULE_PATH, labelKey: 'portal_header_nav_schedule' },
  { path: PAYMENTS_PATH, labelKey: 'portal_header_nav_payments' }
]
