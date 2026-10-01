import { bookMySpot } from '~/resources/scripts/infrastructure/my-reservations.repository'
import { fetchMySchedule } from './infrastructure/schedule.repository'
import { useSessionBooking } from './application/use-session-booking'
import { useWeekSchedule } from './application/use-week-schedule'
import { useWeekView } from './application/use-week-view'
import { ANY_PROFESSIONAL } from './domain/schedule.const'
import { collectWeekProfessionals, filterWeekByProfessional } from './domain/schedule.helpers'
import type {
  ScheduleProfessional,
  ScheduleSession,
  WeekSchedule
} from './domain/schedule.interface'
import type { SessionSummary } from './domain/week-view.interface'
import horariosEs from './domain/locales/horarios.es.json'
import { SCHEDULE_AVAILABILITY_CHANNEL } from '~/resources/scripts/domain/realtime.const'

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

    // Con quien (D8): se ofrece elegir solo si la semana tiene mas de una
    // profesional. Es un recorte de pantalla; el API ya decide que sesiones son
    // del atleta.
    const selectedProfessional = ref<number | typeof ANY_PROFESSIONAL>(ANY_PROFESSIONAL)

    const professionals = computed<ScheduleProfessional[]>(() =>
      week.schedule.value === null ? [] : collectWeekProfessionals(week.schedule.value)
    )

    const professionalOptions = computed(() => [
      { value: ANY_PROFESSIONAL, label: i18n.t('schedule_professional_any') },
      ...professionals.value.map((professional) => ({
        value: professional.id,
        label: professional.name
      }))
    ])

    // Si la semana nueva ya no tiene a la elegida, se vuelve a "cualquiera".
    watch(professionals, (list) => {
      const chosen = selectedProfessional.value
      if (chosen !== ANY_PROFESSIONAL && !list.some((item) => item.id === chosen)) {
        selectedProfessional.value = ANY_PROFESSIONAL
      }
    })

    const visibleSchedule = computed<WeekSchedule | null>(() => {
      const schedule = week.schedule.value
      if (schedule === null) return null

      const chosen = selectedProfessional.value

      return filterWeekByProfessional(schedule, chosen === ANY_PROFESSIONAL ? null : chosen)
    })

    const { view, summarize } = useWeekView({
      schedule: visibleSchedule,
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

    // Horarios en vivo (C-24): un lugar que se libera o se ocupa se ve sin
    // recargar. El aviso no trae datos; se vuelve a preguntar al API.
    useRealtime({
      channels: [SCHEDULE_AVAILABILITY_CHANNEL],
      onChange: () => void week.sync()
    })

    onMounted(() => {
      void week.current()
    })

    const { isOnline } = useNetworkStatus()

    return {
      isOnline,
      week,
      view,
      booking,
      selectedSummary,
      professionals,
      professionalOptions,
      selectedProfessional,
      cancelTarget,
      isCancelOpen,
      openCancel
    }
  }
})
