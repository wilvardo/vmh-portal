// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import passwordRecoveryPage from './index.vue'

const { requestRecoveryMock } = vi.hoisted(() => ({ requestRecoveryMock: vi.fn() }))

vi.mock('~/resources/scripts/infrastructure/password.repository', () => ({
  requestPasswordRecovery: requestRecoveryMock,
  resetPassword: vi.fn()
}))

/** Espera a que se resuelvan las promesas del envio. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('passwordRecoveryPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('pinta un solo titulo y la salida de vuelta al acceso', async () => {
    const wrapper = await mountSuspended(passwordRecoveryPage, { route: '/recuperar-contrasena' })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('.recovery__link').attributes('href')).toBe('/')
  })

  it('no gasta una peticion con un correo sin forma de correo', async () => {
    const wrapper = await mountSuspended(passwordRecoveryPage, { route: '/recuperar-contrasena' })

    await wrapper.find('#recovery-email').setValue('ana')
    await wrapper.find('form').trigger('submit')
    await flush()

    expect(requestRecoveryMock).not.toHaveBeenCalled()
    expect(wrapper.find('.recovery__notice-title').text()).toBe('Revisa el formato del correo.')
  })

  it('pide el enlace y muestra el mensaje generico del API, exista o no la cuenta', async () => {
    requestRecoveryMock.mockResolvedValue({ message: 'Si la cuenta existe, te llegará un correo.' })
    const wrapper = await mountSuspended(passwordRecoveryPage, { route: '/recuperar-contrasena' })

    await wrapper.find('#recovery-email').setValue('ana@correo.test')
    await wrapper.find('form').trigger('submit')
    await flush()

    expect(requestRecoveryMock).toHaveBeenCalledWith({
      baseUrl: expect.any(String),
      email: 'ana@correo.test'
    })
    expect(wrapper.text()).toContain('Si la cuenta existe, te llegará un correo.')
  })

  it('si el API falla muestra su titulo y su detalle', async () => {
    requestRecoveryMock.mockRejectedValue({
      data: { title: 'Demasiados intentos', detail: 'Espera un momento.', key: 'k', code: 'c' }
    })
    const wrapper = await mountSuspended(passwordRecoveryPage, { route: '/recuperar-contrasena' })

    await wrapper.find('#recovery-email').setValue('ana@correo.test')
    await wrapper.find('form').trigger('submit')
    await flush()

    expect(wrapper.find('.recovery__notice-title').text()).toBe('Demasiados intentos')
    expect(wrapper.find('.recovery__notice-detail').text()).toBe('Espera un momento.')
  })
})
