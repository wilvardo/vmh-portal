// Calcula los hashes CSP de los scripts en linea que Nuxt escribe en la cascara
// generada, y los deja en un archivo que Caddy lee al servir.
//
// Por que: con `ssr: false`, `nuxt generate` escribe dos scripts en linea en
// cada HTML: el mapa de importacion de la entrada y `window.__NUXT__.config`
// (configuracion publica y preset del tema). Su contenido cambia con cada build
// y con cada entorno (la URL del API se fija en el build), asi que el hash no
// puede vivir escrito a mano en el Caddyfile: se calcula aqui, despues de
// generar, y viaja dentro de la imagen junto con los archivos que describe.
// Asi `script-src` no necesita `'unsafe-inline'`.
//
// Uso: node scripts/csp/inline-script-hashes.mjs <carpeta-generada> <archivo-salida>

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi

/** Tipos de script que el navegador no ejecuta: bloques de datos fuera de CSP. */
const DATA_BLOCK_TYPE = /\btype\s*=\s*["']?application\/(?:ld\+)?json/i

/** Un script con `src` no es en linea: lo cubre `'self'`. */
const EXTERNAL_SOURCE = /\bsrc\s*=/i

/**
 * Hash CSP de un contenido de script, tal como lo calcula el navegador: SHA-256
 * de los bytes UTF-8 exactos entre las etiquetas, en base64.
 *
 * @param {string} content Contenido del script.
 * @returns {string} La fuente CSP, entre comillas simples.
 */
export function cspHash(content) {
  const digest = createHash('sha256').update(content, 'utf8').digest('base64')
  return `'sha256-${digest}'`
}

/**
 * Hashes de los scripts en linea ejecutables de un HTML.
 *
 * @param {string} html Documento.
 * @returns {string[]} Fuentes CSP, sin repetir, en orden de aparicion.
 */
export function collectInlineScriptHashes(html) {
  const hashes = []
  for (const match of html.matchAll(SCRIPT_TAG)) {
    const [, attributes, content] = match
    if (EXTERNAL_SOURCE.test(attributes) || DATA_BLOCK_TYPE.test(attributes)) continue
    if (content.trim() === '') continue

    const hash = cspHash(content)
    if (!hashes.includes(hash)) hashes.push(hash)
  }
  return hashes
}

/**
 * Recorre la carpeta generada y junta los hashes de todos sus HTML.
 *
 * @param {string} dir Carpeta generada.
 * @returns {string[]} Fuentes CSP, sin repetir y ordenadas.
 */
export function collectFromDirectory(dir) {
  const hashes = new Set()
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.html')) {
        for (const hash of collectInlineScriptHashes(readFileSync(full, 'utf8'))) hashes.add(hash)
      }
    }
  }
  walk(dir)
  return [...hashes].sort()
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const [dir, output] = process.argv.slice(2)
  if (!dir || !output) {
    console.error(
      'Uso: node scripts/csp/inline-script-hashes.mjs <carpeta-generada> <archivo-salida>'
    )
    process.exit(1)
  }

  const hashes = collectFromDirectory(dir)
  // Sin hashes la cascara no arrancaria bajo la CSP: mejor que falle el build.
  if (hashes.length === 0) {
    console.error(`inline-script-hashes: no se encontraron scripts en linea en ${dir}`)
    process.exit(1)
  }

  writeFileSync(output, hashes.join(' '))
  console.error(`inline-script-hashes: ${hashes.length} hash(es) en ${output}`)
}
