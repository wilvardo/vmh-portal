// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import { SESSION_STORAGE_KEY } from '~/resources/scripts/domain/session.const'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { writeStoredSession } from '~/resources/scripts/infrastructure/session-storage.repository'
import sessionPlugin from './session.client'

const buildSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 7,
    firstName: 'Ana',
    lastName: 'De Prueba',
    email: 'ana@correo.test',
    role: AUTH_ROLE.ATHLETE
  },
  ...overrides
})

describe('plugin de sesion', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSession().endSession()
  })

  it('recupera la sesion guardada al arrancar: recargar no saca al atleta', async () => {
    writeStoredSession({ session: buildSession() })

    await sessionPlugin(useNuxtApp())

    expect(useSession().session.value).toEqual(buildSession())
  })

  it('adopta la sesion que otra pestana abrio despues de arrancar', async () => {
    await sessionPlugin(useNuxtApp())

    const incoming = buildSession({ accessToken: 'otro-token' })
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify(incoming)
      })
    )

    expect(useSession().session.value).toEqual(incoming)
  })

  it('si otra pestana cierra sesion, esta sale a la pantalla de acceso', async () => {
    writeStoredSession({ session: buildSession() })
    await sessionPlugin(useNuxtApp())
    const router = useRouter()
    await router.push('/pagos')

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        oldValue: JSON.stringify(buildSession()),
        newValue: null
      })
    )

    expect(useSession().session.value).toBeNull()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
