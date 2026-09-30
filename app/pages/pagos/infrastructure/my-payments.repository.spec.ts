import { describe, expect, it, vi } from 'vitest'
import type { ApiFetch } from '~/composables/use-api'
import { fetchMyPayments } from './my-payments.repository'

describe('fetchMyPayments', () => {
  it('pide la tanda sin mandar ningun identificador de persona', async () => {
    const spy = vi.fn().mockResolvedValue({
      data: [{ paymentId: 7, amount: 3000 }],
      meta: { pagination: { page: 2, perPage: 10, total: 11, lastPage: 2 } }
    })

    const page = await fetchMyPayments({ apiFetch: spy as unknown as ApiFetch, page: 2 })

    expect(spy).toHaveBeenCalledWith('/users/me/payments', { query: { page: 2, perPage: 10 } })
    expect(page.payments[0]?.paymentId).toBe(7)
    expect(page.lastPage).toBe(2)
  })

  it('propaga el fallo del API', async () => {
    const spy = vi.fn().mockRejectedValue(new Error('red'))

    await expect(
      fetchMyPayments({ apiFetch: spy as unknown as ApiFetch, page: 1 })
    ).rejects.toThrow('red')
  })
})
