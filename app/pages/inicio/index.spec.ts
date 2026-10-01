// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import homePage from './index.vue'

const { apiFetchMock, useRealtimeMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  useRealtimeMock: vi.fn()
}))

/** Antes de las sesiones de prueba. */
const BEFORE_SESSIONS = new Date('2026-09-29T12:00:00.000Z')
const clockMock = ref(BEFORE_SESSIONS)

mockNuxtImport('useApi', () => () => apiFetchMock)
mockNuxtImport('useToast', () => () => ({ add: vi.fn() }))
mockNuxtImport('useRealtime', () => useRealtimeMock)
mockNuxtImport('useClock', () => () => clockMock)

/**
 * Perfil crudo tal como lo manda el API, con una reserva por venir.
 *
 * @param overrides Campos del tablero que la prueba necesita distintos.
 * @returns La respuesta del API.
 */
const profileResponse = (overrides: Record<string, unknown> = {}): { data: unknown } => ({
  data: {
    profile: {
      id: 12,
      firstName: 'Ana',
      lastName: 'De Prueba',
      email: 'ana@correo.test',
      phone: '5512000010',
      emergencyContactName: 'Luis De Prueba',
      emergencyContactPhone: '5519000001'
    },
    membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null },
    initialEvaluationCompletedAt: null,
    upcomingReservations: [
      {
        id: 7,
        reservationType: 'evaluation',
        startsAt: '2026-09-30T18:00:00.000Z',
        serviceName: null,
        isCancellable: true
      }
    ],
    ...overrides
  }
})

/** Espera a que se resuelvan las promesas del montaje. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('homePage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    clockMock.value = BEFORE_SESSIONS
  })

  it('saluda por nombre y pinta sesiones, membresia y datos', async () => {
    apiFetchMock.mockResolvedValue(profileResponse())

    const wrapper = await mountSuspended(homePage)
    await flush()

    expect(wrapper.find('h1').text()).toContain('Hola, Ana')
    expect(wrapper.find('.upcoming-sessions__name').text()).toBe('Evaluación inicial')
    expect(wrapper.find('.membership-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('ana@correo.test')
  })

  it('si el perfil no carga lo dice y ofrece reintentar, en vez de un tablero vacio', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    apiFetchMock.mockRejectedValue(new Error('caido'))

    const wrapper = await mountSuspended(homePage)
    await flush()

    expect(wrapper.text()).toContain('No se pudo cargar tu información')
    expect(wrapper.find('.membership-card').exists()).toBe(false)
  })

  it('cancelar desde la lista abre la confirmacion compartida con esa reserva', async () => {
    apiFetchMock.mockResolvedValue(profileResponse())

    const wrapper = await mountSuspended(homePage)
    await flush()
    await wrapper.find('.upcoming-sessions__cancel').trigger('click')

    const vm = wrapper.vm as unknown as {
      cancelDialog: {
        isOpen: { value: boolean }
        reservation: { value: { reservationId: number } }
      }
    }
    expect(vm.cancelDialog.isOpen.value).toBe(true)
    expect(vm.cancelDialog.reservation.value.reservationId).toBe(7)
  })

  it('cuando la sesion empieza deja de ofrecer cancelar sin recargar', async () => {
    apiFetchMock.mockResolvedValue(profileResponse())

    const wrapper = await mountSuspended(homePage)
    await flush()
    expect(wrapper.find('.upcoming-sessions__cancel').exists()).toBe(true)

    clockMock.value = new Date('2026-09-30T18:00:00.000Z')
    await flush()

    expect(wrapper.find('.upcoming-sessions__cancel').exists()).toBe(false)
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
  })

  it('escucha la agenda en vivo para releer el tablero', async () => {
    apiFetchMock.mockResolvedValue(profileResponse())

    await mountSuspended(homePage)
    await flush()

    const [request] = useRealtimeMock.mock.calls[0] as [{ channels: string[] }]
    expect(request.channels).toEqual(['schedule/availability/_private'])
  })
})
