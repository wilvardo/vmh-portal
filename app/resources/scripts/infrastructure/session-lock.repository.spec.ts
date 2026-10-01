import { afterEach, describe, expect, it, vi } from 'vitest'
import { runWithSessionLock } from './session-lock.repository'

type LockCallback = () => Promise<unknown>

/**
 * Candado de prueba con la semantica de Web Locks: exclusivo y en orden de
 * llegada, como el del navegador entre pestanas.
 *
 * @returns El candado y el registro de nombres pedidos.
 */
const fakeLockManager = (): { request: ReturnType<typeof vi.fn>; names: string[] } => {
  let tail: Promise<unknown> = Promise.resolve()
  const names: string[] = []
  const request = vi.fn((name: string, _options: unknown, callback: LockCallback) => {
    names.push(name)
    const run = tail.then(() => callback())
    tail = run.catch(() => undefined)
    return run
  })

  return { request, names }
}

/**
 * Instala un candado en el navegador de prueba.
 *
 * @param value Candado a exponer, o `null` para simular su ausencia.
 */
const installLocks = (value: unknown): void => {
  Object.defineProperty(navigator, 'locks', { value, configurable: true })
}

describe('runWithSessionLock', () => {
  afterEach(() => {
    installLocks(null)
  })

  it('corre el trabajo bajo el candado de renovacion del portal', async () => {
    const locks = fakeLockManager()
    installLocks(locks)

    const result = await runWithSessionLock({ task: () => Promise.resolve('hecho') })

    expect(result).toBe('hecho')
    expect(locks.names).toEqual(['vmh-portal-session-refresh'])
  })

  it('dos trabajos no se enciman: el segundo espera a que termine el primero', async () => {
    installLocks(fakeLockManager())
    const order: string[] = []
    let releaseFirst: () => void = () => undefined

    const first = runWithSessionLock({
      task: async () => {
        order.push('inicia-1')
        await new Promise<void>((resolve) => {
          releaseFirst = resolve
        })
        order.push('termina-1')
      }
    })
    const second = runWithSessionLock({
      task: () => {
        order.push('inicia-2')
        return Promise.resolve()
      }
    })

    await Promise.resolve()
    releaseFirst()
    await Promise.all([first, second])

    expect(order).toEqual(['inicia-1', 'termina-1', 'inicia-2'])
  })

  it('sin Web Locks corre el trabajo directo en lugar de fallar', async () => {
    installLocks(null)

    await expect(runWithSessionLock({ task: () => Promise.resolve(7) })).resolves.toBe(7)
  })

  it('propaga el error del trabajo', async () => {
    installLocks(fakeLockManager())

    await expect(
      runWithSessionLock({ task: () => Promise.reject(new Error('token revocado')) })
    ).rejects.toThrow('token revocado')
  })
})
