import { ofetch } from 'ofetch'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import type { Acknowledgement } from '../domain/acknowledgement.interface'
import { parseAuthSession } from '../domain/session.helpers'
import type { AuthSession } from '../domain/session.interface'

/** Mensaje unico de contrato roto: el API respondio algo que el portal no entiende. */
const CONTRACT_ERROR =
  'first-access.repository: la respuesta del API no cumple el contrato de primer acceso'

interface RequestFirstAccessCodeParams {
  /** URL base del API. */
  baseUrl: string
  /** Correo capturado. */
  email: string
}

interface CompleteFirstAccessParams {
  /** URL base del API. */
  baseUrl: string
  /** Correo al que se envio el codigo. */
  email: string
  /** Codigo de 6 digitos recibido por correo. */
  code: string
  /** Contrasena que la persona eligio. */
  password: string
}

/**
 * Pide el codigo de primer acceso.
 *
 * Como el login, no usa el cliente con sesion: quien estrena su cuenta todavia
 * no tiene ninguna. El API responde lo mismo exista o no la cuenta, asi que esta
 * funcion no tiene forma de decir si el codigo salio: esa ambiguedad es el
 * contrato, no una carencia.
 *
 * @param params Correo capturado y URL base del API.
 * @returns El mensaje generico del API.
 * @throws Si la captura no pasa la validacion del API o se excede el limite de
 * peticiones.
 */
export const requestFirstAccessCode = async (
  params: RequestFirstAccessCodeParams
): Promise<Acknowledgement> => {
  const response = await ofetch<{ data: unknown }>(AUTH_ENDPOINT.FIRST_ACCESS_CODE, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { email: params.email }
  })

  const message = (response?.data as { message?: unknown } | undefined)?.message
  if (typeof message !== 'string') throw new Error(CONTRACT_ERROR)

  return { message }
}

/**
 * Canjea el codigo, fija la contrasena y recibe la sesion.
 *
 * La respuesta es identica a la del login y se valida con el mismo lector: el
 * primer acceso termina en el mismo punto que un acceso normal.
 *
 * @param params Correo, codigo, contrasena y URL base del API.
 * @returns La sesion emitida por el API.
 * @throws Si el codigo no coincide, vencio o se bloqueo; si la cuenta esta
 * suspendida; si se excede el limite de peticiones, o si la respuesta no cumple
 * el contrato.
 */
export const completeFirstAccess = async (
  params: CompleteFirstAccessParams
): Promise<AuthSession> => {
  const response = await ofetch<{ data: unknown }>(AUTH_ENDPOINT.FIRST_ACCESS, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { email: params.email, code: params.code, password: params.password }
  })

  const session = parseAuthSession(response?.data)
  if (session === null) throw new Error(CONTRACT_ERROR)

  return session
}
