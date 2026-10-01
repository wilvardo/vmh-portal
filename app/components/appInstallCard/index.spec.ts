// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import appInstallCard from './index.vue'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1'

describe('appInstallCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('en un navegador sin forma de instalar no ocupa lugar', async () => {
    const wrapper = await mountSuspended(appInstallCard)

    expect(wrapper.find('.app-install-card').exists()).toBe(false)
  })

  it('en Safari de iPhone explica como instalar y se puede descartar', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI)
    const wrapper = await mountSuspended(appInstallCard)

    expect(wrapper.find('.app-install-card__detail').text()).toContain('Compartir')

    await wrapper.find('.app-install-card__actions button').trigger('click')

    expect(wrapper.find('.app-install-card').exists()).toBe(false)
  })
})
