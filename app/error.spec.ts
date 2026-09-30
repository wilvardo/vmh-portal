// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import appError from './error.vue'

describe('pantalla de error', () => {
  it('una ruta que no existe dice que no la encontramos, sin hablar del panel', async () => {
    const wrapper = await mountSuspended(appError, {
      props: { error: createError({ statusCode: 404, statusMessage: 'Not Found' }) }
    })

    expect(wrapper.find('.app-error__title').text()).toBe('No encontramos esta página')
    expect(wrapper.find('.app-error__detail').text()).toBe(
      'La dirección que abriste no existe o cambió de lugar.'
    )
    expect(wrapper.text()).not.toContain('panel')
  })

  it('cualquier otra falla pide volver a intentar y avisar al estudio', async () => {
    const wrapper = await mountSuspended(appError, {
      props: { error: createError({ statusCode: 500, statusMessage: 'Server Error' }) }
    })

    expect(wrapper.find('.app-error__title').text()).toBe('Algo no salió bien')
    expect(wrapper.find('.app-error__detail').text()).toContain('avisa al estudio')
    expect(wrapper.find('.app-error__action').text()).toBe('Volver al inicio')
  })
})
