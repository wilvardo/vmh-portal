// @vitest-environment nuxt
import { beforeAll, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import inicioEs from '~/pages/inicio/domain/locales/inicio.es.json'
import type { MyUpcomingReservation } from '~/pages/inicio/domain/upcoming-reservation.interface'
import upcomingSessions from './index.vue'

/** Evaluacion del miercoles 30 de septiembre a las 12:00 del estudio. */
const evaluation: MyUpcomingReservation = {
  id: 1,
  reservationType: 'evaluation',
  startsAt: '2026-09-30T18:00:00.000Z',
  serviceName: null
}

describe('upcomingSessions', () => {
  beforeAll(() => {
    // Los textos los aporta el tablero que monta el componente.
    useNuxtApp().$i18n.mergeLocaleMessage('es', inicioEs)
  })

  it('nombra la evaluacion como evaluacion inicial con el dia y la hora del estudio', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { reservations: [evaluation] }
    })

    expect(wrapper.text()).toContain('Evaluación inicial')
    expect(wrapper.text()).toContain('30 de septiembre')
    expect(wrapper.text()).toContain('12:00')
    expect(wrapper.text()).not.toContain('No tienes sesiones reservadas')
  })

  it('nombra el entrenamiento por su servicio y respeta el orden que manda el API', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: {
        reservations: [
          evaluation,
          {
            id: 2,
            reservationType: 'training',
            startsAt: '2026-10-02T13:00:00.000Z',
            serviceName: 'Fuerza'
          }
        ]
      }
    })

    const names = wrapper.findAll('.upcoming-sessions__name').map((node) => node.text())
    expect(names).toEqual(['Evaluación inicial', 'Fuerza'])
  })

  it('solo dice que no hay sesiones cuando de verdad no hay', async () => {
    const wrapper = await mountSuspended(upcomingSessions, { props: { reservations: [] } })

    expect(wrapper.text()).toContain('No tienes sesiones reservadas por ahora.')
    expect(wrapper.findAll('.upcoming-sessions__item')).toHaveLength(0)
  })
})
