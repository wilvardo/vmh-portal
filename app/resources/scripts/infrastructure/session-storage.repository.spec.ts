import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_ROLE } from '../domain/auth-role.enum'
import { SESSION_STORAGE_KEY } from '../domain/session.const'
import type { AuthSession } from '../domain/session.interface'
import {
  clearStoredSession,
  readStoredSession,
  watchStoredSession,
  writeStoredSession
} from './session-storage.repository'

const buildSession = (): AuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 1,
    firstName: 'Victoria',
    lastName: 'Mendoza',
    email: 'admin@vmh.mx',
    role: AUTH_ROLE.ADMIN
  }
})

describe('repositorio de sesion en almacenamiento local', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve null cuando no hay sesion guardada', () => {
    expect(readStoredSession()).toBeNull()
  })

  it('guarda y recupera la sesion completa', () => {
    writeStoredSession({ session: buildSession() })
    expect(readStoredSession()).toEqual(buildSession())
  })

  it('trata un contenido corrupto como ausencia de sesion', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, '{ esto no es json')
    expect(readStoredSession()).toBeNull()
  })

  it('descarta una sesion guardada que ya no cumple el contrato', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: 'solo-eso' }))
    expect(readStoredSession()).toBeNull()
  })

  it('borra la sesion guardada', () => {
    writeStoredSession({ session: buildSession() })
    clearStoredSession()
    expect(readStoredSession()).toBeNull()
  })

  it('avisa cuando otra pestana inicia sesion', () => {
    const onChange = vi.fn()
    const stop = watchStoredSession({ onChange })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        newValue: JSON.stringify(buildSession())
      })
    )

    expect(onChange).toHaveBeenCalledWith(buildSession(), false)
    stop()
  })

  it('avisa con null cuando otra pestana cierra sesion, y que antes habia una', () => {
    const onChange = vi.fn()
    const stop = watchStoredSession({ onChange })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: SESSION_STORAGE_KEY,
        oldValue: JSON.stringify(buildSession()),
        newValue: null
      })
    )

    expect(onChange).toHaveBeenCalledWith(null, true)
    stop()
  })

  it('ignora cambios de otras claves del almacenamiento', () => {
    const onChange = vi.fn()
    const stop = watchStoredSession({ onChange })

    window.dispatchEvent(new StorageEvent('storage', { key: 'otra-cosa', newValue: 'x' }))

    expect(onChange).not.toHaveBeenCalled()
    stop()
  })

  it('deja de escuchar al liberar el observador', () => {
    const onChange = vi.fn()
    const stop = watchStoredSession({ onChange })
    stop()

    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_STORAGE_KEY, newValue: null }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
