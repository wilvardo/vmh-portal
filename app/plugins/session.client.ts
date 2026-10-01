import { LOGIN_PATH } from '~/resources/scripts/domain/session.const'
import { isPublicPath } from '~/resources/scripts/domain/session.helpers'

/**
 * Recupera la sesion guardada antes de que corra el guardia de rutas y mantiene
 * al portal sincronizado con las demas pestanas abiertas.
 *
 * Si otra pestana cierra sesion, esta sale a la pantalla de acceso: perfil,
 * contacto de emergencia y pagos no se quedan a la vista, y al desmontarse la
 * pantalla se cierra su canal en vivo.
 *
 * Sin este plugin, el atleta que recarga la pagina o llega desde el enlace de
 * un correo vuelve al acceso aunque su sesion siga guardada: el guardia decide
 * con la sesion en memoria, y nadie la habia leido del almacenamiento.
 *
 * Va en un plugin (y no en el middleware) porque los plugins corren una sola vez
 * al arrancar: leer el almacenamiento en cada navegacion seria trabajo repetido,
 * y el middleware necesita la sesion ya en memoria para decidir.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { restoreSession, syncAcrossTabs } = useSession()
  const router = useRouter()

  restoreSession()
  syncAcrossTabs({
    // El aviso llega desde un evento del navegador, fuera del contexto de
    // Nuxt: la navegacion se corre dentro del contexto de la app.
    onSignedOut: () => {
      if (isPublicPath(router.currentRoute.value.path)) return
      void nuxtApp.runWithContext(() => navigateTo(LOGIN_PATH))
    }
  })
})
