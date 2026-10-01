// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AUTH_ROLE, type AuthRole } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import accessPage from './index.vue'

const { loginMock, logoutMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn()
}))

vi.mock('~/resources/scripts/infrastructure/auth.repository', () => ({
  login: loginMock,
  logout: logoutMock,
  refreshSession: vi.fn(),
  fetchCurrentUser: vi.fn()
}))

mockNuxtImport('navigateTo', () => navigateMock)

/**
 * Sesion inventada con el rol pedido.
 *
 * @param role Rol de la cuenta.
 * @returns La sesion que emitiria el API.
 */
const sessionAs = (role: AuthRole): AuthSession => ({
  accessToken: `access-${role}`,
  refreshToken: `refresh-${role}`,
  user: { id: 4, firstName: 'Ana', lastName: 'De Prueba', email: 'ana@correo.test', role }
})

/**
 * Llena el formulario y lo envia.
 *
 * @param wrapper Pantalla montada.
 */
const signIn = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>): Promise<void> => {
  await wrapper.find('#login-email').setValue('ana@correo.test')
  await wrapper.find('#login-password').setValue('contrasena-de-prueba')
  await wrapper.find('form').trigger('submit')
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('accessPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSession().endSession()
    logoutMock.mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    useRuntimeConfig().public.SITE_BASE_URL = ''
  })

  it('explica por que la guardia la mando aqui', async () => {
    const wrapper = await mountSuspended(accessPage, { route: '/?motivo=sesion-expirada' })

    expect(wrapper.find('.access__notice-title').text()).toBe(
      'Tu sesión terminó. Vuelve a entrar para continuar.'
    )
  })

  it('sin motivo no inventa avisos', async () => {
    const wrapper = await mountSuspended(accessPage, { route: '/' })

    expect(wrapper.find('.access__notice').exists()).toBe(false)
  })

  it('un atleta entra: guarda la sesion y va a su tablero', async () => {
    loginMock.mockResolvedValue(sessionAs(AUTH_ROLE.ATHLETE))
    const wrapper = await mountSuspended(accessPage, { route: '/' })

    await signIn(wrapper)

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@correo.test', password: 'contrasena-de-prueba' })
    )
    expect(useSession().session.value).toEqual(sessionAs(AUTH_ROLE.ATHLETE))
    expect(navigateMock).toHaveBeenCalledWith('/inicio')
  })

  it('una cuenta del estudio no entra: se revoca en el servidor y se explica', async () => {
    loginMock.mockResolvedValue(sessionAs(AUTH_ROLE.RECEPTIONIST))
    const wrapper = await mountSuspended(accessPage, { route: '/' })

    await signIn(wrapper)

    expect(wrapper.find('.access__notice-title').text()).toBe('Esta cuenta no es de un atleta')
    expect(logoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'access-receptionist',
        refreshToken: 'refresh-receptionist'
      })
    )
    expect(useSession().session.value).toBeNull()
    expect(window.localStorage.getItem('vmh-portal-session')).toBeNull()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('la contrasena no se queda en el campo despues del intento', async () => {
    loginMock.mockRejectedValue({
      data: { title: 'Datos incorrectos', detail: 'Revisa.', key: 'k', code: 'VMH.AUTH.X' }
    })
    const wrapper = await mountSuspended(accessPage, { route: '/' })

    await signIn(wrapper)

    expect(wrapper.find('.access__notice-title').text()).toBe('Datos incorrectos')
    expect((wrapper.find('#login-password').element as HTMLInputElement).value).toBe('')
  })

  it('ofrece agendar en el sitio solo si hay sitio configurado', async () => {
    const withoutSite = await mountSuspended(accessPage, { route: '/' })
    expect(withoutSite.find('.access__closing').exists()).toBe(false)

    useRuntimeConfig().public.SITE_BASE_URL = 'https://sitio.test/'
    const withSite = await mountSuspended(accessPage, { route: '/' })

    expect(withSite.find('.access__closing a').attributes('href')).toBe(
      'https://sitio.test/agendar'
    )
  })
})
