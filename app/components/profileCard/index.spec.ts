// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { MyProfile } from '~/pages/inicio/domain/membership.interface'
import profileCard from './index.vue'

/** Perfil completo con datos inventados. */
const profile: MyProfile = {
  id: 12,
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@correo.mx',
  phone: '5512000010',
  emergencyContactName: 'Luis Lopez',
  emergencyContactPhone: '5519000001'
}

/** Enlaces del sitio de prueba. */
const legalLinks = {
  privacy: 'https://vmh.example/aviso-de-privacidad',
  terms: 'https://vmh.example/terminos-y-condiciones'
}

describe('profileCard', () => {
  it('muestra el contacto de emergencia en una linea', async () => {
    const wrapper = await mountSuspended(profileCard, { props: { profile, legalLinks } })

    expect(wrapper.text()).toContain('Luis Lopez · 5519000001')
    expect(wrapper.text()).not.toContain('Falta tu contacto de emergencia')
  })

  it('avisa cuando falta el contacto de emergencia', async () => {
    const wrapper = await mountSuspended(profileCard, {
      props: { profile: { ...profile, emergencyContactPhone: null } }
    })

    expect(wrapper.text()).toContain('Falta tu contacto de emergencia')
  })

  it('enlaza el aviso de privacidad y los terminos del sitio', async () => {
    const wrapper = await mountSuspended(profileCard, { props: { profile, legalLinks } })

    const hrefs = wrapper.findAll('.profile-card__link').map((link) => link.attributes('href'))
    expect(hrefs).toEqual([legalLinks.privacy, legalLinks.terms])
  })

  it('sin sitio configurado no pinta enlaces legales', async () => {
    const wrapper = await mountSuspended(profileCard, { props: { profile, legalLinks: null } })

    expect(wrapper.find('.profile-card__legal').exists()).toBe(false)
  })

  it('pide editar al tablero', async () => {
    const wrapper = await mountSuspended(profileCard, { props: { profile } })

    await wrapper.find('.profile-card__edit').trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})
