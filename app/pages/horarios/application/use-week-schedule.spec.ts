import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WeekSchedule } from '../domain/schedule.interface'
import { useWeekSchedule } from './use-week-schedule'

const weekOf = (weekStart: string): WeekSchedule => ({
  weekStart,
  weekEnd: weekStart,
  evaluationPending: false,
  days: []
})

describe('useWeekSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('arranca en la semana en curso y navega de lunes a lunes', async () => {
    const load = vi
      .fn()
      .mockImplementation((weekStart?: string) =>
        Promise.resolve(weekOf(weekStart ?? '2026-10-05'))
      )
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })

    await week.current()
    await week.next()
    await week.previous()
    await week.previous()

    expect(load.mock.calls).toEqual([[undefined], ['2026-10-12'], ['2026-10-05'], ['2026-09-28']])
    expect(week.schedule.value?.weekStart).toBe('2026-09-28')
  })

  it('refrescar vuelve a pedir la semana que se esta viendo', async () => {
    const load = vi.fn().mockResolvedValue(weekOf('2026-10-12'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })

    await week.current()
    await week.refresh()

    expect(load).toHaveBeenLastCalledWith('2026-10-12')
  })

  it('ante un error no deja pintada la semana anterior', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(weekOf('2026-10-05'))
      .mockRejectedValueOnce(new Error('la red se cayo'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })

    await week.current()
    await week.next()

    expect(week.schedule.value).toBeNull()
    expect(week.errorTitle.value).toBe('No se pudo cargar')
    expect(week.isLoading.value).toBe(false)
  })

  it('tras un error, reintentar pide la misma semana que fallo', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(weekOf('2026-10-05'))
      .mockRejectedValueOnce(new Error('la red se cayo'))
      .mockResolvedValueOnce(weekOf('2026-10-12'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })

    await week.current()
    await week.next()
    await week.refresh()

    expect(load).toHaveBeenLastCalledWith('2026-10-12')
    expect(week.schedule.value?.weekStart).toBe('2026-10-12')
  })

  it('en vivo trae la semana que se ve sin esqueleto de carga', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(weekOf('2026-10-12'))
      .mockResolvedValueOnce({ ...weekOf('2026-10-12'), evaluationPending: true })
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })
    await week.current()

    const pending = week.sync()
    expect(week.isLoading.value).toBe(false)
    await pending

    expect(load).toHaveBeenLastCalledWith('2026-10-12')
    expect(week.schedule.value?.evaluationPending).toBe(true)
  })

  it('en vivo, si falla, se queda con la semana que ya estaba', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce(weekOf('2026-10-12'))
      .mockRejectedValueOnce(new Error('red'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })
    await week.current()

    await week.sync()

    expect(week.schedule.value?.weekStart).toBe('2026-10-12')
    expect(week.errorTitle.value).toBe('')
  })

  it('en vivo descarta la respuesta si mientras tanto se cambio de semana', async () => {
    let resolveLate: (value: WeekSchedule) => void = () => undefined
    const load = vi
      .fn()
      .mockResolvedValueOnce(weekOf('2026-10-12'))
      .mockImplementationOnce(() => new Promise<WeekSchedule>((resolve) => (resolveLate = resolve)))
      .mockResolvedValueOnce(weekOf('2026-10-19'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })
    await week.current()

    const pending = week.sync()
    await week.next()
    resolveLate(weekOf('2026-10-12'))
    await pending

    expect(week.schedule.value?.weekStart).toBe('2026-10-19')
  })

  it('en vivo, con la pantalla en error, reintenta la carga normal', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('red'))
      .mockResolvedValueOnce(weekOf('2026-10-12'))
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })
    await week.current()

    await week.sync()

    expect(week.schedule.value?.weekStart).toBe('2026-10-12')
    expect(week.errorTitle.value).toBe('')
  })

  it('en vivo no pide nada si la semana nunca se cargo', async () => {
    const load = vi.fn()
    const week = useWeekSchedule({ load, loadErrorTitle: 'No se pudo cargar' })

    await week.sync()

    expect(load).not.toHaveBeenCalled()
  })
})
