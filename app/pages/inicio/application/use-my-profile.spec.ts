import { describe, expect, it, vi } from 'vitest'
import { useMyProfile } from './use-my-profile'
import type { MyProfileView } from '../domain/membership.interface'

const view = {
  profile: {
    id: 12,
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@correo.mx',
    phone: '5512000010'
  },
  membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null }
} as unknown as MyProfileView

describe('useMyProfile', () => {
  it('carga el perfil y lo deja disponible', async () => {
    const load = vi.fn().mockResolvedValue(view)
    const tablero = useMyProfile({ load, unexpectedTitle: 'No se pudo cargar' })

    await tablero.refresh()

    expect(tablero.view.value).toEqual(view)
    expect(tablero.errorTitle.value).toBe('')
  })

  it('no se traga el fallo: un tablero vacio y uno que fallo se ven igual', async () => {
    const load = vi.fn().mockRejectedValue(new Error('la red se cayo'))
    const tablero = useMyProfile({ load, unexpectedTitle: 'No se pudo cargar' })

    await tablero.refresh()

    expect(tablero.view.value).toBeNull()
    expect(tablero.errorTitle.value).toBe('No se pudo cargar')
  })

  it('muestra el titulo del API cuando el fallo trae su contrato', async () => {
    const load = vi.fn().mockRejectedValue({
      data: {
        title: 'Sesión requerida',
        detail: 'Inicia sesión para continuar.',
        key: 'sesion-requerida',
        code: 'VMH.AUTH.UNAUTHORIZED'
      }
    })
    const tablero = useMyProfile({ load, unexpectedTitle: 'No se pudo cargar' })

    await tablero.refresh()

    expect(tablero.errorTitle.value).toBe('Sesión requerida')
  })

  it('no lanza dos lecturas a la vez', async () => {
    const load = vi.fn().mockResolvedValue(view)
    const tablero = useMyProfile({ load, unexpectedTitle: 'No se pudo cargar' })

    await Promise.all([tablero.refresh(), tablero.refresh()])

    expect(load).toHaveBeenCalledOnce()
  })
})
