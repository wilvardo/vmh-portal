import { describe, expect, it, vi } from 'vitest'
import { useProfileEditor } from './use-profile-editor'
import type { MyProfile, MyProfileView } from '../domain/membership.interface'

const profile: MyProfile = {
  id: 12,
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@correo.mx',
  phone: '5512000010'
}

const view = { profile, membership: { displayStatus: 'activa' } } as unknown as MyProfileView

const messages = {
  invalidPhone: 'El teléfono va a 10 dígitos.',
  missingName: 'Escribe tu nombre y tus apellidos.',
  unexpectedTitle: 'No se pudieron guardar tus datos'
}

describe('useProfileEditor', () => {
  it('abre con los datos actuales cargados', () => {
    const editor = useProfileEditor({ save: vi.fn(), onSaved: vi.fn(), messages })

    editor.open(profile)

    expect(editor.isOpen.value).toBe(true)
    expect(editor.values.phone).toBe('5512000010')
  })

  it('guarda y cierra cuando la captura es valida', async () => {
    const save = vi.fn().mockResolvedValue(view)
    const onSaved = vi.fn()
    const editor = useProfileEditor({ save, onSaved, messages })

    editor.open(profile)
    editor.values.lastName = 'Lopez Ruiz'
    await editor.submit()

    expect(save).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Lopez Ruiz',
      phone: '5512000010'
    })
    expect(onSaved).toHaveBeenCalledWith(view)
    expect(editor.isOpen.value).toBe(false)
  })

  it('no gasta una peticion con un telefono mal capturado', async () => {
    const save = vi.fn()
    const editor = useProfileEditor({ save, onSaved: vi.fn(), messages })

    editor.open(profile)
    editor.values.phone = '5512'
    await editor.submit()

    expect(save).not.toHaveBeenCalled()
    expect(editor.fieldErrors.value.phone).toBe(messages.invalidPhone)
  })

  it('muestra el telefono ya tomado en su campo y deja el editor abierto', async () => {
    const save = vi.fn().mockRejectedValue({
      data: {
        title: 'Teléfono ya registrado',
        detail: 'Este teléfono ya está asociado a otra cuenta.',
        key: 'telefono-ya-registrado',
        code: 'VMH.USR.PHONE_TAKEN'
      }
    })
    const editor = useProfileEditor({ save, onSaved: vi.fn(), messages })

    editor.open(profile)
    editor.values.phone = '5512000099'
    await editor.submit()

    expect(editor.fieldErrors.value.phone).toBe('Este teléfono ya está asociado a otra cuenta.')
    expect(editor.isOpen.value).toBe(true)
  })

  it('exige nombre y apellidos antes de llamar al API', async () => {
    const save = vi.fn()
    const editor = useProfileEditor({ save, onSaved: vi.fn(), messages })

    editor.open(profile)
    editor.values.lastName = '   '
    await editor.submit()

    expect(save).not.toHaveBeenCalled()
    expect(editor.fieldErrors.value.firstName).toBe(messages.missingName)
  })
})
