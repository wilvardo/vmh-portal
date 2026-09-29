import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignOut } from './use-sign-out'

describe('useSignOut', () => {
  const calls: string[] = []
  const closeSession = vi.fn(async (): Promise<void> => {
    calls.push('close')
  })
  const goToLogin = vi.fn(async (): Promise<void> => {
    calls.push('login')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    calls.length = 0
  })

  it('cierra la sesion en el API y despues lleva al acceso', async () => {
    const { signOut } = useSignOut({ closeSession, goToLogin })

    await signOut()

    expect(closeSession).toHaveBeenCalledTimes(1)
    expect(calls).toEqual(['close', 'login'])
  })

  it('no dispara dos cierres con un doble clic', async () => {
    const { signOut } = useSignOut({ closeSession, goToLogin })

    await Promise.all([signOut(), signOut()])

    expect(closeSession).toHaveBeenCalledTimes(1)
  })
})
