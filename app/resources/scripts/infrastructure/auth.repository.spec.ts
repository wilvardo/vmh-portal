import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import { AUTH_ROLE } from '../domain/auth-role.enum'
import type { AuthSession } from '../domain/session.interface'
import { fetchCurrentUser, login, logout, refreshSession } from './auth.repository'

const BASE_URL = 'http://127.0.0.1:3333/api'

const buildSession = (): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 1,
    firstName: 'Victoria',
    lastName: 'Mendoza',
    email: 'admin@vmh.mx',
    role: AUTH_ROLE.ADMIN
  }
})

const fetchMock = vi.fn()

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => fetchMock(...args)
}))

describe('repositorio de autenticacion', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('envia las credenciales y devuelve la sesion emitida', async () => {
      fetchMock.mockResolvedValue({ data: buildSession() })

      const session = await login({
        baseUrl: BASE_URL,
        email: 'admin@vmh.mx',
        password: 'secreto'
      })

      expect(session).toEqual(buildSession())
      expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINT.LOGIN, {
        baseURL: BASE_URL,
        method: 'POST',
        body: { email: 'admin@vmh.mx', password: 'secreto' }
      })
    })

    it('descarta los campos que el contrato de sesion no declara', async () => {
      fetchMock.mockResolvedValue({
        data: { ...buildSession(), user: { ...buildSession().user, passwordHash: 'x' } }
      })

      const session = await login({ baseUrl: BASE_URL, email: 'a@b.mx', password: 'x' })

      expect(session.user).not.toHaveProperty('passwordHash')
    })

    it('falla cuando la respuesta no cumple el contrato de sesion', async () => {
      fetchMock.mockResolvedValue({ data: { accessToken: 'solo-eso' } })

      await expect(login({ baseUrl: BASE_URL, email: 'a@b.mx', password: 'x' })).rejects.toThrow(
        /contrato de sesion/
      )
    })

    it('propaga el error del API sin traducirlo', async () => {
      fetchMock.mockRejectedValue({ response: { status: 401 } })

      await expect(
        login({ baseUrl: BASE_URL, email: 'a@b.mx', password: 'x' })
      ).rejects.toMatchObject({ response: { status: 401 } })
    })
  })

  describe('refreshSession', () => {
    it('envia el token de renovacion y devuelve el par nuevo', async () => {
      fetchMock.mockResolvedValue({ data: buildSession() })

      const session = await refreshSession({ baseUrl: BASE_URL, refreshToken: 'refresh-token' })

      expect(session).toEqual(buildSession())
      expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINT.REFRESH, {
        baseURL: BASE_URL,
        method: 'POST',
        body: { refreshToken: 'refresh-token' }
      })
    })

    it('falla cuando la respuesta no cumple el contrato de sesion', async () => {
      fetchMock.mockResolvedValue({ data: null })

      await expect(
        refreshSession({ baseUrl: BASE_URL, refreshToken: 'refresh-token' })
      ).rejects.toThrow(/contrato de sesion/)
    })
  })

  describe('logout', () => {
    it('firma la peticion y manda el token a revocar', async () => {
      fetchMock.mockResolvedValue(undefined)

      await logout({ baseUrl: BASE_URL, accessToken: 'access', refreshToken: 'refresh' })

      expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINT.LOGOUT, {
        baseURL: BASE_URL,
        method: 'POST',
        headers: { Authorization: 'Bearer access' },
        body: { refreshToken: 'refresh' }
      })
    })
  })

  describe('fetchCurrentUser', () => {
    it('devuelve la persona dueña del token', async () => {
      fetchMock.mockResolvedValue({ data: { user: buildSession().user } })

      const user = await fetchCurrentUser({ baseUrl: BASE_URL, accessToken: 'access' })

      expect(user).toEqual(buildSession().user)
      expect(fetchMock).toHaveBeenCalledWith(AUTH_ENDPOINT.ME, {
        baseURL: BASE_URL,
        headers: { Authorization: 'Bearer access' }
      })
    })

    it('falla cuando la persona no cumple el contrato', async () => {
      fetchMock.mockResolvedValue({ data: { user: { id: 1 } } })

      await expect(fetchCurrentUser({ baseUrl: BASE_URL, accessToken: 'access' })).rejects.toThrow(
        /contrato de sesion/
      )
    })
  })
})
