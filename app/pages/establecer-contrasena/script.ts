import { resetPassword } from '~/resources/scripts/infrastructure/password.repository'
import { LOGIN_PATH, PASSWORD_RECOVERY_PATH } from '~/resources/scripts/domain/session.const'
import { useSetPassword } from './application/use-set-password'
import setPasswordEs from './domain/locales/set-password.es.json'

/** Nombre del parametro con el token del enlace, tal como lo arma el API. */
const TOKEN_QUERY = 'token'

/**
 * Pantalla donde se fija una contrasena a partir de un enlace. Publica.
 *
 * Sirve a los dos caminos que emiten ese enlace: quien olvido su contrasena y
 * quien fue dado de alta en el mostrador y nunca tuvo una. Es la misma pantalla
 * porque es el mismo token y el mismo desenlace.
 */
export default defineComponent({
  name: 'setPasswordPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', setPasswordEs)

    const config = useRuntimeConfig()
    const route = useRoute()
    const baseUrl = config.public.BASE_API_PATH as string

    const rawToken = route.query[TOKEN_QUERY]

    const form = useSetPassword({
      token: typeof rawToken === 'string' ? rawToken : '',
      submitPassword: (token, password) => resetPassword({ baseUrl, token, password }),
      messages: {
        tooShort: i18n.t('set_password_error_short'),
        mismatch: i18n.t('set_password_error_mismatch'),
        missingTokenTitle: i18n.t('set_password_error_missing_token_title'),
        missingTokenDetail: i18n.t('set_password_error_missing_token_detail'),
        unexpectedTitle: i18n.t('set_password_error_unexpected_title'),
        unexpectedDetail: i18n.t('set_password_error_unexpected_detail')
      }
    })

    return { ...form, loginPath: LOGIN_PATH, recoveryPath: PASSWORD_RECOVERY_PATH }
  }
})
