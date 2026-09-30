// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { MyUpcomingReservation } from '~/pages/inicio/domain/upcoming-reservation.interface'
import { SCHEDULE_PATH } from '~/resources/scripts/domain/session.const'
import evaluationNotice from './index.vue'

/** Evaluacion del miercoles 30 de septiembre a las 12:00 del estudio. */
const evaluation: MyUpcomingReservation = {
  id: 1,
  reservationType: 'evaluation',
  startsAt: '2026-09-30T18:00:00.000Z',
  serviceName: null,
  professionalName: null,
  isCancellable: true
}

describe('evaluationNotice', () => {
  it('pide agendar la evaluacion con enlace a horarios', async () => {
    const wrapper = await mountSuspended(evaluationNotice, {
      props: { evaluationCompletedAt: null, reservations: [] }
    })

    expect(wrapper.text()).toContain('Agenda tu evaluación inicial')
    expect(wrapper.find('.evaluation-notice__action').attributes('href')).toBe(SCHEDULE_PATH)
  })

  it('dice cuando es la evaluacion agendada, en la hora del estudio', async () => {
    const wrapper = await mountSuspended(evaluationNotice, {
      props: { evaluationCompletedAt: null, reservations: [evaluation] }
    })

    expect(wrapper.text()).toContain('30 de septiembre')
    expect(wrapper.text()).toContain('12:00')
    expect(wrapper.find('.evaluation-notice__action').exists()).toBe(false)
  })

  it('no pinta nada cuando la evaluacion ya esta hecha', async () => {
    const wrapper = await mountSuspended(evaluationNotice, {
      props: { evaluationCompletedAt: '2026-09-20T15:00:00.000Z', reservations: [] }
    })

    expect(wrapper.find('.evaluation-notice').exists()).toBe(false)
  })
})
