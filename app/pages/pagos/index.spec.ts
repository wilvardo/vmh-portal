// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import myPaymentsPage from './index.vue'

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }))

mockNuxtImport('useApi', () => () => apiFetchMock)

/** Espera a que se resuelvan las promesas del montaje. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('myPaymentsPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('pinta cada pago con folio, fecha, forma de pago y monto', async () => {
    apiFetchMock.mockResolvedValue({
      data: [
        {
          paymentId: 41,
          amount: 16200,
          method: 'terminal',
          paidAtLocal: '2026-09-21T13:35',
          planName: 'Presencial Semestral',
          isVoided: false
        },
        {
          paymentId: 40,
          amount: 3000,
          method: 'cash',
          paidAtLocal: '2026-08-21T09:00',
          planName: 'Presencial Mensual',
          isVoided: true
        }
      ],
      meta: { pagination: { page: 1, perPage: 10, total: 2, lastPage: 1 } }
    })

    const wrapper = await mountSuspended(myPaymentsPage)
    await flush()

    const items = wrapper.findAll('.my-payments__item')
    expect(items).toHaveLength(2)
    expect(items[0]?.text()).toContain('Folio 41')
    expect(items[0]?.text()).toContain('21 de septiembre de 2026 · 13:35')
    expect(items[0]?.text()).toContain('Tarjeta en terminal')
    expect(items[0]?.text()).toContain('$16,200.00')
    expect(items[1]?.text()).toContain('Anulado por el estudio')
    expect(wrapper.find('.my-payments__more').exists()).toBe(false)
    expect(apiFetchMock).toHaveBeenCalledWith('/users/me/payments', {
      query: { page: 1, perPage: 10 }
    })
  })

  it('ofrece ver pagos anteriores cuando quedan', async () => {
    apiFetchMock.mockResolvedValue({
      data: [{ paymentId: 41, amount: 1, paidAtLocal: '2026-09-21T13:35' }],
      meta: { pagination: { page: 1, perPage: 10, total: 11, lastPage: 2 } }
    })

    const wrapper = await mountSuspended(myPaymentsPage)
    await flush()

    expect(wrapper.find('.my-payments__more').text()).toContain('Ver pagos anteriores')
    expect(wrapper.text()).toContain('1 de 11 pagos')
  })

  it('explica cuando todavia no hay pagos', async () => {
    apiFetchMock.mockResolvedValue({ data: [], meta: { pagination: { total: 0, lastPage: 1 } } })

    const wrapper = await mountSuspended(myPaymentsPage)
    await flush()

    expect(wrapper.text()).toContain('Aún no tienes pagos registrados')
  })

  it('ofrece reintentar cuando no se pudieron cargar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    apiFetchMock.mockRejectedValue(new Error('red'))

    const wrapper = await mountSuspended(myPaymentsPage)
    await flush()

    expect(wrapper.text()).toContain('No pudimos cargar tus pagos')
    expect(wrapper.text()).toContain('Reintentar')
  })
})
