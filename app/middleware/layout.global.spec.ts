// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'
import {
  LOGIN_PATH,
  POST_LOGIN_REDIRECT_PATH,
  SET_PASSWORD_PATH
} from '~/resources/scripts/domain/session.const'
import layoutMiddleware from './layout.global'

const setLayout = vi.fn()

mockNuxtImport(
  'setPageLayout',
  () =>
    (...args: unknown[]) =>
      setLayout(...args)
)

/**
 * Ruta normalizada hacia la que navega la prueba, como la recibe un middleware.
 *
 * @param path Ruta de destino.
 * @returns La ruta resuelta por el enrutador del portal.
 */
const routeTo = (path: string): RouteLocationNormalized => {
  const { name, ...resolved } = useRouter().resolve(path)

  return { ...resolved, name: name ?? path }
}

/**
 * Corre el middleware de armazon hacia una ruta.
 *
 * @param path Ruta de destino.
 */
const resolveLayoutFor = (path: string): void => {
  const to = routeTo(path)
  layoutMiddleware(to, to)
}

describe('armazon de cada ruta', () => {
  beforeEach(() => {
    setLayout.mockReset()
  })

  it('las pantallas de acceso usan la tarjeta centrada', () => {
    resolveLayoutFor(LOGIN_PATH)
    resolveLayoutFor(SET_PASSWORD_PATH)

    expect(setLayout).toHaveBeenNthCalledWith(1, 'guest')
    expect(setLayout).toHaveBeenNthCalledWith(2, 'guest')
  })

  it('las del portal usan el armazon con encabezado', () => {
    resolveLayoutFor(POST_LOGIN_REDIRECT_PATH)

    expect(setLayout).toHaveBeenCalledWith('default')
  })
})
