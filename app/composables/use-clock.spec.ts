// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useClock } from './use-clock'

const Probe = defineComponent({
  setup() {
    return { now: useClock() }
  },
  render() {
    return h('span', { class: 'probe' }, this.now.toISOString())
  }
})

/**
 * Simula que la pestana cambia de visibilidad.
 *
 * @param state Visibilidad a reportar.
 */
const setVisibility = (state: DocumentVisibilityState): void => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('arranca con la hora actual', async () => {
    const wrapper = await mountSuspended(Probe)

    expect(wrapper.find('.probe').text()).toBe('2026-10-05T10:00:00.000Z')
  })

  it('avanza cada medio minuto', async () => {
    const wrapper = await mountSuspended(Probe)

    await vi.advanceTimersByTimeAsync(30_000)

    expect(wrapper.find('.probe').text()).toBe('2026-10-05T10:00:30.000Z')
  })

  it('se pone al dia al volver a la pestana, aunque el temporizador se haya congelado', async () => {
    const wrapper = await mountSuspended(Probe)
    vi.setSystemTime(new Date('2026-10-05T12:00:00.000Z'))

    setVisibility('visible')
    await nextTick()

    expect(wrapper.find('.probe').text()).toBe('2026-10-05T12:00:00.000Z')
  })

  it('deja de avanzar al desmontarse', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = await mountSuspended(Probe)

    wrapper.unmount()

    expect(clearSpy).toHaveBeenCalled()
  })
})
