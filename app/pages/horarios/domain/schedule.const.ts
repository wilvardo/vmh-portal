/** Idioma con el que se escriben fechas y horas. */
export const DATE_LOCALE = 'es-MX'

/** Zona del estudio: la hora que importa es la de la puerta del estudio. */
export const STUDIO_TIMEZONE = 'America/Mexico_City'

/** Dias de una semana. */
export const DAYS_PER_WEEK = 7

/** Estados que el API puede mandar; cualquier otro rompe el contrato. */
export const SESSION_STATUSES: readonly string[] = [
  'available',
  'full',
  'blocked',
  'closed',
  'past'
]

/** Tipos de sesion que el API puede mandar. */
export const SESSION_TYPES: readonly string[] = ['evaluation', 'training']
