import { MY_PAYMENTS_CURRENCY, MY_PAYMENTS_LOCALE, MY_PAYMENTS_MISSING } from './my-payments.const'
import { MY_PAYMENT_METHOD, type MyPaymentMethod } from './my-payments.enum'
import type { MyPayment, MyPaymentsPage } from './my-payments.interface'

/**
 * Lee un campo de un objeto desconocido sin confiar en su forma.
 *
 * @param source Valor crudo.
 * @param key Campo.
 * @returns El valor, o `undefined` si el origen no es objeto.
 */
const readField = (source: unknown, key: string): unknown =>
  typeof source === 'object' && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined

/**
 * Lee un numero finito.
 *
 * @param source Valor crudo.
 * @param key Campo.
 * @returns El numero, o `null`.
 */
const readNumber = (source: unknown, key: string): number | null => {
  const value = readField(source, key)

  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Lee un texto.
 *
 * @param source Valor crudo.
 * @param key Campo.
 * @returns El texto, o cadena vacia.
 */
const readText = (source: unknown, key: string): string => {
  const value = readField(source, key)

  return typeof value === 'string' ? value : ''
}

/**
 * Interpreta la forma de pago admitiendo solo las conocidas.
 *
 * @param source Pago crudo.
 * @returns La forma de pago; `other` si no se reconoce. Leerla como efectivo
 *   le diria a la persona que pago de una forma en que no pago.
 */
const readMethod = (source: unknown): MyPaymentMethod => {
  const value = readField(source, 'method')
  const known: readonly string[] = Object.values(MY_PAYMENT_METHOD)

  return typeof value === 'string' && known.includes(value)
    ? (value as MyPaymentMethod)
    : MY_PAYMENT_METHOD.OTHER
}

/**
 * Traduce un pago crudo del API.
 *
 * Solo lee lo que el portal declara: si el servidor mandara algo de mas, no
 * llega a pantalla.
 *
 * @param source Elemento crudo.
 * @returns El pago, o `null` si le falta el folio.
 */
export const parseMyPayment = (source: unknown): MyPayment | null => {
  const paymentId = readNumber(source, 'paymentId')
  if (paymentId === null) return null

  return {
    paymentId,
    amount: readNumber(source, 'amount') ?? 0,
    method: readMethod(source),
    paidAtLocal: readText(source, 'paidAtLocal'),
    planName: readText(source, 'planName'),
    isVoided: readField(source, 'isVoided') === true
  }
}

/**
 * Traduce la respuesta paginada de mis pagos.
 *
 * @param body Cuerpo completo de la respuesta (`data` y `meta`).
 * @returns La tanda ya mapeada.
 * @throws Si la respuesta no trae la lista.
 */
export const parseMyPaymentsPage = (body: unknown): MyPaymentsPage => {
  const raw = readField(body, 'data')
  if (!Array.isArray(raw)) {
    throw new Error('my-payments: la respuesta del API no cumple el contrato de mis pagos')
  }

  const payments = raw
    .map(parseMyPayment)
    .filter((payment): payment is MyPayment => payment !== null)
  const pagination = readField(readField(body, 'meta'), 'pagination')

  return {
    payments,
    total: readNumber(pagination, 'total') ?? payments.length,
    page: readNumber(pagination, 'page') ?? 1,
    lastPage: readNumber(pagination, 'lastPage') ?? 1
  }
}

/**
 * Escribe un monto como se lee en Mexico. Es formato, no calculo.
 *
 * @param amount Monto del servidor.
 * @returns El monto con su moneda.
 */
export const formatMyPaymentAmount = (amount: number): string =>
  new Intl.NumberFormat(MY_PAYMENTS_LOCALE, {
    style: 'currency',
    currency: MY_PAYMENTS_CURRENCY,
    maximumFractionDigits: 2
  }).format(amount)

/**
 * Escribe la fecha y la hora del pago.
 *
 * La marca ya viene en hora del estudio y sin desfase; se formatea en UTC para
 * que el navegador no la vuelva a correr.
 *
 * @param localStamp Marca local del API (`YYYY-MM-DDTHH:mm`).
 * @returns La fecha y la hora, o el marcador de dato ausente.
 */
export const formatMyPaymentDate = (localStamp: string): string => {
  const instant = new Date(`${localStamp}:00Z`)
  if (localStamp.length < 16 || Number.isNaN(instant.getTime())) return MY_PAYMENTS_MISSING

  const day = new Intl.DateTimeFormat(MY_PAYMENTS_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(instant)

  return `${day} · ${localStamp.slice(11, 16)}`
}
