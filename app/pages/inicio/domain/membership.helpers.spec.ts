import { describe, expect, it } from 'vitest'
import { needsAction, parseProfileView } from './membership.helpers'

/** Respuesta completa del API, para alterar una pieza por prueba. */
const buildView = (): unknown => ({
  profile: {
    id: 12,
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@correo.mx',
    phone: '5512000010'
  },
  membership: {
    id: 3,
    displayStatus: 'activa',
    serviceName: 'Entrenamiento funcional',
    planName: 'Mensual',
    paymentMode: 'monthly',
    startsAt: '2026-09-01',
    endsAt: '2027-03-01',
    nextPayment: { dueDate: '2026-10-01', amount: 1200 }
  }
})

describe('parseProfileView', () => {
  it('devuelve el perfil cuando la respuesta cumple el contrato', () => {
    const view = parseProfileView(buildView())

    expect(view?.profile.email).toBe('ana@correo.mx')
    expect(view?.membership.displayStatus).toBe('activa')
  })

  it('acepta el caso sin membresia, que no es un error', () => {
    const view = parseProfileView({
      profile: (buildView() as { profile: unknown }).profile,
      membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null }
    })

    expect(view?.membership.displayStatus).toBe('sin-membresia')
  })

  it('descarta un estado que el portal no sabe pintar en vez de adivinar', () => {
    const view = parseProfileView({
      profile: (buildView() as { profile: unknown }).profile,
      membership: { displayStatus: 'en-tramite' }
    })

    expect(view).toBeNull()
  })

  it('descarta una respuesta sin perfil', () => {
    expect(parseProfileView({ membership: { displayStatus: 'activa' } })).toBeNull()
    expect(parseProfileView(null)).toBeNull()
    expect(parseProfileView('lo que sea')).toBeNull()
  })
})

describe('needsAction', () => {
  it('pide accion cuando hay algo que resolver', () => {
    expect(needsAction('morosa')).toBe(true)
    expect(needsAction('por-vencer')).toBe(true)
    expect(needsAction('vencida')).toBe(true)
  })

  it('no pide nada cuando la membresia esta al corriente', () => {
    expect(needsAction('activa')).toBe(false)
    expect(needsAction('sin-membresia')).toBe(false)
  })
})
