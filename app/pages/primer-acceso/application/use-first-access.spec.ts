import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '~/resources/scripts/domain/auth-role.enum'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { RESEND_COOLDOWN_SECONDS } from '../domain/first-access.const'
import { FIRST_ACCESS_STEP } from '../domain/first-access.enum'
import { useFirstAccess } from './use-first-access'

const EMAIL = 'lucia@correo.mx'
const CODE = '123456'
const PASSWORD = 'contrasena-larga-de-verdad'
const ACK = { message: 'Si ese correo puede estrenar cuenta, te enviamos un código.' }

const buildSession = (role: string = AUTH_ROLE.ATHLETE): AuthSession =>
  ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 7, firstName: 'Lucia', lastName: 'Prueba', email: EMAIL, role }
  }) as AuthSession

const apiError = (code: string, title = 'Rechazo del API') => ({
  data: { title, detail: `Detalle de ${code}`, key: 'clave', code }
})

const messages = {
  invalidEmail: 'Revisa el formato del correo.',
  incompleteCode: 'Escribe los 6 dígitos del código.',
  passwordShort: 'Usa al menos 12 caracteres.',
  passwordMismatch: 'Las dos contraseñas no coinciden.',
  forbiddenTitle: 'Esta cuenta no es de un atleta',
  forbiddenDetail: 'Entra por el panel.',
  unexpectedTitle: 'No se pudo completar',
  unexpectedDetail: 'Vuelve a intentarlo.'
}

describe('useFirstAccess', () => {
  const requestCode = vi.fn()
  const complete = vi.fn()
  const onAuthenticated = vi.fn()
  const revoke = vi.fn()

  /** Arma el caso de uso con el correo inicial indicado. */
  const build = (initialEmail = '') =>
    useFirstAccess({ initialEmail, requestCode, complete, onAuthenticated, revoke, messages })

  /** Lleva el caso de uso hasta el paso de la contrasena. */
  const reachPasswordStep = async () => {
    requestCode.mockResolvedValue(ACK)
    const flow = build(EMAIL)
    await flow.sendCode()
    flow.code.value = CODE
    flow.confirmCode()
    return flow
  }

  beforeEach(() => {
    vi.useFakeTimers()
    requestCode.mockReset()
    complete.mockReset()
    onAuthenticated.mockReset()
    revoke.mockReset().mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('paso 1: correo', () => {
    it('arranca en el paso del correo con el correo que trae del acceso', () => {
      const flow = build('  lucia@correo.mx ')

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.EMAIL)
      expect(flow.email.value).toBe(EMAIL)
    })

    it('no gasta una peticion con un correo mal escrito', async () => {
      const flow = build('lucia')

      await flow.sendCode()

      expect(requestCode).not.toHaveBeenCalled()
      expect(flow.errorTitle.value).toBe(messages.invalidEmail)
      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.EMAIL)
    })

    it('pide el codigo, muestra el acuse del API y pasa al paso del codigo', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build()
      flow.email.value = `  ${EMAIL}  `

      await flow.sendCode()

      expect(requestCode).toHaveBeenCalledWith(EMAIL)
      expect(flow.sentMessage.value).toBe(ACK.message)
      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.CODE)
    })

    it('se queda en el correo y muestra el texto del API si lo rechaza por limite', async () => {
      requestCode.mockRejectedValue(apiError('VMH.AUTH.RATE_LIMITED', 'Demasiados intentos'))
      const flow = build(EMAIL)

      await flow.sendCode()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.EMAIL)
      expect(flow.errorTitle.value).toBe('Demasiados intentos')
      expect(flow.errorDetail.value).toBe('Detalle de VMH.AUTH.RATE_LIMITED')
    })

    it('cae a su propio mensaje cuando el fallo no trae contrato', async () => {
      requestCode.mockRejectedValue(new Error('sin red'))
      const flow = build(EMAIL)

      await flow.sendCode()

      expect(flow.errorTitle.value).toBe(messages.unexpectedTitle)
      expect(flow.isSubmitting.value).toBe(false)
    })
  })

  describe('paso 2: codigo', () => {
    it('limpia lo pegado y deja solo seis digitos', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()

      flow.code.value = '123 4567'

      expect(flow.code.value).toBe(CODE)
    })

    it('no avanza con un codigo incompleto', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()
      flow.code.value = '123'

      flow.confirmCode()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.CODE)
      expect(flow.errorTitle.value).toBe(messages.incompleteCode)
    })

    it('pasa a la contrasena con el codigo completo sin llamar al API', async () => {
      const flow = await reachPasswordStep()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.PASSWORD)
      expect(complete).not.toHaveBeenCalled()
    })

    it('permite volver a corregir el correo', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()

      flow.changeEmail()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.EMAIL)
      expect(flow.sentMessage.value).toBe('')
    })
  })

  describe('reenvio', () => {
    it('no deja pedir otro codigo antes de 60 segundos', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()

      expect(flow.canResend.value).toBe(false)
      expect(flow.resendSecondsLeft.value).toBe(RESEND_COOLDOWN_SECONDS)

      await flow.resendCode()

      expect(requestCode).toHaveBeenCalledTimes(1)
    })

    it('descuenta la espera segundo a segundo', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()

      vi.advanceTimersByTime(10_000)

      expect(flow.resendSecondsLeft.value).toBe(RESEND_COOLDOWN_SECONDS - 10)
    })

    it('ofrece otro codigo al cumplirse la espera y la reinicia al pedirlo', async () => {
      requestCode.mockResolvedValue(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()
      flow.code.value = '111'

      vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000)
      expect(flow.canResend.value).toBe(true)

      await flow.resendCode()

      expect(requestCode).toHaveBeenCalledTimes(2)
      expect(requestCode).toHaveBeenLastCalledWith(EMAIL)
      expect(flow.code.value).toBe('')
      expect(flow.resendSecondsLeft.value).toBe(RESEND_COOLDOWN_SECONDS)
    })

    it('muestra el texto del API si el reenvio falla', async () => {
      requestCode.mockResolvedValueOnce(ACK)
      const flow = build(EMAIL)
      await flow.sendCode()
      vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000)
      requestCode.mockRejectedValueOnce(apiError('VMH.AUTH.RATE_LIMITED', 'Demasiados intentos'))

      await flow.resendCode()

      expect(flow.errorTitle.value).toBe('Demasiados intentos')
      expect(flow.isResending.value).toBe(false)
    })
  })

  describe('paso 3: contrasena', () => {
    it('no llama al API con una contrasena corta', async () => {
      const flow = await reachPasswordStep()
      flow.password.value = 'corta'
      flow.confirmation.value = 'corta'

      await flow.submitPassword()

      expect(complete).not.toHaveBeenCalled()
      expect(flow.errorTitle.value).toBe(messages.passwordShort)
    })

    it('no llama al API cuando las dos capturas no coinciden', async () => {
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = `${PASSWORD}x`

      await flow.submitPassword()

      expect(complete).not.toHaveBeenCalled()
      expect(flow.errorTitle.value).toBe(messages.passwordMismatch)
    })

    it('canjea el codigo y abre sesion con la sesion emitida', async () => {
      complete.mockResolvedValue(buildSession())
      onAuthenticated.mockResolvedValue(undefined)
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      await flow.submitPassword()

      expect(complete).toHaveBeenCalledWith({ email: EMAIL, code: CODE, password: PASSWORD })
      expect(onAuthenticated).toHaveBeenCalledWith(buildSession())
      expect(flow.errorTitle.value).toBe('')
    })

    it('no abre sesion para una cuenta cuyo rol no entra al portal', async () => {
      complete.mockResolvedValue(buildSession(AUTH_ROLE.RECEPTIONIST))
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      await flow.submitPassword()

      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(revoke).toHaveBeenCalledWith(buildSession(AUTH_ROLE.RECEPTIONIST))
      expect(flow.errorTitle.value).toBe(messages.forbiddenTitle)
    })

    it.each(['VMH.AUTH.CODE_INVALID', 'VMH.AUTH.CODE_EXPIRED', 'VMH.AUTH.CODE_LOCKED'])(
      'regresa al paso del codigo ante %s con el texto del API',
      async (errorCode) => {
        complete.mockRejectedValue(apiError(errorCode, 'Código rechazado'))
        const flow = await reachPasswordStep()
        flow.password.value = PASSWORD
        flow.confirmation.value = PASSWORD

        await flow.submitPassword()

        expect(flow.step.value).toBe(FIRST_ACCESS_STEP.CODE)
        expect(flow.code.value).toBe('')
        expect(flow.errorTitle.value).toBe('Código rechazado')
        expect(flow.errorDetail.value).toBe(`Detalle de ${errorCode}`)
      }
    )

    it('se queda en la contrasena ante una cuenta suspendida', async () => {
      complete.mockRejectedValue(apiError('VMH.AUTH.ACCOUNT_SUSPENDED', 'Cuenta suspendida'))
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      await flow.submitPassword()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.PASSWORD)
      expect(flow.errorTitle.value).toBe('Cuenta suspendida')
    })

    it('se queda en la contrasena ante un rechazo de validacion', async () => {
      complete.mockRejectedValue(apiError('VMH.SYS.VAL_INPUT', 'Revisa los datos'))
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      await flow.submitPassword()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.PASSWORD)
      expect(flow.errorTitle.value).toBe('Revisa los datos')
    })

    it('no deja las contrasenas en memoria despues del intento', async () => {
      complete.mockRejectedValue(new Error('sin red'))
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      await flow.submitPassword()

      expect(flow.password.value).toBe('')
      expect(flow.confirmation.value).toBe('')
      expect(flow.errorTitle.value).toBe(messages.unexpectedTitle)
    })

    it('ignora un segundo envio mientras hay uno en curso', async () => {
      let resolveComplete: (session: AuthSession) => void = () => undefined
      complete.mockReturnValue(
        new Promise<AuthSession>((resolve) => {
          resolveComplete = resolve
        })
      )
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD
      flow.confirmation.value = PASSWORD

      const first = flow.submitPassword()
      await flow.submitPassword()
      resolveComplete(buildSession())
      await first

      expect(complete).toHaveBeenCalledTimes(1)
    })

    it('permite volver al codigo sin conservar la contrasena', async () => {
      const flow = await reachPasswordStep()
      flow.password.value = PASSWORD

      flow.backToCode()

      expect(flow.step.value).toBe(FIRST_ACCESS_STEP.CODE)
      expect(flow.password.value).toBe('')
    })
  })
})
