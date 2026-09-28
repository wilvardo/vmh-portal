import { describe, expect, it } from 'vitest'
import { LOGIN_REASON } from '~/resources/scripts/domain/session.const'
import { LOGIN_ERROR_ACTION } from './login.enum'
import {
  resolveLoginErrorAction,
  resolveReasonMessageKey,
  validateLoginForm
} from './login.helpers'

describe('validateLoginForm', () => {
  it('acepta un correo con formato y una contrasena de largo suficiente', () => {
    expect(validateLoginForm('admin@vmh.mx', 'contrasena-larga')).toEqual({
      isValid: true,
      messageKey: ''
    })
  })

  it('exige ambos campos', () => {
    expect(validateLoginForm('', 'contrasena-larga').messageKey).toBe('login_error_required')
    expect(validateLoginForm('admin@vmh.mx', '').messageKey).toBe('login_error_required')
  })

  it('trata un correo de solo espacios como vacio', () => {
    expect(validateLoginForm('   ', 'contrasena-larga').messageKey).toBe('login_error_required')
  })

  it('rechaza un correo sin forma de correo', () => {
    expect(validateLoginForm('admin', 'contrasena-larga').messageKey).toBe(
      'login_error_email_format'
    )
    expect(validateLoginForm('admin@vmh', 'contrasena-larga').messageKey).toBe(
      'login_error_email_format'
    )
  })

  it('rechaza una contrasena mas corta que el minimo', () => {
    expect(validateLoginForm('admin@vmh.mx', 'corta').messageKey).toBe('login_error_password_short')
  })
})

describe('resolveReasonMessageKey', () => {
  it('explica la sesion expirada', () => {
    expect(resolveReasonMessageKey(LOGIN_REASON.EXPIRED)).toBe('login_notice_expired')
  })

  it('explica la cuenta sin acceso al panel', () => {
    expect(resolveReasonMessageKey(LOGIN_REASON.FORBIDDEN)).toBe('login_notice_forbidden')
  })

  it('no inventa aviso cuando no hay motivo', () => {
    expect(resolveReasonMessageKey(null)).toBe('')
    expect(resolveReasonMessageKey('cualquier-otra-cosa')).toBe('')
  })
})

describe('resolveLoginErrorAction', () => {
  it('ofrece el primer acceso destacado a la cuenta sin contrasena definida', () => {
    expect(resolveLoginErrorAction('VMH.AUTH.PASSWORD_NOT_SET')).toBe(
      LOGIN_ERROR_ACTION.FIRST_ACCESS
    )
  })

  it('sugiere el primer acceso en segundo plano ante credenciales invalidas', () => {
    expect(resolveLoginErrorAction('VMH.AUTH.INVALID_CREDENTIALS')).toBe(
      LOGIN_ERROR_ACTION.FIRST_ACCESS_HINT
    )
  })

  it('manda a la recuperacion a quien no confirmo su correo', () => {
    expect(resolveLoginErrorAction('VMH.AUTH.EMAIL_NOT_VERIFIED')).toBe(LOGIN_ERROR_ACTION.RECOVERY)
  })

  it('no ofrece salida para cualquier otro rechazo o un fallo sin contrato', () => {
    expect(resolveLoginErrorAction('VMH.AUTH.ACCOUNT_SUSPENDED')).toBe(LOGIN_ERROR_ACTION.NONE)
    expect(resolveLoginErrorAction('VMH.AUTH.RATE_LIMITED')).toBe(LOGIN_ERROR_ACTION.NONE)
    expect(resolveLoginErrorAction(null)).toBe(LOGIN_ERROR_ACTION.NONE)
  })
})
