import type { PageTitleParts } from './page-header.interface'

/** Cierre que ya trae su propia entonacion y no recibe el punto de marca. */
const OWN_CLOSING = /[?!…:]$/

/**
 * Separa el titulo de pantalla en su texto y el punto final que se pinta en el
 * acento: la firma tipografica del sitio publico ("Vive con mas fuerza.") a
 * escala de app. Un titulo que ya cierra con punto lo conserva; uno que cierra
 * con pregunta, exclamacion o dos puntos se respeta tal cual.
 *
 * @param title Titulo de la pantalla ya traducido.
 * @returns El texto y el signo final por separado.
 */
export const splitPageTitle = (title: string): PageTitleParts => {
  const trimmed = title.trim()

  if (trimmed === '' || OWN_CLOSING.test(trimmed)) return { text: trimmed, mark: '' }
  if (trimmed.endsWith('.')) return { text: trimmed.slice(0, -1), mark: '.' }

  return { text: trimmed, mark: '.' }
}
