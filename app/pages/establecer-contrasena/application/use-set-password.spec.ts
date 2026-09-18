import { describe, expect, it, vi } from 'vitest'
import { useSetPassword } from './use-set-password'

const TOKEN = 'c'.repeat(64)
const VALID_PASSWORD = 'contrasena-larga-de-verdad'

const messages = {
  tooShort: 'Usa al menos 12 caracteres.',
  mismatch: 'Las dos contraseñas no coinciden.',
  missingTokenTitle: 'Este enlace está incompleto',
  missingTokenDetail: 'Ábrelo desde el correo que te enviamos.',
  unexpectedTitle: 'No se pudo cambiar tu contraseña',
  unexpectedDetail: 'Vuelve a intentarlo en un momento.'
}

describe('useSetPassword', () => {
  it('fija la contrasena cuando las dos capturas coinciden', async () => {
    const submitPassword = vi.fn().mockResolvedValue({ message: 'Tu contraseña quedó lista.' })
    const form = useSetPassword({ token: TOKEN, submitPassword, messages })

    form.password.value = VALID_PASSWORD
    form.confirmation.value = VALID_PASSWORD
    await form.submit()

    expect(submitPassword).toHaveBeenCalledWith(TOKEN, VALID_PASSWORD)
    expect(form.isDone.value).toBe(true)
  })

  it('no gasta el enlace por un dedazo en la confirmacion', async () => {
    const submitPassword = vi.fn()
    const form = useSetPassword({ token: TOKEN, submitPassword, messages })

    form.password.value = VALID_PASSWORD
    form.confirmation.value = 'contrasena-larga-de-verdas'
    await form.submit()

    expect(submitPassword).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.mismatch)
  })

  it('no gasta el enlace con una contrasena mas corta que el minimo del API', async () => {
    const submitPassword = vi.fn()
    const form = useSetPassword({ token: TOKEN, submitPassword, messages })

    form.password.value = 'corta123'
    form.confirmation.value = 'corta123'
    await form.submit()

    expect(submitPassword).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.tooShort)
  })

  it('avisa cuando la direccion llego sin token', async () => {
    const submitPassword = vi.fn()
    const form = useSetPassword({ token: '', submitPassword, messages })

    form.password.value = VALID_PASSWORD
    form.confirmation.value = VALID_PASSWORD
    await form.submit()

    expect(submitPassword).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.missingTokenTitle)
  })

  it('muestra el texto del API cuando el enlace ya vencio', async () => {
    const submitPassword = vi.fn().mockRejectedValue({
      data: {
        title: 'Enlace vencido',
        detail: 'Este enlace ya venció. Solicita uno nuevo.',
        key: 'enlace-vencido',
        code: 'VMH.AUTH.TOKEN_EXPIRED'
      }
    })
    const form = useSetPassword({ token: TOKEN, submitPassword, messages })

    form.password.value = VALID_PASSWORD
    form.confirmation.value = VALID_PASSWORD
    await form.submit()

    expect(form.isDone.value).toBe(false)
    expect(form.errorTitle.value).toBe('Enlace vencido')
  })

  it('no deja las contrasenas en memoria despues del intento', async () => {
    const submitPassword = vi.fn().mockResolvedValue({ message: 'Lista.' })
    const form = useSetPassword({ token: TOKEN, submitPassword, messages })

    form.password.value = VALID_PASSWORD
    form.confirmation.value = VALID_PASSWORD
    await form.submit()

    expect(form.password.value).toBe('')
    expect(form.confirmation.value).toBe('')
  })
})
