import { SESSION_CHECK } from '~/resources/scripts/domain/session-check.enum'
import {
  LOGIN_PATH,
  LOGIN_REASON,
  LOGIN_REASON_QUERY,
  type LoginReason
} from '~/resources/scripts/domain/session.const'
import { isPublicPath } from '~/resources/scripts/domain/session.helpers'

/**
 * Recupera la sesion guardada antes de que corra el guardia de rutas y mantiene
 * al portal sincronizado con las demas pestanas abiertas.
 *
 * Si otra pestana cierra sesion, esta sale a la pantalla de acceso: perfil,
 * contacto de emergencia y pagos no se quedan a la vista, y al desmontarse la
 * pantalla se cierra su canal en vivo.
 *
 * Una vez por arranque confirma la sesion restaurada contra el API (vigencia y
 * rol) **sin esperarla**: la app instalada tiene que abrir sin conexion con lo
 * guardado. Si el API dice que la sesion murio o que la cuenta ya no es de
 * atleta, se sale al acceso con el motivo; sin respuesta, nada cambia.
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
  const { restoreSession, syncAcrossTabs, verifySession } = useSession()
  const router = useRouter()

  /**
   * Saca a la persona a la pantalla de acceso desde fuera del contexto de Nuxt.
   *
   * @param reason Motivo que el acceso explica, si lo hay.
   */
  const leaveToLogin = (reason?: LoginReason): void => {
    if (isPublicPath(router.currentRoute.value.path)) return
    void nuxtApp.runWithContext(() =>
      navigateTo(
        reason === undefined
          ? LOGIN_PATH
          : { path: LOGIN_PATH, query: { [LOGIN_REASON_QUERY]: reason } }
      )
    )
  }

  // Se decide con la primera navegacion ya resuelta: antes, la ruta en curso
  // todavia es la de arranque y no se sabria si hay que salir.
  if (restoreSession() !== null) {
    void Promise.all([verifySession(), router.isReady()]).then(([check]) => {
      if (check === SESSION_CHECK.EXPIRED) leaveToLogin(LOGIN_REASON.EXPIRED)
      if (check === SESSION_CHECK.FORBIDDEN) leaveToLogin(LOGIN_REASON.FORBIDDEN)
    })
  }

  syncAcrossTabs({
    // El aviso llega desde un evento del navegador, fuera del contexto de
    // Nuxt: por eso la salida corre dentro del contexto de la app.
    onSignedOut: () => leaveToLogin()
  })
})
