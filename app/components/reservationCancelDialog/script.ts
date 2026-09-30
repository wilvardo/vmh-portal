import type { PropType } from 'vue'
import { cancelMyReservation } from '~/resources/scripts/infrastructure/my-reservations.repository'
import { useReservationCancel } from './application/use-reservation-cancel'
import { CANCEL_REASON_MAX_LENGTH } from './domain/reservation-cancel-dialog.const'
import type { CancellableReservation } from './domain/reservation-cancel-dialog.interface'
import cancelEs from './domain/locales/reservation-cancel-dialog.es.json'

/**
 * Confirmacion de cancelar una reserva propia.
 *
 * Es una sola pieza para las dos pantallas que cancelan -Horarios y el
 * tablero-: la misma pregunta, la misma advertencia de que el lugar se libera
 * y la misma lectura de los rechazos. Si cada pantalla tuviera la suya, el dia
 * que cambie la ventana una de las dos seguiria diciendo otra cosa.
 *
 * Se cierra solo en exito o cuando el estado ya habia cambiado; ante un
 * rechazo que hay que leer, se queda abierta.
 */
export default defineComponent({
  name: 'reservationCancelDialog',
  props: {
    /** Si el dialogo esta abierto. */
    visible: { type: Boolean, required: true },
    /** Reserva a cancelar; `null` mientras no se haya elegido ninguna. */
    reservation: {
      type: Object as PropType<CancellableReservation | null>,
      default: null
    }
  },
  emits: ['update:visible', 'settled'],
  setup(props, { emit }) {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', cancelEs)

    const toast = useToast()
    const apiFetch = useApi()

    const flow = useReservationCancel({
      cancel: (reservationId, reason) => cancelMyReservation({ apiFetch, reservationId, reason }),
      notify: (notice) => toast.add({ ...notice, life: 5000 }),
      onSettled: () => emit('settled'),
      messages: {
        successTitle: i18n.t('reservation_cancel_success'),
        successDetail: i18n.t('reservation_cancel_success_detail'),
        unexpectedTitle: i18n.t('reservation_cancel_error_title'),
        unexpectedDetail: i18n.t('reservation_cancel_error_detail')
      }
    })

    /** Motivo opcional que la persona quiera dejarle al estudio. */
    const reason = ref('')

    // Cada apertura empieza en blanco: el motivo de una reserva no arrastra a otra.
    watch(
      (): boolean => props.visible,
      (isVisible) => {
        if (isVisible) reason.value = ''
      }
    )

    const close = (): void => emit('update:visible', false)

    const confirm = async (): Promise<void> => {
      if (props.reservation === null) return
      const shouldClose = await flow.confirm(props.reservation.reservationId, reason.value)
      if (shouldClose) close()
    }

    return {
      isCancelling: flow.isCancelling,
      reason,
      reasonMaxLength: CANCEL_REASON_MAX_LENGTH,
      close,
      confirm
    }
  }
})
