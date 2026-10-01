import { PERSONAL_BLOCK_EXIT, SITE_EXIT_ANCHOR } from './booking-notice.const'
import type { BookingExit, PersonalBlockCode } from './booking-notice.type'
import type { WeekSchedule } from './schedule.interface'
import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'

/**
 * Indica si un codigo de rechazo es de la persona y no de la sesion.
 *
 * @param code Codigo que manda el API, o `null`.
 * @returns `true` si le cierra todos los entrenamientos por igual.
 */
export const isPersonalBlock = (code: string | null): code is PersonalBlockCode =>
  code !== null && Object.hasOwn(PERSONAL_BLOCK_EXIT, code)

/**
 * Rechazo de la persona que aplica a la semana, si lo hay.
 *
 * El API calcula el bloqueo de la persona con lo que sabe de ella, no de la
 * sesion, asi que es el mismo en todo entrenamiento que llega hasta esa regla:
 * basta el primero. La evaluacion por hacer se calla mientras la seccion de
 * evaluacion ya la este pidiendo: seria decir lo mismo dos veces.
 *
 * @param schedule Semana cargada.
 * @returns El codigo, o `null` si nada de la persona le impide reservar.
 */
export const resolvePersonalBlock = (schedule: WeekSchedule): PersonalBlockCode | null => {
  for (const day of schedule.days) {
    for (const session of day.sessions) {
      const code = session.bookingBlockedBy
      if (!isPersonalBlock(code)) continue
      if (code === API_ERROR_CODE.EVALUATION_REQUIRED && schedule.evaluationPending) return null

      return code
    }
  }

  return null
}

/**
 * Salida que acompana a un rechazo de la persona.
 *
 * @param code Rechazo de la persona.
 * @returns La salida, o `null` si no hay ninguna que ofrecer.
 */
export const resolveBlockExit = (code: PersonalBlockCode): BookingExit | null =>
  PERSONAL_BLOCK_EXIT[code]

/**
 * Enlace del sitio publico al que lleva una salida.
 *
 * @param siteUrl Direccion base del sitio; puede faltar en el entorno.
 * @param exit Salida elegida.
 * @returns El enlace, o cadena vacia sin sitio configurado: no se pinta un
 *   enlace que no lleva a ningun lado.
 */
export const buildSiteExitUrl = (siteUrl: string, exit: BookingExit): string => {
  const base = siteUrl.trim().replace(/\/+$/, '')

  return base === '' ? '' : `${base}/${SITE_EXIT_ANCHOR[exit]}`
}
