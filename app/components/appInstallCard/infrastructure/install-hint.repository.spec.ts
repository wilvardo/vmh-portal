import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IOS_HINT_DISMISSED_KEY } from '../domain/install-mode.const'
import {
  readDeviceInfo,
  readIosHintDismissed,
  saveIosHintDismissed
} from './install-hint.repository'

describe('install-hint.repository', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('recuerda que se descartaron las instrucciones de iOS', () => {
    expect(readIosHintDismissed()).toBe(false)

    saveIosHintDismissed()

    expect(window.localStorage.getItem(IOS_HINT_DISMISSED_KEY)).toBe('1')
    expect(readIosHintDismissed()).toBe(true)
  })

  it('un valor desconocido en el almacenamiento cuenta como no descartado', () => {
    window.localStorage.setItem(IOS_HINT_DISMISSED_KEY, 'quiza')

    expect(readIosHintDismissed()).toBe(false)
  })

  it('un almacenamiento bloqueado no tumba la app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(readIosHintDismissed()).toBe(false)
    expect(() => saveIosHintDismissed()).not.toThrow()
  })

  it('lee el modo instalado del display-mode', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)

    expect(readDeviceInfo().isStandalone).toBe(true)
  })
})
