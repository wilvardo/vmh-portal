import type { ApiFetch } from '~/composables/use-api'
import { MY_RESERVATION_ENDPOINT } from '~/resources/scripts/domain/my-reservation.const'
import { parseWeekSchedule } from '../domain/schedule.helpers'
import type { WeekSchedule } from '../domain/schedule.interface'

/** Mensaje unico de contrato roto: el API respondio algo que el portal no entiende. */
const CONTRACT_ERROR =
  'schedule.repository: la respuesta del API no cumple el contrato de la semana'

interface FetchScheduleParams {
  /** Cliente HTTP firmado. */
  apiFetch: ApiFetch
  /** Lunes de la semana pedida; sin el, el API devuelve la semana en curso. */
  weekStart?: string
}

/**
 * Trae la semana del atleta.
 *
 * @param params Cliente firmado y semana.
 * @returns La semana, ya validada.
 * @throws Si el API falla o si la respuesta no cumple el contrato.
 */
export const fetchMySchedule = async (params: FetchScheduleParams): Promise<WeekSchedule> => {
  const response = await params.apiFetch<{ data: unknown }>(MY_RESERVATION_ENDPOINT.SCHEDULE, {
    query: params.weekStart === undefined ? {} : { weekStart: params.weekStart }
  })

  const schedule = parseWeekSchedule(response?.data)
  if (schedule === null) throw new Error(CONTRACT_ERROR)

  return schedule
}
