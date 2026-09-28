import { describe, expect, it } from 'vitest'
import {
  isCodeComplete,
  isCodeRetryError,
  isEmailWellFormed,
  resolveStepPosition,
  sanitizeCode,
  validateNewPassword
} from './first-access.helpers'

describe('isEmailWellFormed', () => {
  it('acepta un correo con forma de correo, aun con espacios alrededor', () => {
    expect(isEmailWellFormed('  lucia@correo.mx ')).toBe(true)
  })

  it('rechaza lo que no tiene forma de correo', () => {
    expect(isEmailWellFormed('')).toBe(false)
    expect(isEmailWellFormed('lucia')).toBe(false)
    expect(isEmailWellFormed('lucia@correo')).toBe(false)
  })
})

describe('sanitizeCode', () => {
  it('deja solo los digitos de un codigo pegado con espacios', () => {
    expect(sanitizeCode('123 456')).toBe('123456')
  })

  it('corta al largo del codigo', () => {
    expect(sanitizeCode('12345678')).toBe('123456')
  })

  it('descarta letras y simbolos', () => {
    expect(sanitizeCode('a1-b2')).toBe('12')
  })
})

describe('isCodeComplete', () => {
  it('acepta seis digitos', () => {
    expect(isCodeComplete('000123')).toBe(true)
  })

  it('rechaza un codigo incompleto o con letras', () => {
    expect(isCodeComplete('12345')).toBe(false)
    expect(isCodeComplete('12345a')).toBe(false)
    expect(isCodeComplete('')).toBe(false)
  })
})

describe('validateNewPassword', () => {
  it('deja pasar una contrasena larga confirmada', () => {
    expect(validateNewPassword('contrasena-larga', 'contrasena-larga')).toBe('')
  })

  it('exige el minimo del API', () => {
    expect(validateNewPassword('corta12345', 'corta12345')).toBe('password_short')
  })

  it('ataja el dedazo en la confirmacion', () => {
    expect(validateNewPassword('contrasena-larga', 'contrasena-largo')).toBe('password_mismatch')
  })
})

describe('isCodeRetryError', () => {
  it('reconoce los tres rechazos del codigo', () => {
    expect(isCodeRetryError('VMH.AUTH.CODE_INVALID')).toBe(true)
    expect(isCodeRetryError('VMH.AUTH.CODE_EXPIRED')).toBe(true)
    expect(isCodeRetryError('VMH.AUTH.CODE_LOCKED')).toBe(true)
  })

  it('no confunde otros rechazos con un problema del codigo', () => {
    expect(isCodeRetryError('VMH.AUTH.ACCOUNT_SUSPENDED')).toBe(false)
    expect(isCodeRetryError('VMH.SYS.VAL_INPUT')).toBe(false)
    expect(isCodeRetryError(null)).toBe(false)
  })
})

describe('resolveStepPosition', () => {
  it('numera los tres pasos en el orden del recorrido', () => {
    expect(resolveStepPosition('email')).toBe(1)
    expect(resolveStepPosition('code')).toBe(2)
    expect(resolveStepPosition('password')).toBe(3)
  })
})
