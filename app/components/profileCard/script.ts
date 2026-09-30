import type { PropType } from 'vue'
import type { LegalLinks } from '~/pages/inicio/domain/legal-link.interface'
import type { MyProfile } from '~/pages/inicio/domain/membership.interface'
import profileCardEs from './domain/locales/profile-card.es.json'

/**
 * Tarjeta de los datos del atleta.
 *
 * Es de presentacion pura: muestra lo que el API mando y avisa, sin bloquear,
 * cuando falta el contacto de emergencia, que es a quien se llama si algo pasa
 * en una sesion. Editar lo hace el tablero; la tarjeta solo lo pide.
 *
 * Los documentos legales se enlazan al sitio, donde vive la version vigente.
 * Sin la direccion del sitio no se pintan: un enlace relativo mandaria a una
 * pagina que el portal no tiene.
 */
export default defineComponent({
  name: 'profileCard',
  props: {
    /** Perfil tal como lo mando el API. */
    profile: {
      type: Object as PropType<MyProfile>,
      required: true
    },

    /** Enlaces a los documentos legales, o `null` sin sitio configurado. */
    legalLinks: {
      type: Object as PropType<LegalLinks | null>,
      default: null
    }
  },
  emits: ['edit'],
  setup(props, { emit }) {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', profileCardEs)

    const fullName = computed<string>(() =>
      `${props.profile.firstName} ${props.profile.lastName}`.trim()
    )

    const hasEmergencyContact = computed<boolean>(
      () =>
        props.profile.emergencyContactName !== null && props.profile.emergencyContactPhone !== null
    )

    const emergencyLine = computed<string>(() =>
      [props.profile.emergencyContactName, props.profile.emergencyContactPhone]
        .filter((part): part is string => part !== null)
        .join(' · ')
    )

    /** Pide al tablero abrir el editor. */
    const requestEdit = (): void => {
      emit('edit')
    }

    return { fullName, hasEmergencyContact, emergencyLine, requestEdit }
  }
})
