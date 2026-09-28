import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import { AUTH_ROLE } from '../domain/auth-role.enum'
import { completeFirstAccess, requestFirstAccessCode } from './first-access.repository'

const BASE_URL = 'http://127.0.0.1:3399/api'

const fetchMock = vi.fn()

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => fetchMock(...args)
}))

const sessionPayload = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 7,
    firstName: 'Lucia',
    lastName: 'Prueba',
    email: 'lucia@correo.mx',
    role: AUTH_ROLE.ATHLETE
  }
}

describe('repositorio de primer acceso', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('pide el codigo con el correo capturado', async () => {
    fetchMock.mockResolvedValue({ data: { message: 'Si ese correo puede estrenar cuenta…' } })

    const result = await requestFirstAccessCode({ baseUrl: BASE_URL, email: 'lucia@correo.mx' })

    expect(result).toEqual({ message: 'Si ese correo puede estrenar cuenta…' })
    expect(fetchMock).toHaveBeenCalledWith(
      AUTH_ENDPOINT.FIRST_ACCESS_CODE,
      expect.objectContaining({
        baseURL: BASE_URL,
        method: 'POST',
        body: { email: 'lucia@correo.mx' }
      })
    )
  })

  it('descarta los campos extra del acuse', async () => {
    fetchMock.mockResolvedValue({ data: { message: 'Listo.', debug: 'no-deberia-viajar' } })

    const result = await requestFirstAccessCode({ baseUrl: BASE_URL, email: 'lucia@correo.mx' })

    expect(result).not.toHaveProperty('debug')
  })

  it('rechaza un acuse sin mensaje', async () => {
    fetchMock.mockResolvedValue({ data: {} })

    await expect(
      requestFirstAccessCode({ baseUrl: BASE_URL, email: 'lucia@correo.mx' })
    ).rejects.toThrow(/contrato de primer acceso/)
  })

  it('manda correo, codigo y contrasena y devuelve la sesion', async () => {
    fetchMock.mockResolvedValue({ data: sessionPayload })

    const session = await completeFirstAccess({
      baseUrl: BASE_URL,
      email: 'lucia@correo.mx',
      code: '123456',
      password: 'contrasena-larga-de-verdad'
    })

    expect(session).toEqual(sessionPayload)
    expect(fetchMock).toHaveBeenCalledWith(
      AUTH_ENDPOINT.FIRST_ACCESS,
      expect.objectContaining({
        method: 'POST',
        body: {
          email: 'lucia@correo.mx',
          code: '123456',
          password: 'contrasena-larga-de-verdad'
        }
      })
    )
  })

  it('descarta los campos de la persona que el contrato no declara', async () => {
    fetchMock.mockResolvedValue({
      data: { ...sessionPayload, user: { ...sessionPayload.user, passwordHash: 'x' } }
    })

    const session = await completeFirstAccess({
      baseUrl: BASE_URL,
      email: 'lucia@correo.mx',
      code: '123456',
      password: 'contrasena-larga-de-verdad'
    })

    expect(session.user).not.toHaveProperty('passwordHash')
  })

  it('rechaza una sesion que no cumple el contrato', async () => {
    fetchMock.mockResolvedValue({ data: { accessToken: 'a' } })

    await expect(
      completeFirstAccess({
        baseUrl: BASE_URL,
        email: 'lucia@correo.mx',
        code: '123456',
        password: 'contrasena-larga-de-verdad'
      })
    ).rejects.toThrow(/contrato de primer acceso/)
  })

  it('propaga el error del API sin tocarlo', async () => {
    const apiError = {
      data: { title: 'Código incorrecto', detail: 'x', key: 'k', code: 'VMH.AUTH.CODE_INVALID' }
    }
    fetchMock.mockRejectedValue(apiError)

    await expect(
      completeFirstAccess({
        baseUrl: BASE_URL,
        email: 'lucia@correo.mx',
        code: '000000',
        password: 'contrasena-larga-de-verdad'
      })
    ).rejects.toBe(apiError)
  })
})
