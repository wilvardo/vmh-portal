import { PORTAL_BRAND_DESCRIPTOR, PORTAL_BRAND_NAME } from '~/resources/scripts/constants/portal.const'
import { login as loginRequest } from '~/resources/scripts/infrastructure/auth.repository'
import {
  LOGIN_REASON_QUERY,
  PASSWORD_RECOVERY_PATH,
  POST_LOGIN_REDIRECT_PATH,
  REGISTER_PATH,
  VERIFY_EMAIL_PATH
} from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useLoginForm } from './application/use-login-form'
import { resolveReasonMessageKey } from './domain/login.helpers'
import loginEs from './domain/locales/login.es.json'

/**
 * Acceso al portal. Unica pantalla publica: pide correo y contrasena, guarda el
 * par de credenciales que emite el API y entra a su tablero.
 *
 * Es el orquestador del slice: resuelve los textos, cablea la peticion a la URL
 * del API y le entrega todo al caso de uso, que no conoce ni i18n ni el
 * enrutador.
 */
export default defineComponent({
  name: 'accessPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', loginEs)

    const config = useRuntimeConfig()
    const route = useRoute()
    const { startSession } = useSession()

    const baseUrl = config.public.BASE_API_PATH as string

    const form = useLoginForm({
      signIn: (params) => loginRequest({ baseUrl, ...params }),
      onAuthenticated: async (session: AuthSession): Promise<void> => {
        startSession({ session })
        await navigateTo(POST_LOGIN_REDIRECT_PATH)
      },
      messages: {
        validation: {
          login_error_required: i18n.t('login_error_required'),
          login_error_email_format: i18n.t('login_error_email_format'),
          login_error_password_short: i18n.t('login_error_password_short')
        },
        forbiddenTitle: i18n.t('login_error_forbidden_title'),
        forbiddenDetail: i18n.t('login_error_forbidden_detail'),
        unexpectedTitle: i18n.t('login_error_unexpected_title'),
        unexpectedDetail: i18n.t('login_error_unexpected_detail')
      }
    })

    // El guardia de sesion explica por que expulso a la persona; sin motivo, no
    // se inventa un aviso.
    const noticeMessage = computed<string>(() => {
      const reason = route.query[LOGIN_REASON_QUERY]
      const messageKey = resolveReasonMessageKey(typeof reason === 'string' ? reason : null)
      return messageKey === '' ? '' : i18n.t(messageKey)
    })

    return {
      ...form,
      noticeMessage,
      brandName: PORTAL_BRAND_NAME,
      brandDescriptor: PORTAL_BRAND_DESCRIPTOR,
      registerPath: REGISTER_PATH,
      passwordRecoveryPath: PASSWORD_RECOVERY_PATH,
      /**
       * El reenvio vive en la pantalla de confirmacion, que sabe pedirlo sola.
       * Se le pasa el correo ya escrito para que la persona no lo teclee otra
       * vez: acaba de hacerlo aqui.
       */
      resendPath: computed(() => ({
        path: VERIFY_EMAIL_PATH,
        query: { correo: form.email.value }
      }))
    }
  }
})
