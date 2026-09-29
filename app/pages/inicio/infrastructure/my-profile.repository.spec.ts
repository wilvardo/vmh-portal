import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiFetch } from '~/composables/use-api'
import { MY_PROFILE_ENDPOINT } from '../domain/membership.const'
import { fetchMyProfile, updateMyProfile } from './my-profile.repository'

/** Respuesta valida del API. */
const view = {
  profile: {
    id: 12,
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@correo.mx',
    phone: '5512000010'
  },
  membership: { id: null, displayStatus: 'sin-membresia', nextPayment: null },
  initialEvaluationCompletedAt: null,
  upcomingReservations: []
}

describe('repositorio del perfil propio', () => {
  /**
   * Doble del cliente HTTP. Se tipa como `ApiFetch` porque es lo que reciben
   * los repositorios: sin el tipo, la prueba pasaria con una firma que el
   * codigo real nunca aceptaria.
   */
  let apiFetch: ApiFetch & ReturnType<typeof vi.fn>

  beforeEach(() => {
    apiFetch = vi.fn() as unknown as ApiFetch & ReturnType<typeof vi.fn>
  })

  it('lee el perfil del endpoint de la sesion', async () => {
    apiFetch.mockResolvedValue({ data: view })

    const result = await fetchMyProfile({ apiFetch })

    expect(apiFetch).toHaveBeenCalledWith(MY_PROFILE_ENDPOINT)
    expect(result.profile.email).toBe('ana@correo.mx')
  })

  it('descarta los campos de la reserva que el portal no declara', async () => {
    apiFetch.mockResolvedValue({
      data: {
        ...view,
        upcomingReservations: [
          {
            id: 7,
            reservationType: 'evaluation',
            startsAt: '2026-09-30T18:00:00.000Z',
            serviceName: null,
            isCancellable: true,
            createdVia: 'website'
          }
        ]
      }
    })

    const result = await fetchMyProfile({ apiFetch })

    expect(result.upcomingReservations).toEqual([
      {
        id: 7,
        reservationType: 'evaluation',
        startsAt: '2026-09-30T18:00:00.000Z',
        serviceName: null,
        isCancellable: true
      }
    ])
  })

  it('rechaza una respuesta que no cumple el contrato en vez de pintarla', async () => {
    apiFetch.mockResolvedValue({ data: { profile: { id: 'doce' } } })

    await expect(fetchMyProfile({ apiFetch })).rejects.toThrow(/contrato de perfil/)
  })

  it('guarda los datos y relee el perfil para conservar la membresia', async () => {
    apiFetch.mockResolvedValueOnce({ data: view.profile }).mockResolvedValueOnce({ data: view })

    const result = await updateMyProfile({
      apiFetch,
      firstName: 'Ana',
      lastName: 'Lopez Ruiz',
      phone: '5512000011'
    })

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      MY_PROFILE_ENDPOINT,
      expect.objectContaining({ method: 'PUT' })
    )
    expect(apiFetch).toHaveBeenNthCalledWith(2, MY_PROFILE_ENDPOINT)
    expect(result.membership.displayStatus).toBe('sin-membresia')
  })

  it('no manda el cliente HTTP dentro del cuerpo', async () => {
    apiFetch.mockResolvedValueOnce({ data: view.profile }).mockResolvedValueOnce({ data: view })

    await updateMyProfile({ apiFetch, firstName: 'Ana', lastName: 'Lopez', phone: '5512000011' })

    const [, options] = apiFetch.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(options.body).not.toHaveProperty('apiFetch')
  })
})
