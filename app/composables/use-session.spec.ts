// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useSession } from './use-session'

const refreshSessionRequest = vi.fn()
const logoutRequest = vi.fn()
const fetchCurrentUserRequest = vi.fn()

vi.mock('~/resources/scripts/infrastructure/auth.repository', () => ({
  refreshSession: (...args: unknown[]) => refreshSessionRequest(...args),
  logout: (...args: unknown[]) => logoutRequest(...args),
  fetchCurrentUser: (...args: unknown[]) => fetchCurrentUserRequest(...args)
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
    fetchCurrentUserRequest.mockReset()
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

  it('renueva bajo el candado del navegador compartido con las demas pestanas', async () => {
    const request = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) =>
      callback()
    )
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true })
    refreshSessionRequest.mockResolvedValue(buildSession({ refreshToken: 'refresh-2' }))
    const { startSession, renewSession } = useSession()
    startSession({ session: buildSession() })

    await renewSession()

    expect(request).toHaveBeenCalledWith(
      'vmh-portal-session-refresh',
      { mode: 'exclusive' },
      expect.any(Function)
    )
    Object.defineProperty(navigator, 'locks', { value: null, configurable: true })
  })

  it('si otra pestana renovo mientras esperaba, adopta su par y no gasta el token viejo', async () => {
    const { startSession, renewSession, session } = useSession()
    startSession({ session: buildSession() })
    // La otra pestana ya roto el par y lo dejo guardado.
    const renewedElsewhere = buildSession({ accessToken: 'access-9', refreshToken: 'refresh-9' })
    window.localStorage.setItem('vmh-portal-session', JSON.stringify(renewedElsewhere))

    const result = await renewSession()

    expect(refreshSessionRequest).not.toHaveBeenCalled()
    expect(result).toEqual(renewedElsewhere)
    expect(session.value).toEqual(renewedElsewhere)
  })

  it('si otra pestana cerro sesion mientras esperaba el candado, no renueva', async () => {
    const { startSession, renewSession, syncAcrossTabs, session } = useSession()
    startSession({ session: buildSession() })
    const stop = syncAcrossTabs()
    const request = vi.fn((_name: string, _options: unknown, callback: () => Promise<unknown>) => {
      // Mientras esta pestana esperaba, la otra salio.
      window.localStorage.removeItem('vmh-portal-session')
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'vmh-portal-session', newValue: null })
      )
      return callback()
    })
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true })

    const result = await renewSession()

    expect(result).toBeNull()
    expect(refreshSessionRequest).not.toHaveBeenCalled()
    expect(session.value).toBeNull()
    Object.defineProperty(navigator, 'locks', { value: null, configurable: true })
    stop()
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

  it('revoca en el servidor una sesion que nunca se guardo, sin tocar la local', async () => {
    logoutRequest.mockResolvedValue(undefined)
    const { startSession, revokeSession, session } = useSession()
    startSession({ session: buildSession() })
    const rejected = buildSession({ accessToken: 'access-staff', refreshToken: 'refresh-staff' })

    await revokeSession({ session: rejected })

    expect(logoutRequest).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-staff', refreshToken: 'refresh-staff' })
    )
    expect(session.value).toEqual(buildSession())
  })

  it('revocar no falla aunque el servidor no responda', async () => {
    logoutRequest.mockRejectedValue(new Error('sin red'))

    await expect(useSession().revokeSession({ session: buildSession() })).resolves.toBeUndefined()
  })

  it('cierra la sesion local aunque el servidor falle', async () => {
    logoutRequest.mockRejectedValue(new Error('sin red'))
    const { startSession, closeSession, session } = useSession()
    startSession({ session: buildSession() })

    await closeSession()

    expect(session.value).toBeNull()
  })

  it('avisa para salir cuando otra pestana cierra la sesion', () => {
    const onSignedOut = vi.fn()
    const { startSession, syncAcrossTabs, session } = useSession()
    startSession({ session: buildSession() })
    const stop = syncAcrossTabs({ onSignedOut })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'vmh-portal-session',
        oldValue: JSON.stringify(buildSession()),
        newValue: null
      })
    )

    expect(session.value).toBeNull()
    expect(onSignedOut).toHaveBeenCalledTimes(1)
    stop()
  })

  it('sin sesion previa, un cierre en otra pestana no saca a nadie', () => {
    const onSignedOut = vi.fn()
    const stop = useSession().syncAcrossTabs({ onSignedOut })

    window.dispatchEvent(new StorageEvent('storage', { key: 'vmh-portal-session', newValue: null }))

    expect(onSignedOut).not.toHaveBeenCalled()
    stop()
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

  describe('verifySession', () => {
    it('confirma la sesion y adopta lo que el API dice hoy de la persona', async () => {
      const { startSession, verifySession, session } = useSession()
      startSession({ session: buildSession() })
      fetchCurrentUserRequest.mockResolvedValue({ ...buildSession().user, firstName: 'Vicky' })

      expect(await verifySession()).toBe('valid')
      expect(fetchCurrentUserRequest).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'access-token' })
      )
      expect(session.value?.user.firstName).toBe('Vicky')
    })

    it('si la cuenta ya no es de atleta, la revoca y la descarta', async () => {
      logoutRequest.mockResolvedValue(undefined)
      const { startSession, verifySession, session } = useSession()
      startSession({ session: buildSession() })
      fetchCurrentUserRequest.mockResolvedValue({
        ...buildSession().user,
        role: AUTH_ROLE.RECEPTIONIST
      })

      expect(await verifySession()).toBe('forbidden')
      expect(session.value).toBeNull()
      expect(logoutRequest).toHaveBeenCalledTimes(1)
    })

    it('con el pase vencido renueva una vez y vuelve a preguntar', async () => {
      const renewed = buildSession({ accessToken: 'access-2', refreshToken: 'refresh-2' })
      refreshSessionRequest.mockResolvedValue(renewed)
      fetchCurrentUserRequest
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce(renewed.user)
      const { startSession, verifySession, session } = useSession()
      startSession({ session: buildSession() })

      expect(await verifySession()).toBe('valid')
      expect(fetchCurrentUserRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({ accessToken: 'access-2' })
      )
      expect(session.value).toEqual(renewed)
    })

    it('si la sesion murio en el servidor y no se renueva, la descarta', async () => {
      refreshSessionRequest.mockRejectedValue({ response: { status: 401 } })
      fetchCurrentUserRequest.mockRejectedValue({ response: { status: 401 } })
      const { startSession, verifySession, session } = useSession()
      startSession({ session: buildSession() })

      expect(await verifySession()).toBe('expired')
      expect(session.value).toBeNull()
    })

    it('sin red conserva la sesion guardada: la app abre sin conexion', async () => {
      fetchCurrentUserRequest.mockRejectedValue(new TypeError('Failed to fetch'))
      const { startSession, verifySession, session } = useSession()
      startSession({ session: buildSession() })

      expect(await verifySession()).toBe('unverified')
      expect(session.value).toEqual(buildSession())
      expect(refreshSessionRequest).not.toHaveBeenCalled()
    })

    it('sin sesion no pregunta nada', async () => {
      expect(await useSession().verifySession()).toBe('expired')
      expect(fetchCurrentUserRequest).not.toHaveBeenCalled()
    })
  })
})
