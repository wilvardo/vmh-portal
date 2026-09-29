import type { PropType } from 'vue'
import { SCHEDULE_PATH } from '~/resources/scripts/domain/session.const'
import { resolveEvaluationNotice } from '~/pages/inicio/domain/evaluation-notice.helpers'
import {
  formatSessionDay,
  formatSessionTime
} from '~/pages/inicio/domain/upcoming-reservation.helpers'
import type { MyUpcomingReservation } from '~/pages/inicio/domain/upcoming-reservation.interface'
import evaluationNoticeEs from './domain/locales/evaluation-notice.es.json'

/**
 * Aviso de la evaluacion inicial en el tablero.
 *
 * Es de presentacion pura: que aviso corresponde lo decide un helper del
 * dominio del tablero con lo que manda el API -la marca de evaluacion asentada
 * y las reservas por venir-. Mientras no la haya hecho, la recuerda; una vez
 * hecha, no se pinta nada.
 */
export default defineComponent({
  name: 'evaluationNotice',
  props: {
    /** Cuando se asento la evaluacion inicial; `null` mientras no la haya hecho. */
    evaluationCompletedAt: {
      type: String as PropType<string | null>,
      default: null
    },
    /** Reservas por venir, de la mas proxima a la mas lejana. */
    reservations: {
      type: Array as PropType<MyUpcomingReservation[]>,
      required: true
    }
  },
  setup(props) {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', evaluationNoticeEs)

    const notice = computed(() =>
      resolveEvaluationNotice(props.evaluationCompletedAt, props.reservations)
    )

    const bookedTitle = computed<string>(() => {
      const current = notice.value
      if (current === null || current.kind !== 'booked') return ''

      return i18n.t('evaluation_notice_booked_title', {
        day: formatSessionDay(current.startsAt),
        time: formatSessionTime(current.startsAt)
      })
    })

    return { notice, bookedTitle, schedulePath: SCHEDULE_PATH }
  }
})
