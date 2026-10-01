import type { PortalNavIconName } from '~/resources/scripts/domain/portal-nav-icon.type'

/** Un destino de la navegacion del portal. */
export interface PortalNavItem {
  /** Ruta a la que lleva. */
  path: string
  /** Clave del texto del enlace en los locales del encabezado. */
  labelKey: string
  /** Icono que acompaña al texto en la barra lateral y en las pestañas. */
  icon: PortalNavIconName
}
