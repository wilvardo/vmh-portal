// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import appUpdatePrompt from './index.vue'

describe('appUpdatePrompt', () => {
  it('sin service worker no pinta nada', async () => {
    const wrapper = await mountSuspended(appUpdatePrompt)

    expect(wrapper.find('.app-update-prompt').exists()).toBe(false)
  })
})
