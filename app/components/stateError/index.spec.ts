// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import stateError from './index.vue'

describe('stateError', () => {
  it('muestra el titulo y la explicacion que recibe', async () => {
    const wrapper = await mountSuspended(stateError, {
      props: { title: 'No se pudo cargar', detail: 'Vuelve a intentarlo.' }
    })

    expect(wrapper.find('h2').text()).toBe('No se pudo cargar')
    expect(wrapper.find('.state-error__detail').text()).toBe('Vuelve a intentarlo.')
  })

  it('no dibuja reintento sin etiqueta', async () => {
    const wrapper = await mountSuspended(stateError, { props: { title: 'Error' } })

    expect(wrapper.find('.state-error__retry').exists()).toBe(false)
  })

  it('pide reintentar a quien la usa', async () => {
    const wrapper = await mountSuspended(stateError, {
      props: { title: 'Error', retryLabel: 'Volver a intentar' }
    })

    await wrapper.find('.state-error__retry').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
