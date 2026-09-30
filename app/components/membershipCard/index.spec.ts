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

  it('dice la forma de pago del contrato', async () => {
    const upfront = await mountSuspended(membershipCard, { props: { membership: pending } })
    const monthly = await mountSuspended(membershipCard, {
      props: {
        membership: {
          ...pending,
          displayStatus: 'activa',
          paymentMode: 'monthly',
          amountDueOnArrival: null
        }
      }
    })

    expect(upfront.text()).toContain('Forma de pago')
    expect(upfront.text()).toContain('De contado')
    expect(monthly.text()).toContain('Forma de pago')
    expect(monthly.text()).toContain('Mensual')
  })

  it('una modalidad que el portal no conoce no se nombra', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: { membership: { ...pending, paymentMode: 'stripe_subscription' } }
    })

    expect(wrapper.text()).not.toContain('Forma de pago')
  })

  it('suspendida dice que hacer y ofrece escribir al estudio', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: {
        membership: { ...pending, displayStatus: 'suspendida', amountDueOnArrival: null },
        siteUrl: 'https://vmh.test'
      }
    })

    expect(wrapper.find('.membership-card__call').text()).toContain('Habla con recepción')
    const contact = wrapper.find('a.membership-card__action')
    expect(contact.text()).toBe('Escribir al estudio')
    expect(contact.attributes('href')).toBe('https://vmh.test/#contacto')
  })

  it('suspendida sin sitio configurado conserva el llamado pero no pinta un enlace roto', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: { membership: { ...pending, displayStatus: 'suspendida', amountDueOnArrival: null } }
    })

    expect(wrapper.find('.membership-card__call').exists()).toBe(true)
    expect(wrapper.find('a.membership-card__action').exists()).toBe(false)
  })

  it('una suspension real sigue diciendo suspendida', async () => {
    const wrapper = await mountSuspended(membershipCard, {
      props: { membership: { ...pending, displayStatus: 'suspendida', amountDueOnArrival: null } }
    })

    expect(wrapper.text()).toContain('Suspendida')
    expect(wrapper.text()).not.toContain('Pagas al llegar')
  })
})
