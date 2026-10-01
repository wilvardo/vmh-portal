import { requestPasswordRecovery } from '~/resources/scripts/infrastructure/password.repository'
import { LOGIN_PATH } from '~/resources/scripts/domain/session.const'
import { usePasswordRecovery } from './application/use-password-recovery'
import recoveryEs from './domain/locales/password-recovery.es.json'

/**
 * Solicitud de restablecimiento. Pantalla publica.
 *
 * Es el orquestador del slice: resuelve los textos, cablea la peticion a la URL
 * del API y le entrega todo al caso de uso.
 */
export default defineComponent({
  name: 'passwordRecoveryPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', recoveryEs)

    const config = useRuntimeConfig()
    const baseUrl = config.public.BASE_API_PATH as string

    const form = usePasswordRecovery({
      requestLink: (email) => requestPasswordRecovery({ baseUrl, email }),
      messages: {
        invalidEmail: i18n.t('recovery_error_email'),
        unexpectedTitle: i18n.t('recovery_error_unexpected_title'),
        unexpectedDetail: i18n.t('recovery_error_unexpected_detail')
      }
    })

    return { ...form, loginPath: LOGIN_PATH }
  }
})
