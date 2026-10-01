import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { DeviceInfo } from '../domain/device-info.interface'
import { INSTALL_MODE } from '../domain/install-mode.enum'
import type { InstallSource } from '../domain/install-source.interface'
import { useInstallCard, type InstallCardParams } from './use-install-card'

const ANDROID: DeviceInfo = {
  userAgent: 'Mozilla/5.0 (Linux; Android 16) Chrome/140.0 Mobile Safari/537.36',
  maxTouchPoints: 5,
  isStandalone: false
}
const IPHONE: DeviceInfo = {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1',
  maxTouchPoints: 5,
  isStandalone: false
}

const buildSource = (canPrompt: boolean): InstallSource => ({
  showInstallPrompt: ref(canPrompt),
  isPWAInstalled: ref(false),
  install: vi.fn(async (): Promise<unknown> => undefined),
  cancelInstall: vi.fn()
})

const buildParams = (overrides: Partial<InstallCardParams> = {}): InstallCardParams => ({
  source: buildSource(false),
  readDevice: () => ANDROID,
  readIosHintDismissed: () => false,
  saveIosHintDismissed: vi.fn(),
  ...overrides
})

describe('useInstallCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('con aviso nativo ofrece instalar y lo abre', async () => {
    const source = buildSource(true)
    const card = useInstallCard(buildParams({ source }))

    expect(card.mode.value).toBe(INSTALL_MODE.PROMPT)
    await card.install()

    expect(source.install).toHaveBeenCalledTimes(1)
    expect(card.isInstalling.value).toBe(false)
  })

  it('descartar el aviso nativo se lo dice al modulo', () => {
    const source = buildSource(true)

    useInstallCard(buildParams({ source })).dismiss()

    expect(source.cancelInstall).toHaveBeenCalledTimes(1)
  })

  it('en iPhone da instrucciones y recuerda cuando se descartan', () => {
    const params = buildParams({ readDevice: () => IPHONE })
    const card = useInstallCard(params)

    expect(card.mode.value).toBe(INSTALL_MODE.IOS)
    card.dismiss()

    expect(params.saveIosHintDismissed).toHaveBeenCalledTimes(1)
    expect(card.mode.value).toBe(INSTALL_MODE.NONE)
  })

  it('si el aviso nativo falla, no se queda cargando', async () => {
    const source = buildSource(true)
    vi.mocked(source.install).mockRejectedValueOnce(new Error('cancelado'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const card = useInstallCard(buildParams({ source }))

    await card.install()

    expect(card.isInstalling.value).toBe(false)
    consoleError.mockRestore()
  })

  it('sin service worker y fuera de iOS no ofrece nada', () => {
    expect(useInstallCard(buildParams({ source: undefined })).mode.value).toBe(INSTALL_MODE.NONE)
  })
})
