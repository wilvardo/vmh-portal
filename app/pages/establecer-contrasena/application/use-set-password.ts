import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { PASSWORD_MIN_LENGTH } from '../domain/set-password.const'

interface SetPasswordMessages {
  /** Mensaje cuando la contrasena es mas corta que el minimo. */
  tooShort: string
  /** Mensaje cuando las dos capturas no coinciden. */
  mismatch: string
  /** Encabezado cuando la direccion no trae token. */
  missingTokenTitle: string
  /** Cuerpo del aviso de direccion sin token. */
  missingTokenDetail: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseSetPasswordParams {
  /** Token que llego en la direccion, o cadena vacia si no venia. */
  token: string
  /** Peticion al API, ya cableada a su URL base. */
  submitPassword: (token: string, password: string) => Promise<{ message: string }>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: SetPasswordMessages
}

interface UseSetPasswordReturn {
  /** Contrasena capturada. */
  password: Ref<string>
  /** Segunda captura, para atajar el dedazo antes de gastar el enlace. */
  confirmation: Ref<string>
  /** Indica si hay una peticion en curso. */
  isSubmitting: Ref<boolean>
  /** Indica si la contrasena ya quedo fijada. */
  isDone: Ref<boolean>
  /** Mensaje de exito que devolvio el API. */
  successMessage: Ref<string>
  /** Encabezado del error visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error visible, o cadena vacia. */
  errorDetail: Ref<string>
  /** Fija la contrasena nueva. */
  submit: () => Promise<void>
}

/**
 * Caso de uso de "fijar una contrasena nueva".
 *
 * Sirve a los dos caminos que emiten ese enlace: quien olvido su contrasena y
 * quien fue dado de alta en el mostrador y nunca tuvo una. Es el mismo token y
 * el mismo desenlace, asi que es el mismo caso de uso.
 *
 * La confirmacion se valida ANTES de llamar al API y no es un adorno: el enlace
 * es de un solo uso, asi que un dedazo enviado gasta el enlace y obliga a pedir
 * otro correo. Atajarlo aqui es la diferencia entre corregir un campo y repetir
 * todo el tramite.
 *
 * @param params Token, peticion y textos.
 * @returns El estado del formulario y la accion de envio.
 */
export const useSetPassword = (params: UseSetPasswordParams): UseSetPasswordReturn => {
  const password = ref('')
  const confirmation = ref('')
  const isSubmitting = ref(false)
  const isDone = ref(false)
  const successMessage = ref('')
  const errorTitle = ref('')
  const errorDetail = ref('')

  const submit = async (): Promise<void> => {
    if (isSubmitting.value) return

    errorTitle.value = ''
    errorDetail.value = ''

    if (params.token === '') {
      errorTitle.value = params.messages.missingTokenTitle
      errorDetail.value = params.messages.missingTokenDetail
      return
    }

    if (password.value.length < PASSWORD_MIN_LENGTH) {
      errorTitle.value = params.messages.tooShort
      return
    }

    if (password.value !== confirmation.value) {
      errorTitle.value = params.messages.mismatch
      return
    }

    isSubmitting.value = true

    try {
      const result = await params.submitPassword(params.token, password.value)
      successMessage.value = result.message
      isDone.value = true
    } catch (error: unknown) {
      console.error('useSetPassword: no se pudo fijar la contrasena', error)
      const apiError = extractApiError(error)
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
    } finally {
      isSubmitting.value = false
      // Las dos capturas se limpian pase lo que pase: la pantalla ya no las
      // necesita, ni para reintentar.
      password.value = ''
      confirmation.value = ''
    }
  }

  return {
    password,
    confirmation,
    isSubmitting,
    isDone,
    successMessage,
    errorTitle,
    errorDetail,
    submit
  }
}
