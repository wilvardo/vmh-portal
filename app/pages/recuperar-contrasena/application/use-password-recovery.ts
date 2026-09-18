import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { EMAIL_PATTERN } from '~/resources/scripts/domain/api-error.const'

interface RecoveryMessages {
  /** Mensaje cuando el correo capturado no tiene forma de correo. */
  invalidEmail: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UsePasswordRecoveryParams {
  /** Peticion al API, ya cableada a su URL base. */
  requestLink: (email: string) => Promise<{ message: string }>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: RecoveryMessages
}

interface UsePasswordRecoveryReturn {
  /** Correo capturado. */
  email: Ref<string>
  /** Indica si hay una peticion en curso. */
  isSubmitting: Ref<boolean>
  /** Mensaje generico del API cuando la peticion se atendio. */
  sentMessage: Ref<string>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error visible, o cadena vacia. */
  errorDetail: Ref<string>
  /** Pide el enlace para el correo capturado. */
  submit: () => Promise<void>
}

/**
 * Caso de uso de la solicitud de restablecimiento.
 *
 * El API responde lo mismo exista o no la cuenta, y esta pantalla respeta esa
 * ambiguedad: muestra el mensaje tal como llega y NO cambia de tono segun el
 * resultado. Un "te enviamos el enlace" contra un "ese correo no existe" seria
 * la enumeracion que el endpoint se cuida de evitar, reintroducida por la
 * interfaz.
 *
 * @param params Peticion y textos.
 * @returns El estado del formulario y la accion de envio.
 */
export const usePasswordRecovery = (
  params: UsePasswordRecoveryParams
): UsePasswordRecoveryReturn => {
  const email = ref('')
  const isSubmitting = ref(false)
  const sentMessage = ref('')
  const errorTitle = ref('')
  const errorDetail = ref('')

  const submit = async (): Promise<void> => {
    if (isSubmitting.value) return

    errorTitle.value = ''
    errorDetail.value = ''
    sentMessage.value = ''

    if (!EMAIL_PATTERN.test(email.value.trim())) {
      errorTitle.value = params.messages.invalidEmail
      return
    }

    isSubmitting.value = true

    try {
      const result = await params.requestLink(email.value.trim())
      sentMessage.value = result.message
    } catch (error: unknown) {
      console.error('usePasswordRecovery: no se pudo pedir el enlace', error)
      const apiError = extractApiError(error)
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
    } finally {
      isSubmitting.value = false
    }
  }

  return { email, isSubmitting, sentMessage, errorTitle, errorDetail, submit }
}
