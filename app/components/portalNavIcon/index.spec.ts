// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import portalNavIcon from './index.vue'

describe('portalNavIcon', () => {
  it('dibuja el icono del destino y lo esconde del lector de pantalla', async () => {
    const wrapper = await mountSuspended(portalNavIcon, { props: { name: 'schedule' } })

    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('path').length).toBeGreaterThan(0)
  })
})
