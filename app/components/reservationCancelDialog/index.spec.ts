// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import reservationCancelDialog from './index.vue'

const { apiFetchMock, toastAddMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  toastAddMock: vi.fn()
}))

mockNuxtImport('useApi', () => () => apiFetchMock)
mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))

const reservation = { reservationId: 7, label: 'Entrenamiento', when: 'lunes 5, 07:00' }

/**
 * Monta el dialogo abierto sobre una reserva.
 *
 * El dialogo de PrimeVue teletransporta su contenido al cuerpo del documento,
 * asi que la prueba desactiva el teleport para afirmar sobre lo renderizado.
 *
 * @returns El componente montado.
 */
const mountDialog = async () =>
  mountSuspended(reservationCancelDialog, {
    props: { visible: true, reservation },
    global: { stubs: { teleport: true } }
  })

/** Espera a que se resuelvan las promesas pendientes. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('reservationCancelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockResolvedValue({
      data: {
        reservationId: 7,
        sessionSlotId: 41,
        reservationType: 'training',
        status: 'cancelled',
        startsAt: '2026-10-05T13:00:00.000Z'
      }
    })
  })

  it('ofrece un motivo opcional', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.text()).toContain('Motivo · opcional')
    expect(wrapper.find('#reservation-cancel-reason').exists()).toBe(true)
  })

  it('el motivo escrito llega al API con la cancelacion', async () => {
    const wrapper = await mountDialog()

    await wrapper.find('#reservation-cancel-reason').setValue('Viaje de trabajo')
    const confirm = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Cancelar reserva'))
    await confirm?.trigger('click')
    await flush()

    expect(apiFetchMock).toHaveBeenCalledWith('/users/me/reservations/7/cancel', {
      method: 'PATCH',
      body: { reason: 'Viaje de trabajo' }
    })
    expect(wrapper.emitted('settled')).toHaveLength(1)
  })

  it('sin motivo cancela igual, sin cuerpo', async () => {
    const wrapper = await mountDialog()

    const confirm = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Cancelar reserva'))
    await confirm?.trigger('click')
    await flush()

    expect(apiFetchMock).toHaveBeenCalledWith('/users/me/reservations/7/cancel', {
      method: 'PATCH'
    })
  })
})
