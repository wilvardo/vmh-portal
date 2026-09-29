import { describe, expect, it } from 'vitest'
import { formatAmount, formatDayMonth, needsAction, parseProfileView } from './membership.helpers'

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
    nextPayment: { dueDate: '2026-10-01', amount: 1200 },
    amountDueOnArrival: null
  },
  upcomingReservations: [
    {
      id: 1,
      reservationType: 'evaluation',
      startsAt: '2026-09-30T18:00:00.000Z',
      serviceName: null,
      isCancellable: true
    }
  ],
  initialEvaluationCompletedAt: null
})

/** Perfil valido, para armar respuestas con una membresia a la medida. */
const validProfile = (): unknown => (buildView() as { profile: unknown }).profile

describe('parseProfileView', () => {
  it('lee la evaluacion inicial asentada', () => {
    const view = parseProfileView({
      ...(buildView() as object),
      initialEvaluationCompletedAt: '2026-09-20T15:00:00.000Z'
    })

    expect(view?.initialEvaluationCompletedAt).toBe('2026-09-20T15:00:00.000Z')
  })

  it('trata como roto un perfil sin la marca de evaluacion o con una fecha ilegible', () => {
    const { initialEvaluationCompletedAt: _omitted, ...withoutMark } = buildView() as Record<
      string,
      unknown
    >

    expect(parseProfileView(withoutMark)).toBeNull()
    expect(
      parseProfileView({ ...(buildView() as object), initialEvaluationCompletedAt: 'ayer' })
    ).toBeNull()
  })

  it('devuelve el perfil cuando la respuesta cumple el contrato', () => {
    const view = parseProfileView(buildView())

    expect(view?.profile.email).toBe('ana@correo.mx')
    expect(view?.membership.displayStatus).toBe('activa')
  })

  it('acepta el caso sin membresia, que no es un error', () => {
    const view = parseProfileView({
      profile: validProfile(),
      membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null },
      initialEvaluationCompletedAt: null,
      upcomingReservations: []
    })

    expect(view?.membership.displayStatus).toBe('sin-membresia')
  })

  it('acepta la membresia pendiente de pago con su monto al llegar', () => {
    const view = parseProfileView({
      profile: validProfile(),
      membership: {
        id: 1,
        displayStatus: 'pendiente-de-pago',
        startsAt: '2026-09-30',
        nextPayment: null,
        amountDueOnArrival: 9000
      },
      initialEvaluationCompletedAt: null,
      upcomingReservations: []
    })

    expect(view?.membership.displayStatus).toBe('pendiente-de-pago')
    expect(view?.membership.amountDueOnArrival).toBe(9000)
  })

  it('entrega las reservas por venir tal como llegan', () => {
    const view = parseProfileView(buildView())

    expect(view?.upcomingReservations).toHaveLength(1)
    expect(view?.upcomingReservations[0]?.reservationType).toBe('evaluation')
  })

  it('descarta un estado que el portal no sabe pintar en vez de adivinar', () => {
    const view = parseProfileView({
      profile: validProfile(),
      membership: { displayStatus: 'en-tramite' },
      initialEvaluationCompletedAt: null,
      upcomingReservations: []
    })

    expect(view).toBeNull()
  })

  it('descarta una respuesta sin la lista de reservas en vez de decir que no hay', () => {
    const view = parseProfileView({
      profile: validProfile(),
      membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null }
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

  it('no alarma a quien solo tiene pendiente su primer pago', () => {
    expect(needsAction('pendiente-de-pago')).toBe(false)
  })
})

describe('formatDayMonth', () => {
  it('escribe el dia y el mes sin correr la fecha al dia anterior', () => {
    expect(formatDayMonth('2026-09-30')).toBe('30 de septiembre')
  })

  it('sin fecha pinta un guion y no una cadena vacia', () => {
    expect(formatDayMonth(null)).toBe('—')
  })
})

describe('formatAmount', () => {
  it('escribe el importe en pesos con centavos', () => {
    expect(formatAmount(9000)).toBe('$9,000.00')
  })
})
