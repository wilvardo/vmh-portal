import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { AppUpdateSource } from '../domain/app-update-source.interface'
import { useAppUpdate } from './use-app-update'

const reloadAfterSwap = vi.fn(async (): Promise<void> => undefined)

const buildSource = (needRefresh: boolean): AppUpdateSource => ({
  needRefresh: ref(needRefresh),
  updateServiceWorker: vi.fn(async (): Promise<void> => undefined),
  cancelPrompt: vi.fn(async (): Promise<void> => undefined)
})

describe('useAppUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('se muestra solo cuando hay una version esperando', () => {
    expect(useAppUpdate({ source: buildSource(true), reloadAfterSwap }).isVisible.value).toBe(true)
    expect(useAppUpdate({ source: buildSource(false), reloadAfterSwap }).isVisible.value).toBe(
      false
    )
  })

  it('sin service worker no existe el aviso', async () => {
    const appUpdate = useAppUpdate({ source: undefined, reloadAfterSwap })

    await appUpdate.update()

    expect(appUpdate.isVisible.value).toBe(false)
    expect(appUpdate.isUpdating.value).toBe(false)
    expect(reloadAfterSwap).not.toHaveBeenCalled()
  })

  it('actualizar activa la version y recarga cuando toma el control', async () => {
    const source = buildSource(true)
    const appUpdate = useAppUpdate({ source, reloadAfterSwap })

    await appUpdate.update()

    expect(source.updateServiceWorker).toHaveBeenCalledWith(false)
    expect(reloadAfterSwap).toHaveBeenCalledTimes(1)
    expect(appUpdate.isUpdating.value).toBe(true)
  })

  it('si falla la activacion, el aviso queda listo para reintentar', async () => {
    const source = buildSource(true)
    vi.mocked(source.updateServiceWorker).mockRejectedValueOnce(new Error('sin red'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const appUpdate = useAppUpdate({ source, reloadAfterSwap })

    await appUpdate.update()

    expect(appUpdate.isUpdating.value).toBe(false)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('despues descarta el aviso hasta la siguiente version', async () => {
    const source = buildSource(true)

    await useAppUpdate({ source, reloadAfterSwap }).dismiss()

    expect(source.cancelPrompt).toHaveBeenCalledTimes(1)
  })
})
