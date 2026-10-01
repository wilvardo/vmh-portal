import type { ApiError } from './api-error.interface'

/** Nombre con el que el cliente HTTP (`ofetch`) marca sus errores. */
const FETCH_ERROR_NAME = 'FetchError'

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

/**
 * Indica si un error ya se le dijo a la persona fuera de la pantalla que hizo
 * la llamada: un fallo de red o del servidor que salio del cliente HTTP.
 * `useApi` lo avisa con su toast global, o calla porque el dispositivo esta sin
 * red y la franja de "sin conexion" ya lo dice. Quien llamo no debe avisar otra
 * vez; solo decide que hacer (dejar el dialogo abierto para reintentar).
 *
 * Un error que no salio del cliente HTTP (una respuesta que no cumple el
 * contrato) no lo aviso nadie: le toca a quien llamo.
 *
 * @param error Error capturado.
 * @returns `true` si ya hubo aviso global.
 */
export const isAnnouncedGlobally = (error: unknown): boolean =>
  (error as { name?: unknown } | null)?.name === FETCH_ERROR_NAME &&
  isGlobalFailure(extractStatus(error))
