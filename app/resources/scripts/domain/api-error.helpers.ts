import type { ApiError } from './api-error.interface'

/**
 * Extrae el codigo de estado HTTP de un error de `ofetch`/`$fetch`.
 *
 * @param error Error capturado.
 * @returns El estado HTTP, o `null` si el error no llego a tener respuesta
 * (fallo de red, DNS, CORS o peticion cancelada).
 */
export const extractStatus = (error: unknown): number | null => {
  const candidate = error as { response?: { status?: number }; statusCode?: number } | null
  const status = candidate?.response?.status ?? candidate?.statusCode
  return typeof status === 'number' ? status : null
}

/**
 * Extrae el cuerpo de error estandar del API. Es lo unico que la interfaz puede
 * mostrar tal cual: `title` como encabezado y `detail` como cuerpo (MASTER 13.2).
 *
 * @param error Error capturado.
 * @returns El error del API, o `null` si la respuesta no trae el contrato (fallo
 * de red, proxy intermedio o error del propio navegador).
 */
export const extractApiError = (error: unknown): ApiError | null => {
  const body = (error as { data?: unknown } | null)?.data
  if (typeof body !== 'object' || body === null) return null

  const candidate = body as Partial<Record<keyof ApiError, unknown>>
  const isValid =
    typeof candidate.title === 'string' &&
    typeof candidate.detail === 'string' &&
    typeof candidate.key === 'string' &&
    typeof candidate.code === 'string'

  if (!isValid) return null

  return {
    title: candidate.title as string,
    detail: candidate.detail as string,
    key: candidate.key as string,
    code: candidate.code as string
  }
}

/**
 * Indica si un error merece el aviso global del cliente HTTP: fallos de red y
 * errores del servidor. Los 4xx los traduce a interfaz quien hizo la llamada,
 * que es el unico que sabe que significa un 404 o un 422 en su pantalla.
 *
 * @param status Estado HTTP, o `null` si no hubo respuesta.
 * @returns `true` si corresponde avisar de forma global.
 */
export const isGlobalFailure = (status: number | null): boolean => status === null || status >= 500
