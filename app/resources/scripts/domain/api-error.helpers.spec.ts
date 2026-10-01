import { describe, expect, it } from 'vitest'
import {
  extractApiError,
  extractStatus,
  isAnnouncedGlobally,
  isGlobalFailure
} from './api-error.helpers'

const buildApiError = (): Record<string, string> => ({
  title: 'Credenciales invalidas',
  detail: 'Revisa el correo y la contrasena.',
  key: 'credenciales-invalidas',
  code: 'VMH.AUTH.INVALID_CREDENTIALS'
})

describe('extractStatus', () => {
  it('lee el estado desde la respuesta de ofetch', () => {
    expect(extractStatus({ response: { status: 401 } })).toBe(401)
  })

  it('lee el estado desde statusCode cuando no hay respuesta anidada', () => {
    expect(extractStatus({ statusCode: 500 })).toBe(500)
  })

  it('devuelve null cuando el error no llego a tener respuesta', () => {
    expect(extractStatus(new Error('Network request failed'))).toBeNull()
    expect(extractStatus(null)).toBeNull()
  })
})

describe('extractApiError', () => {
  it('devuelve el cuerpo estandar del API', () => {
    expect(extractApiError({ data: buildApiError() })).toEqual(buildApiError())
  })

  it('devuelve null cuando la respuesta no trae el contrato', () => {
    expect(extractApiError({ data: { message: 'Internal Server Error' } })).toBeNull()
  })

  it('devuelve null cuando no hubo cuerpo de respuesta', () => {
    expect(extractApiError(new Error('Failed to fetch'))).toBeNull()
  })
})

describe('isGlobalFailure', () => {
  it('avisa de forma global ante un fallo sin respuesta', () => {
    expect(isGlobalFailure(null)).toBe(true)
  })

  it('avisa de forma global ante un error del servidor', () => {
    expect(isGlobalFailure(500)).toBe(true)
    expect(isGlobalFailure(503)).toBe(true)
  })

  it('deja los 4xx a quien hizo la llamada', () => {
    expect(isGlobalFailure(401)).toBe(false)
    expect(isGlobalFailure(422)).toBe(false)
  })
})

describe('isAnnouncedGlobally', () => {
  it('un fallo de red del cliente HTTP ya se aviso', () => {
    expect(isAnnouncedGlobally({ name: 'FetchError' })).toBe(true)
  })

  it('un error del servidor del cliente HTTP ya se aviso', () => {
    expect(isAnnouncedGlobally({ name: 'FetchError', response: { status: 503 } })).toBe(true)
  })

  it('un rechazo 4xx no se aviso: lo traduce quien llamo', () => {
    expect(isAnnouncedGlobally({ name: 'FetchError', response: { status: 409 } })).toBe(false)
  })

  it('una respuesta que no cumple el contrato no la aviso nadie', () => {
    expect(isAnnouncedGlobally(new Error('contrato roto'))).toBe(false)
    expect(isAnnouncedGlobally(null)).toBe(false)
  })
})
