import type { InstallContext } from './install-context.interface'
import { INSTALL_MODE, type InstallMode } from './install-mode.enum'

/** iPhone, iPad o iPod (incluido el iPad que se anuncia como Mac con pantalla tactil). */
const APPLE_MOBILE = /iphone|ipad|ipod/i
/** Navegadores de iOS que no son Safari: no pueden instalar desde Compartir. */
const IOS_OTHER_BROWSER = /crios|fxios|edgios|opios|gsa\//i

/**
 * Indica si el agente de usuario es Safari en iPhone o iPad, el unico de iOS
 * que puede agregar el portal a la pantalla de inicio.
 *
 * @param userAgent Agente de usuario del navegador.
 * @param maxTouchPoints Puntos tactiles del dispositivo (distingue el iPad que se anuncia como Mac).
 * @returns `true` en Safari de iOS.
 */
export const isIosSafari = (userAgent: string, maxTouchPoints = 0): boolean => {
  const isAppleMobile =
    APPLE_MOBILE.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)

  return isAppleMobile && /safari/i.test(userAgent) && !IOS_OTHER_BROWSER.test(userAgent)
}

/**
 * Decide como ofrecer instalar el portal. Instalada no se ofrece nada; con
 * aviso nativo se usa ese; en Safari de iOS se dan instrucciones, salvo que la
 * persona ya las haya descartado.
 *
 * @param context Lo que se sabe del dispositivo.
 * @param maxTouchPoints Puntos tactiles del dispositivo.
 * @returns El modo de instalacion a ofrecer.
 */
export const resolveInstallMode = (context: InstallContext, maxTouchPoints = 0): InstallMode => {
  if (context.isStandalone) return INSTALL_MODE.NONE
  if (context.canPrompt) return INSTALL_MODE.PROMPT
  if (!context.iosHintDismissed && isIosSafari(context.userAgent, maxTouchPoints)) {
    return INSTALL_MODE.IOS
  }

  return INSTALL_MODE.NONE
}
