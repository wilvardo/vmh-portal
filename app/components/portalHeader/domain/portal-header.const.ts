import { POST_LOGIN_REDIRECT_PATH, SCHEDULE_PATH } from '~/resources/scripts/domain/session.const'
import type { PortalNavItem } from './portal-header.interface'

/**
 * Destinos de la navegacion del portal, en el orden en que se leen.
 *
 * Dos y nada mas: el atleta entra a ver su estado (Inicio) y a reservar
 * (Horarios). Cada pantalla nueva entra aqui y no en la plantilla.
 */
export const PORTAL_NAV_ITEMS: readonly PortalNavItem[] = [
  { path: POST_LOGIN_REDIRECT_PATH, labelKey: 'portal_header_nav_home' },
  { path: SCHEDULE_PATH, labelKey: 'portal_header_nav_schedule' }
]
