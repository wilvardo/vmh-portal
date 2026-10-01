// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNetworkStatus } from './use-network-status'

const Probe = defineComponent({
  setup() {
    return useNetworkStatus()
  },
  render() {
    return h('span', { class: 'probe' }, this.isOnline ? 'en-linea' : 'sin-red')
  }
})

/**
 * Fija lo que el navegador reporta y avisa del cambio como lo haria el sistema.
 *
 * @param online Estado de red a simular.
 */
const goNetwork = (online: boolean): void => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

describe('useNetworkStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arranca con lo que reporta el navegador', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const wrapper = await mountSuspended(Probe)

    expect(wrapper.find('.probe').text()).toBe('sin-red')
  })

  it('se entera cuando se pierde la red y cuando vuelve', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const wrapper = await mountSuspended(Probe)

    goNetwork(false)
    await nextTick()
    expect(wrapper.find('.probe').text()).toBe('sin-red')

    goNetwork(true)
    await nextTick()
    expect(wrapper.find('.probe').text()).toBe('en-linea')
  })

  it('deja de escuchar al desmontarse', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = await mountSuspended(Probe)

    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
