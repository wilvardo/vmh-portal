import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import { register, resendVerification, verifyEmail } from './registration.repository'

const BASE_URL = 'http://127.0.0.1:3399/api'

/** Cuenta que devuelve el API en un alta correcta. */
const pendingAccount = {
  id: 7,
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@correo.mx',
  emailVerified: false
}

const fetchMock = vi.fn()

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => fetchMock(...args)
}))

describe('repositorio de registro', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  describe('register', () => {
    it('manda la captura al endpoint de alta y devuelve la cuenta creada', async () => {
      fetchMock.mockResolvedValue({ data: pendingAccount })

      const account = await register({
        baseUrl: BASE_URL,
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@correo.mx',
        phone: '5512000010',
        password: 'contrasena-larga-de-verdad',
        privacyAccepted: true
      })

      expect(account).toEqual(pendingAccount)
      expect(fetchMock).toHaveBeenCalledWith(
        AUTH_ENDPOINT.REGISTER,
        expect.objectContaining({ baseURL: BASE_URL, method: 'POST' })
      )
    })

    it('no manda la URL base dentro del cuerpo de la peticion', async () => {
      fetchMock.mockResolvedValue({ data: pendingAccount })

      await register({
        baseUrl: BASE_URL,
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@correo.mx',
        phone: '5512000010',
        password: 'contrasena-larga-de-verdad',
        privacyAccepted: true
      })

      const [, options] = fetchMock.mock.calls[0] as [string, { body: Record<string, unknown> }]
      expect(options.body).not.toHaveProperty('baseUrl')
      expect(options.body.privacyAccepted).toBe(true)
    })

    it('propaga el rechazo del API para que la pantalla lo traduzca', async () => {
      fetchMock.mockRejectedValue({ data: { code: 'VMH.AUTH.EMAIL_TAKEN' } })

      await expect(
        register({
          baseUrl: BASE_URL,
          firstName: 'Ana',
          lastName: 'Lopez',
          email: 'ana@correo.mx',
          phone: '5512000010',
          password: 'contrasena-larga-de-verdad',
          privacyAccepted: true
        })
      ).rejects.toMatchObject({ data: { code: 'VMH.AUTH.EMAIL_TAKEN' } })
    })
  })

  describe('verifyEmail', () => {
    it('manda el token del enlace y devuelve la confirmacion', async () => {
      fetchMock.mockResolvedValue({ data: { message: 'Tu correo quedó confirmado.' } })

      const result = await verifyEmail(BASE_URL, 'a'.repeat(64))

      expect(result.message).toBe('Tu correo quedó confirmado.')
      expect(fetchMock).toHaveBeenCalledWith(
        AUTH_ENDPOINT.VERIFY_EMAIL,
        expect.objectContaining({ body: { token: 'a'.repeat(64) } })
      )
    })
  })

  describe('resendVerification', () => {
    it('pide un enlace nuevo con el correo capturado', async () => {
      fetchMock.mockResolvedValue({ data: { message: 'Si ese correo tiene cuenta…' } })

      await resendVerification(BASE_URL, 'ana@correo.mx')

      expect(fetchMock).toHaveBeenCalledWith(
        AUTH_ENDPOINT.RESEND_VERIFICATION,
        expect.objectContaining({ body: { email: 'ana@correo.mx' } })
      )
    })
  })
})
