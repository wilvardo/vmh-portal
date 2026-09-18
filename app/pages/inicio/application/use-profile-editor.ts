import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import type { MyProfile, MyProfileView } from '../domain/membership.interface'

/** Telefono de Mexico a diez digitos, la misma definicion que usa el API. */
const PHONE_PATTERN = /^\d{10}$/

interface ProfileEditorMessages {
  /** Mensaje cuando el telefono no tiene diez digitos. */
  invalidPhone: string
  /** Mensaje cuando falta nombre o apellidos. */
  missingName: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
}

interface UseProfileEditorParams {
  /** Guardado, ya cableado al cliente HTTP. */
  save: (values: { firstName: string; lastName: string; phone: string }) => Promise<MyProfileView>
  /** Que hacer con el perfil guardado. */
  onSaved: (view: MyProfileView) => void
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: ProfileEditorMessages
}

interface UseProfileEditorReturn {
  /** Indica si el editor esta abierto. */
  isOpen: Ref<boolean>
  /** Datos en edicion. */
  values: { firstName: string; lastName: string; phone: string }
  /** Indica si hay un guardado en curso. */
  isSaving: Ref<boolean>
  /** Mensaje del campo que hay que corregir, indexado por campo. */
  fieldErrors: Ref<Record<string, string>>
  /** Encabezado del error general visible, o cadena vacia. */
  errorTitle: Ref<string>
  /** Abre el editor con los datos actuales. */
  open: (profile: MyProfile) => void
  /** Cierra el editor sin guardar. */
  close: () => void
  /** Guarda los datos en edicion. */
  submit: () => Promise<void>
}

/**
 * Caso de uso del editor de datos de contacto.
 *
 * El telefono ya tomado se muestra EN SU CAMPO, igual que en el alta: es lo
 * unico que la persona puede corregir y un aviso general la deja buscando.
 *
 * @param params Guardado, destino y textos.
 * @returns El estado del editor y sus acciones.
 */
export const useProfileEditor = (params: UseProfileEditorParams): UseProfileEditorReturn => {
  const isOpen = ref(false)
  const isSaving = ref(false)
  const fieldErrors = ref<Record<string, string>>({})
  const errorTitle = ref('')
  const values = reactive({ firstName: '', lastName: '', phone: '' })

  const open = (profile: MyProfile): void => {
    values.firstName = profile.firstName
    values.lastName = profile.lastName
    values.phone = profile.phone
    fieldErrors.value = {}
    errorTitle.value = ''
    isOpen.value = true
  }

  const close = (): void => {
    isOpen.value = false
  }

  const submit = async (): Promise<void> => {
    if (isSaving.value) return

    fieldErrors.value = {}
    errorTitle.value = ''

    if (values.firstName.trim() === '' || values.lastName.trim() === '') {
      fieldErrors.value = { firstName: params.messages.missingName }
      return
    }

    if (!PHONE_PATTERN.test(values.phone.trim())) {
      fieldErrors.value = { phone: params.messages.invalidPhone }
      return
    }

    isSaving.value = true

    try {
      const saved = await params.save({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim()
      })

      params.onSaved(saved)
      isOpen.value = false
    } catch (error: unknown) {
      console.error('useProfileEditor: no se pudieron guardar los datos', error)
      const apiError = extractApiError(error)

      const isPhoneTaken =
        apiError?.code === API_ERROR_CODE.PROFILE_PHONE_TAKEN ||
        apiError?.code === API_ERROR_CODE.PHONE_TAKEN

      if (isPhoneTaken && apiError !== null) {
        fieldErrors.value = { phone: apiError.detail }
      } else {
        errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
      }
    } finally {
      isSaving.value = false
    }
  }

  return { isOpen, values, isSaving, fieldErrors, errorTitle, open, close, submit }
}
