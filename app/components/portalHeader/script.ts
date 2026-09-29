import { LOGIN_PATH } from '~/resources/scripts/domain/session.const'
import { buildDisplayName, buildInitials } from '~/resources/scripts/domain/session.helpers'
import { useSignOut } from './application/use-sign-out'
import { PORTAL_NAV_ITEMS } from './domain/portal-header.const'
import { isNavItemActive } from './domain/portal-header.helpers'
import portalHeaderEs from './domain/locales/portal-header.es.json'

/** Destino de la navegacion ya resuelto para pintarse. */
interface NavLink {
  /** Ruta. */
  path: string
  /** Texto del enlace. */
  label: string
  /** Si es la pantalla actual. */
  isActive: boolean
}

/**
 * Encabezado de las pantallas con sesion: quien esta dentro, a donde puede ir
 * (Inicio y Horarios) y la salida.
 *
 * Salir vive aqui y no en el tablero: tiene que estar a mano desde cualquier
 * pantalla, y revoca la sesion en el API (`closeSession`), no solo en el
 * navegador.
 */
export default defineComponent({
  name: 'portalHeader',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', portalHeaderEs)

    const route = useRoute()
    const { user, closeSession } = useSession()

    const displayName = computed<string>(() =>
      user.value === null ? '' : buildDisplayName(user.value)
    )
    const initials = computed<string>(() => (user.value === null ? '' : buildInitials(user.value)))

    const links = computed<NavLink[]>(() =>
      PORTAL_NAV_ITEMS.map((item) => ({
        path: item.path,
        label: i18n.t(item.labelKey),
        isActive: isNavItemActive(route.path, item.path)
      }))
    )

    const { isSigningOut, signOut } = useSignOut({
      closeSession,
      goToLogin: async (): Promise<void> => {
        await navigateTo(LOGIN_PATH)
      }
    })

    return { user, displayName, initials, links, isSigningOut, signOut }
  }
})
