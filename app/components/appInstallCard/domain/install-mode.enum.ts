/** Como se ofrece instalar el portal en el dispositivo actual. */
export const INSTALL_MODE = {
  /** El navegador tiene su aviso nativo (Android, Chrome de escritorio). */
  PROMPT: 'prompt',
  /** iPhone o iPad en Safari: se instala a mano desde Compartir. */
  IOS: 'ios',
  /** Ya instalada, descartada o sin forma de instalar: no se ofrece. */
  NONE: 'none'
} as const

export type InstallMode = (typeof INSTALL_MODE)[keyof typeof INSTALL_MODE]
