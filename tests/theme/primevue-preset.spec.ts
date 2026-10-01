import { describe, expect, it } from 'vitest'
import VmhPreset, { VMH_COLOR_SCHEME } from '../../theme/primevue-preset'

/**
 * El preset es lo que impide que PrimeVue imponga su propia apariencia. Estas
 * pruebas fijan las decisiones que no pueden erosionarse en un refactor: que los
 * colores salgan de los tokens, que el boton sea pill y que la marca nunca se
 * vea en oscuro.
 */
describe('preset de PrimeVue de VMH', () => {
  const semantic = VmhPreset.semantic as Record<string, unknown>
  const colorScheme = semantic.colorScheme as Record<string, Record<string, unknown>>
  const components = VmhPreset.components as Record<string, Record<string, Record<string, unknown>>>

  it('resuelve el color de marca contra los tokens del design system', () => {
    const primary = colorScheme.light.primary as Record<string, string>

    expect(primary.color).toBe('var(--color-primary)')
    expect(primary.contrastColor).toBe('var(--color-on-primary)')
  })

  it('no deja ningun color literal en el esquema claro', () => {
    const serialized = JSON.stringify(colorScheme.light)

    expect(serialized).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(serialized).not.toMatch(/\brgba?\(/i)
  })

  it('declara los mismos valores en claro y en oscuro: la marca no admite tema oscuro', () => {
    // El preset se fusiona con Aura, que aporta slots que VMH no declara. Lo que
    // se verifica es que TODO lo que VMH si declara vale igual en ambos esquemas:
    // si el conmutador de la libreria llegara a activarse, la marca no se
    // invierte.
    for (const group of Object.keys(VMH_COLOR_SCHEME)) {
      expect(colorScheme.dark[group]).toEqual(colorScheme.light[group])
    }
  })

  it('da al boton la forma pill de la marca', () => {
    expect(components.button.root.borderRadius).toBe('var(--radius-pill)')
  })

  it('respeta la densidad del panel en el boton de solo icono', () => {
    expect(components.button.root.iconOnlyWidth).toBe('var(--app-control-h)')
  })

  it('alinea el foco de la libreria con el anillo unico del sistema', () => {
    const focusRing = semantic.focusRing as Record<string, string>

    expect(focusRing.color).toBe('var(--focus-ring-color)')
    expect(focusRing.width).toBe('var(--focus-ring-width)')
  })
})
