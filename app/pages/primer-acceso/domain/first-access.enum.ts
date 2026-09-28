/**
 * Pasos del primer acceso, en el orden en que la persona los recorre: pedir el
 * codigo, escribirlo y elegir su contrasena.
 */
export const FIRST_ACCESS_STEP = {
  EMAIL: 'email',
  CODE: 'code',
  PASSWORD: 'password'
} as const

/** Paso vigente del primer acceso. */
export type FirstAccessStep = (typeof FIRST_ACCESS_STEP)[keyof typeof FIRST_ACCESS_STEP]
