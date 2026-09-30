// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import schedulePage from './index.vue'

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }))

mockNuxtImport('useApi', () => () => apiFetchMock)
mockNuxtImport('useToast', () => () => ({ add: vi.fn() }))

/**
 * Sesion cruda con la forma que manda el API.
 *
 * @param overrides Campos que la prueba necesita distintos.
 * @returns La sesion.
 */
const rawSession = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  sessionSlotId: 1,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null,
  ...overrides
})

/**
 * Semana cruda con las sesiones en el lunes.
 *
 * @param sessions Sesiones del lunes.
 * @returns La respuesta del API.
 */
const weekWith = (sessions: Record<string, unknown>[]): { data: Record<string, unknown> } => ({
  data: {
    weekStart: '2026-10-05',
    weekEnd: '2026-10-11',
    evaluationPending: false,
    days: ['05', '06', '07', '08', '09', '10', '11'].map((day, index) => ({
      date: `2026-10-${day}`,
      sessions: index === 0 ? sessions : []
    }))
  }
})

/** Espera a que se resuelvan las promesas del montaje. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('schedulePage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('con mas de una profesional en la semana ofrece elegir con quien y acota', async () => {
    apiFetchMock.mockResolvedValue(
      weekWith([
        rawSession({ sessionSlotId: 1, professionalId: 1, professionalName: 'Ana Pérez' }),
        rawSession({ sessionSlotId: 2, professionalId: 2, professionalName: 'Bea Ruiz' })
      ])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()

    expect(wrapper.find('.schedule__professionals').text()).toContain('Ana Pérez')
    expect(wrapper.findAll('.schedule-session-card')).toHaveLength(2)

    const vm = wrapper.vm as unknown as { selectedProfessional: number | string }
    vm.selectedProfessional = 2
    await flush()

    const cards = wrapper.findAll('.schedule-session-card__with').map((node) => node.text())
    expect(cards).toEqual(['con Bea Ruiz'])
  })

  it('con una sola profesional no pide elegir, pero dice con quien es', async () => {
    apiFetchMock.mockResolvedValue(
      weekWith([rawSession({ professionalId: 1, professionalName: 'Ana Pérez' })])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()

    expect(wrapper.find('.schedule__professionals').exists()).toBe(false)
    expect(wrapper.find('.schedule-session-card__with').text()).toBe('con Ana Pérez')
  })
})
