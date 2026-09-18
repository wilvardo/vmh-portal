import { describe, expect, it } from 'vitest'
import {
  PORTAL_BRAND_DESCRIPTOR,
  PORTAL_BRAND_NAME
} from '../app/resources/scripts/constants/portal.const'

/**
 * Prueba de humo del andamiaje. No verifica funcionalidad: verifica que el arnes
 * de pruebas corre, que los alias resuelven y que la identidad del portal sale
 * de una sola fuente.
 */
describe('andamiaje del portal', () => {
  it('declara la marca sin el sufijo pendiente de IMPI', () => {
    expect(PORTAL_BRAND_NAME).toBe('VMH')
  })

  it('se describe como portal del atleta, no como panel', () => {
    expect(PORTAL_BRAND_DESCRIPTOR).toBe('Portal del atleta')
  })
})
