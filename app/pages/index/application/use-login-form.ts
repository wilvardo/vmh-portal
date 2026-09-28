import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { canAccessPortal } from '~/resources/scripts/domain/session.helpers'
import type { AuthSession } from '~/resources/scripts/domain/session.interface'
import { resolveLoginErrorAction, validateLoginForm } from '../domain/login.helpers'
import { LOGIN_ERROR_ACTION, type LoginErrorAction } from '../domain/login.enum'

interface LoginFormMessages {
  /** Mensajes de validacion local, indexados por la clave que devuelve el dominio. */
  validation: Record<string, string>
  /** Encabezado cuando la cuenta es valida pero su rol no entra al portal. */
  forbiddenTitle: string
  /** Cuerpo del aviso de rol sin acceso. */
  forbiddenDetail: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseLoginFormParams {
  /** Peticion de acceso al API, ya cableada a su URL base. */
  signIn: (params: { email: string; password: string }) => Promise<AuthSession>
  /** Que hacer con la sesion emitida (guardarla y entrar al panel). */
  onAuthenticated: (session: AuthSession) => Promise<void>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: LoginFormMessages
}

interface UseLoginFormReturn {
  /** Correo capturado. */
  email: Ref<string>
  /** Contrasena capturada. */
  password: Ref<string>
  /** Indica si hay una peticion de acceso en curso. */
  isSubmitting: Ref<boolean>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error visible, o cadena vacia. */
  errorDetail: Ref<string>
  /**
   * Salida que se ofrece junto al rechazo (primer acceso destacado, primer
   * acceso como sugerencia o recuperacion). La pantalla la pinta ahi mismo para
   * no dejar a la persona buscando por donde seguir.
   */
  errorAction: Ref<LoginErrorAction>
  /** Intenta iniciar sesion con lo capturado. */
  submit: () => Promise<void>
}

/**
 * Caso de uso del acceso al portal.
 *
 * Recibe la peticion, el destino y los textos ya resueltos: no invoca i18n, ni
 * el cliente HTTP, ni el enrutador. Eso lo arma el orquestador del slice.
 *
 * Dos reglas que sostiene y que no deben relajarse:
 * 1. Una cuenta valida sin rol de portal NO abre sesion: el par de credenciales
 *    se descarta y se explica por que. Guardarla "para luego" dejaria una
 *    sesion sin acceso viva en el navegador.
 * 2. El error de credenciales se muestra tal como lo manda el API, sin
 *    reinterpretarlo: el servidor responde igual exista o no el correo, y
 *    cualquier matiz que agregue la interfaz rompe esa defensa. La sugerencia
 *    de primer acceso que lo acompana no afirma nada sobre la cuenta.
 *
 * @param params Peticion, destino y textos del formulario.
 * @returns El estado del formulario y la accion de envio.
 */
export const useLoginForm = (params: UseLoginFormParams): UseLoginFormReturn => {
  const email = ref('')
  const password = ref('')
  const isSubmitting = ref(false)
  const errorTitle = ref('')
  const errorDetail = ref('')
  const errorAction = ref<LoginErrorAction>(LOGIN_ERROR_ACTION.NONE)

  /** Deja visible un error de una sola linea (validacion local). */
  const showValidationError = (messageKey: string): void => {
    errorTitle.value = params.messages.validation[messageKey] ?? params.messages.unexpectedTitle
    errorDetail.value = ''
  }

  const submit = async (): Promise<void> => {
    if (isSubmitting.value) return

    errorTitle.value = ''
    errorDetail.value = ''
    errorAction.value = LOGIN_ERROR_ACTION.NONE

    const validation = validateLoginForm(email.value, password.value)
    if (!validation.isValid) {
      showValidationError(validation.messageKey)
      return
    }

    isSubmitting.value = true

    try {
      const session = await params.signIn({
        email: email.value.trim(),
        password: password.value
      })

      if (!canAccessPortal(session.user.role)) {
        errorTitle.value = params.messages.forbiddenTitle
        errorDetail.value = params.messages.forbiddenDetail
        return
      }

      await params.onAuthenticated(session)
    } catch (error: unknown) {
      console.error('useLoginForm: error al iniciar sesion', error)
      const apiError = extractApiError(error)
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
      errorAction.value = resolveLoginErrorAction(apiError?.code ?? null)
    } finally {
      isSubmitting.value = false
      // La contrasena no se queda en memoria despues del intento.
      password.value = ''
    }
  }

  return { email, password, isSubmitting, errorTitle, errorDetail, errorAction, submit }
}
