// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import { SESSION_STORAGE_KEY } from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { writeStoredSession } from '~/resources/scripts/infrastructure/session-storage.repository'
import sessionPlugin from './session.client'

const { fetchCurrentUserMock, refreshSessionMock, logoutMock } = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  logoutMock: vi.fn()
}))

vi.mock('~/resources/scripts/infrastructure/auth.repository', () => ({
  fetchCurrentUser: fetchCurrentUserMock,
  refreshSession: refreshSessionMock,
  logout: logoutMock
}))

/**
 * Deja la respuesta de `/auth/me` en manos de la prueba.
 *
 * @returns Funciones para resolverla o rechazarla.
 */
const holdCurrentUser = (): {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
} => {
  let resolve: (value: unknown) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  fetchCurrentUserMock.mockReturnValue(
    new Promise((onResolve, onReject) => {
      resolve = onResolve
      reject = onReject
    })
  )

  return { resolve: (value) => resolve(value), reject: (reason) => reject(reason) }
}

const buildSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 7,
    firstName: 'Ana',
    lastName: 'De Prueba',
    email: 'ana@correo.test',
    role: AUTH_ROLE.ATHLETE
  },
  ...overrides
})

describe('plugin de sesion', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    useSession().endSession()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    logoutMock.mockResolvedValue(undefined)
    fetchCurrentUserMock.mockResolvedValue(buildSession().user)
    await useRouter().push('/')
  })

  it('recupera la sesion guardada al arrancar: recargar no saca al atleta', async () => {
    writeStoredSession({ session: buildSession() })

    await sessionPlugin(useNuxtApp())

    expect(useSession().session.value).toEqual(buildSession())
  })

  it('confirma la sesion restaurada contra el API una sola vez al arrancar', async () => {
    writeStoredSession({ session: buildSession() })

    await sessionPlugin(useNuxtApp())

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1)
    expect(fetchCurrentUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-token' })
    )
  })

  it('sin sesion guardada no pregunta nada', async () => {
    await sessionPlugin(useNuxtApp())

    expect(fetchCurrentUserMock).not.toHaveBeenCalled()
  })

  it('no espera la respuesta para arrancar, y sin red conserva la sesion', async () => {
    writeStoredSession({ session: buildSession() })
    const pending = holdCurrentUser()

    await sessionPlugin(useNuxtApp())
    expect(useSession().session.value).toEqual(buildSession())

    const router = useRouter()
    await router.push('/pagos')
    pending.reject(new TypeError('Failed to fetch'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(useSession().session.value).toEqual(buildSession())
    expect(router.currentRoute.value.path).toBe('/pagos')
  })

  it('si la sesion murio en el servidor sale al acceso con el motivo', async () => {
    writeStoredSession({ session: buildSession() })
    const pending = holdCurrentUser()
    refreshSessionMock.mockRejectedValue({ response: { status: 401 } })
    await sessionPlugin(useNuxtApp())
    const router = useRouter()
    await router.push('/pagos')

    pending.reject({ response: { status: 401 } })

    await vi.waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/?motivo=sesion-expirada')
    })
    expect(useSession().session.value).toBeNull()
  })

  it('si la cuenta ya no es de atleta la revoca y sale al acceso con el motivo', async () => {
    writeStoredSession({ session: buildSession() })
    const pending = holdCurrentUser()
    await sessionPlugin(useNuxtApp())
    const router = useRouter()
    await router.push('/pagos')

    pending.resolve({ ...buildSession().user, role: AUTH_ROLE.COACH })

    await vi.waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/?motivo=sin-acceso')
    })
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('adopta la sesion que otra pestana abrio despues de arrancar', async () => {
    await sessionPlugin(useNuxtApp())

    const incoming = buildSession({ accessToken: 'otro-token' })
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify(incoming)
      })
    )

    expect(useSession().session.value).toEqual(incoming)
  })

  it('si otra pestana cierra sesion, esta sale a la pantalla de acceso', async () => {
    writeStoredSession({ session: buildSession() })
    await sessionPlugin(useNuxtApp())
    const router = useRouter()
    await router.push('/pagos')

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        oldValue: JSON.stringify(buildSession()),
        newValue: null
      })
    )

    expect(useSession().session.value).toBeNull()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
