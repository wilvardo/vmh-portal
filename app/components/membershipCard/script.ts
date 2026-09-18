import type { PropType } from 'vue'
import { MEMBERSHIP_SEVERITY } from '~/pages/inicio/domain/membership.const'
import { needsAction } from '~/pages/inicio/domain/membership.helpers'
import type { MyMembership } from '~/pages/inicio/domain/membership.interface'

/**
 * Tarjeta de la membresia del atleta.
 *
 * Es de presentacion pura: recibe la membresia ya resuelta por el API y decide
 * como se ve, nunca que significa. Los seis estados vienen del servidor; la
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

    const formattedNextPayment = computed<string>(() => {
      const next = props.membership.nextPayment
      if (next === null) return '—'

      const amount = next.amount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
      })

      return `${amount} · ${formatDate(next.dueDate)}`
    })

    const actionMessage = computed<string>(() =>
      needsAction(props.membership.displayStatus)
        ? i18n.t(`membership_action_${props.membership.displayStatus}`)
        : ''
    )

    return { severity, formattedEndsAt, formattedNextPayment, actionMessage }
  }
})
