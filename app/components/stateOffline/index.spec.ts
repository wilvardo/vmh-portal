// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import stateOffline from './index.vue'

describe('stateOffline', () => {
  it('dice que no hay conexion y como salir', async () => {
    const wrapper = await mountSuspended(stateOffline)

    expect(wrapper.find('h2').text()).toBe('Estás sin conexión')
    expect(wrapper.find('.state-offline__retry').text()).toBe('Reintentar')
  })

  it('pide reintentar a quien la usa', async () => {
    const wrapper = await mountSuspended(stateOffline)

    await wrapper.find('.state-offline__retry').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('cambia a gerundio mientras reintenta', async () => {
    const wrapper = await mountSuspended(stateOffline, { props: { busy: true } })

    expect(wrapper.find('.state-offline__retry').text()).toContain('Reintentando')
  })
})
