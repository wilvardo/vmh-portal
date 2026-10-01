import { describe, expect, it } from 'vitest'
import {
  formatSessionDay,
  formatSessionTime,
  isCancellableAt,
  parseUpcomingReservations
} from './upcoming-reservation.helpers'
import type { MyUpcomingReservation } from './upcoming-reservation.interface'

/** Evaluacion del miercoles 30 de septiembre a las 12:00 del estudio (18:00 UTC). */
const evaluation = {
  id: 1,
  reservationType: 'evaluation',
  startsAt: '2026-09-30T18:00:00.000Z',
  serviceName: null,
  isCancellable: true
}

describe('parseUpcomingReservations', () => {
  it('acepta una lista vacia, que no es un error', () => {
    expect(parseUpcomingReservations([])).toEqual([])
  })

  it('conserva el orden y descarta los campos que el portal no declara', () => {
    const training = {
      id: 2,
      reservationType: 'training',
      startsAt: '2026-10-02T13:00:00.000Z',
      serviceName: 'Fuerza',
      isCancellable: false,
      localStartsAt: '2026-10-02T07:00'
    }

    const result = parseUpcomingReservations([evaluation, training])

    expect(result).toEqual([
      { ...evaluation, professionalName: null },
      {
        id: 2,
        reservationType: 'training',
        startsAt: '2026-10-02T13:00:00.000Z',
        serviceName: 'Fuerza',
        professionalName: null,
        isCancellable: false
      }
    ])
  })

  it('lee con quien es la sesion y deja del estudio la que no lo dice', () => {
    const result = parseUpcomingReservations([
      { ...evaluation, professionalName: ' Ana Pérez ' },
      { ...evaluation, id: 2, professionalName: '' }
    ])

    expect(result?.map((item) => item.professionalName)).toEqual(['Ana Pérez', null])
  })

  it('descarta la lista entera si una reserva no cumple el contrato', () => {
    expect(parseUpcomingReservations([evaluation, { ...evaluation, id: 'dos' }])).toBeNull()
    expect(parseUpcomingReservations([{ ...evaluation, reservationType: 'clase' }])).toBeNull()
    expect(parseUpcomingReservations([{ ...evaluation, startsAt: 'manana' }])).toBeNull()
    const { isCancellable: _omitted, ...withoutFlag } = evaluation
    expect(parseUpcomingReservations([withoutFlag])).toBeNull()
  })

  it('descarta lo que no es una lista', () => {
    expect(parseUpcomingReservations(undefined)).toBeNull()
    expect(parseUpcomingReservations(null)).toBeNull()
    expect(parseUpcomingReservations({})).toBeNull()
  })
})

describe('formato de la sesion en la zona del estudio', () => {
  it('escribe el dia de la semana y la fecha del estudio', () => {
    expect(formatSessionDay(evaluation.startsAt)).toBe('miércoles, 30 de septiembre')
  })

  it('escribe la hora del reloj del estudio, no la del telefono', () => {
    expect(formatSessionTime(evaluation.startsAt)).toBe('12:00')
  })

  it('una sesion de noche en el estudio no se pasa al dia siguiente', () => {
    // 21:00 del estudio son las 03:00 UTC del dia siguiente.
    expect(formatSessionDay('2026-10-01T03:00:00.000Z')).toBe('miércoles, 30 de septiembre')
    expect(formatSessionTime('2026-10-01T03:00:00.000Z')).toBe('21:00')
  })
})

describe('isCancellableAt', () => {
  const reservation: MyUpcomingReservation = {
    id: 1,
    reservationType: 'training',
    startsAt: '2026-09-30T18:00:00.000Z',
    serviceName: null,
    professionalName: null,
    isCancellable: true
  }

  it('antes del inicio respeta lo que dijo el API', () => {
    const before = new Date('2026-09-30T17:59:00.000Z')

    expect(isCancellableAt(reservation, before)).toBe(true)
    expect(isCancellableAt({ ...reservation, isCancellable: false }, before)).toBe(false)
  })

  it('una sesion que ya empezo deja de ofrecer cancelar', () => {
    expect(isCancellableAt(reservation, new Date('2026-09-30T18:00:00.000Z'))).toBe(false)
  })

  it('con la ventana del API deja de ofrecer cancelar al cruzarla, antes del inicio', () => {
    expect(isCancellableAt(reservation, new Date('2026-09-30T15:59:00.000Z'), 120)).toBe(true)
    expect(isCancellableAt(reservation, new Date('2026-09-30T16:00:00.000Z'), 120)).toBe(false)
  })
})
