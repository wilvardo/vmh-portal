import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { LOGIN_ERROR_ACTION } from '../domain/login.enum'
import { useLoginForm } from './use-login-form'

const apiRejection = (status: number, code: string, title: string) => ({
  response: { status },
  data: { title, detail: `Detalle de ${code}`, key: 'clave', code }
})

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
  const revoke = vi.fn()

  beforeEach(() => {
    signIn.mockReset()
    onAuthenticated.mockReset()
    revoke.mockReset().mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('no llama al API cuando faltan campos', async () => {
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })

    await form.submit()

    expect(signIn).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.validation.login_error_required)
  })

  it('no llama al API cuando el correo no tiene forma de correo', async () => {
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'admin'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(signIn).not.toHaveBeenCalled()
    expect(form.errorTitle.value).toBe(messages.validation.login_error_email_format)
  })

  it('entra al portal con credenciales validas de un atleta', async () => {
    signIn.mockResolvedValue(buildSession())
    onAuthenticated.mockResolvedValue(undefined)
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = '  atleta@correo.mx  '
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(signIn).toHaveBeenCalledWith({ email: 'atleta@correo.mx', password: 'contrasena-larga' })
    expect(onAuthenticated).toHaveBeenCalledWith(buildSession())
    expect(form.errorTitle.value).toBe('')
  })

  it('no abre sesion para una cuenta cuyo rol no entra al portal', async () => {
    signIn.mockResolvedValue(buildSession(AUTH_ROLE.RECEPTIONIST))
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'recepcion@vmh.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledWith(buildSession(AUTH_ROLE.RECEPTIONIST))
    expect(form.errorTitle.value).toBe(messages.forbiddenTitle)
    expect(form.errorDetail.value).toBe(messages.forbiddenDetail)
  })

  it('el aviso de rol sin acceso no espera a que el servidor revoque', async () => {
    signIn.mockResolvedValue(buildSession(AUTH_ROLE.COACH))
    revoke.mockReturnValue(new Promise<void>(() => undefined))
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'coach@vmh.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.isSubmitting.value).toBe(false)
    expect(form.errorTitle.value).toBe(messages.forbiddenTitle)
  })

  it('a un atleta no le revoca nada', async () => {
    signIn.mockResolvedValue(buildSession())
    onAuthenticated.mockResolvedValue(undefined)
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(revoke).not.toHaveBeenCalled()
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
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.errorTitle.value).toBe('Credenciales invalidas')
    expect(form.errorDetail.value).toBe('Revisa el correo y la contraseña.')
  })

  it('cae a su propio mensaje cuando el fallo no trae contrato', async () => {
    signIn.mockRejectedValue(new Error('Failed to fetch'))
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.errorTitle.value).toBe(messages.unexpectedTitle)
    expect(form.errorDetail.value).toBe(messages.unexpectedDetail)
  })

  it('borra la contrasena capturada despues de cada intento', async () => {
    signIn.mockRejectedValue(new Error('sin red'))
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    await form.submit()

    expect(form.password.value).toBe('')
  })

  it('apaga el estado de envio pase lo que pase', async () => {
    signIn.mockRejectedValue(new Error('sin red'))
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
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
    const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
    form.email.value = 'atleta@correo.mx'
    form.password.value = 'contrasena-larga'

    const first = form.submit()
    await form.submit()
    resolveSignIn(buildSession())
    await first

    expect(signIn).toHaveBeenCalledTimes(1)
  })

  describe('salida junto al rechazo', () => {
    /** Arma el formulario con datos validos y lo envia contra el rechazo dado. */
    const submitAgainst = async (rejection: unknown) => {
      signIn.mockRejectedValue(rejection)
      const form = useLoginForm({ signIn, onAuthenticated, revoke, messages })
      form.email.value = 'atleta@correo.mx'
      form.password.value = 'contrasena-larga'
      await form.submit()
      return form
    }

    it('ofrece el primer acceso destacado cuando la cuenta no definio contrasena', async () => {
      const form = await submitAgainst(
        apiRejection(403, 'VMH.AUTH.PASSWORD_NOT_SET', 'Falta definir tu contraseña')
      )

      expect(form.errorTitle.value).toBe('Falta definir tu contraseña')
      expect(form.errorAction.value).toBe(LOGIN_ERROR_ACTION.FIRST_ACCESS)
    })

    it('sugiere el primer acceso ante credenciales invalidas sin cambiar el texto del API', async () => {
      const form = await submitAgainst(
        apiRejection(401, 'VMH.AUTH.INVALID_CREDENTIALS', 'Credenciales invalidas')
      )

      expect(form.errorTitle.value).toBe('Credenciales invalidas')
      expect(form.errorDetail.value).toBe('Detalle de VMH.AUTH.INVALID_CREDENTIALS')
      expect(form.errorAction.value).toBe(LOGIN_ERROR_ACTION.FIRST_ACCESS_HINT)
    })

    it('manda a la recuperacion cuando falta confirmar el correo', async () => {
      const form = await submitAgainst(
        apiRejection(403, 'VMH.AUTH.EMAIL_NOT_VERIFIED', 'Falta confirmar tu correo')
      )

      expect(form.errorAction.value).toBe(LOGIN_ERROR_ACTION.RECOVERY)
    })

    it('no ofrece salida ante una cuenta suspendida', async () => {
      const form = await submitAgainst(
        apiRejection(403, 'VMH.AUTH.ACCOUNT_SUSPENDED', 'Cuenta suspendida')
      )

      expect(form.errorAction.value).toBe(LOGIN_ERROR_ACTION.NONE)
    })

    it('retira la salida anterior al volver a intentar', async () => {
      const form = await submitAgainst(
        apiRejection(403, 'VMH.AUTH.PASSWORD_NOT_SET', 'Falta definir tu contraseña')
      )
      form.password.value = ''

      await form.submit()

      expect(form.errorAction.value).toBe(LOGIN_ERROR_ACTION.NONE)
    })
  })
})
