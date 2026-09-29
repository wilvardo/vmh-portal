// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthUser } from '~/resources/scripts/domain/session.interface'
import portalHeader from './index.vue'

const { closeSession, navigate, currentUser, currentPath } = vi.hoisted(() => ({
  closeSession: vi.fn(async (): Promise<void> => undefined),
  navigate: vi.fn(),
  currentUser: { value: null as AuthUser | null },
  currentPath: { value: '/inicio' }
}))

mockNuxtImport('useSession', () => () => ({
  user: computed(() => currentUser.value),
  closeSession
}))
mockNuxtImport('useRoute', () => () => ({ path: currentPath.value }))
mockNuxtImport(
  'navigateTo',
  () =>
    (...args: unknown[]) =>
      navigate(...args)
)

const athlete: AuthUser = {
  id: 5,
  firstName: 'Ana',
  lastName: 'Trejo Luna',
  email: 'ana@correo.test',
  role: AUTH_ROLE.ATHLETE
}

describe('portalHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentUser.value = athlete
    currentPath.value = '/inicio'
  })

  it('muestra quien esta dentro con sus iniciales', async () => {
    const wrapper = await mountSuspended(portalHeader)

    expect(wrapper.find('.portal-header__name').text()).toBe('Ana Trejo Luna')
    expect(wrapper.find('.portal-header__initials').text()).toBe('AT')
  })

  it('ofrece Inicio y Horarios y marca la pantalla actual', async () => {
    currentPath.value = '/horarios'
    const wrapper = await mountSuspended(portalHeader)

    const links = wrapper.findAll('.portal-header__link')
    expect(links.map((link) => link.text())).toEqual(['Inicio', 'Horarios'])
    expect(links[0]?.attributes('aria-current')).toBeUndefined()
    expect(links[1]?.attributes('aria-current')).toBe('page')
  })

  it('salir cierra la sesion en el API y lleva al acceso', async () => {
    const wrapper = await mountSuspended(portalHeader)

    await wrapper.find('.portal-header__sign-out').trigger('click')
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))

    expect(closeSession).toHaveBeenCalledTimes(1)
  })

  it('no pinta la cuenta mientras la sesion se resuelve', async () => {
    currentUser.value = null
    const wrapper = await mountSuspended(portalHeader)

    expect(wrapper.find('.portal-header__account').exists()).toBe(false)
  })
})
