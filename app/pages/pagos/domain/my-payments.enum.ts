/**
 * Forma de pago, espejo del ENUM del API.
 *
 * El atleta no elige ninguna aqui: solo se nombra la que se uso.
 */
export const MY_PAYMENT_METHOD = {
  CASH: 'cash',
  TERMINAL: 'terminal',
  TRANSFER: 'transfer',
  STRIPE: 'stripe',
  /**
   * Una forma que el portal todavia no conoce. No viene del API: es como se
   * lee un valor nuevo para no nombrarlo con otra que no es.
   */
  OTHER: 'other'
} as const

/** Forma de pago de un cobro. */
export type MyPaymentMethod = (typeof MY_PAYMENT_METHOD)[keyof typeof MY_PAYMENT_METHOD]
