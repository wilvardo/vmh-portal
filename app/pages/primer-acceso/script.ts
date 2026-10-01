import {
  completeFirstAccess,
  requestFirstAccessCode
} from '~/resources/scripts/infrastructure/first-access.repository'
import {
  FIRST_ACCESS_EMAIL_QUERY,
  LOGIN_PATH,
  PASSWORD_RECOVERY_PATH,
  POST_LOGIN_REDIRECT_PATH
} from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useFirstAccess } from './application/use-first-access'
import { FIRST_ACCESS_STEP_ORDER } from './domain/first-access.const'
import { FIRST_ACCESS_STEP } from './domain/first-access.enum'
import { resolveStepPosition } from './domain/first-access.helpers'
import firstAccessEs from './domain/locales/first-access.es.json'

/**
 * Primer acceso al portal. Pantalla publica.
 *
 * Es la unica puerta para estrenar una cuenta, venga de la agenda del sitio o
 * del alta en mostrador: correo, codigo de 6 digitos y contrasena. Al terminar
 * abre sesion con el mismo nucleo que el acceso y lleva al tablero.
 *
 * Es el orquestador del slice: resuelve los textos, cablea las peticiones a la
 * URL del API y le entrega todo al caso de uso.
 */
export default defineComponent({
  name: 'firstAccessPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', firstAccessEs)

    const config = useRuntimeConfig()
    const route = useRoute()
    const { startSession, revokeSession } = useSession()

    const baseUrl = config.public.BASE_API_PATH as string
    const rawEmail = route.query[FIRST_ACCESS_EMAIL_QUERY]

    const flow = useFirstAccess({
      initialEmail: typeof rawEmail === 'string' ? rawEmail : '',
      requestCode: (email) => requestFirstAccessCode({ baseUrl, email }),
      complete: (params) => completeFirstAccess({ baseUrl, ...params }),
      onAuthenticated: async (session: AuthSession): Promise<void> => {
        startSession({ session })
        await navigateTo(POST_LOGIN_REDIRECT_PATH)
      },
      revoke: (session) => revokeSession({ session }),
      messages: {
        invalidEmail: i18n.t('first_access_error_email'),
        incompleteCode: i18n.t('first_access_error_code'),
        passwordShort: i18n.t('first_access_error_password_short'),
        passwordMismatch: i18n.t('first_access_error_password_mismatch'),
        forbiddenTitle: i18n.t('first_access_error_forbidden_title'),
        forbiddenDetail: i18n.t('first_access_error_forbidden_detail'),
        unexpectedTitle: i18n.t('first_access_error_unexpected_title'),
        unexpectedDetail: i18n.t('first_access_error_unexpected_detail')
      }
    })

    return {
      ...flow,
      steps: FIRST_ACCESS_STEP,
      stepPosition: computed<number>(() => resolveStepPosition(flow.step.value)),
      totalSteps: FIRST_ACCESS_STEP_ORDER.length,
      loginPath: LOGIN_PATH,
      recoveryPath: PASSWORD_RECOVERY_PATH
    }
  }
})
