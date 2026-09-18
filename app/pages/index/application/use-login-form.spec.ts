import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { useLoginForm } from './use-login-form'

const buildSession = (role: string = AUTH_ROLE.ATHLETE): AuthSession =>
  ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 1,
      firstName: 'Victoria',
      lastName: 'Mendoza',
      email: 'atleta@correo.mx',
      role
    }
  }) as AuthSession

const messages = {
  validation: {
    login_error_required: 'Escribe tu correo y tu contraseña.',
    login_error_email_format: 'Revisa el formato del correo.',
    login_error_password_short: 'La contraseña es más corta de lo permitido.'
  },
  forbiddenTitle: 'Esta cuenta no entra al portal',
  forbiddenDetail: 'Solo el personal de administración tiene acceso.',
  unexpectedTitle: 'No se pudo iniciar sesión',
  unexpectedDetail: 'Vuelve a intentarlo en un momento.'
}

describe('useLoginForm', () => {
  const signIn = vi.fn()
  const onAuthenticated = vi.fn()

  beforeEach(() => {
    signIn.mockReset()
    onAuthenticated.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no llama al API cuando faltan campos', async () => {
    const form = useLoginForm({ signIn, onAuthenticated, messages })

    await form.submit()

    expect(signIn).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.validation.login_error_required)
  })

  it('no llama al API cuando el correo no tiene forma de correo', async () => {
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'admin'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(signIn).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.validation.login_error_email_format)
  })

  it('entra al portal con credenciales validas de un atleta', async () => {
    signIn.mockResolvedValue(buildSession())
    onAuthenticated.mockResolvedValue(undefined)
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = '  atleta@correo.mx  '
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(signIn).toHaveBeenCalledWith({ email: 'atleta@correo.mx', password: 'contrasena-larga' })
    expect(onAuthenticated).toHaveBeenCalledWith(buildSession())
    expect(form.errorTitle.value).toBe('')
  })

  it('no abre sesion para una cuenta cuyo rol no entra al portal', async () => {
    signIn.mockResolvedValue(buildSession(AUTH_ROLE.RECEPTIONIST))
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'recepcion@vmh.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.forbiddenTitle)
    expect(form.errorDetail.value).toBe(messages.forbiddenDetail)
  })

  it('muestra el error del API tal como lo manda', async () => {
    signIn.mockRejectedValue({
      response: { status: 401 },
      data: {
        title: 'Credenciales invalidas',
        detail: 'Revisa el correo y la contraseña.',
        key: 'credenciales-invalidas',
        code: 'VMH.AUTH.INVALID_CREDENTIALS'
      }
    })
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.errorTitle.value).toBe('Credenciales invalidas')
    expect(form.errorDetail.value).toBe('Revisa el correo y la contraseña.')
  })

  it('cae a su propio mensaje cuando el fallo no trae contrato', async () => {
    signIn.mockRejectedValue(new Error('Failed to fetch'))
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.errorTitle.value).toBe(messages.unexpectedTitle)
    expect(form.errorDetail.value).toBe(messages.unexpectedDetail)
  })

  it('borra la contrasena capturada despues de cada intento', async () => {
    signIn.mockRejectedValue(new Error('sin red'))
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.password.value).toBe('')
  })

  it('apaga el estado de envio pase lo que pase', async () => {
    signIn.mockRejectedValue(new Error('sin red'))
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.isSubmitting.value).toBe(false)
  })

  it('ignora un segundo envio mientras hay uno en curso', async () => {
    let resolveSignIn: (session: AuthSession) => void = () => undefined
    signIn.mockReturnValue(
      new Promise<AuthSession>((resolve) => {
        resolveSignIn = resolve
      })
    )
    const form = useLoginForm({ signIn, onAuthenticated, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    const first = form.submit()
    await form.submit()
    resolveSignIn(buildSession())
    await first

    expect(signIn).toHaveBeenCalledTimes(1)
  })
})
