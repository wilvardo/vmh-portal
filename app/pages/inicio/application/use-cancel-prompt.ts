import type { CancelPromptRow, PromptedReservation } from '../domain/cancel-prompt.interface'

interface UseCancelPromptReturn {
  /** Si la confirmacion esta abierta. */
  isOpen: Ref<boolean>
  /** Reserva que se propone cancelar; `null` antes de elegir una. */
  reservation: Ref<PromptedReservation | null>
  /** Abre la confirmacion para el renglon elegido. */
  ask: (row: CancelPromptRow) => void
}

/**
 * Caso de uso de "pedir cancelar" desde el tablero.
 *
 * Solo elige que reserva se propone y abre la confirmacion: cancelar, leer los
 * rechazos y avisar es del dialogo compartido con Horarios, para que las dos
 * pantallas digan lo mismo.
 *
 * @returns El estado de la confirmacion y la accion para abrirla.
 */
export const useCancelPrompt = (): UseCancelPromptReturn => {
  const isOpen = ref(false)
  const reservation = ref<PromptedReservation | null>(null)

  const ask = (row: CancelPromptRow): void => {
    reservation.value = {
      reservationId: row.id,
      label: row.name,
      when: `${row.day}, ${row.time}`
    }
    isOpen.value = true
  }

  return { isOpen, reservation, ask }
}
