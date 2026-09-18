import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'

/** En que punto del flujo esta la pantalla. */
export type VerificationStatus = 'idle' | 'checking' | 'confirmed' | 'failed'

interface VerificationMessages {
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseEmailVerificationParams {
  /** Token que llego en la direccion, o cadena vacia si no venia. */
  token: string
  /** Consume el enlace contra el API. */
  confirm: (token: string) => Promise<{ message: string }>
  /** Pide un enlace nuevo. */
  resend: (email: string) => Promise<{ message: string }>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: VerificationMessages
}

interface UseEmailVerificationReturn {
  /** Punto del flujo en el que esta la pantalla. */
  status: Ref<VerificationStatus>
  /** Mensaje de exito que devolvio el API. */
  successMessage: Ref<string>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error visible, o cadena vacia. */
  errorDetail: Ref<string>
  /** Correo capturado para el reenvio. */
  email: Ref<string>
  /** Indica si hay un reenvio en curso. */
  isResending: Ref<boolean>
  /** Mensaje generico del reenvio, o cadena vacia. */
  resendMessage: Ref<string>
  /** Consume el enlace. Sin token no hace nada. */
  confirm: () => Promise<void>
  /** Pide un enlace nuevo al correo capturado. */
  resend: () => Promise<void>
}

/**
 * Caso de uso de la confirmacion de correo.
 *
 * Cubre los dos caminos que llegan a esta pantalla: quien abre el enlace del
 * correo (trae token y se confirma sola) y quien llega a pedir otro enlace
 * porque el suyo vencio o nunca le llego (sin token, con el formulario de
 * reenvio). Son la misma pantalla porque para la persona son el mismo asunto:
 * "el correo de confirmacion".
 *
 * Los tres desenlaces de un enlace roto -inexistente, vencido y ya usado- se
 * muestran con el texto que manda el API y todos ofrecen el reenvio. La
 * pantalla no interpreta el codigo: el API ya redacto el mensaje y traducirlo
 * aqui seria escribirlo dos veces.
 *
 * @param params Token, peticiones y textos.
 * @returns El estado de la pantalla y sus dos acciones.
 */
export const useEmailVerification = (
  params: UseEmailVerificationParams
): UseEmailVerificationReturn => {
  const status = ref<VerificationStatus>('idle')
  const successMessage = ref('')
  const errorTitle = ref('')
  const errorDetail = ref('')
  const email = ref('')
  const isResending = ref(false)
  const resendMessage = ref('')

  const confirm = async (): Promise<void> => {
    if (params.token === '') return

    status.value = 'checking'
    errorTitle.value = ''
    errorDetail.value = ''

    try {
      const result = await params.confirm(params.token)
      successMessage.value = result.message
      status.value = 'confirmed'
    } catch (error: unknown) {
      console.error('useEmailVerification: no se pudo confirmar el correo', error)
      const apiError = extractApiError(error)
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
      status.value = 'failed'
    }
  }

  const resend = async (): Promise<void> => {
    if (isResending.value || email.value.trim() === '') return

    isResending.value = true
    resendMessage.value = ''

    try {
      const result = await params.resend(email.value.trim())
      resendMessage.value = result.message
    } catch (error: unknown) {
      console.error('useEmailVerification: no se pudo reenviar la confirmacion', error)
      const apiError = extractApiError(error)
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
    } finally {
      isResending.value = false
    }
  }

  return {
    status,
    successMessage,
    errorTitle,
    errorDetail,
    email,
    isResending,
    resendMessage,
    confirm,
    resend
  }
}
