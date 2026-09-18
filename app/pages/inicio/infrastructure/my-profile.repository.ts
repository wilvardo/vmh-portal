import type { ApiFetch } from '~/composables/use-api'
import { MY_PROFILE_ENDPOINT } from '../domain/membership.const'
import { parseProfileView } from '../domain/membership.helpers'
import type { MyProfileView } from '../domain/membership.interface'

/** Mensaje unico de contrato roto: el API respondio algo que el portal no entiende. */
const CONTRACT_ERROR = 'my-profile.repository: la respuesta del API no cumple el contrato de perfil'

interface ClientParams {
  /** Cliente HTTP del portal, ya firmado. */
  apiFetch: ApiFetch
}

interface UpdateProfileParams extends ClientParams {
  firstName: string
  lastName: string
  phone: string
}

/**
 * Lee el perfil del atleta con su membresia.
 *
 * @param params Cliente HTTP firmado.
 * @returns El perfil y la membresia resuelta.
 * @throws Si la respuesta no cumple el contrato.
 */
export const fetchMyProfile = async (params: ClientParams): Promise<MyProfileView> => {
  const response = await params.apiFetch<{ data: unknown }>(MY_PROFILE_ENDPOINT)

  const view = parseProfileView(response?.data)
  if (view === null) throw new Error(CONTRACT_ERROR)

  return view
}

/**
 * Guarda los datos de contacto corregidos.
 *
 * Devuelve el perfil completo releyendolo: el PUT responde solo los datos de
 * contacto y la pantalla necesita conservar la membresia que ya tenia.
 *
 * @param params Cliente HTTP firmado y datos corregidos.
 * @returns El perfil con su membresia, ya actualizado.
 * @throws Si el telefono ya pertenece a otra cuenta.
 */
export const updateMyProfile = async (params: UpdateProfileParams): Promise<MyProfileView> => {
  const { apiFetch, ...body } = params

  await apiFetch(MY_PROFILE_ENDPOINT, { method: 'PUT', body })

  return fetchMyProfile({ apiFetch })
}
