import type { Acknowledgement } from '~/resources/scripts/domain/acknowledgement.interface'
import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { canAccessPortal } from '~/resources/scripts/domain/session.helpers'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { COOLDOWN_TICK_MS, RESEND_COOLDOWN_SECONDS } from '../domain/first-access.const'
import { FIRST_ACCESS_STEP, type FirstAccessStep } from '../domain/first-access.enum'
import {
  isCodeComplete,
  isCodeRetryError,
  isEmailWellFormed,
  sanitizeCode,
  validateNewPassword
} from '../domain/first-access.helpers'

interface FirstAccessMessages {
  /** Mensaje cuando el correo no tiene forma de correo. */
  invalidEmail: string
  /** Mensaje cuando el codigo no tiene los seis digitos. */
  incompleteCode: string
  /** Mensaje cuando la contrasena es mas corta que el minimo. */
  passwordShort: string
  /** Mensaje cuando las dos capturas de la contrasena no coinciden. */
  passwordMismatch: string
  /** Encabezado cuando la cuenta es valida pero su rol no entra al portal. */
  forbiddenTitle: string
  /** Cuerpo del aviso de rol sin acceso. */
  forbiddenDetail: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface CompleteParams {
  email: string
  code: string
  password: string
}

interface UseFirstAccessParams {
  /** Correo con el que llega la persona (desde el acceso), o cadena vacia. */
  initialEmail: string
  /** Peticion del codigo, ya cableada a su URL base. */
  requestCode: (email: string) => Promise<Acknowledgement>
  /** Canje del codigo con la contrasena nueva, ya cableado a su URL base. */
  complete: (params: CompleteParams) => Promise<AuthSession>
  /** Que hacer con la sesion emitida (guardarla y entrar al tablero). */
  onAuthenticated: (session: AuthSession) => Promise<void>
  /** Revoca en el servidor una sesion que no se va a guardar. No falla. */
  revoke: (session: AuthSession) => Promise<void>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: FirstAccessMessages
}

interface UseFirstAccessReturn {
  /** Paso vigente. */
  step: Ref<FirstAccessStep>
  /** Correo capturado. */
  email: Ref<string>
  /** Codigo capturado, siempre limpio (solo digitos). */
  code: WritableComputedRef<string>
  /** Contrasena nueva. */
  password: Ref<string>
  /** Segunda captura de la contrasena. */
  confirmation: Ref<string>
  /** Indica si hay una peticion principal en curso. */
  isSubmitting: Ref<boolean>
  /** Indica si hay un reenvio de codigo en curso. */
  isResending: Ref<boolean>
  /** Mensaje generico del API tras pedir el codigo. */
  sentMessage: Ref<string>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error visible, o cadena vacia. */
  errorDetail: Ref<string>
  /** Segundos que faltan para poder pedir otro codigo. */
  resendSecondsLeft: Ref<number>
  /** Indica si ya se puede pedir otro codigo. */
  canResend: ComputedRef<boolean>
  /** Paso 1: pide el codigo para el correo capturado. */
  sendCode: () => Promise<void>
  /** Pide otro codigo al mismo correo, respetando la espera. */
  resendCode: () => Promise<void>
  /** Paso 2: acepta el codigo capturado y pasa a elegir contrasena. */
  confirmCode: () => void
  /** Paso 3: canjea el codigo con la contrasena nueva y abre sesion. */
  submitPassword: () => Promise<void>
  /** Vuelve al paso del correo para corregirlo. */
  changeEmail: () => void
  /** Vuelve al paso del codigo desde el de la contrasena. */
  backToCode: () => void
}

/**
 * Caso de uso del primer acceso: correo, codigo de 6 digitos y contrasena.
 *
 * Tres reglas que sostiene:
 * 1. El codigo lo verifica el API hasta el ultimo paso, junto con la contrasena.
 *    Por eso un rechazo del codigo (incorrecto, vencido o bloqueado) regresa a
 *    la persona al paso del codigo con el texto del API, y no la deja atorada
 *    frente a un formulario de contrasena que nunca va a pasar.
 * 2. La respuesta al pedir codigo es la misma exista o no la cuenta, y la
 *    pantalla la muestra tal cual: no cambia de tono segun el resultado.
 * 3. La sesion emitida pasa por la misma regla de rol que el login: una cuenta
 *    de personal que estrene contrasena aqui no abre sesion en el portal.
 *
 * La espera del reenvio usa un temporizador del navegador; se libera sola al
 * desmontar la pantalla.
 *
 * @param params Peticiones, destino y textos.
 * @returns El estado de los tres pasos y sus acciones.
 */
export const useFirstAccess = (params: UseFirstAccessParams): UseFirstAccessReturn => {
  const step = ref<FirstAccessStep>(FIRST_ACCESS_STEP.EMAIL)
  const email = ref(params.initialEmail.trim())
  const rawCode = ref('')
  const password = ref('')
  const confirmation = ref('')
  const isSubmitting = ref(false)
  const isResending = ref(false)
  const sentMessage = ref('')
  const errorTitle = ref('')
  const errorDetail = ref('')
  const resendSecondsLeft = ref(0)

  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  // El campo se limpia al escribir: pegar "123 456" desde el correo es lo normal.
  const code = computed<string>({
    get: () => rawCode.value,
    set: (value) => {
      rawCode.value = sanitizeCode(value)
    }
  })

  const canResend = computed<boolean>(() => resendSecondsLeft.value === 0 && !isResending.value)

  /** Limpia el error visible. */
  const clearError = (): void => {
    errorTitle.value = ''
    errorDetail.value = ''
  }

  /** Muestra el error del API, o el propio si el fallo no trae contrato. */
  const showApiError = (error: unknown): string | null => {
    const apiError = extractApiError(error)
    errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
    errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
    return apiError?.code ?? null
  }

  /** Detiene la cuenta regresiva del reenvio. */
  const stopCooldown = (): void => {
    if (cooldownTimer !== null) clearInterval(cooldownTimer)
    cooldownTimer = null
  }

  /** Arranca la espera antes de ofrecer otro codigo. */
  const startCooldown = (): void => {
    stopCooldown()
    resendSecondsLeft.value = RESEND_COOLDOWN_SECONDS
    cooldownTimer = setInterval(() => {
      resendSecondsLeft.value = Math.max(0, resendSecondsLeft.value - 1)
      if (resendSecondsLeft.value === 0) stopCooldown()
    }, COOLDOWN_TICK_MS)
  }

  if (getCurrentScope()) onScopeDispose(stopCooldown)

  const sendCode = async (): Promise<void> => {
    if (isSubmitting.value) return

    clearError()
    sentMessage.value = ''

    if (!isEmailWellFormed(email.value)) {
      errorTitle.value = params.messages.invalidEmail
      return
    }

    isSubmitting.value = true

    try {
      const result = await params.requestCode(email.value.trim())
      email.value = email.value.trim()
      sentMessage.value = result.message
      rawCode.value = ''
      step.value = FIRST_ACCESS_STEP.CODE
      startCooldown()
    } catch (error: unknown) {
      console.error('useFirstAccess: no se pudo pedir el codigo', error)
      showApiError(error)
    } finally {
      isSubmitting.value = false
    }
  }

  const resendCode = async (): Promise<void> => {
    if (!canResend.value) return

    clearError()
    isResending.value = true

    try {
      const result = await params.requestCode(email.value)
      sentMessage.value = result.message
      rawCode.value = ''
      step.value = FIRST_ACCESS_STEP.CODE
      startCooldown()
    } catch (error: unknown) {
      console.error('useFirstAccess: no se pudo reenviar el codigo', error)
      showApiError(error)
    } finally {
      isResending.value = false
    }
  }

  const confirmCode = (): void => {
    clearError()

    if (!isCodeComplete(rawCode.value)) {
      errorTitle.value = params.messages.incompleteCode
      return
    }

    step.value = FIRST_ACCESS_STEP.PASSWORD
  }

  const submitPassword = async (): Promise<void> => {
    if (isSubmitting.value) return

    clearError()

    const verdict = validateNewPassword(password.value, confirmation.value)
    if (verdict !== '') {
      errorTitle.value =
        verdict === 'password_short'
          ? params.messages.passwordShort
          : params.messages.passwordMismatch
      return
    }

    isSubmitting.value = true

    try {
      const session = await params.complete({
        email: email.value,
        code: rawCode.value,
        password: password.value
      })

      if (!canAccessPortal(session.user.role)) {
        // Sin guardarla y sin esperar: la cuenta del estudio no queda con una
        // sesion viva en el servidor, y el aviso no depende de su respuesta.
        void params.revoke(session)
        errorTitle.value = params.messages.forbiddenTitle
        errorDetail.value = params.messages.forbiddenDetail
        return
      }

      stopCooldown()
      await params.onAuthenticated(session)
    } catch (error: unknown) {
      console.error('useFirstAccess: no se pudo estrenar la cuenta', error)
      const errorCode = showApiError(error)
      if (isCodeRetryError(errorCode)) {
        rawCode.value = ''
        step.value = FIRST_ACCESS_STEP.CODE
      }
    } finally {
      isSubmitting.value = false
      // La contrasena no se queda en memoria despues del intento.
      password.value = ''
      confirmation.value = ''
    }
  }

  const changeEmail = (): void => {
    clearError()
    sentMessage.value = ''
    rawCode.value = ''
    step.value = FIRST_ACCESS_STEP.EMAIL
  }

  const backToCode = (): void => {
    clearError()
    password.value = ''
    confirmation.value = ''
    step.value = FIRST_ACCESS_STEP.CODE
  }

  return {
    step,
    email,
    code,
    password,
    confirmation,
    isSubmitting,
    isResending,
    sentMessage,
    errorTitle,
    errorDetail,
    resendSecondsLeft,
    canResend,
    sendCode,
    resendCode,
    confirmCode,
    submitPassword,
    changeEmail,
    backToCode
  }
}
