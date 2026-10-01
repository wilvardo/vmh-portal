/** Textos de un aviso, ya traducidos. */
export interface BookingNoticeText {
  /** Encabezado: la causa. */
  title: string
  /** Cuerpo: que la resuelve. */
  detail: string
}

/** Aviso de la semana listo para pintarse. */
export interface BookingNoticeView extends BookingNoticeText {
  /** A donde lleva la salida; vacio si no hay salida o no hay sitio configurado. */
  exitUrl: string
  /** Texto del enlace de salida; vacio si no hay salida. */
  exitLabel: string
}
