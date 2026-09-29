/** Aviso que el caso de uso pide mostrar; el script lo convierte en Toast. */
export interface BookingNotice {
  /** Tono del aviso. */
  severity: 'success' | 'info' | 'error'
  /** Encabezado. */
  summary: string
  /** Cuerpo. */
  detail: string
}
