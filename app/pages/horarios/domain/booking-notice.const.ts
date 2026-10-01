import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import type { BookingExit, PersonalBlockCode } from './booking-notice.type'

/**
 * Rechazos de la persona y su salida.
 *
 * Son los que el API resuelve con lo que sabe del atleta antes de mirar el
 * servicio y el cupo (`resolveTrainingBlock` en `vmh-api`). Sin membresia, la
 * salida es conocer los planes; con una que no abre la puerta (pendiente de
 * pago, en pausa, vencida o con la mensualidad atrasada), hablar con el estudio.
 * La evaluacion por hacer no tiene salida: ya esta agendada y solo falta
 * presentarse.
 */
export const PERSONAL_BLOCK_EXIT: Readonly<Record<PersonalBlockCode, BookingExit | null>> = {
  [API_ERROR_CODE.EVALUATION_REQUIRED]: null,
  [API_ERROR_CODE.MEMBERSHIP_REQUIRED]: 'plans',
  [API_ERROR_CODE.MEMBERSHIP_NOT_ACTIVE]: 'contact',
  [API_ERROR_CODE.PAYMENT_OVERDUE]: 'contact'
}

/**
 * Rechazos que dicen que la sesion no es para esta persona: de otro servicio,
 * o una evaluacion cuando ya hizo la suya o ya tiene una agendada. No se
 * ofrecen ni se explican: se ocultan, porque no hay nada que la persona pueda
 * hacer con ellas.
 */
export const FOREIGN_SESSION_CODES: readonly string[] = [
  API_ERROR_CODE.SERVICE_NOT_INCLUDED,
  API_ERROR_CODE.EVALUATION_ALREADY_COMPLETED,
  API_ERROR_CODE.EVALUATION_ALREADY_BOOKED
]

/**
 * Anclas del inicio del sitio publico a las que manda cada salida. Copia propia
 * del slice: el tablero declara la suya del contacto.
 */
export const SITE_EXIT_ANCHOR: Readonly<Record<BookingExit, string>> = {
  plans: '#planes',
  contact: '#contacto'
}
