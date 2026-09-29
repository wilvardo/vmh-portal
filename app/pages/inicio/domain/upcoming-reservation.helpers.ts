import { DATE_LOCALE } from './membership.const'
import { STUDIO_TIMEZONE } from './upcoming-reservation.const'
import type { MyUpcomingReservation } from './upcoming-reservation.interface'

/** Tipos de reserva que el portal sabe pintar. */
const KNOWN_TYPES: readonly string[] = ['evaluation', 'training']

/**
 * Valida una reserva por venir que llega por la red.
 *
 * Se queda solo con lo que el portal declara: los campos extra del API se
 * descartan aqui para que ningun dato no declarado termine en pantalla.
 *
 * @param value Valor a validar.
 * @returns La reserva validada, o `null` si no cumple el contrato.
 */
const parseReservation = (value: unknown): MyUpcomingReservation | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>
  const { id, reservationType, startsAt, serviceName, isCancellable } = candidate

  if (typeof id !== 'number') return null
  if (typeof reservationType !== 'string' || !KNOWN_TYPES.includes(reservationType)) return null
  if (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt))) return null
  if (serviceName !== null && typeof serviceName !== 'string') return null
  if (typeof isCancellable !== 'boolean') return null

  return {
    id,
    reservationType: reservationType as MyUpcomingReservation['reservationType'],
    startsAt,
    serviceName,
    isCancellable
  }
}

/**
 * Valida la lista de reservas por venir del perfil.
 *
 * Una sola reserva que no cumple el contrato descarta la lista entera en vez
 * de pintar un tablero a medias: el portal no adivina que sesion falto.
 *
 * @param value Valor a validar.
 * @returns Las reservas validadas, o `null` si la lista no cumple el contrato.
 */
export const parseUpcomingReservations = (value: unknown): MyUpcomingReservation[] | null => {
  if (!Array.isArray(value)) return null

  const reservations = value.map(parseReservation)
  if (reservations.some((reservation) => reservation === null)) return null

  return reservations as MyUpcomingReservation[]
}

/**
 * Escribe el dia de una sesion en la zona del estudio.
 *
 * @param startsAt Instante ISO 8601 de inicio.
 * @returns Dia de la semana y fecha larga, por ejemplo "miercoles, 30 de septiembre".
 */
export const formatSessionDay = (startsAt: string): string =>
  new Date(startsAt).toLocaleDateString(DATE_LOCALE, {
    timeZone: STUDIO_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

/**
 * Escribe la hora de una sesion en la zona del estudio.
 *
 * @param startsAt Instante ISO 8601 de inicio.
 * @returns Hora de reloj de 24 horas, por ejemplo "12:00".
 */
export const formatSessionTime = (startsAt: string): string =>
  new Date(startsAt).toLocaleTimeString(DATE_LOCALE, {
    timeZone: STUDIO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
