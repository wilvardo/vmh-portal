// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AUTH_ROLE, type AuthRole } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import firstAccessPage from './index.vue'

const { requestCodeMock, completeMock, logoutMock, navigateMock } = vi.hoisted(() => ({
  requestCodeMock: vi.fn(),
  completeMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn()
}))

vi.mock('~/resources/scripts/infrastructure/first-access.repository', () => ({
  requestFirstAccessCode: requestCodeMock,
  completeFirstAccess: completeMock
}))

vi.mock('~/resources/scripts/infrastructure/auth.repository', () => ({
  login: vi.fn(),
  logout: logoutMock,
  refreshSession: vi.fn(),
  fetchCurrentUser: vi.fn()
}))

mockNuxtImport('navigateTo', () => navigateMock)

const EMAIL = 'ana@correo.test'
const PASSWORD = 'una-contrasena-larga'

/**
 * Sesion inventada con el rol pedido.
 *
 * @param role Rol de la cuenta.
 * @returns La sesion que emitiria el API al estrenar la cuenta.
 */
const sessionAs = (role: AuthRole): AuthSession => ({
  accessToken: `access-${role}`,
  refreshToken: `refresh-${role}`,
  user: { id: 4, firstName: 'Ana', lastName: 'De Prueba', email: EMAIL, role }
})

/** Espera a que se resuelvan las promesas del paso. */
const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Recorre los tres pasos con datos validos.
 *
 * @param wrapper Pantalla montada.
 */
const walkThrough = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>): Promise<void> => {
  await wrapper.find('form').trigger('submit')
  await flush()
  await wrapper.find('#first-access-code').setValue('123456')
  await wrapper.find('form').trigger('submit')
  await flush()
  await wrapper.find('#first-access-password').setValue(PASSWORD)
  await wrapper.find('#first-access-confirmation').setValue(PASSWORD)
  await wrapper.find('form').trigger('submit')
  await flush()
}

describe('firstAccessPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSession().endSession()
    requestCodeMock.mockResolvedValue({ message: 'Si la cuenta existe, te enviamos un código.' })
    logoutMock.mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('llega con el correo que la persona ya escribio en el acceso', async () => {
    const wrapper = await mountSuspended(firstAccessPage, {
      route: `/primer-acceso?correo=${encodeURIComponent(EMAIL)}`
    })

    expect((wrapper.find('#first-access-email').element as HTMLInputElement).value).toBe(EMAIL)
    expect(wrapper.find('h1').text()).toBe('Estrena tu cuenta')
  })

  it('pide el codigo y pasa al paso del codigo con el aviso generico del API', async () => {
    const wrapper = await mountSuspended(firstAccessPage, {
      route: `/primer-acceso?correo=${encodeURIComponent(EMAIL)}`
    })

    await wrapper.find('form').trigger('submit')
    await flush()

    expect(requestCodeMock).toHaveBeenCalledWith(expect.objectContaining({ email: EMAIL }))
    expect(wrapper.find('#first-access-code').exists()).toBe(true)
    expect(wrapper.text()).toContain('Si la cuenta existe, te enviamos un código.')
  })

  it('un atleta estrena su cuenta, guarda la sesion y entra a su tablero', async () => {
    completeMock.mockResolvedValue(sessionAs(AUTH_ROLE.ATHLETE))
    const wrapper = await mountSuspended(firstAccessPage, {
      route: `/primer-acceso?correo=${encodeURIComponent(EMAIL)}`
    })

    await walkThrough(wrapper)

    expect(completeMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: EMAIL, code: '123456', password: PASSWORD })
    )
    expect(useSession().session.value).toEqual(sessionAs(AUTH_ROLE.ATHLETE))
    expect(navigateMock).toHaveBeenCalledWith('/inicio')
  })

  it('una cuenta del estudio no entra: se revoca en el servidor y se explica', async () => {
    completeMock.mockResolvedValue(sessionAs(AUTH_ROLE.COACH))
    const wrapper = await mountSuspended(firstAccessPage, {
      route: `/primer-acceso?correo=${encodeURIComponent(EMAIL)}`
    })

    await walkThrough(wrapper)

    expect(wrapper.find('.first-access__notice-title').text()).toBe(
      'Esta cuenta no es de un atleta'
    )
    expect(logoutMock).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-coach', refreshToken: 'refresh-coach' })
    )
    expect(useSession().session.value).toBeNull()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
