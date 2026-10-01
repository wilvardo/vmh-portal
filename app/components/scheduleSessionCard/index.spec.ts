// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { ScheduleSession } from '~/pages/horarios/domain/schedule.interface'
import scheduleSessionCard from './index.vue'

const session = (overrides: Partial<ScheduleSession> = {}): ScheduleSession => ({
  sessionSlotId: 41,
  sessionType: 'training',
  serviceName: null,
  professionalId: null,
  professionalName: null,
  startsAt: '2026-10-05T13:00:00.000Z',
  startsAtLocal: '2026-10-05T07:00',
  durationMinutes: 60,
  capacity: 6,
  remaining: 2,
  status: 'available',
  myReservation: null,
  canBook: true,
  bookingBlockedBy: null,
  ...overrides
})

describe('scheduleSessionCard', () => {
  it('muestra hora, lugares libres y ofrece reservar una sesion disponible', async () => {
    const wrapper = await mountSuspended(scheduleSessionCard, { props: { session: session() } })

    expect(wrapper.text()).toContain('07:00')
    expect(wrapper.text()).toContain('Quedan 2 de 6 lugares')

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('book')?.[0]).toEqual([session()])
  })

  it('si el API dice que no se puede reservar, no lo ofrece ni presume lugares', async () => {
    const wrapper = await mountSuspended(scheduleSessionCard, {
      props: {
        session: session({ canBook: false, bookingBlockedBy: 'VMH.RSV.MEMBERSHIP_REQUIRED' })
      }
    })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Quedan')
    expect(wrapper.text()).not.toContain('membresía')
  })

  it('una sesion llena no ofrece reservar y lo dice', async () => {
    const wrapper = await mountSuspended(scheduleSessionCard, {
      props: { session: session({ status: 'full', remaining: 0 }) }
    })

    expect(wrapper.text()).toContain('Llena')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('una sesion no disponible no presume lugares libres', async () => {
    const wrapper = await mountSuspended(scheduleSessionCard, {
      props: { session: session({ status: 'blocked', remaining: 3 }) }
    })

    expect(wrapper.text()).toContain('No disponible')
    expect(wrapper.text()).not.toContain('Quedan')
  })

  it('con reserva cancelable ofrece cancelar', async () => {
    const mine = session({ myReservation: { reservationId: 7, isCancellable: true } })
    const wrapper = await mountSuspended(scheduleSessionCard, { props: { session: mine } })

    expect(wrapper.text()).toContain('Tienes reserva')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('cancel')?.[0]).toEqual([mine])
  })

  it('dentro de la ventana no ofrece cancelar y manda a recepcion', async () => {
    const mine = session({ myReservation: { reservationId: 7, isCancellable: false } })
    const wrapper = await mountSuspended(scheduleSessionCard, { props: { session: mine } })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('contacta a recepción')
  })

  it('la evaluacion se nombra y se reserva como evaluacion', async () => {
    const wrapper = await mountSuspended(scheduleSessionCard, {
      props: { session: session({ sessionType: 'evaluation' }) }
    })

    expect(wrapper.text()).toContain('Evaluación inicial')
    expect(wrapper.text()).toContain('Reservar evaluación')
  })

  it('dice con quien es la sesion, y nada si es del estudio', async () => {
    const withAna = await mountSuspended(scheduleSessionCard, {
      props: { session: session({ professionalId: 1, professionalName: 'Ana Pérez' }) }
    })
    const studio = await mountSuspended(scheduleSessionCard, { props: { session: session() } })

    expect(withAna.find('.schedule-session-card__with').text()).toBe('con Ana Pérez')
    expect(studio.find('.schedule-session-card__with').exists()).toBe(false)
  })
})
