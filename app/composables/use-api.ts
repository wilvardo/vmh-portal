import { ofetch, type FetchOptions } from 'ofetch'
import {
  extractApiError,
  extractStatus,
  isGlobalFailure
} from '~/resources/scripts/domain/api-error.helpers'
import {
  LOGIN_PATH,
  LOGIN_REASON,
  LOGIN_REASON_QUERY
} from '~/resources/scripts/domain/session.const'

/**
 * Cliente HTTP del portal. Firma estable de todo el proyecto: ningun slice llama
 * al API por su cuenta.
 *
 * @param url Ruta del endpoint, relativa a la base del API.
 * @param options Opciones de la peticion (metodo, cuerpo, cabeceras, query).
 * @returns El cuerpo de la respuesta ya parseado.
 * @throws El error original de la peticion, para que el llamador lo traduzca a
 * su pantalla.
 */
export type ApiFetch = <T>(url: string, options?: FetchOptions<'json'>) => Promise<T>

/**
 * Cliente HTTP del portal contra `vmh-api`.
 *
 * Resuelve tres cosas que nadie mas debe repetir: firma cada peticion con el
 * token de acceso, renueva la sesion una sola vez ante un 401 y reintenta, y
 * avisa de forma global cuando falla la red o el servidor. Los 4xx se propagan
 * sin aviso: quien hizo la llamada es el unico que sabe que significa un 404 o
 * un 422 en su pantalla (MASTER 13.2).
 *
 * Invoca `useToast` y `useI18n` porque el aviso global es su responsabilidad;
 * es la excepcion documentada al aislamiento de hooks de presentacion.
 *
 * @returns La funcion de peticion tipada.
 */
export const useApi = (): ApiFetch => {
  const config = useRuntimeConfig()
  const toast = useToast()
  const i18n = useI18n()
  const { accessToken, renewSession } = useSession()

  /** Muestra el aviso global de fallo de red o de servidor. */
  const notifyGlobalFailure = (error: unknown, status: number | null): void => {
    const apiError = extractApiError(error)

    toast.add({
      severity: 'error',
      // El API habla en español y para personas: si mando su contrato, se
      // muestra tal cual. El texto propio es solo el respaldo.
      summary: apiError?.title ?? i18n.t('api_error_title'),
      detail:
        apiError?.detail ??
        (status === null ? i18n.t('api_error_network') : i18n.t('api_error_server')),
      life: 6000
    })
  }

  const apiFetch = async <T>(
    url: string,
    options: FetchOptions<'json'> = {},
    retried = false
  ): Promise<T> => {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    if (accessToken.value !== null) {
      headers.set('Authorization', `Bearer ${accessToken.value}`)
    }

    try {
      return await ofetch<T>(url, {
        baseURL: config.public.BASE_API_PATH as string,
        ...options,
        headers
      })
    } catch (error: unknown) {
      const status = extractStatus(error)

      // Token de acceso vencido: se renueva una sola vez y se reintenta. El
      // segundo 401 significa que la sesion murio de verdad.
      if (status === 401 && !retried) {
        const renewed = await renewSession()
        if (renewed === null) {
          await navigateTo({
            path: LOGIN_PATH,
            query: { [LOGIN_REASON_QUERY]: LOGIN_REASON.EXPIRED }
          })
          throw error
        }
        return apiFetch<T>(url, options, true)
      }

      if (isGlobalFailure(status)) {
        notifyGlobalFailure(error, status)
      }

      throw error
    }
  }

  return apiFetch
}
