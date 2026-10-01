// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import offlineBanner from './index.vue'

describe('offlineBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no ocupa lugar mientras hay red', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const wrapper = await mountSuspended(offlineBanner)

    expect(wrapper.find('.offline-banner').exists()).toBe(false)
  })

  it('avisa sin conexion como estado, sin alarma', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const wrapper = await mountSuspended(offlineBanner)

    const banner = wrapper.find('.offline-banner')
    expect(banner.attributes('role')).toBe('status')
    expect(banner.text()).toContain('Sin conexión.')
  })
})
