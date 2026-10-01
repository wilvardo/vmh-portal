import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadAfterSwap } from './page-reload.repository'

describe('reloadAfterSwap', () => {
  const reload = vi.fn()
  let swTarget: EventTarget

  beforeEach(() => {
    vi.useFakeTimers()
    swTarget = new EventTarget()
    vi.stubGlobal('location', { ...window.location, reload })
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: swTarget })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })

  it('recarga en cuanto la version nueva toma el control', async () => {
    const pending = reloadAfterSwap({ timeoutMs: 3000 })

    swTarget.dispatchEvent(new Event('controllerchange'))
    await pending

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('si el cambio no llega, recarga al vencer el tope y solo una vez', async () => {
    const pending = reloadAfterSwap({ timeoutMs: 3000 })

    vi.advanceTimersByTime(3000)
    await pending
    swTarget.dispatchEvent(new Event('controllerchange'))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
