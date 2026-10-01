import { describe, expect, it } from 'vitest'
import type { InstallContext } from './install-context.interface'
import { INSTALL_MODE } from './install-mode.enum'
import { isIosSafari, resolveInstallMode } from './install-mode.helpers'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1'
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36'

const base: InstallContext = {
  canPrompt: false,
  isStandalone: false,
  userAgent: ANDROID_CHROME,
  iosHintDismissed: false
}

describe('isIosSafari', () => {
  it('reconoce Safari en iPhone', () => {
    expect(isIosSafari(IPHONE_SAFARI)).toBe(true)
  })

  it('descarta otros navegadores de iOS, que no instalan desde Compartir', () => {
    expect(isIosSafari(IPHONE_CHROME)).toBe(false)
  })

  it('reconoce el iPad que se anuncia como Mac por su pantalla tactil', () => {
    expect(isIosSafari(IPAD_AS_MAC, 5)).toBe(true)
    expect(isIosSafari(IPAD_AS_MAC, 0)).toBe(false)
  })

  it('no confunde Chrome de Android con Safari', () => {
    expect(isIosSafari(ANDROID_CHROME)).toBe(false)
  })
})

describe('resolveInstallMode', () => {
  it('ya instalada no ofrece nada', () => {
    expect(resolveInstallMode({ ...base, isStandalone: true, canPrompt: true })).toBe(
      INSTALL_MODE.NONE
    )
  })

  it('usa el aviso nativo cuando el navegador lo tiene', () => {
    expect(resolveInstallMode({ ...base, canPrompt: true })).toBe(INSTALL_MODE.PROMPT)
  })

  it('en Safari de iOS da instrucciones', () => {
    expect(resolveInstallMode({ ...base, userAgent: IPHONE_SAFARI })).toBe(INSTALL_MODE.IOS)
  })

  it('no repite las instrucciones de iOS una vez descartadas', () => {
    expect(resolveInstallMode({ ...base, userAgent: IPHONE_SAFARI, iosHintDismissed: true })).toBe(
      INSTALL_MODE.NONE
    )
  })

  it('sin aviso nativo ni Safari de iOS no ofrece nada', () => {
    expect(resolveInstallMode(base)).toBe(INSTALL_MODE.NONE)
  })
})
