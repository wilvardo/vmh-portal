// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import appError from './error.vue'

describe('pantalla de error', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('una ruta que no existe dice que no la encontramos, sin hablar del panel', async () => {
    const wrapper = await mountSuspended(appError, {
      props: { error: createError({ statusCode: 404, statusMessage: 'Not Found' }) }
    })

    expect(wrapper.find('.app-error__title').text()).toBe('No encontramos esta página.')
    // Sin pagina no hay nada que reintentar: solo volver al inicio.
    expect(wrapper.find('.app-error__secondary').exists()).toBe(false)
    expect(wrapper.find('.app-error__detail').text()).toBe(
      'La dirección que abriste no existe o cambió de lugar.'
    )
    expect(wrapper.text()).not.toContain('panel')
  })

  it('cualquier otra falla pide volver a intentar y avisar al estudio', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const wrapper = await mountSuspended(appError, {
      props: { error: createError({ statusCode: 500, statusMessage: 'Server Error' }) }
    })

    expect(wrapper.find('.app-error__title').text()).toBe('Algo no salió bien.')
    expect(wrapper.find('.app-error__secondary').text()).toBe('Reintentar')
    expect(wrapper.find('.app-error__detail').text()).toContain('avisa al estudio')
    expect(wrapper.find('.app-error__action').text()).toBe('Volver al inicio')
  })

  it('sin red dice que no hay conexion en lugar de culpar al sistema', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const wrapper = await mountSuspended(appError, {
      props: { error: createError({ statusCode: 500, statusMessage: 'Failed to fetch' }) }
    })

    expect(wrapper.find('.app-error__title').text()).toBe('Estás sin conexión.')
    expect(wrapper.find('.app-error__eyebrow').text()).toBe('Sin conexión')
    expect(wrapper.find('.app-error__icon--offline').exists()).toBe(true)
  })
})
