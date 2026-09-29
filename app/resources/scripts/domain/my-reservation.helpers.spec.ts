import { describe, expect, it } from 'vitest'
import { parseMyReservationResult } from './my-reservation.helpers'

const valid = {
  reservationId: 7,
  sessionSlotId: 41,
  reservationType: 'training',
  status: 'active',
  startsAt: '2026-10-05T13:00:00.000Z'
}

describe('parseMyReservationResult', () => {
  it('acepta la respuesta del API y descarta lo que el portal no declara', () => {
    expect(parseMyReservationResult({ ...valid, athleteId: 3, startsAtLocal: 'x' })).toEqual(valid)
  })

  it('rechaza un tipo o un estado desconocido', () => {
    expect(parseMyReservationResult({ ...valid, reservationType: 'clase' })).toBeNull()
    expect(parseMyReservationResult({ ...valid, status: 'borrada' })).toBeNull()
  })

  it('rechaza lo que no es un objeto', () => {
    expect(parseMyReservationResult(null)).toBeNull()
    expect(parseMyReservationResult('ok')).toBeNull()
  })
})
