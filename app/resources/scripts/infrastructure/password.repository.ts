import { ofetch } from 'ofetch'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import type { Acknowledgement } from '../domain/acknowledgement.interface'

interface PasswordRecoveryParams {
  /** URL base del API. */
  baseUrl: string
  /** Correo capturado. */
  email: string
}

interface PasswordResetParams {
  /** URL base del API. */
  baseUrl: string
  /** Valor que llego en la direccion del enlace. */
  token: string
  /** Contrasena nueva. */
  password: string
}

/**
 * Pide el enlace para restablecer la contrasena.
 *
 * El API responde lo mismo exista o no la cuenta, asi que esta funcion no tiene
 * forma de decir si el correo se envio: esa ambiguedad es el contrato, no una
 * carencia.
 *
 * @param params Correo capturado y URL base del API.
 * @returns El mensaje generico del API.
 */
export const requestPasswordRecovery = async (
  params: PasswordRecoveryParams
): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.PASSWORD_RECOVERY, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { email: params.email }
  })

  return response.data
}

/**
 * Fija una contrasena nueva a partir del enlace recibido.
 *
 * @param params Token del enlace, contrasena nueva y URL base del API.
 * @returns La confirmacion que manda el API.
 * @throws Si el enlace no existe, vencio o ya se habia usado.
 */
export const resetPassword = async (params: PasswordResetParams): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.PASSWORD_RESET, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { token: params.token, password: params.password }
  })

  return response.data
}
