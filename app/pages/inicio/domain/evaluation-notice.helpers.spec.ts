import { describe, expect, it } from 'vitest'
import { resolveEvaluationNotice } from './evaluation-notice.helpers'
import type { MyUpcomingReservation } from './upcoming-reservation.interface'

const training: MyUpcomingReservation = {
  id: 1,
  reservationType: 'training',
  startsAt: '2026-10-01T13:00:00.000Z',
  serviceName: null,
  isCancellable: true
}

const evaluation: MyUpcomingReservation = {
  id: 2,
  reservationType: 'evaluation',
  startsAt: '2026-10-02T13:00:00.000Z',
  serviceName: null,
  isCancellable: true
}

describe('resolveEvaluationNotice', () => {
  it('pide agendarla cuando no esta hecha ni agendada', () => {
    expect(resolveEvaluationNotice(null, [training])).toEqual({ kind: 'schedule' })
  })

  it('recuerda cuando es si ya esta agendada', () => {
    expect(resolveEvaluationNotice(null, [training, evaluation])).toEqual({
      kind: 'booked',
      startsAt: evaluation.startsAt
    })
  })

  it('no dice nada cuando ya esta hecha, aunque quede una reserva de evaluacion', () => {
    expect(resolveEvaluationNotice('2026-09-20T15:00:00.000Z', [evaluation])).toBeNull()
  })
})
