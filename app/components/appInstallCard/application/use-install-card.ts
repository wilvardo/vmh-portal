import type { ComputedRef, Ref } from 'vue'
import type { DeviceInfo } from '../domain/device-info.interface'
import { INSTALL_MODE, type InstallMode } from '../domain/install-mode.enum'
import { resolveInstallMode } from '../domain/install-mode.helpers'
import type { InstallSource } from '../domain/install-source.interface'

/** Dependencias de la invitacion a instalar. */
export interface InstallCardParams {
  /** El `$pwa` del modulo, o `undefined` sin service worker. */
  source: InstallSource | undefined
  /** Lee los datos del dispositivo. */
  readDevice: () => DeviceInfo
  /** Lee si ya se descartaron las instrucciones de iOS. */
  readIosHintDismissed: () => boolean
  /** Recuerda que se descartaron las instrucciones de iOS. */
  saveIosHintDismissed: () => void
}

/** Estado y acciones de la invitacion a instalar. */
export interface InstallCard {
  /** Como ofrecer instalar en este dispositivo. */
  mode: ComputedRef<InstallMode>
  /** Si el aviso nativo esta abierto. */
  isInstalling: Ref<boolean>
  /** Abre el aviso nativo de instalacion. */
  install: () => Promise<void>
  /** Descarta la invitacion y no vuelve a ofrecerla. */
  dismiss: () => void
}

/**
 * Caso de uso de la invitacion a instalar el portal como app.
 *
 * @param params Fuente PWA y acceso al dispositivo, inyectados.
 * @returns El modo de instalacion y sus acciones.
 */
export const useInstallCard = (params: InstallCardParams): InstallCard => {
  const device = params.readDevice()
  const iosHintDismissed = ref<boolean>(params.readIosHintDismissed())
  const isInstalling = ref<boolean>(false)

  const mode = computed<InstallMode>(() =>
    resolveInstallMode(
      {
        canPrompt: params.source?.showInstallPrompt.value === true,
        isStandalone: device.isStandalone || params.source?.isPWAInstalled.value === true,
        userAgent: device.userAgent,
        iosHintDismissed: iosHintDismissed.value
      },
      device.maxTouchPoints
    )
  )

  /** Abre el aviso nativo; la respuesta la registra el propio modulo. */
  const install = async (): Promise<void> => {
    if (!params.source) return
    isInstalling.value = true
    try {
      await params.source.install()
    } catch (error) {
      console.error('useInstallCard: error al abrir el aviso de instalacion', error)
    } finally {
      isInstalling.value = false
    }
  }

  /** Descarta la invitacion del modo que este a la vista. */
  const dismiss = (): void => {
    if (mode.value === INSTALL_MODE.PROMPT) {
      params.source?.cancelInstall()
      return
    }
    params.saveIosHintDismissed()
    iosHintDismissed.value = true
  }

  return { mode, isInstalling, install, dismiss }
}
