// @vitest-environment nuxt
import { beforeAll, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import inicioEs from '~/pages/inicio/domain/locales/inicio.es.json'
import type { MyMembership } from '~/pages/inicio/domain/membership.interface'
import membershipCard from './index.vue'

/** Contrato de contado recien firmado que todavia no cobra. */
const pending: MyMembership = {
  id: 1,
  displayStatus: 'pendiente-de-pago',
  serviceName: 'Entrenamiento funcional',
  planName: 'Mensual',
  paymentMode: 'upfront',
  startsAt: '2026-09-30',
  endsAt: '2026-10-29',
  nextPayment: null,
  amountDueOnArrival: 1800
}

describe('membershipCard', () => {
  beforeAll(() => {
    // Los textos los aporta el tablero que monta la tarjeta.
    useNuxtApp().$i18n.mergeLocaleMessage('es', inicioEs)
  })

  it('pendiente de pago dice cuando empieza y cuanto se paga al llegar', async () => {
    const wrapper = await mountSuspended(membershipCard, { props: { membership: pending } })

    expect(wrapper.text()).toContain('Pendiente de pago')
    expect(wrapper.text()).toContain('Empieza el')
    expect(wrapper.text()).toContain('30 de septiembre')
    expect(wrapper.text()).toContain('Pagas al llegar')
    expect(wrapper.text()).toContain('$1,800.00')
    expect(wrapper.text()).not.toContain('Vigente hasta')
    expect(wrapper.text()).not.toContain('Suspendida')
  })

  it('activa sigue diciendo hasta cuando esta vigente', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: { membership: { ...pending, displayStatus: 'activa', amountDueOnArrival: null } }
    })

    expect(wrapper.text()).toContain('Activa')
    expect(wrapper.text()).toContain('Vigente hasta')
    expect(wrapper.text()).not.toContain('Pagas al llegar')
  })

  it('una suspension real sigue diciendo suspendida', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: { membership: { ...pending, displayStatus: 'suspendida', amountDueOnArrival: null } }
    })

    expect(wrapper.text()).toContain('Suspendida')
    expect(wrapper.text()).not.toContain('Pagas al llegar')
  })
})
