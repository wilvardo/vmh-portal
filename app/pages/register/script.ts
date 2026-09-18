import { PORTAL_BRAND_NAME } from '~/resources/scripts/constants/portal.const'
import { register as registerRequest } from '~/resources/scripts/infrastructure/registration.repository'
import { LOGIN_PATH, VERIFY_EMAIL_PATH } from '~/resources/scripts/domain/session.const'
import { useRegistration } from './application/use-registration'
import registerEs from './domain/locales/register.es.json'

/**
 * Alta de cuenta del atleta. Pantalla publica.
 *
 * Es el orquestador del slice: resuelve los textos, cablea la peticion a la URL
 * del API y le entrega todo al caso de uso, que no conoce ni i18n ni el
 * enrutador.
 *
 * Al terminar no navega a ningun lado: la misma pantalla cambia a "revisa tu
 * correo". Mandar a otra ruta perderia el correo recien capturado, que es justo
 * el dato que hay que repetirle a la persona para que sepa donde buscar.
 */
export default defineComponent({
  name: 'registerPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', registerEs)

    const config = useRuntimeConfig()
    const baseUrl = config.public.BASE_API_PATH as string

    const form = useRegistration({
      signUp: (values) => registerRequest({ baseUrl, ...values }),
      messages: {
        validation: {
          register_error_first_name: i18n.t('register_error_first_name'),
          register_error_last_name: i18n.t('register_error_last_name'),
          register_error_email: i18n.t('register_error_email'),
          register_error_phone: i18n.t('register_error_phone'),
          register_error_password: i18n.t('register_error_password'),
          register_error_privacy: i18n.t('register_error_privacy')
        },
        unexpectedTitle: i18n.t('register_error_unexpected_title'),
        unexpectedDetail: i18n.t('register_error_unexpected_detail')
      }
    })

    const doneDetail = computed<string>(() =>
      i18n.t('register_done_detail', { email: form.account.value?.email ?? '' })
    )

    /** Reenvio con el correo ya escrito: la persona acaba de teclearlo aqui. */
    const resendPath = computed(() => ({
      path: VERIFY_EMAIL_PATH,
      query: { correo: form.account.value?.email ?? '' }
    }))

    return {
      ...form,
      doneDetail,
      resendPath,
      loginPath: LOGIN_PATH,
      brandName: PORTAL_BRAND_NAME
    }
  }
})
