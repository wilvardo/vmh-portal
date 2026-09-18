import { describe, expect, it } from 'vitest'
import { validateRegisterForm, type RegisterFormValues } from './register.helpers'

/** Captura correcta, para alterar un solo campo por prueba. */
const buildValues = (overrides: Partial<RegisterFormValues> = {}): RegisterFormValues => ({
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@correo.mx',
  phone: '5512000010',
  password: 'contrasena-larga-de-verdad',
  privacyAccepted: true,
  ...overrides
})

describe('validateRegisterForm', () => {
  it('acepta una captura completa', () => {
    expect(validateRegisterForm(buildValues())).toEqual({
      isValid: true,
      field: '',
      messageKey: ''
    })
  })

  it('exige el aviso de privacidad, que es el unico requisito legal del alta', () => {
    const result = validateRegisterForm(buildValues({ privacyAccepted: false }))

    expect(result.isValid).toBe(false)
    expect(result.field).toBe('privacyAccepted')
  })

  it('pide el telefono a diez digitos, ni mas ni menos', () => {
    expect(validateRegisterForm(buildValues({ phone: '551200001' })).field).toBe('phone')
    expect(validateRegisterForm(buildValues({ phone: '55120000100' })).field).toBe('phone')
    expect(validateRegisterForm(buildValues({ phone: '55 1200 0010' })).field).toBe('phone')
  })

  it('rechaza una contrasena mas corta que la que el API acepta', () => {
    expect(validateRegisterForm(buildValues({ password: 'corta123' })).field).toBe('password')
  })

  it('devuelve el primer problema en el orden de la pantalla, no todos juntos', () => {
    const result = validateRegisterForm(
      buildValues({ firstName: '', email: 'sin-arroba', privacyAccepted: false })
    )

    expect(result.field).toBe('firstName')
  })

  it('no toma por nombre un texto que solo son espacios', () => {
    expect(validateRegisterForm(buildValues({ firstName: '   ' })).field).toBe('firstName')
  })
})
