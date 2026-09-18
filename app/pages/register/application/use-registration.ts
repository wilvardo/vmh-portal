import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import type { PendingAccount } from '~/resources/scripts/infrastructure/registration.repository'
import { validateRegisterForm, type RegisterFormValues } from '../domain/register.helpers'

interface RegistrationMessages {
  /** Mensajes de validacion local, indexados por la clave que devuelve el dominio. */
  validation: Record<string, string>
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
  /** Cuerpo del fallo sin contrato. */
  unexpectedDetail: string
}

interface UseRegistrationParams {
  /** Peticion de alta al API, ya cableada a su URL base. */
  signUp: (values: RegisterFormValues) => Promise<PendingAccount>
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: RegistrationMessages
}

interface UseRegistrationReturn {
  /** Datos capturados. */
  values: RegisterFormValues
  /** Indica si hay un alta en curso. */
  isSubmitting: Ref<boolean>
  /** Mensaje del campo que hay que corregir, indexado por campo. */
  fieldErrors: Ref<Record<string, string>>
  /** Encabezado del error general visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Cuerpo del error general visible, o cadena vacia. */
  errorDetail: Ref<string>
  /** Cuenta creada, o `null` mientras no haya alta. */
  account: Ref<PendingAccount | null>
  /** Intenta dar de alta la cuenta con lo capturado. */
  submit: () => Promise<void>
}

/**
 * Caso de uso del alta de cuenta.
 *
 * Dos reglas que sostiene:
 * 1. Un correo o telefono ya tomado se muestra EN SU CAMPO, no como error
 *    general: es lo unico que la persona puede corregir, y un aviso arriba del
 *    formulario la deja buscando cual de los seis campos esta mal.
 * 2. La contrasena se limpia despues de cada intento fallido, igual que en el
 *    acceso. Un formulario que se reenvia con la contrasena todavia cargada es
 *    un formulario que la deja en memoria mas tiempo del necesario.
 *
 * @param params Peticion de alta y textos del formulario.
 * @returns El estado del formulario y la accion de envio.
 */
export const useRegistration = (params: UseRegistrationParams): UseRegistrationReturn => {
  const values = reactive<RegisterFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    privacyAccepted: false
  })

  const isSubmitting = ref(false)
  const fieldErrors = ref<Record<string, string>>({})
  const errorTitle = ref('')
  const errorDetail = ref('')
  const account = ref<PendingAccount | null>(null)

  /** Campo al que pertenece cada rechazo del API que la persona puede corregir. */
  const fieldForCode = (code: string | undefined): string | null => {
    if (code === API_ERROR_CODE.EMAIL_TAKEN) return 'email'
    if (code === API_ERROR_CODE.PHONE_TAKEN) return 'phone'

    return null
  }

  const submit = async (): Promise<void> => {
    if (isSubmitting.value) return

    fieldErrors.value = {}
    errorTitle.value = ''
    errorDetail.value = ''

    const validation = validateRegisterForm(values)
    if (!validation.isValid) {
      fieldErrors.value = {
        [validation.field]: params.messages.validation[validation.messageKey] ?? ''
      }
      return
    }

    isSubmitting.value = true

    try {
      account.value = await params.signUp({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        privacyAccepted: values.privacyAccepted
      })
    } catch (error: unknown) {
      console.error('useRegistration: error al registrar la cuenta', error)
      const apiError = extractApiError(error)
      const field = fieldForCode(apiError?.code)

      if (field !== null && apiError !== null) {
        fieldErrors.value = { [field]: apiError.detail }
      } else {
        errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
        errorDetail.value = apiError?.detail ?? params.messages.unexpectedDetail
      }
    } finally {
      isSubmitting.value = false
      values.password = ''
    }
  }

  return { values, isSubmitting, fieldErrors, errorTitle, errorDetail, account, submit }
}
