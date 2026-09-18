import { describe, expect, it, vi } from 'vitest'
import { useEmailVerification } from './use-email-verification'

const messages = {
  unexpectedTitle: 'No se pudo confirmar tu correo',
  unexpectedDetail: 'Vuelve a intentarlo en un momento.'
}

/** Rechazo del API con el contrato completo de error. */
const apiRejection = (code: string, title: string, detail: string): unknown => ({
  data: { title, detail, key: 'x', code }
})

describe('useEmailVerification', () => {
  it('confirma el correo cuando el enlace trae un token valido', async () => {
    const confirm = vi.fn().mockResolvedValue({ message: 'Tu correo quedó confirmado.' })
    const view = useEmailVerification({ token: 'a'.repeat(64), confirm, resend: vi.fn(), messages })

    await view.confirm()

    expect(view.status.value).toBe('confirmed')
    expect(view.successMessage.value).toBe('Tu correo quedó confirmado.')
  })

  it('no gasta una peticion cuando la direccion no trae token', async () => {
    const confirm = vi.fn()
    const view = useEmailVerification({ token: '', confirm, resend: vi.fn(), messages })

    await view.confirm()

    expect(confirm).not.toHaveBeenCalled()
    expect(view.status.value).toBe('idle')
  })

  it('muestra el texto del API en los tres desenlaces de un enlace roto', async () => {
    const casos = [
      ['VMH.AUTH.TOKEN_EXPIRED', 'Enlace vencido', 'Este enlace ya venció.'],
      ['VMH.AUTH.TOKEN_ALREADY_USED', 'Enlace ya utilizado', 'Este enlace ya se usó.'],
      ['VMH.AUTH.TOKEN_INVALID', 'Enlace no válido', 'Este enlace no es válido.']
    ]

    for (const [code, title, detail] of casos) {
      const confirm = vi.fn().mockRejectedValue(apiRejection(code!, title!, detail!))
      const view = useEmailVerification({
        token: 'a'.repeat(64),
        confirm,
        resend: vi.fn(),
        messages
      })

      await view.confirm()

      expect(view.status.value).toBe('failed')
      expect(view.errorTitle.value).toBe(title)
      expect(view.errorDetail.value).toBe(detail)
    }
  })

  it('cae al texto propio cuando el fallo no trae el contrato del API', async () => {
    const confirm = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const view = useEmailVerification({ token: 'a'.repeat(64), confirm, resend: vi.fn(), messages })

    await view.confirm()

    expect(view.errorTitle.value).toBe(messages.unexpectedTitle)
  })

  it('reenvia el enlace al correo capturado y muestra el mensaje generico', async () => {
    const resend = vi.fn().mockResolvedValue({ message: 'Si ese correo tiene cuenta…' })
    const view = useEmailVerification({ token: '', confirm: vi.fn(), resend, messages })

    view.email.value = '  ana@correo.mx  '
    await view.resend()

    expect(resend).toHaveBeenCalledWith('ana@correo.mx')
    expect(view.resendMessage.value).toBe('Si ese correo tiene cuenta…')
  })

  it('no reenvia sin correo capturado', async () => {
    const resend = vi.fn()
    const view = useEmailVerification({ token: '', confirm: vi.fn(), resend, messages })

    await view.resend()

    expect(resend).not.toHaveBeenCalled()
  })
})
