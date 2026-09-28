import { ofetch } from 'ofetch'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import type { Acknowledgement } from '../domain/acknowledgement.interface'

/** Datos del alta, tal como los pide el API. */
export interface RegisterParams {
  /** URL base del API. */
  baseUrl: string
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  /** Consentimiento del aviso de privacidad. El API rechaza el alta sin el. */
  privacyAccepted: boolean
}

/** Cuenta recien creada, pendiente de confirmar su correo. */
export interface PendingAccount {
  id: number
  firstName: string
  lastName: string
  email: string
  emailVerified: boolean
}


/**
 * Da de alta una cuenta de atleta.
 *
 * No usa el cliente con sesion: quien se registra todavia no tiene ninguna.
 *
 * @param params Datos capturados y URL base del API.
 * @returns La cuenta creada, pendiente de confirmar su correo.
 * @throws Si el correo o el telefono ya tienen cuenta, o si la captura no pasa
 * la validacion del API.
 */
export const register = async (params: RegisterParams): Promise<PendingAccount> => {
  const { baseUrl, ...body } = params

  const response = await ofetch<{ data: PendingAccount }>(AUTH_ENDPOINT.REGISTER, {
    baseURL: baseUrl,
    method: 'POST',
    body
  })

  return response.data
}

/**
 * Confirma el correo a partir del enlace recibido.
 *
 * @param baseUrl URL base del API.
 * @param token Valor que llego en la direccion del enlace.
 * @returns La confirmacion que manda el API.
 * @throws Si el enlace no existe, vencio o ya se habia usado.
 */
export const verifyEmail = async (baseUrl: string, token: string): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.VERIFY_EMAIL, {
    baseURL: baseUrl,
    method: 'POST',
    body: { token }
  })

  return response.data
}

/**
 * Pide un enlace de confirmacion nuevo.
 *
 * El API responde lo mismo exista o no la cuenta, asi que esta funcion no tiene
 * forma de decir si el correo se envio: esa ambiguedad es el contrato, no una
 * carencia.
 *
 * @param baseUrl URL base del API.
 * @param email Correo capturado.
 * @returns El mensaje generico del API.
 */
export const resendVerification = async (
  baseUrl: string,
  email: string
): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: Acknowledgement }>(AUTH_ENDPOINT.RESEND_VERIFICATION, {
    baseURL: baseUrl,
    method: 'POST',
    body: { email }
  })

  return response.data
}
