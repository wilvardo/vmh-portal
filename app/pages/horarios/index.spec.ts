// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import schedulePage from './index.vue'

const { apiFetchMock, useRealtimeMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  useRealtimeMock: vi.fn()
}))

/** Antes de la semana de prueba: nada caduca por el dia en que corra la suite. */
const BEFORE_WEEK = new Date('2026-10-01T12:00:00.000Z')
const clockMock = ref(BEFORE_WEEK)

mockNuxtImport('useApi', () => () => apiFetchMock)
mockNuxtImport('useToast', () => () => ({ add: vi.fn() }))
mockNuxtImport('useRealtime', () => useRealtimeMock)
// Reloj controlado por la prueba: el de verdad avanza cada medio minuto.
mockNuxtImport('useClock', () => () => clockMock)

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
  startsAt: '2026-10-05T13:00:00.000Z',
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null,
  canBook: true,
  bookingBlockedBy: null,
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
    cancelWindowMinutes: 120,
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
    useRuntimeConfig().public.SITE_BASE_URL = ''
    clockMock.value = BEFORE_WEEK
  })

  it('sin membresia avisa una sola vez arriba, con la salida, y no ofrece reservar', async () => {
    useRuntimeConfig().public.SITE_BASE_URL = 'https://sitio.test'
    const blocked = { canBook: false, bookingBlockedBy: 'VMH.RSV.MEMBERSHIP_REQUIRED' }
    apiFetchMock.mockResolvedValue(
      weekWith([
        rawSession({ sessionSlotId: 1, ...blocked }),
        rawSession({ sessionSlotId: 2, ...blocked })
      ])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()

    const notices = wrapper.findAll('.schedule__notice-title')
    expect(notices).toHaveLength(1)
    expect(notices[0]?.text()).toBe('Necesitas una membresía para reservar')
    expect(wrapper.find('.schedule__notice-action').attributes('href')).toBe(
      'https://sitio.test/#planes'
    )
    expect(wrapper.findAll('.schedule-session-card')).toHaveLength(2)
    expect(wrapper.find('.schedule-session-card__actions').exists()).toBe(false)
  })

  it('con la membresia en pausa manda a escribir al estudio', async () => {
    useRuntimeConfig().public.SITE_BASE_URL = 'https://sitio.test'
    apiFetchMock.mockResolvedValue(
      weekWith([rawSession({ canBook: false, bookingBlockedBy: 'VMH.RSV.MEMBERSHIP_NOT_ACTIVE' })])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()

    expect(wrapper.find('.schedule__notice-title').text()).toBe('Tu membresía no está activa')
    expect(wrapper.find('.schedule__notice-action').text()).toBe('Escribir al estudio')
    expect(wrapper.find('.schedule__notice-action').attributes('href')).toBe(
      'https://sitio.test/#contacto'
    )
  })

  it('un bloqueo de la sesion no levanta aviso y la sesion de otro servicio se oculta', async () => {
    apiFetchMock.mockResolvedValue(
      weekWith([
        rawSession({ sessionSlotId: 1 }),
        rawSession({
          sessionSlotId: 2,
          canBook: false,
          bookingBlockedBy: 'VMH.RSV.SERVICE_NOT_INCLUDED'
        })
      ])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()

    expect(wrapper.find('.schedule__notice-title').exists()).toBe(false)
    expect(wrapper.findAll('.schedule-session-card')).toHaveLength(1)
    expect(wrapper.find('.schedule-session-card__actions button').text()).toBe('Reservar')
  })

  it('al cruzar la ventana de cancelacion deja de ofrecer cancelar sin recargar', async () => {
    clockMock.value = new Date('2026-10-05T10:30:00.000Z')
    apiFetchMock.mockResolvedValue(
      weekWith([rawSession({ myReservation: { reservationId: 7, isCancellable: true } })])
    )

    const wrapper = await mountSuspended(schedulePage)
    await flush()
    expect(wrapper.find('.schedule-session-card__actions button').text()).toBe('Cancelar')

    clockMock.value = new Date('2026-10-05T11:30:00.000Z')
    await flush()

    expect(wrapper.find('.schedule-session-card__actions button').exists()).toBe(false)
    expect(wrapper.text()).toContain('contacta a recepción')
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
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

  it('escucha la agenda en vivo y un aviso vuelve a pedir la semana que se ve', async () => {
    apiFetchMock.mockResolvedValue(
      weekWith([rawSession({ professionalId: 1, professionalName: 'Ana Pérez' })])
    )
    const wrapper = await mountSuspended(schedulePage)
    await flush()
    const [request] = useRealtimeMock.mock.calls[0] as [
      { channels: string[]; onChange: () => void }
    ]
    expect(request.channels).toEqual(['schedule/availability/_private'])
    apiFetchMock.mockResolvedValue(
      weekWith([rawSession({ professionalId: 1, professionalName: 'Luz Ortiz' })])
    )

    request.onChange()
    await flush()

    expect(wrapper.find('.schedule-session-card__with').text()).toBe('con Luz Ortiz')
  })
})
