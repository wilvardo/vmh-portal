import { ofetch } from 'ofetch'
import { AUTH_ENDPOINT } from '../domain/auth-endpoint.const'
import { parseAuthSession, parseAuthUser } from '../domain/session.helpers'
import type { AuthSession, AuthUser } from '../domain/session.interface'

/** Mensaje unico de contrato roto: el API respondio algo que el panel no entiende. */
const CONTRACT_ERROR = 'auth.repository: la respuesta del API no cumple el contrato de sesion'

interface LoginParams {
  /** URL base del API. */
  baseUrl: string
  /** Correo capturado. */
  email: string
  /** Contrasena capturada. */
  password: string
}

interface RefreshParams {
  /** URL base del API. */
  baseUrl: string
  /** Token de renovacion vigente. El API lo invalida al responder. */
  refreshToken: string
}

interface LogoutParams {
  /** URL base del API. */
  baseUrl: string
  /** Token de acceso con el que se firma la peticion. */
  accessToken: string
  /** Token de renovacion a revocar. */
  refreshToken: string
}

interface CurrentUserParams {
  /** URL base del API. */
  baseUrl: string
  /** Token de acceso con el que se firma la peticion. */
  accessToken: string
}

/**
 * Inicia sesion contra el API y devuelve el par de credenciales con su persona.
 *
 * @param params Datos de acceso y URL base del API.
 * @returns La sesion emitida por el API.
 * @throws Si el API responde con error (credenciales invalidas, cuenta
 * suspendida, limite de intentos) o si la respuesta no cumple el contrato.
 */
export const login = async (params: LoginParams): Promise<AuthSession> => {
  const response = await ofetch<{ data: unknown }>(AUTH_ENDPOINT.LOGIN, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { email: params.email, password: params.password }
  })

  const session = parseAuthSession(response?.data)
  if (session === null) throw new Error(CONTRACT_ERROR)

  return session
}

/**
 * Rota el par de credenciales. El token entregado queda invalidado en el
 * servidor: reusarlo revoca toda la familia de la sesion.
 *
 * @param params Token de renovacion vigente y URL base del API.
 * @returns La sesion nueva emitida por el API.
 * @throws Si el token esta vencido, revocado o si la respuesta no cumple el
 * contrato.
 */
export const refreshSession = async (params: RefreshParams): Promise<AuthSession> => {
  const response = await ofetch<{ data: unknown }>(AUTH_ENDPOINT.REFRESH, {
    baseURL: params.baseUrl,
    method: 'POST',
    body: { refreshToken: params.refreshToken }
  })

  const session = parseAuthSession(response?.data)
  if (session === null) throw new Error(CONTRACT_ERROR)

  return session
}

/**
 * Cierra la sesion en el servidor revocando su token de renovacion. Las demas
 * sesiones de la persona siguen vivas.
 *
 * @param params Par de credenciales y URL base del API.
 * @throws Si el API responde con error.
 */
export const logout = async (params: LogoutParams): Promise<void> => {
  await ofetch(AUTH_ENDPOINT.LOGOUT, {
    baseURL: params.baseUrl,
    method: 'POST',
    headers: { Authorization: `Bearer ${params.accessToken}` },
    body: { refreshToken: params.refreshToken }
  })
}

/**
 * Consulta la persona dueña del token de acceso. Sirve para confirmar que la
 * sesion restaurada del almacenamiento sigue siendo valida en el servidor.
 *
 * @param params Token de acceso y URL base del API.
 * @returns La persona autenticada.
 * @throws Si el token es invalido, la cuenta ya no esta vigente o la respuesta
 * no cumple el contrato.
 */
export const fetchCurrentUser = async (params: CurrentUserParams): Promise<AuthUser> => {
  const response = await ofetch<{ data: { user?: unknown } }>(AUTH_ENDPOINT.ME, {
    baseURL: params.baseUrl,
    headers: { Authorization: `Bearer ${params.accessToken}` }
  })

  const user = parseAuthUser(response?.data?.user)
  if (user === null) throw new Error(CONTRACT_ERROR)

  return user
}
