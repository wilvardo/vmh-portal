import { useMyPayments } from './application/use-my-payments'
import { formatMyPaymentAmount, formatMyPaymentDate } from './domain/my-payments.helpers'
import { MY_PAYMENT_METHOD, type MyPaymentMethod } from './domain/my-payments.enum'
import { fetchMyPayments } from './infrastructure/my-payments.repository'
import pagosEs from './domain/locales/pagos.es.json'

/**
 * Mis pagos: lo que el atleta ha pagado en el estudio (USVMH1783638600000,
 * regla 1; C-25 de VMH-30).
 *
 * Solo lo propio: el API decide de quien son los pagos con la sesion. Cada pago
 * dice su folio, fecha, forma de pago y monto tal como los devolvio el
 * servidor; el portal no calcula nada.
 *
 * Es el orquestador del slice: resuelve textos y cablea la peticion al caso de
 * uso.
 */
export default defineComponent({
  name: 'myPaymentsPage',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', pagosEs)

    const apiFetch = useApi()

    const list = useMyPayments({
      load: (page) => fetchMyPayments({ apiFetch, page }),
      loadErrorTitle: i18n.t('my_payments_error')
    })

    /**
     * Nombra la forma de pago como la entiende el atleta.
     *
     * @param method Forma de pago.
     * @returns El nombre ya traducido.
     */
    const methodLabel = (method: MyPaymentMethod): string => {
      if (method === MY_PAYMENT_METHOD.TERMINAL) return i18n.t('my_payments_method_terminal')
      if (method === MY_PAYMENT_METHOD.TRANSFER) return i18n.t('my_payments_method_transfer')
      if (method === MY_PAYMENT_METHOD.STRIPE) return i18n.t('my_payments_method_online')

      return i18n.t('my_payments_method_cash')
    }

    const countLabel = computed<string>(() =>
      i18n.t('my_payments_count', { shown: list.payments.value.length, total: list.total.value })
    )

    onMounted(() => {
      void list.refresh()
    })

    return {
      list,
      countLabel,
      methodLabel,
      amountLabel: formatMyPaymentAmount,
      dateLabel: formatMyPaymentDate
    }
  }
})
