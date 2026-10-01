/** Datos del dispositivo que deciden como ofrecer instalar. */
export interface DeviceInfo {
  /** Agente de usuario del navegador. */
  userAgent: string
  /** Puntos tactiles (distingue el iPad que se anuncia como Mac). */
  maxTouchPoints: number
  /** El portal ya corre en modo app instalada. */
  isStandalone: boolean
}
