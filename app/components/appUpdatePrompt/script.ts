import { useAppUpdate } from './application/use-app-update'
import { CONTROLLER_SWAP_TIMEOUT_MS } from './domain/app-update.const'
import type { AppUpdateSource } from './domain/app-update-source.interface'
import appUpdatePromptEs from './domain/locales/app-update-prompt.es.json'
import { reloadAfterSwap } from './infrastructure/page-reload.repository'

/**
 * Aviso flotante de version nueva del portal instalado. Vive en `app.vue` para
 * aparecer en cualquier pantalla, con o sin sesion.
 */
export default defineComponent({
  name: 'appUpdatePrompt',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', appUpdatePromptEs)

    // `$pwa` solo existe con service worker (no en desarrollo) y llega dentro
    // de un `reactive()`: sus refs vienen desenvueltas, asi que se adaptan con
    // `toRef` para que el caso de uso lea `.value` como declara su contrato.
    const pwa = useNuxtApp().$pwa
    const source: AppUpdateSource | undefined = pwa
      ? {
          needRefresh: toRef(pwa, 'needRefresh'),
          updateServiceWorker: pwa.updateServiceWorker,
          cancelPrompt: pwa.cancelPrompt
        }
      : undefined

    return useAppUpdate({
      source,
      reloadAfterSwap: () => reloadAfterSwap({ timeoutMs: CONTROLLER_SWAP_TIMEOUT_MS })
    })
  }
})
