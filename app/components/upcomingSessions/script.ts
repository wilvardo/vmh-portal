import type { PropType } from 'vue'
import {
  formatSessionDay,
  formatSessionTime
} from '~/pages/inicio/domain/upcoming-reservation.helpers'
import type { MyUpcomingReservation } from '~/pages/inicio/domain/upcoming-reservation.interface'

/** Renglon de la lista, ya escrito para pintarse. */
interface SessionRow {
  id: number
  name: string
  day: string
  time: string
}

/**
 * Proximas sesiones del atleta en su tablero.
 *
 * Es de presentacion pura: recibe las reservas ya resueltas por el API, en el
 * orden en que llegan, y solo decide como se nombran. La evaluacion se llama
 * "Evaluacion inicial" porque es lo que la persona agendo en el sitio; un
 * entrenamiento lleva el nombre de su servicio cuando lo tiene. Dia y hora se
 * escriben en la zona del estudio, que es donde hay que presentarse.
 */
export default defineComponent({
  name: 'upcomingSessions',
  props: {
    /** Reservas por venir, de la mas proxima a la mas lejana. */
    reservations: {
      type: Array as PropType<MyUpcomingReservation[]>,
      required: true
    }
  },
  setup(props) {
    const i18n = useI18n()

    const nameOf = (reservation: MyUpcomingReservation): string => {
      if (reservation.reservationType === 'evaluation') return i18n.t('home_session_evaluation')
      return reservation.serviceName ?? i18n.t('home_session_training')
    }

    const items = computed<SessionRow[]>(() =>
      props.reservations.map((reservation) => ({
        id: reservation.id,
        name: nameOf(reservation),
        day: formatSessionDay(reservation.startsAt),
        time: formatSessionTime(reservation.startsAt)
      }))
    )

    return { items }
  }
})
