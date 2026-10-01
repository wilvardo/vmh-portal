import type { PropType } from 'vue'
import { SCHEDULE_PATH } from '~/resources/scripts/domain/session.const'
import {
  formatSessionDay,
  formatSessionTime,
  isCancellableAt
} from '~/pages/inicio/domain/upcoming-reservation.helpers'
import type { MyUpcomingReservation } from '~/pages/inicio/domain/upcoming-reservation.interface'

/** Renglon de la lista, ya escrito para pintarse. */
export interface SessionRow {
  /** Reserva. */
  id: number
  /** Que es: "Evaluacion inicial" o el nombre del entrenamiento. */
  name: string
  /** Dia en la zona del estudio. */
  day: string
  /** Hora en la zona del estudio. */
  time: string
  /** "con {nombre}" (D8); vacio si la sesion es del estudio. */
  withLabel: string
  /** Si todavia se cancela desde el portal, segun el API y el reloj. */
  isCancellable: boolean
}

/**
 * Proximas sesiones del atleta en su tablero.
 *
 * Es de presentacion: recibe las reservas ya resueltas por el API, en el orden
 * en que llegan, y solo decide como se nombran. La evaluacion se llama
 * "Evaluacion inicial" porque es lo que la persona agendo; un entrenamiento
 * lleva el nombre de su servicio cuando lo tiene. Dia y hora se escriben en la
 * zona del estudio, que es donde hay que presentarse.
 *
 * Cancelar no ocurre aqui: el componente avisa al tablero con el renglon y el
 * tablero abre la confirmacion. Si el API dice que ya no se cancela desde el
 * portal (ventana cerrada), o la sesion ya empezo segun el reloj que recibe, en
 * lugar del boton va la salida a recepcion.
 */
export default defineComponent({
  name: 'upcomingSessions',
  props: {
    /** Reservas por venir, de la mas proxima a la mas lejana. */
    reservations: {
      type: Array as PropType<MyUpcomingReservation[]>,
      required: true
    },
    /** Hora actual; reactiva en el tablero para que lo que el tiempo cierra se apague solo. */
    now: {
      type: Date,
      required: true
    }
  },
  emits: {
    /** Pide cancelar la reserva del renglon. */
    cancel: (row: SessionRow): boolean => typeof row.id === 'number'
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
        time: formatSessionTime(reservation.startsAt),
        withLabel:
          reservation.professionalName === null
            ? ''
            : i18n.t('home_session_with', { name: reservation.professionalName }),
        isCancellable: isCancellableAt(reservation, props.now)
      }))
    )

    return { items, schedulePath: SCHEDULE_PATH }
  }
})
