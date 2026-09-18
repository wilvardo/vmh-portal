import { describe, expect, it, vi } from 'vitest'
import { useRegistration } from './use-registration'
import type { RegisterFormValues } from '../domain/register.helpers'

/** Cuenta que devuelve el API en un alta correcta. */
const pendingAccount = {
  id: 7,
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@correo.mx',
  emailVerified: false
}

/** Textos ya resueltos, como se los pasa el orquestador del slice. */
const messages = {
  validation: {
    register_error_privacy: 'Acepta el aviso de privacidad para continuar.',
    register_error_password: 'Usa al menos 12 caracteres.'
  },
  unexpectedTitle: 'No se pudo crear tu cuenta',
  unexpectedDetail: 'Vuelve a intentarlo en un momento.'
}

/** Llena la captura con datos validos. */
const fill = (values: RegisterFormValues): void => {
  values.firstName = 'Ana'
  values.lastName = 'Lopez'
  values.email = 'ana@correo.mx'
  values.phone = '5512000010'
  values.password = 'contrasena-larga-de-verdad'
  values.privacyAccepted = true
}

describe('useRegistration', () => {
  it('entrega la cuenta creada cuando el alta sale bien', async () => {
    const signUp = vi.fn().mockResolvedValue(pendingAccount)
    const { values, submit, account } = useRegistration({ signUp, messages })

    fill(values)
    await submit()

    expect(signUp).toHaveBeenCalledOnce()
    expect(account.value).toEqual(pendingAccount)
  })

  it('no gasta una peticion cuando la captura no pasa la validacion local', async () => {
    const signUp = vi.fn()
    const { values, submit, fieldErrors } = useRegistration({ signUp, messages })

    fill(values)
    values.privacyAccepted = false
    await submit()

    expect(signUp).not.toHaveBeenCalled()
    expect(fieldErrors.value.privacyAccepted).toBe(messages.validation.register_error_privacy)
  })

  it('muestra el correo ya tomado en su campo, no como error general', async () => {
    const signUp = vi.fn().mockRejectedValue({
      data: {
        title: 'Correo ya registrado',
        detail: 'Ese correo ya tiene una cuenta.',
        key: 'correo-ya-registrado',
        code: 'VMH.AUTH.EMAIL_TAKEN'
      }
    })
    const { values, submit, fieldErrors, errorTitle } = useRegistration({ signUp, messages })

    fill(values)
    await submit()

    expect(fieldErrors.value.email).toBe('Ese correo ya tiene una cuenta.')
    expect(errorTitle.value).toBe('')
  })

  it('manda el telefono ya tomado a su propio campo', async () => {
    const signUp = vi.fn().mockRejectedValue({
      data: {
        title: 'Teléfono ya registrado',
        detail: 'Ese teléfono ya está asociado a una cuenta.',
        key: 'telefono-ya-registrado',
        code: 'VMH.AUTH.PHONE_TAKEN'
      }
    })
    const { values, submit, fieldErrors } = useRegistration({ signUp, messages })

    fill(values)
    await submit()

    expect(fieldErrors.value.phone).toBe('Ese teléfono ya está asociado a una cuenta.')
  })

  it('cae al texto propio cuando el fallo no trae el contrato del API', async () => {
    const signUp = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const { values, submit, errorTitle, errorDetail } = useRegistration({ signUp, messages })

    fill(values)
    await submit()

    expect(errorTitle.value).toBe(messages.unexpectedTitle)
    expect(errorDetail.value).toBe(messages.unexpectedDetail)
  })

  it('no deja la contrasena en memoria despues del intento', async () => {
    const signUp = vi.fn().mockResolvedValue(pendingAccount)
    const { values, submit } = useRegistration({ signUp, messages })

    fill(values)
    await submit()

    expect(values.password).toBe('')
  })
})
