import { describe, expect, it } from 'vitest'
import { AUTH_ROLE } from './auth-role.enum'
import {
  LOGIN_PATH,
  PASSWORD_RECOVERY_PATH,
  POST_LOGIN_REDIRECT_PATH,
  REGISTER_PATH,
  SET_PASSWORD_PATH,
  VERIFY_EMAIL_PATH
} from './session.const'
import type { AuthUser } from './session.interface'
import {
  buildDisplayName,
  buildInitials,
  canAccessPortal,
  isPublicPath,
  parseAuthSession,
  parseAuthUser
} from './session.helpers'

const buildUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 1,
  firstName: 'Victoria',
  lastName: 'Mendoza Herrera',
  email: 'admin@vmh.mx',
  role: AUTH_ROLE.ADMIN,
  ...overrides
})

describe('isPublicPath', () => {
  it('reconoce como publicas el acceso y las pantallas de alta', () => {
    expect(isPublicPath(LOGIN_PATH)).toBe(true)
    expect(isPublicPath(REGISTER_PATH)).toBe(true)
    expect(isPublicPath(VERIFY_EMAIL_PATH)).toBe(true)
    expect(isPublicPath(PASSWORD_RECOVERY_PATH)).toBe(true)
    expect(isPublicPath(SET_PASSWORD_PATH)).toBe(true)
  })

  it('exige sesion en cualquier ruta no declarada', () => {
    expect(isPublicPath(POST_LOGIN_REDIRECT_PATH)).toBe(false)
    expect(isPublicPath('/reservas')).toBe(false)
  })
})

describe('canAccessPortal', () => {
  it('deja entrar al atleta, que es de quien es este portal', () => {
    expect(canAccessPortal(AUTH_ROLE.ATHLETE)).toBe(true)
  })

  it('niega a quien trabaja en el estudio: su herramienta es el panel', () => {
    expect(canAccessPortal(AUTH_ROLE.ADMIN)).toBe(false)
    expect(canAccessPortal(AUTH_ROLE.RECEPTIONIST)).toBe(false)
    expect(canAccessPortal(AUTH_ROLE.COACH)).toBe(false)
  })

  it('niega un rol desconocido en lugar de asumir permiso', () => {
    expect(canAccessPortal('auditor')).toBe(false)
    expect(canAccessPortal('')).toBe(false)
  })
})

describe('parseAuthUser', () => {
  it('devuelve la persona cuando la forma cumple el contrato', () => {
    expect(parseAuthUser(buildUser())).toEqual(buildUser())
  })

  it('descarta los campos que el contrato no declara', () => {
    const withExtra = { ...buildUser(), passwordHash: 'no-deberia-viajar' }
    expect(parseAuthUser(withExtra)).not.toHaveProperty('passwordHash')
  })

  it('acepta al entrenador: es un rol que el API si devuelve', () => {
    const coach = { ...buildUser(), role: AUTH_ROLE.COACH }
    expect(parseAuthUser(coach)).toEqual(coach)
  })

  it('rechaza un rol que el sistema no conoce', () => {
    expect(parseAuthUser({ ...buildUser(), role: 'root' })).toBeNull()
  })

  it('rechaza valores que no son objeto', () => {
    expect(parseAuthUser(null)).toBeNull()
    expect(parseAuthUser('sesion')).toBeNull()
  })

  it('rechaza una persona con campos faltantes', () => {
    const { email: _email, ...withoutEmail } = buildUser()
    expect(parseAuthUser(withoutEmail)).toBeNull()
  })
})

describe('parseAuthSession', () => {
  it('devuelve la sesion completa', () => {
    const session = { accessToken: 'a', refreshToken: 'r', user: buildUser() }
    expect(parseAuthSession(session)).toEqual(session)
  })

  it('rechaza una sesion sin token de renovacion', () => {
    expect(parseAuthSession({ accessToken: 'a', refreshToken: '', user: buildUser() })).toBeNull()
  })

  it('rechaza una sesion cuya persona no cumple el contrato', () => {
    expect(parseAuthSession({ accessToken: 'a', refreshToken: 'r', user: { id: 1 } })).toBeNull()
  })
})

describe('buildDisplayName', () => {
  it('une nombre y apellidos', () => {
    expect(buildDisplayName(buildUser())).toBe('Victoria Mendoza Herrera')
  })

  it('no deja espacios colgando cuando falta el apellido', () => {
    expect(buildDisplayName(buildUser({ lastName: '' }))).toBe('Victoria')
  })
})

describe('buildInitials', () => {
  it('toma las dos primeras iniciales en caja alta', () => {
    expect(buildInitials(buildUser())).toBe('VM')
  })

  it('devuelve una sola inicial cuando solo hay nombre', () => {
    expect(buildInitials(buildUser({ lastName: '' }))).toBe('V')
  })

  it('devuelve cadena vacia cuando no hay nombre', () => {
    expect(buildInitials(buildUser({ firstName: '', lastName: '' }))).toBe('')
  })
})
