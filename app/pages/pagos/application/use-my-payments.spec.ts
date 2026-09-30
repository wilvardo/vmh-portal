import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MyPayment, MyPaymentsPage } from '../domain/my-payments.interface'
import { useMyPayments } from './use-my-payments'

/**
 * Pago de prueba.
 *
 * @param paymentId Folio.
 * @returns El pago.
 */
const pago = (paymentId: number): MyPayment => ({
  paymentId,
  amount: 3000,
  method: 'cash',
  paidAtLocal: '2026-09-21T13:35',
  planName: 'Presencial Mensual',
  isVoided: false
})

/**
 * Tanda de prueba.
 *
 * @param page Tanda.
 * @param ids Folios.
 * @returns La tanda de dos en total.
 */
const tanda = (page: number, ids: number[]): MyPaymentsPage => ({
  payments: ids.map(pago),
  total: 3,
  page,
  lastPage: 2
})

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMyPayments', () => {
  it('carga la primera tanda y suma las anteriores abajo', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(tanda(1, [3, 2]))
      .mockResolvedValueOnce(tanda(2, [1]))
    const list = useMyPayments({ load, loadErrorTitle: 'No pudimos' })

    await list.refresh()
    expect(list.hasMore.value).toBe(true)

    await list.loadMore()

    expect(load).toHaveBeenLastCalledWith(2)
    expect(list.payments.value.map((payment) => payment.paymentId)).toEqual([3, 2, 1])
    expect(list.hasMore.value).toBe(false)
  })

  it('un fallo de la primera carga se dice y no deja nada pintado', async () => {
    const list = useMyPayments({
      load: vi.fn().mockRejectedValue(new Error('red')),
      loadErrorTitle: 'No pudimos cargar tus pagos'
    })

    await list.refresh()

    expect(list.errorTitle.value).toBe('No pudimos cargar tus pagos')
    expect(list.payments.value).toEqual([])
    expect(list.isEmpty.value).toBe(false)
  })

  it('un fallo al pedir anteriores conserva lo que ya estaba', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(tanda(1, [3, 2]))
      .mockRejectedValueOnce(new Error('red'))
    const list = useMyPayments({ load, loadErrorTitle: '' })

    await list.refresh()
    await list.loadMore()

    expect(list.payments.value).toHaveLength(2)
    expect(list.isLoading.value).toBe(false)
    expect(list.moreFailed.value).toBe(true)
  })

  it('sin pagos queda vacio', async () => {
    const list = useMyPayments({
      load: vi.fn().mockResolvedValue({ payments: [], total: 0, page: 1, lastPage: 1 }),
      loadErrorTitle: ''
    })

    await list.refresh()

    expect(list.isEmpty.value).toBe(true)
  })
})
