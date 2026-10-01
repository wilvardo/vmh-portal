// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useApi } from './use-api'

const fetchMock = vi.fn()
const toastAdd = vi.fn()
const renewSession = vi.fn()
const navigate = vi.fn()
const accessToken = ref<string | null>('access-token')

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => fetchMock(...args)
}))

mockNuxtImport('useToast', () => () => ({ add: toastAdd }))
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }))
mockNuxtImport(
  'navigateTo',
  () =>
    (...args: unknown[]) =>
      navigate(...args)
)
mockNuxtImport('useSession', () => () => ({ accessToken, renewSession }))

/** Error con la forma que produce ofetch ante una respuesta con cuerpo. */
const buildHttpError = (status: number, data?: unknown): unknown => ({
  response: { status },
  data
})

describe('useApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    toastAdd.mockReset()
    renewSession.mockReset()
    navigate.mockReset()
    accessToken.value = 'access-token'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('firma la peticion con el token de acceso vigente', async () => {
    fetchMock.mockResolvedValue({ data: [] })

    await useApi()('/catalog/plans')

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Headers }]
    expect(options.headers.get('Authorization')).toBe('Bearer access-token')
  })

  it('no manda cabecera de autorizacion cuando no hay sesion', async () => {
    accessToken.value = null
    fetchMock.mockResolvedValue({ data: [] })

    await useApi()('/catalog/plans')

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Headers }]
    expect(options.headers.get('Authorization')).toBeNull()
  })

  it('devuelve el cuerpo ya parseado', async () => {
    fetchMock.mockResolvedValue({ data: [{ planId: 1 }] })

    await expect(useApi()('/catalog/plans')).resolves.toEqual({ data: [{ planId: 1 }] })
  })

  it('renueva la sesion ante un 401 y reintenta una sola vez', async () => {
    fetchMock.mockRejectedValueOnce(buildHttpError(401)).mockResolvedValueOnce({ data: 'ok' })
    renewSession.mockResolvedValue({ accessToken: 'access-2' })

    await expect(useApi()('/catalog/plans')).resolves.toEqual({ data: 'ok' })
    expect(renewSession).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('manda a la pantalla de acceso cuando la renovacion falla', async () => {
    fetchMock.mockRejectedValue(buildHttpError(401))
    renewSession.mockResolvedValue(null)

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/', query: { motivo: 'sesion-expirada' } })
    )
  })

  it('no reintenta dos veces si el reintento tambien devuelve 401', async () => {
    fetchMock.mockRejectedValue(buildHttpError(401))
    renewSession.mockResolvedValue({ accessToken: 'access-2' })

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('avisa de forma global cuando falla la red', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', detail: 'api_error_network' })
    )
  })

  it('sin red en el dispositivo no repite el aviso: ya lo dicen la franja y la vista', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(toastAdd).not.toHaveBeenCalled()
    onLine.mockRestore()
  })

  it('muestra el titulo y detalle del API cuando el servidor falla con contrato', async () => {
    fetchMock.mockRejectedValue(
      buildHttpError(500, {
        title: 'Error interno',
        detail: 'Vuelve a intentarlo.',
        key: 'error-interno',
        code: 'VMH.SYS.INTERNAL_ERROR'
      })
    )

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Error interno', detail: 'Vuelve a intentarlo.' })
    )
  })

  it('deja los 4xx al llamador, sin aviso global', async () => {
    fetchMock.mockRejectedValue(buildHttpError(422, { title: 'Datos invalidos' }))

    await expect(useApi()('/catalog/plans')).rejects.toBeDefined()
    expect(toastAdd).not.toHaveBeenCalled()
  })
})
