import { fetchMyProfile, updateMyProfile } from './infrastructure/my-profile.repository'
import { useMyProfile } from './application/use-my-profile'
import { useProfileEditor } from './application/use-profile-editor'
import { useCancelPrompt } from './application/use-cancel-prompt'
import { buildLegalLinks } from './domain/legal-link.helpers'
import type { LegalLinks } from './domain/legal-link.interface'
import inicioEs from './domain/locales/inicio.es.json'
import { SCHEDULE_AVAILABILITY_CHANNEL } from '~/resources/scripts/domain/realtime.const'

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
    const clock = useClock()

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
        missingEmergencyName: i18n.t('profile_editor_error_emergency_name'),
        invalidEmergencyPhone: i18n.t('profile_editor_error_emergency_phone'),
        unexpectedTitle: i18n.t('profile_editor_error_unexpected')
      }
    })

    const greeting = computed<string>(() =>
      i18n.t('home_greeting', {
        name: tablero.view.value?.profile.firstName ?? user.value?.firstName ?? ''
      })
    )

    const siteUrl = (config.public.SITE_BASE_URL as string | undefined) ?? ''

    // Sin la direccion del sitio no hay a donde enlazar los documentos legales:
    // la tarjeta los oculta en lugar de apuntar a una pagina que no existe aqui.
    const legalLinks: LegalLinks | null = buildLegalLinks(siteUrl)

    /** Abre el editor con los datos que el tablero ya tiene. */
    const openEditor = (): void => {
      const profile = tablero.view.value?.profile
      if (profile !== undefined) editor.open(profile)
    }

    // Cancelar se confirma en el dialogo compartido con Horarios; el tablero
    // solo elige cual y se relee al terminar.
    const cancelDialog = useCancelPrompt()

    // Tablero en vivo (C-24): si el estudio cancela o mueve una reserva, se ve
    // sin recargar. El aviso no trae datos; se vuelve a preguntar al API.
    useRealtime({
      channels: [SCHEDULE_AVAILABILITY_CHANNEL],
      onChange: () => void tablero.sync()
    })

    onMounted(() => {
      void tablero.refresh()
    })

    const { isOnline } = useNetworkStatus()

    return {
      isOnline,
      clock,
      tablero,
      editor,
      greeting,
      openEditor,
      cancelDialog,
      askCancel: cancelDialog.ask,
      siteUrl,
      legalLinks
    }
  }
})
