import { describe, expect, it } from 'vitest'
import {
  formatMyPaymentAmount,
  formatMyPaymentDate,
  parseMyPayment,
  parseMyPaymentsPage
} from './my-payments.helpers'

describe('parseMyPayment', () => {
  it('lee solo lo que el portal declara y descarta lo demas', () => {
    const payment = parseMyPayment({
      paymentId: 41,
      amount: 3000,
      method: 'terminal',
      paidAt: '2026-09-21T19:35:00.000Z',
      paidAtLocal: '2026-09-21T13:35',
      planName: 'Presencial Mensual',
      isVoided: false,
      registeredBy: { userId: 3, name: 'Recepcion' }
    })

    expect(payment).toEqual({
      paymentId: 41,
      amount: 3000,
      method: 'terminal',
      paidAtLocal: '2026-09-21T13:35',
      planName: 'Presencial Mensual',
      isVoided: false
    })
  })

  it('un pago sin folio no se pinta y una forma desconocida se lee como otra', () => {
    expect(parseMyPayment({ amount: 1 })).toBeNull()
    expect(parseMyPayment({ paymentId: 1, method: 'cripto' })?.method).toBe('other')
    expect(parseMyPayment({ paymentId: 1 })?.method).toBe('other')
  })
})

describe('parseMyPaymentsPage', () => {
  it('lee la tanda y su paginacion', () => {
    const page = parseMyPaymentsPage({
      data: [{ paymentId: 1 }, { roto: true }],
      meta: { pagination: { page: 1, perPage: 10, total: 12, lastPage: 2 } }
    })

    expect(page.payments).toHaveLength(1)
    expect(page).toMatchObject({ total: 12, page: 1, lastPage: 2 })
  })

  it('una respuesta sin lista rompe el contrato', () => {
    expect(() => parseMyPaymentsPage({ data: null })).toThrow('contrato')
  })
})

describe('formatos', () => {
  it('escribe el monto en pesos y la fecha con la hora del estudio', () => {
    expect(formatMyPaymentAmount(16200)).toBe('$16,200.00')
    expect(formatMyPaymentDate('2026-09-21T23:30')).toBe('21 de septiembre de 2026 · 23:30')
  })

  it('una marca vacia no inventa fecha', () => {
    expect(formatMyPaymentDate('')).toBe('—')
  })
})
