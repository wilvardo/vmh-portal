import type { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'

/**
 * Rechazo que es de la persona y no de la sesion: le cierra todos los
 * entrenamientos de la semana por igual. Por eso se dice una vez, arriba de la
 * semana, y no en cada tarjeta.
 */
export type PersonalBlockCode =
  | (typeof API_ERROR_CODE)['EVALUATION_REQUIRED']
  | (typeof API_ERROR_CODE)['MEMBERSHIP_REQUIRED']
  | (typeof API_ERROR_CODE)['MEMBERSHIP_NOT_ACTIVE']
  | (typeof API_ERROR_CODE)['PAYMENT_OVERDUE']

/** Salida que se ofrece junto al aviso: ver los planes o escribir al estudio. */
export type BookingExit = 'plans' | 'contact'
