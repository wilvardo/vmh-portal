import type { PropType } from 'vue'
import {
  canOfferBooking,
  formatSessionTime,
  resolveCardState
} from '~/pages/horarios/domain/schedule.helpers'
import type { ScheduleSession, SessionCardState } from '~/pages/horarios/domain/schedule.interface'
import cardEs from './domain/locales/schedule-session-card.es.json'

/** Tono de la etiqueta de cada estado; disponible no lleva etiqueta. */
const STATE_SEVERITY: Record<Exclude<SessionCardState, 'available'>, string> = {
  mine: 'info',
  full: 'warn',
  unavailable: 'secondary',
  past: 'secondary'
}

/**
 * Una sesion de la semana del atleta.
 *
 * Es de presentacion pura: recibe la sesion ya resuelta por el API y avisa al
 * padre cuando la persona quiere reservarla o cancelarla. Que se pueda cancelar
 * lo decide el API (`isCancellable`); la tarjeta solo muestra la accion o, en
 * su lugar, a quien acudir.
 *
 * Nunca muestra quien mas va: solo cuantos lugares quedan.
 */
export default defineComponent({
  name: 'scheduleSessionCard',
  props: {
    /** Sesion tal como la manda el API. */
    session: {
      type: Object as PropType<ScheduleSession>,
      required: true
    }
  },
  emits: ['book', 'cancel'],
  setup(props) {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', cardEs)

    const state = computed<SessionCardState>(() => resolveCardState(props.session))

    const stateLabel = computed<string>(() =>
      state.value === 'available' ? '' : i18n.t(`session_card_state_${state.value}`)
    )

    const stateSeverity = computed<string>(() =>
      state.value === 'available' ? '' : STATE_SEVERITY[state.value]
    )

    const title = computed<string>(() => {
      if (props.session.sessionType === 'evaluation') return i18n.t('session_card_evaluation')
      return props.session.serviceName ?? i18n.t('session_card_training')
    })

    const bookLabel = computed<string>(() =>
      props.session.sessionType === 'evaluation'
        ? i18n.t('session_card_book_evaluation')
        : i18n.t('session_card_book')
    )

    return {
      state,
      stateLabel,
      stateSeverity,
      title,
      bookLabel,
      time: computed<string>(() => formatSessionTime(props.session.startsAtLocal)),
      canBook: computed<boolean>(() => canOfferBooking(props.session)),
      // Los lugares solo informan donde se puede actuar: en una sesion llena,
      // cerrada o pasada, "quedan 3" invita a algo que no se puede hacer.
      showsSpots: computed<boolean>(() => state.value === 'available' || state.value === 'mine'),
      reservation: computed(() => props.session.myReservation)
    }
  }
})
