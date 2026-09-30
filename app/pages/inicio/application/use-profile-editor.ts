import { extractApiError } from '~/resources/scripts/domain/api-error.helpers'
import { API_ERROR_CODE } from '~/resources/scripts/domain/api-error.const'
import type { MyProfile, MyProfileView } from '../domain/membership.interface'

/** Telefono de Mexico a diez digitos, la misma definicion que usa el API. */
const PHONE_PATTERN = /^\d{10}$/

/** Datos que la persona corrige de si misma. */
interface ProfileValues {
  firstName: string
  lastName: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
}

interface ProfileEditorMessages {
  /** Mensaje cuando el telefono no tiene diez digitos. */
  invalidPhone: string
  /** Mensaje cuando falta nombre o apellidos. */
  missingName: string
  /** Mensaje cuando falta el nombre del contacto de emergencia. */
  missingEmergencyName: string
  /** Mensaje cuando el telefono del contacto no tiene diez digitos. */
  invalidEmergencyPhone: string
  /** Encabezado cuando el fallo no trae el contrato de error del API. */
  unexpectedTitle: string
}

interface UseProfileEditorParams {
  /** Guardado, ya cableado al cliente HTTP. */
  save: (values: ProfileValues) => Promise<MyProfileView>
  /** Que hacer con el perfil guardado. */
  onSaved: (view: MyProfileView) => void
  /** Textos ya traducidos. El caso de uso no invoca i18n. */
  messages: ProfileEditorMessages
}

interface UseProfileEditorReturn {
  /** Indica si el editor esta abierto. */
  isOpen: Ref<boolean>
  /** Datos en edicion. */
  values: ProfileValues
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
 * Revisa la captura antes de gastar una peticion.
 *
 * Es la misma definicion que aplica el API -nombre y telefono del contacto
 * obligatorios, telefonos a diez digitos-: aqui solo se adelanta el aviso para
 * decirlo junto al campo, el API sigue siendo quien decide.
 *
 * @param values Captura ya recortada.
 * @param messages Textos de cada rechazo.
 * @returns El error por campo, o un objeto vacio si la captura sirve.
 */
const checkValues = (
  values: ProfileValues,
  messages: ProfileEditorMessages
): Record<string, string> => {
  if (values.firstName === '' || values.lastName === '') {
    return { firstName: messages.missingName }
  }
  if (!PHONE_PATTERN.test(values.phone)) return { phone: messages.invalidPhone }
  if (values.emergencyContactName === '') {
    return { emergencyContactName: messages.missingEmergencyName }
  }
  if (!PHONE_PATTERN.test(values.emergencyContactPhone)) {
    return { emergencyContactPhone: messages.invalidEmergencyPhone }
  }

  return {}
}

/**
 * Caso de uso del editor de datos de contacto.
 *
 * El telefono ya tomado se muestra EN SU CAMPO, igual que en el alta: es lo
 * unico que la persona puede corregir y un aviso general la deja buscando. Lo
 * mismo el contacto de emergencia que el API exige completo.
 *
 * @param params Guardado, destino y textos.
 * @returns El estado del editor y sus acciones.
 */
export const useProfileEditor = (params: UseProfileEditorParams): UseProfileEditorReturn => {
  const isOpen = ref(false)
  const isSaving = ref(false)
  const fieldErrors = ref<Record<string, string>>({})
  const errorTitle = ref('')
  const values = reactive<ProfileValues>({
    firstName: '',
    lastName: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  })

  /**
   * Abre el editor con los datos actuales.
   *
   * @param profile Perfil tal como lo mando el API.
   */
  const open = (profile: MyProfile): void => {
    values.firstName = profile.firstName
    values.lastName = profile.lastName
    values.phone = profile.phone
    values.emergencyContactName = profile.emergencyContactName ?? ''
    values.emergencyContactPhone = profile.emergencyContactPhone ?? ''
    fieldErrors.value = {}
    errorTitle.value = ''
    isOpen.value = true
  }

  /** Cierra el editor sin guardar. */
  const close = (): void => {
    isOpen.value = false
  }

  /**
   * Traduce el rechazo del API al campo que hay que corregir.
   *
   * @param error Fallo del guardado.
   */
  const showFailure = (error: unknown): void => {
    const apiError = extractApiError(error)
    const code = apiError?.code

    if (
      apiError !== null &&
      (code === API_ERROR_CODE.PROFILE_PHONE_TAKEN || code === API_ERROR_CODE.PHONE_TAKEN)
    ) {
      fieldErrors.value = { phone: apiError.detail }
    } else if (apiError !== null && code === API_ERROR_CODE.EMERGENCY_CONTACT_REQUIRED) {
      fieldErrors.value = { emergencyContactName: apiError.detail }
    } else {
      errorTitle.value = apiError?.title ?? params.messages.unexpectedTitle
    }
  }

  /**
   * Guarda los datos en edicion.
   *
   * @returns Promesa que resuelve al terminar, con exito o sin el.
   */
  const submit = async (): Promise<void> => {
    if (isSaving.value) return

    fieldErrors.value = {}
    errorTitle.value = ''

    const trimmed: ProfileValues = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
      emergencyContactName: values.emergencyContactName.trim(),
      emergencyContactPhone: values.emergencyContactPhone.trim()
    }

    const issues = checkValues(trimmed, params.messages)
    if (Object.keys(issues).length > 0) {
      fieldErrors.value = issues
      return
    }

    isSaving.value = true

    try {
      const saved = await params.save(trimmed)

      params.onSaved(saved)
      isOpen.value = false
    } catch (error: unknown) {
      console.error('useProfileEditor: no se pudieron guardar los datos', error)
      showFailure(error)
    } finally {
      isSaving.value = false
    }
  }

  return { isOpen, values, isSaving, fieldErrors, errorTitle, open, close, submit }
}
