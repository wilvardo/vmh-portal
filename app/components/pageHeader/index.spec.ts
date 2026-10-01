// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import pageHeader from './index.vue'

describe('pageHeader', () => {
  it('declara el unico h1 de la pantalla con el punto de marca aparte', async () => {
    const wrapper = await mountSuspended(pageHeader, { props: { title: 'Reservas' } })

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('Reservas.')
    expect(wrapper.find('.page-header__mark').text()).toBe('.')
  })

  it('muestra la etiqueta y el apoyo que recibe', async () => {
    const wrapper = await mountSuspended(pageHeader, {
      props: { title: 'Reservas', eyebrow: 'Operacion', support: 'Quien viene y a que hora.' }
    })

    expect(wrapper.find('.page-header__eyebrow').text()).toBe('Operacion')
    expect(wrapper.find('.page-header__support').text()).toBe('Quien viene y a que hora.')
  })

  it('no dibuja etiqueta, apoyo ni acciones que no recibe', async () => {
    const wrapper = await mountSuspended(pageHeader, { props: { title: 'Reservas' } })

    expect(wrapper.find('.page-header__eyebrow').exists()).toBe(false)
    expect(wrapper.find('.page-header__support').exists()).toBe(false)
    expect(wrapper.find('.page-header__actions').exists()).toBe(false)
  })

  it('coloca las acciones de la pantalla a la derecha del titulo', async () => {
    const wrapper = await mountSuspended(pageHeader, {
      props: { title: 'Atletas' },
      slots: { actions: () => h('button', { class: 'nuevo' }, 'Agregar') }
    })

    expect(wrapper.find('.page-header__actions .nuevo').exists()).toBe(true)
  })
})
