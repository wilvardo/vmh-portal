import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import { requestPasswordRecovery, resetPassword } from './password.repository'

const BASE_URL = 'http://127.0.0.1:3399/api'

const fetchMock = vi.fn()

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => fetchMock(...args)
}))

describe('repositorio de contrasena', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('pide el enlace con el correo capturado', async () => {
    fetchMock.mockResolvedValue({ data: { message: 'Si ese correo tiene una cuenta…' } })

    const result = await requestPasswordRecovery({ baseUrl: BASE_URL, email: 'ana@correo.mx' })

    expect(result.message).toBe('Si ese correo tiene una cuenta…')
    expect(fetchMock).toHaveBeenCalledWith(
      AUTH_ENDPOINT.PASSWORD_RECOVERY,
      expect.objectContaining({ body: { email: 'ana@correo.mx' }, method: 'POST' })
    )
  })

  it('manda token y contrasena nueva al restablecer', async () => {
    fetchMock.mockResolvedValue({ data: { message: 'Tu contraseña quedó lista.' } })

    await resetPassword({
      baseUrl: BASE_URL,
      token: 'c'.repeat(64),
      password: 'contrasena-larga-de-verdad'
    })

    expect(fetchMock).toHaveBeenCalledWith(
      AUTH_ENDPOINT.PASSWORD_RESET,
      expect.objectContaining({
        body: { token: 'c'.repeat(64), password: 'contrasena-larga-de-verdad' }
      })
    )
  })

  it('propaga el rechazo de un enlace vencido', async () => {
    fetchMock.mockRejectedValue({ data: { code: 'VMH.AUTH.TOKEN_EXPIRED' } })

    await expect(
      resetPassword({ baseUrl: BASE_URL, token: 'c'.repeat(64), password: 'otra-contrasena-larga' })
    ).rejects.toMatchObject({
      data: { code: 'VMH.AUTH.TOKEN_EXPIRED' }
    })
  })
})
