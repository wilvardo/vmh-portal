import type { DeviceInfo } from '../domain/device-info.interface'
import { IOS_HINT_DISMISSED_KEY } from '../domain/install-mode.const'

/** Dispositivo neutro cuando no hay navegador: no ofrece instalar nada. */
const NO_DEVICE: DeviceInfo = { userAgent: '', maxTouchPoints: 0, isStandalone: false }

/**
 * Lee del navegador lo necesario para decidir como ofrecer instalar.
 *
 * @returns Los datos del dispositivo, o un dispositivo neutro sin navegador.
 */
export const readDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return NO_DEVICE

  // `navigator.standalone` solo existe en Safari de iOS; el resto lo dice el
  // `display-mode` del manifiesto.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches

  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    isStandalone: iosStandalone || displayStandalone
  }
}

/**
 * Indica si la persona ya descarto las instrucciones de instalacion de iOS.
 * Un almacenamiento bloqueado o ausente cuenta como "no descartado".
 *
 * @returns `true` si ya las descarto.
 */
export const readIosHintDismissed = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(IOS_HINT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Recuerda que la persona descarto las instrucciones de iOS. Es una preferencia,
 * no un dato personal; si el almacenamiento esta bloqueado se pierde sin fallar.
 */
export const saveIosHintDismissed = (): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(IOS_HINT_DISMISSED_KEY, '1')
  } catch {
    // Navegacion privada o almacenamiento lleno: el aviso volvera a salir.
  }
}
