import type { ApiFetch } from '~/composables/use-api'
import { MY_PAYMENTS_ENDPOINT, MY_PAYMENTS_PAGE_SIZE } from '../domain/my-payments.const'
import { parseMyPaymentsPage } from '../domain/my-payments.helpers'
import type { MyPaymentsPage } from '../domain/my-payments.interface'

interface FetchMyPaymentsParams {
  /** Cliente HTTP firmado. */
  apiFetch: ApiFetch
  /** Tanda pedida, empezando en 1. */
  page: number
}

/**
 * Trae una tanda de los pagos del atleta.
 *
 * De quien son los pagos lo decide el API con la sesion: aqui no viaja ningun
 * identificador de persona.
 *
 * @param params Cliente firmado y tanda.
 * @returns La tanda, ya validada.
 * @throws Si el API falla o la respuesta no cumple el contrato.
 */
export const fetchMyPayments = async (params: FetchMyPaymentsParams): Promise<MyPaymentsPage> => {
  const response = await params.apiFetch<unknown>(MY_PAYMENTS_ENDPOINT, {
    query: { page: params.page, perPage: MY_PAYMENTS_PAGE_SIZE }
  })

  return parseMyPaymentsPage(response)
}
