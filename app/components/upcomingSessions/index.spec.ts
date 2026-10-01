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
  serviceName: null,
  professionalName: null,
  isCancellable: true
}

/** Antes de todas las sesiones de prueba. */
const BEFORE = new Date('2026-09-29T12:00:00.000Z')

describe('upcomingSessions', () => {
  beforeAll(() => {
    // Los textos los aporta el tablero que monta el componente.
    useNuxtApp().$i18n.mergeLocaleMessage('es', inicioEs)
  })

  it('nombra la evaluacion como evaluacion inicial con el dia y la hora del estudio', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { now: BEFORE, reservations: [evaluation] }
    })

    expect(wrapper.text()).toContain('Evaluación inicial')
    expect(wrapper.text()).toContain('30 de septiembre')
    expect(wrapper.text()).toContain('12:00')
    expect(wrapper.text()).not.toContain('No tienes sesiones reservadas')
  })

  it('nombra el entrenamiento por su servicio y respeta el orden que manda el API', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: {
        now: BEFORE,
        reservations: [
          evaluation,
          {
            id: 2,
            reservationType: 'training',
            startsAt: '2026-10-02T13:00:00.000Z',
            serviceName: 'Fuerza',
            professionalName: null,
            isCancellable: true
          }
        ]
      }
    })

    const names = wrapper.findAll('.upcoming-sessions__name').map((node) => node.text())
    expect(names).toEqual(['Evaluación inicial', 'Fuerza'])
  })

  it('solo dice que no hay sesiones cuando de verdad no hay', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { now: BEFORE, reservations: [] }
    })

    expect(wrapper.text()).toContain('No tienes sesiones reservadas por ahora.')
    expect(wrapper.findAll('.upcoming-sessions__item')).toHaveLength(0)
  })

  it('en el vacio lleva a horarios', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { now: BEFORE, reservations: [] }
    })

    expect(wrapper.find('.upcoming-sessions__empty-action').attributes('href')).toBe('/horarios')
  })

  it('ofrece cancelar solo si el API dice que se puede, y avisa al tablero con el renglon', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: {
        now: BEFORE,
        reservations: [evaluation, { ...evaluation, id: 9, isCancellable: false }]
      }
    })

    const buttons = wrapper.findAll('.upcoming-sessions__cancel')
    expect(buttons).toHaveLength(1)
    expect(wrapper.text()).toContain('Para cancelarla, contacta a recepción.')

    await buttons[0]?.trigger('click')

    const emitted = wrapper.emitted('cancel')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toMatchObject({ id: 1, name: 'Evaluación inicial', time: '12:00' })
  })

  it('cuando la sesion ya empezo deja de ofrecer cancelar sin recargar', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { now: BEFORE, reservations: [evaluation] }
    })
    expect(wrapper.find('.upcoming-sessions__cancel').exists()).toBe(true)

    await wrapper.setProps({ now: new Date('2026-09-30T18:00:00.000Z') })

    expect(wrapper.find('.upcoming-sessions__cancel').exists()).toBe(false)
    expect(wrapper.text()).toContain('Para cancelarla, contacta a recepción.')
  })

  it('dice con quien es la proxima sesion', async () => {
    const wrapper = await mountSuspended(upcomingSessions, {
      props: { now: BEFORE, reservations: [{ ...evaluation, professionalName: 'Ana Pérez' }] }
    })

    expect(wrapper.find('.upcoming-sessions__with').text()).toBe('con Ana Pérez')
  })
})
