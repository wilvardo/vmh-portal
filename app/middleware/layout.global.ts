import { isPublicPath } from '~/resources/scripts/domain/session.helpers'

/**
 * Asigna el armazon de cada ruta: el del portal (una columna con encabezado) o
 * el de acceso (una tarjeta centrada).
 *
 * Vive en un middleware y no en cada pagina porque las vistas del portal usan el
 * patron `script.ts` y `definePageMeta` no se extrae de un script importado.
 * Decidirlo aqui ademas evita el parpadeo: el layout queda resuelto antes de
 * montar la vista.
 */
export default defineNuxtRouteMiddleware((to) => {
  setPageLayout(isPublicPath(to.path) ? 'guest' : 'default')
})
