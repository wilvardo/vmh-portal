/** Lo que se sabe del dispositivo para decidir si y como ofrecer instalar. */
export interface InstallContext {
  /** El navegador ya capturo su aviso nativo de instalacion. */
  canPrompt: boolean
  /** El portal ya corre como app instalada. */
  isStandalone: boolean
  /** Agente de usuario del navegador. */
  userAgent: string
  /** La persona ya dijo que no a las instrucciones de iOS. */
  iosHintDismissed: boolean
}
