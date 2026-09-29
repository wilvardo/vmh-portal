import { describe, expect, it } from 'vitest'
import { isNavItemActive } from './portal-header.helpers'

describe('isNavItemActive', () => {
  it('marca la pantalla exacta', () => {
    expect(isNavItemActive('/horarios', '/horarios')).toBe(true)
  })

  it('marca una ruta hija de la pantalla', () => {
    expect(isNavItemActive('/horarios/semana', '/horarios')).toBe(true)
  })

  it('no confunde un prefijo de texto con una ruta hija', () => {
    expect(isNavItemActive('/horarios-viejos', '/horarios')).toBe(false)
    expect(isNavItemActive('/inicio', '/horarios')).toBe(false)
  })
})
