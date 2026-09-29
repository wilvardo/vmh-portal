/** Renglon de "Proximas sesiones" que la persona pidio cancelar. */
export interface CancelPromptRow {
  /** Reserva. */
  id: number
  /** Que es, ya nombrado para pintarse. */
  name: string
  /** Dia en la zona del estudio. */
  day: string
  /** Hora en la zona del estudio. */
  time: string
}

/** Reserva tal como la recibe el dialogo compartido de cancelar. */
export interface PromptedReservation {
  /** Reserva a cancelar. */
  reservationId: number
  /** Que es. */
  label: string
  /** Dia y hora. */
  when: string
}
