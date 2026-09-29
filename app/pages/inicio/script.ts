import { fetchMyProfile, updateMyProfile } from './infrastructure/my-profile.repository'
import { useMyProfile } from './application/use-my-profile'
import { useProfileEditor } from './application/use-profile-editor'
import { useCancelPrompt } from './application/use-cancel-prompt'
import inicioEs from './domain/locales/inicio.es.json'

/**
 * Tablero del atleta. Primera pantalla tras entrar.
 *
 * Es el orquestador del slice: resuelve los textos, cablea las peticiones al
 * cliente HTTP firmado y le entrega todo a los casos de uso. La salida vive en
 * el encabezado del portal.
 */
export default defineComponent({
  name: 'homePage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', inicioEs)

    const config = useRuntimeConfig()
    const apiFetch = useApi()
    const { user } = useSession()

    const tablero = useMyProfile({
      load: () => fetchMyProfile({ apiFetch }),
      unexpectedTitle: i18n.t('home_load_error')
    })

    const editor = useProfileEditor({
      save: (values) => updateMyProfile({ apiFetch, ...values }),
      onSaved: (view) => tablero.replace(view),
      messages: {
        invalidPhone: i18n.t('profile_editor_error_phone'),
        missingName: i18n.t('profile_editor_error_name'),
        unexpectedTitle: i18n.t('profile_editor_error_unexpected')
      }
    })

    const greeting = computed<string>(() =>
      i18n.t('home_greeting', {
        name: tablero.view.value?.profile.firstName ?? user.value?.firstName ?? ''
      })
    )

    const openEditor = (): void => {
      const profile = tablero.view.value?.profile
      if (profile !== undefined) editor.open(profile)
    }

    // Cancelar se confirma en el dialogo compartido con Horarios; el tablero
    // solo elige cual y se relee al terminar.
    const cancelDialog = useCancelPrompt()

    onMounted(() => {
      void tablero.refresh()
    })

    return {
      tablero,
      editor,
      greeting,
      openEditor,
      cancelDialog,
      askCancel: cancelDialog.ask,
      siteUrl: (config.public.SITE_BASE_URL as string | undefined) ?? ''
    }
  }
})
