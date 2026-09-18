import { describe, expect, it } from 'vitest'
import { readField, readFlag, readNumber, readText } from './api-payload.helpers'

describe('readField', () => {
  it('devuelve indefinido cuando el origen no es un objeto', () => {
    expect(readField(null, 'x')).toBeUndefined()
    expect(readField('texto', 'x')).toBeUndefined()
  })

  it('lee el campo cuando existe', () => {
    expect(readField({ x: 3 }, 'x')).toBe(3)
  })
})

describe('readNumber', () => {
  it('rechaza lo que no es un numero utilizable', () => {
    expect(readNumber({ x: '3' }, 'x')).toBeNull()
    expect(readNumber({ x: Number.NaN }, 'x')).toBeNull()
    expect(readNumber({}, 'x')).toBeNull()
  })

  it('acepta el cero, que es un numero como cualquier otro', () => {
    expect(readNumber({ x: 0 }, 'x')).toBe(0)
  })
})

describe('readText', () => {
  it('acepta la cadena vacia y rechaza lo que no es cadena', () => {
    expect(readText({ x: '' }, 'x')).toBe('')
    expect(readText({ x: 3 }, 'x')).toBeNull()
  })
})

describe('readFlag', () => {
  it('solo el booleano verdadero cuenta como afirmativo', () => {
    /**
     * Un contrato que manda `1` o `"true"` donde prometio un booleano ya se
     * rompio; tomarlo por bueno esconde el problema hasta que estorba.
     */
    expect(readFlag({ x: true }, 'x')).toBe(true)
    expect(readFlag({ x: 1 }, 'x')).toBe(false)
    expect(readFlag({ x: 'true' }, 'x')).toBe(false)
    expect(readFlag({}, 'x')).toBe(false)
  })
})
