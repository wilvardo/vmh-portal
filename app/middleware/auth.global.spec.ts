// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'
import { AUTH_ROLE, type AuthRole } from '~/resources/scripts/domain/auth-role.enum'
import {
  FIRST_ACCESS_PATH,
  LOGIN_PATH,
  LOGIN_REASON,
  LOGIN_REASON_QUERY,
  PAYMENTS_PATH,
  POST_LOGIN_REDIRECT_PATH,
  SCHEDULE_PATH
} from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import authMiddleware from './auth.global'

const navigate = vi.fn()
const closeSession = vi.fn()
const session = ref<AuthSession | null>(null)

mockNuxtImport(
  'navigateTo',
  () =>
    (...args: unknown[]) =>
      navigate(...args)
)
mockNuxtImport('useSession', () => () => ({ session, closeSession }))

/**
 * Sesion inventada con el rol pedido.
 *
 * @param role Rol de la cuenta.
 * @returns La sesion.
 */
const sessionAs = (role: AuthRole): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: { id: 7, firstName: 'Ana', lastName: 'De Prueba', email: 'ana@correo.test', role }
})

/**
 * Ruta normalizada hacia la que navega la prueba, como la recibe un middleware.
 *
 * @param path Ruta de destino.
 * @returns La ruta resuelta por el enrutador del portal.
 */
const routeTo = (path: string): RouteLocationNormalized => {
  const { name, ...resolved } = useRouter().resolve(path)

  return { ...resolved, name: name ?? path }
}

/**
 * Corre la guardia hacia una ruta del portal.
 *
 * @param path Ruta de destino.
 * @returns Lo que la guardia devolvio.
 */
const guard = (path: string): unknown => {
  const to = routeTo(path)

  return authMiddleware(to, to)
}

describe('guardia global de sesion', () => {
  beforeEach(() => {
    navigate.mockReset()
    closeSession.mockReset().mockResolvedValue(undefined)
    session.value = null
  })

  it('sin sesion, una ruta privada manda al acceso', () => {
    guard(SCHEDULE_PATH)

    expect(navigate).toHaveBeenCalledWith(LOGIN_PATH)
  })

  it('sin sesion, las pantallas publicas se dejan ver', () => {
    expect(guard(LOGIN_PATH)).toBeUndefined()
    expect(guard(FIRST_ACCESS_PATH)).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('con sesion de atleta, las rutas privadas pasan sin desvio', () => {
    session.value = sessionAs(AUTH_ROLE.ATHLETE)

    expect(guard(SCHEDULE_PATH)).toBeUndefined()
    expect(guard(PAYMENTS_PATH)).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('con sesion de atleta, una pantalla publica manda a su tablero', () => {
    session.value = sessionAs(AUTH_ROLE.ATHLETE)

    guard(FIRST_ACCESS_PATH)

    expect(navigate).toHaveBeenCalledWith(POST_LOGIN_REDIRECT_PATH)
  })

  it('una cuenta del estudio se revoca en el servidor y va al acceso con el motivo', () => {
    session.value = sessionAs(AUTH_ROLE.RECEPTIONIST)

    guard(POST_LOGIN_REDIRECT_PATH)

    expect(closeSession).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith({
      path: LOGIN_PATH,
      query: { [LOGIN_REASON_QUERY]: LOGIN_REASON.FORBIDDEN }
    })
  })

  it('una cuenta del estudio que ya esta en el acceso solo pierde la sesion', () => {
    session.value = sessionAs(AUTH_ROLE.COACH)

    expect(guard(LOGIN_PATH)).toBeUndefined()
    expect(closeSession).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })
})
