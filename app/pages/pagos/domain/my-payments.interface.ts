import type { MyPaymentMethod } from './my-payments.enum'

/**
 * Pago del atleta tal como lo publica el API.
 *
 * Es lo que la persona pago y nada de la trastienda del estudio: ni quien
 * cobro, ni notas de caja, ni el motivo de una anulacion.
 */
export interface MyPayment {
  /** Folio del comprobante. */
  paymentId: number
  /** Monto pagado, tal como lo devolvio el servidor. */
  amount: number
  /** Forma de pago. */
  method: MyPaymentMethod
  /** Momento del pago con el reloj del estudio (`YYYY-MM-DDTHH:mm`). */
  paidAtLocal: string
  /** Plan que cubre el pago. */
  planName: string
  /** `true` si el estudio anulo el cobro. */
  isVoided: boolean
}

/** Tanda de pagos con lo que hace falta para pedir la siguiente. */
export interface MyPaymentsPage {
  /** Pagos de la tanda. */
  payments: MyPayment[]
  /** Pagos propios en total. */
  total: number
  /** Tanda devuelta, empezando en 1. */
  page: number
  /** Ultima tanda disponible. */
  lastPage: number
}
