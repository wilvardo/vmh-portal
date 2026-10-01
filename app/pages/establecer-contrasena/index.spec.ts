// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import setPasswordPage from './index.vue'

const { resetPasswordMock } = vi.hoisted(() => ({ resetPasswordMock: vi.fn() }))

vi.mock('~/resources/scripts/infrastructure/password.repository', () => ({
  requestPasswordRecovery: vi.fn(),
  resetPassword: resetPasswordMock
}))

const PASSWORD = 'una-contrasena-larga'

/** Espera a que se resuelvan las promesas del envio. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Captura la contrasena dos veces y envia.
 *
 * @param wrapper Pantalla montada.
 * @param confirmation Segunda captura.
 */
const submit = async (
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  confirmation = PASSWORD
): Promise<void> => {
  await wrapper.find('#set-password-value').setValue(PASSWORD)
  await wrapper.find('#set-password-confirmation').setValue(confirmation)
  await wrapper.find('form').trigger('submit')
  await flush()
}

describe('setPasswordPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('fija la contrasena con el token del enlace y ofrece entrar', async () => {
    resetPasswordMock.mockResolvedValue({ message: 'Listo, ya puedes entrar.' })
    const wrapper = await mountSuspended(setPasswordPage, {
      route: '/establecer-contrasena?token=abc123'
    })

    await submit(wrapper)

    expect(resetPasswordMock).toHaveBeenCalledWith({
      baseUrl: expect.any(String),
      token: 'abc123',
      password: PASSWORD
    })
    expect(wrapper.find('h1').text()).toBe('Listo, ya puedes entrar.')
    expect(wrapper.find('.set-password__link').attributes('href')).toBe('/')
  })

  it('un enlace sin token no llama al API y manda a pedir otro', async () => {
    const wrapper = await mountSuspended(setPasswordPage, { route: '/establecer-contrasena' })

    await submit(wrapper)

    expect(resetPasswordMock).not.toHaveBeenCalled()
    expect(wrapper.find('.set-password__notice-title').text()).toBe('Este enlace está incompleto')
    expect(wrapper.find('.set-password__notice-action').attributes('href')).toBe(
      '/recuperar-contrasena'
    )
  })

  it('si las dos capturas no coinciden lo dice sin llamar al API', async () => {
    const wrapper = await mountSuspended(setPasswordPage, {
      route: '/establecer-contrasena?token=abc123'
    })

    await submit(wrapper, 'otra-contrasena-larga')

    expect(resetPasswordMock).not.toHaveBeenCalled()
    expect(wrapper.find('.set-password__notice-title').text()).toBe(
      'Las dos contraseñas no coinciden.'
    )
  })

  it('un enlace vencido muestra el texto del API y la salida para pedir otro', async () => {
    resetPasswordMock.mockRejectedValue({
      data: { title: 'El enlace venció', detail: 'Pide uno nuevo.', key: 'k', code: 'c' }
    })
    const wrapper = await mountSuspended(setPasswordPage, {
      route: '/establecer-contrasena?token=abc123'
    })

    await submit(wrapper)

    expect(wrapper.find('.set-password__notice-title').text()).toBe('El enlace venció')
    expect(wrapper.find('.set-password__notice-detail').text()).toBe('Pide uno nuevo.')
  })
})
