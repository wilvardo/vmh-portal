import { useInstallCard } from './application/use-install-card'
import { INSTALL_MODE } from './domain/install-mode.enum'
import type { InstallSource } from './domain/install-source.interface'
import appInstallCardEs from './domain/locales/app-install-card.es.json'
import {
  readDeviceInfo,
  readIosHintDismissed,
  saveIosHintDismissed
} from './infrastructure/install-hint.repository'

/**
 * Invitacion a instalar el portal como app. Con aviso nativo (Android, Chrome
 * de escritorio) ofrece el boton; en Safari de iOS, que no tiene aviso, da las
 * instrucciones. Instalada o descartada, desaparece.
 */
export default defineComponent({
  name: 'appInstallCard',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', appInstallCardEs)

    // `$pwa` solo existe con service worker (no en desarrollo) y llega dentro
    // de un `reactive()`: sus refs vienen desenvueltas, asi que se adaptan con
    // `toRef` para que el caso de uso lea `.value` como declara su contrato.
    const pwa = useNuxtApp().$pwa
    const source: InstallSource | undefined = pwa
      ? {
          showInstallPrompt: toRef(pwa, 'showInstallPrompt'),
          isPWAInstalled: toRef(pwa, 'isPWAInstalled'),
          install: pwa.install,
          cancelInstall: pwa.cancelInstall
        }
      : undefined

    const card = useInstallCard({
      source,
      readDevice: readDeviceInfo,
      readIosHintDismissed,
      saveIosHintDismissed
    })

    return { ...card, INSTALL_MODE }
  }
})
