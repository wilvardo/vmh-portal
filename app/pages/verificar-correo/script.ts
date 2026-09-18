import {
  resendVerification,
  verifyEmail
} from '~/resources/scripts/infrastructure/registration.repository'
import { LOGIN_PATH } from '~/resources/scripts/domain/session.const'
import { useEmailVerification } from './application/use-email-verification'
import verifyEmailEs from './domain/locales/verify-email.es.json'

/** Nombre del parametro con el token del enlace, tal como lo arma el API. */
const TOKEN_QUERY = 'token'

/** Nombre del parametro con el correo, para no pedirlo dos veces. */
const EMAIL_QUERY = 'correo'

/**
 * Confirmacion del correo. Pantalla publica.
 *
 * Atiende los dos caminos que llegan aqui: quien abre el enlace del correo -que
 * trae token y se confirma sola al montar- y quien viene a pedir otro enlace.
 * Para la persona son el mismo asunto, asi que son la misma pantalla.
 */
export default defineComponent({
  name: 'verifyEmailPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', verifyEmailEs)

    const config = useRuntimeConfig()
    const route = useRoute()
    const baseUrl = config.public.BASE_API_PATH as string

    const rawToken = route.query[TOKEN_QUERY]
    const rawEmail = route.query[EMAIL_QUERY]

    const view = useEmailVerification({
      token: typeof rawToken === 'string' ? rawToken : '',
      confirm: (token) => verifyEmail(baseUrl, token),
      resend: (email) => resendVerification(baseUrl, email),
      messages: {
        unexpectedTitle: i18n.t('verify_error_unexpected_title'),
        unexpectedDetail: i18n.t('verify_error_unexpected_detail')
      }
    })

    // El correo llega escrito cuando la persona viene del alta o del acceso: ya
    // lo tecleo una vez y pedirlo de nuevo es hacerle repetir el camino.
    if (typeof rawEmail === 'string') view.email.value = rawEmail

    onMounted(() => {
      void view.confirm()
    })

    return { ...view, loginPath: LOGIN_PATH }
  }
})
