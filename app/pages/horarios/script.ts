import { bookMySpot } from '~/resources/scripts/infrastructure/my-reservations.repository'
import { fetchMySchedule } from './infrastructure/schedule.repository'
import { useSessionBooking } from './application/use-session-booking'
import { useWeekSchedule } from './application/use-week-schedule'
import { useWeekView } from './application/use-week-view'
import type { ScheduleSession } from './domain/schedule.interface'
import type { SessionSummary } from './domain/week-view.interface'
import horariosEs from './domain/locales/horarios.es.json'

/**
 * Semana del atleta: ver, reservar y cancelar (HU 32, 34, 35 y 36).
 *
 * Es el orquestador del slice: resuelve textos, cablea las peticiones al
 * cliente firmado y entrega todo a los casos de uso. Lo que se muestra -lugares,
 * estados, si se puede cancelar- viene del API; el portal no calcula nada de
 * eso por su cuenta.
 */
export default defineComponent({
  name: 'schedulePage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', horariosEs)

    const apiFetch = useApi()
    const toast = useToast()

    const week = useWeekSchedule({
      load: (weekStart) => fetchMySchedule({ apiFetch, weekStart }),
      loadErrorTitle: i18n.t('schedule_load_error')
    })

    const { view, summarize } = useWeekView({
      schedule: week.schedule,
      now: () => new Date(),
      labels: {
        evaluation: i18n.t('schedule_label_evaluation'),
        training: i18n.t('schedule_label_training')
      }
    })

    const booking = useSessionBooking({
      book: (sessionSlotId) => bookMySpot({ apiFetch, sessionSlotId }),
      notify: (notice) => toast.add({ ...notice, life: 5000 }),
      refresh: week.refresh,
      messages: {
        successTitle: i18n.t('schedule_book_success'),
        successDetail: i18n.t('schedule_book_success_detail'),
        unexpectedTitle: i18n.t('schedule_book_error_title'),
        unexpectedDetail: i18n.t('schedule_book_error_detail')
      }
    })

    // Que reserva se esta por cancelar: estado de la pantalla, no del negocio.
    const cancelTarget = ref<(SessionSummary & { reservationId: number }) | null>(null)
    const isCancelOpen = ref(false)

    const openCancel = (session: ScheduleSession): void => {
      if (session.myReservation === null) return
      cancelTarget.value = {
        reservationId: session.myReservation.reservationId,
        ...summarize(session)
      }
      isCancelOpen.value = true
    }

    const selectedSummary = computed<SessionSummary | null>(() =>
      booking.selected.value === null ? null : summarize(booking.selected.value)
    )

    onMounted(() => {
      void week.current()
    })

    return {
      week,
      view,
      booking,
      selectedSummary,
      cancelTarget,
      isCancelOpen,
      openCancel
    }
  }
})
