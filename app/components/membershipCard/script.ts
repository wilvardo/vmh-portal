import type { PropType } from 'vue'
import { MEMBERSHIP_SEVERITY } from '~/pages/inicio/domain/membership.const'
import {
  formatAmount,
  formatDayMonth,
  needsAction,
  paymentModeLabelKey,
  studioContactUrl
} from '~/pages/inicio/domain/membership.helpers'
import type { MyMembership } from '~/pages/inicio/domain/membership.interface'

/**
 * Tarjeta de la membresia del atleta.
 *
 * Es de presentacion pura: recibe la membresia ya resuelta por el API y decide
 * como se ve, nunca que significa. Los siete estados vienen del servidor; la
 * tarjeta no deriva ninguno.
 */
export default defineComponent({
  name: 'membershipCard',
  props: {
    /** Membresia resuelta, tal como la manda el API. */
    membership: {
      type: Object as PropType<MyMembership>,
      required: true
    },

    /** Direccion del sitio publico, para mandar a contratar. Puede faltar. */
    siteUrl: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const i18n = useI18n()

    const severity = computed<string>(
      () => MEMBERSHIP_SEVERITY[props.membership.displayStatus] ?? 'secondary'
    )

    /** Fecha larga en espanol; sin fecha, un guion y no una cadena vacia. */
    const formatDate = (value: string | null): string =>
      value === null
        ? '—'
        : new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })

    const formattedEndsAt = computed<string>(() => formatDate(props.membership.endsAt))

    const isPendingPayment = computed<boolean>(
      () => props.membership.displayStatus === 'pendiente-de-pago'
    )

    const formattedStartsAt = computed<string>(() => formatDayMonth(props.membership.startsAt))

    /** Sin monto del servidor no se pinta la fila: el portal no lo inventa. */
    const formattedAmountDue = computed<string>(() => {
      const amount = props.membership.amountDueOnArrival
      return amount === null || amount === undefined ? '' : formatAmount(amount)
    })

    const formattedNextPayment = computed<string>(() => {
      const next = props.membership.nextPayment
      if (next === null) return '—'

      return `${formatAmount(next.amount)} · ${formatDate(next.dueDate)}`
    })

    const actionMessage = computed<string>(() =>
      needsAction(props.membership.displayStatus)
        ? i18n.t(`membership_action_${props.membership.displayStatus}`)
        : ''
    )

    /** Clave de la modalidad de pago; vacia si no hay o el portal no la conoce. */
    const paymentModeKey = computed<string>(() => paymentModeLabelKey(props.membership.paymentMode))

    /** Salida de la membresia en pausa: el contacto del estudio, si hay sitio. */
    const contactUrl = computed<string>(() =>
      props.membership.displayStatus === 'suspendida' ? studioContactUrl(props.siteUrl) : ''
    )

    return {
      severity,
      paymentModeKey,
      contactUrl,
      isPendingPayment,
      formattedEndsAt,
      formattedStartsAt,
      formattedAmountDue,
      formattedNextPayment,
      actionMessage
    }
  }
})
