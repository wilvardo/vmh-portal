// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useSession } from './use-session'

const refreshSessionRequest = vi.fn()
const logoutRequest = vi.fn()

vi.mock('~/resources/scripts/infrastructure/auth.repository', () => ({
  refreshSession: (...args: unknown[]) => refreshSessionRequest(...args),
  logout: (...args: unknown[]) => logoutRequest(...args)
}))

const buildSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 1,
    firstName: 'Victoria',
    lastName: 'Mendoza',
    email: 'admin@vmh.mx',
    role: AUTH_ROLE.ATHLETE
  },
  ...overrides
})

describe('useSession', () => {
  beforeEach(() => {
    window.localStorage.clear()
    refreshSessionRequest.mockReset()
    logoutRequest.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    useSession().endSession()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arranca sin sesion', () => {
    const { session, isAuthenticated, user, accessToken } = useSession()

    expect(session.value).toBeNull()
    expect(isAuthenticated.value).toBe(false)
    expect(user.value).toBeNull()
    expect(accessToken.value).toBeNull()
  })

  it('guarda la sesion en memoria y la persiste', () => {
    const { startSession, session, isAuthenticated, restoreSession, endSession } = useSession()

    startSession({ session: buildSession() })

    expect(session.value).toEqual(buildSession())
    expect(isAuthenticated.value).toBe(true)

    // Se vacia la memoria para comprobar que la persistencia sobrevive sola.
    endSession()
    window.localStorage.setItem('vmh-portal-session', JSON.stringify(buildSession()))
    expect(restoreSession()).toEqual(buildSession())
  })

  it('niega el acceso a una sesion cuyo rol no entra al portal', () => {
    const { startSession, isAuthenticated } = useSession()

    startSession({
      session: buildSession({
        user: { ...buildSession().user, role: AUTH_ROLE.RECEPTIONIST }
      })
    })

    expect(isAuthenticated.value).toBe(false)
  })

  it('renueva la sesion y guarda el par nuevo', async () => {
    const renewed = buildSession({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    refreshSessionRequest.mockResolvedValue(renewed)
    const { startSession, renewSession, session } = useSession()
    startSession({ session: buildSession() })

    const result = await renewSession()

    expect(result).toEqual(renewed)
    expect(session.value).toEqual(renewed)
    expect(refreshSessionRequest).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'refresh-token' })
    )
  })

  it('renueva una sola vez aunque se pida en paralelo', async () => {
    refreshSessionRequest.mockResolvedValue(buildSession({ accessToken: 'access-2' }))
    const { startSession, renewSession } = useSession()
    startSession({ session: buildSession() })

    await Promise.all([renewSession(), renewSession(), renewSession()])

    // Una segunda llamada con el token ya rotado seria un reuso y el API
    // revocaria toda la familia de la sesion.
    expect(refreshSessionRequest).toHaveBeenCalledTimes(1)
  })

  it('cierra la sesion cuando la renovacion falla', async () => {
    refreshSessionRequest.mockRejectedValue({ response: { status: 401 } })
    const { startSession, renewSession, session } = useSession()
    startSession({ session: buildSession() })

    const result = await renewSession()

    expect(result).toBeNull()
    expect(session.value).toBeNull()
    expect(window.localStorage.getItem('vmh-portal-session')).toBeNull()
  })

  it('no intenta renovar cuando no hay sesion', async () => {
    const { renewSession } = useSession()

    expect(await renewSession()).toBeNull()
    expect(refreshSessionRequest).not.toHaveBeenCalled()
  })

  it('revoca en el servidor al cerrar sesion', async () => {
    logoutRequest.mockResolvedValue(undefined)
    const { startSession, closeSession, session } = useSession()
    startSession({ session: buildSession() })

    await closeSession()

    expect(logoutRequest).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    )
    expect(session.value).toBeNull()
  })

  it('cierra la sesion local aunque el servidor falle', async () => {
    logoutRequest.mockRejectedValue(new Error('sin red'))
    const { startSession, closeSession, session } = useSession()
    startSession({ session: buildSession() })

    await closeSession()

    expect(session.value).toBeNull()
  })

  it('adopta la sesion que otra pestana inicio', () => {
    const { syncAcrossTabs, session } = useSession()
    const stop = syncAcrossTabs()

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'vmh-portal-session',
        newValue: JSON.stringify(buildSession())
      })
    )

    expect(session.value).toEqual(buildSession())
    stop()
  })
})
