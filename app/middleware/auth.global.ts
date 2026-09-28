import {
  LOGIN_PATH,
  LOGIN_REASON,
  LOGIN_REASON_QUERY,
  POST_LOGIN_REDIRECT_PATH
} from '~/resources/scripts/domain/session.const'
import { canAccessPortal, isPublicPath } from '~/resources/scripts/domain/session.helpers'

/**
 * Guardia global de sesion. Protege TODAS las rutas salvo las declaradas como
 * publicas, y es fail-closed: lo que no esta explicitamente permitido, se niega.
 *
 * Tres decisiones que sostiene:
 * 1. Una cuenta valida pero sin rol de portal (quien trabaja en el estudio) NO
 *    entra: se cierra su sesion local y se le explica por que, en vez de dejarla
 *    en una pantalla en blanco. Es la imagen espejo de la regla del panel, que
 *    rechaza al atleta.
 * 2. Quien ya tiene sesion no vuelve a ver las pantallas publicas: se le manda
 *    a su tablero antes de renderizar, sin el parpadeo del formulario. Incluye
 *    el primer acceso y la recuperacion: pedirlas con sesion viva es siempre un
 *    enlace viejo.
 * 3. Todo lo demas exige sesion.
 *
 * Se usa un middleware propio en vez del de una libreria de auth porque las
 * paginas del portal usan el patron `script.ts` y `definePageMeta` no se extrae
 * de un script importado.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { session, endSession } = useSession()
  const current = session.value

  // Cuenta viva cuyo rol no entra al portal: se corta aqui, no en cada pantalla.
  if (current !== null && !canAccessPortal(current.user.role)) {
    endSession()
    if (to.path === LOGIN_PATH) return
    return navigateTo({
      path: LOGIN_PATH,
      query: { [LOGIN_REASON_QUERY]: LOGIN_REASON.FORBIDDEN }
    })
  }

  const isAuthenticated = current !== null

  if (isPublicPath(to.path)) {
    return isAuthenticated ? navigateTo(POST_LOGIN_REDIRECT_PATH) : undefined
  }

  return isAuthenticated ? undefined : navigateTo(LOGIN_PATH)
})
