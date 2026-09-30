import { describe, expect, it } from 'vitest'
import { buildLegalLinks } from './legal-link.helpers'

describe('buildLegalLinks', () => {
  it('enlaza el aviso y los terminos donde los publica el sitio', () => {
    expect(buildLegalLinks('https://vmh.example')).toEqual({
      privacy: 'https://vmh.example/aviso-de-privacidad',
      terms: 'https://vmh.example/terminos-y-condiciones'
    })
  })

  it('no duplica la diagonal final de la direccion', () => {
    expect(buildLegalLinks('https://vmh.example/')?.privacy).toBe(
      'https://vmh.example/aviso-de-privacidad'
    )
  })

  it('sin direccion del sitio no hay enlaces', () => {
    expect(buildLegalLinks('')).toBeNull()
    expect(buildLegalLinks('   ')).toBeNull()
  })
})
