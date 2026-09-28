import { ofetch } from 'ofetch'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import type { Acknowledgement } from '../domain/acknowledgement.interface'

/**
 * Pide el enlace para restablecer la contrasena.
 *
 * El API responde lo mismo exista o no la cuenta, asi que esta funcion no tiene
 * forma de decir si el correo se envio: esa ambiguedad es el contrato, no una
 * carencia.
 *
 * @param baseUrl URL base del API.
 * @param email Correo capturado.
 * @returns El mensaje generico del API.
 */
export const requestPasswordRecovery = async (
  baseUrl: string,
  email: string
): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.PASSWORD_RECOVERY, {
    baseURL: baseUrl,
    method: 'POST',
    body: { email }
  })

  return response.data
}

/**
 * Fija una contrasena nueva a partir del enlace recibido.
 *
 * @param baseUrl URL base del API.
 * @param token Valor que llego en la direccion del enlace.
 * @param password Contrasena nueva.
 * @returns La confirmacion que manda el API.
 * @throws Si el enlace no existe, vencio o ya se habia usado.
 */
export const resetPassword = async (
  baseUrl: string,
  token: string,
  password: string
): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.PASSWORD_RESET, {
    baseURL: baseUrl,
    method: 'POST',
    body: { token, password }
  })

  return response.data
}
