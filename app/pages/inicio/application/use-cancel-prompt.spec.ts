import { describe, expect, it } from 'vitest'
import { useCancelPrompt } from './use-cancel-prompt'

describe('useCancelPrompt', () => {
  it('arranca cerrado y sin reserva elegida', () => {
    const prompt = useCancelPrompt()

    expect(prompt.isOpen.value).toBe(false)
    expect(prompt.reservation.value).toBeNull()
  })

  it('abre la confirmacion con la reserva del renglon, escrita para el dialogo', () => {
    const prompt = useCancelPrompt()

    prompt.ask({ id: 7, name: 'Fuerza', day: 'jueves, 1 de octubre', time: '07:00' })

    expect(prompt.isOpen.value).toBe(true)
    expect(prompt.reservation.value).toEqual({
      reservationId: 7,
      label: 'Fuerza',
      when: 'jueves, 1 de octubre, 07:00'
    })
  })
})
