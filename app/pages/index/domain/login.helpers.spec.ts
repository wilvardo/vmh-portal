import { describe, expect, it } from 'vitest'
import { LOGIN_REASON } from '~/resources/scripts/domain/session.const'
import { resolveReasonMessageKey, validateLoginForm } from './login.helpers'

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
