import { PORTAL_BRAND_DESCRIPTOR, PORTAL_BRAND_NAME } from '~/resources/scripts/constants/portal.const'
import { login as loginRequest } from '~/resources/scripts/infrastructure/auth.repository'
import {
  FIRST_ACCESS_EMAIL_QUERY,
  FIRST_ACCESS_PATH,
  LOGIN_REASON_QUERY,
  PASSWORD_RECOVERY_PATH,
  POST_LOGIN_REDIRECT_PATH
} from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useLoginForm } from './application/use-login-form'
import { BOOKING_SITE_PATH } from './domain/login.const'
import { LOGIN_ERROR_ACTION } from './domain/login.enum'
import { resolveReasonMessageKey } from './domain/login.helpers'
import loginEs from './domain/locales/login.es.json'

/**
 * Acceso al portal. Pide correo y contrasena, guarda el par de credenciales que
 * emite el API y entra a su tablero. De aqui salen las otras dos puertas: el
 * primer acceso y la recuperacion.
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
    const siteUrl = (config.public.SITE_BASE_URL as string | undefined) ?? ''

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
      errorActions: LOGIN_ERROR_ACTION,
      brandName: PORTAL_BRAND_NAME,
      brandDescriptor: PORTAL_BRAND_DESCRIPTOR,
      passwordRecoveryPath: PASSWORD_RECOVERY_PATH,
      // Sin sitio configurado no hay a donde mandar a agendar: el pie se oculta.
      bookingUrl: siteUrl === '' ? '' : `${siteUrl.replace(/\/$/, '')}${BOOKING_SITE_PATH}`,
      /**
       * El primer acceso recibe el correo ya escrito aqui, para no pedirlo dos
       * veces. Sin correo, abre vacio.
       */
      firstAccessPath: computed(() => {
        const email = form.email.value.trim()
        return {
          path: FIRST_ACCESS_PATH,
          query: email === '' ? {} : { [FIRST_ACCESS_EMAIL_QUERY]: email }
        }
      })
    }
  }
})
