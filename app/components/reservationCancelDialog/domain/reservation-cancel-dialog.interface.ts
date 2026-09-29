/** Reserva que el dialogo propone cancelar, ya escrita para pintarse. */
export interface CancellableReservation {
  /** Reserva a cancelar. */
  reservationId: number
  /** Que es: "Evaluación inicial" o el nombre del entrenamiento. */
  label: string
  /** Dia y hora en la zona del estudio. */
  when: string
}

/** Aviso que el caso de uso pide mostrar; el script lo convierte en Toast. */
export interface CancelNotice {
  /** Tono del aviso. */
  severity: 'success' | 'info' | 'error'
  /** Encabezado. */
  summary: string
  /** Cuerpo. */
  detail: string
}
