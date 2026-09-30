import { LEGAL_SITE_PATH } from './legal-link.const'
import type { LegalLinks } from './legal-link.interface'

/**
 * Arma los enlaces a los documentos legales del sitio.
 *
 * Sin la direccion del sitio no hay enlaces: apuntar a una ruta relativa
 * mandaria a la persona a una pagina que el portal no tiene.
 *
 * @param siteUrl Direccion del sitio publico, o cadena vacia.
 * @returns Los dos enlaces, o `null` si no hay sitio configurado.
 */
export const buildLegalLinks = (siteUrl: string): LegalLinks | null => {
  const base = siteUrl.trim().replace(/\/+$/, '')
  if (base === '') return null

  return {
    privacy: `${base}${LEGAL_SITE_PATH.PRIVACY}`,
    terms: `${base}${LEGAL_SITE_PATH.TERMS}`
  }
}
