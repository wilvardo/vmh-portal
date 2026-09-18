import { describe, expect, it, vi } from 'vitest'
import { usePasswordRecovery } from './use-password-recovery'

const messages = {
  invalidEmail: 'Revisa el formato del correo.',
  unexpectedTitle: 'No se pudo enviar el enlace',
  unexpectedDetail: 'Vuelve a intentarlo en un momento.'
}

describe('usePasswordRecovery', () => {
  it('pide el enlace y muestra el mensaje generico del API', async () => {
    const requestLink = vi.fn().mockResolvedValue({ message: 'Si ese correo tiene una cuenta…' })
    const form = usePasswordRecovery({ requestLink, messages })

    form.email.value = '  ana@correo.mx  '
    await form.submit()

    expect(requestLink).toHaveBeenCalledWith('ana@correo.mx')
    expect(form.sentMessage.value).toBe('Si ese correo tiene una cuenta…')
  })

  it('no gasta una peticion con un correo mal escrito', async () => {
    const requestLink = vi.fn()
    const form = usePasswordRecovery({ requestLink, messages })

    form.email.value = 'sin-arroba'
    await form.submit()

    expect(requestLink).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.invalidEmail)
  })

  it('no distingue entre un correo con cuenta y uno sin ella', async () => {
    const generic = { message: 'Si ese correo tiene una cuenta, le enviamos un enlace.' }
    const requestLink = vi.fn().mockResolvedValue(generic)
    const conCuenta = usePasswordRecovery({ requestLink, messages })
    const sinCuenta = usePasswordRecovery({ requestLink, messages })

    conCuenta.email.value = 'existe@correo.mx'
    sinCuenta.email.value = 'fantasma@correo.mx'
    await conCuenta.submit()
    await sinCuenta.submit()

    expect(conCuenta.sentMessage.value).toBe(sinCuenta.sentMessage.value)
  })

  it('cae al texto propio cuando el fallo no trae el contrato del API', async () => {
    const requestLink = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const form = usePasswordRecovery({ requestLink, messages })

    form.email.value = 'ana@correo.mx'
    await form.submit()

    expect(form.errorTitle.value).toBe(messages.unexpectedTitle)
  })
})
