#!/usr/bin/env node
/**
 * Lint de terminologia del portal vmh-portal.
 *
 * Enforza por CI tres familias de reglas que ningun linter estandar cubre:
 *
 * 1. FRONTERA DE CLIENTE. El portal se funda como espejo estructural de
 *    `vmh-landlord`, que a su vez se fundo desde cero: ninguno arrastra el
 *    esqueleto heredado que era el clon del repositorio de otro cliente. Ninguna mencion a ese producto, su stack de
 *    autenticacion ni su tipografia puede aparecer en este repo: no es una
 *    cuestion de estilo, es una frontera contractual.
 * 2. Reglas de negocio de marca (VMH-05): el sufijo de marca sigue pendiente de
 *    IMPI y se escribe solo via `PORTAL_BRAND_NAME`; el catalogo pactado no
 *    incluye un plan "Bienal".
 * 3. Cero emojis, en codigo, comentarios, textos de interfaz y documentacion
 *    (regla dura del proyecto y del design system, MASTER 10).
 *
 * Uso:
 *   node scripts/lint-terminology.mjs              # Recorre el repo completo
 *   node scripts/lint-terminology.mjs path1 path2  # Limita a las rutas dadas
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')

const TERMS = [
  { name: 'producto de otro cliente (frontera)', pattern: /valanserh/giu },
  { name: 'producto de otro cliente (frontera)', pattern: /\bgsti\b/giu },
  { name: 'stack de auth del esqueleto retirado', pattern: /sidebase|next-auth/giu },
  { name: 'tipografia del esqueleto retirado', pattern: /\bmulish\b/giu },
  { name: 'plan Bienal (fuera de catalogo)', pattern: /\bbienal\b/giu },
  { name: 'sufijo de marca pendiente de IMPI', pattern: /\bVMH\s+(studio|training)\b/giu },
  { name: 'dominio pendiente de IMPI', pattern: /vmh\.(studio|training)\b/giu },
  { name: 'emoji', pattern: /\p{Extended_Pictographic}/gu }
]

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.husky',
  '.nuxt',
  '.output',
  '.data',
  '.nitro',
  '.cache',
  'dist',
  'coverage'
])

const EXCLUDED_FILES = new Set(['pnpm-lock.yaml', 'lint-terminology.mjs'])
const TEXT_EXTENSIONS =
  /\.(ts|vue|scss|css|json|md|mjs|js|yml|yaml|html|txt|svg|mdc|example|conf)$/i

/** Recorre el arbol de archivos aplicando exclusiones. */
const walk = async (dir) => {
  const out = []
  for (const entry of await readdir(dir)) {
    // Lo retirado con prefijo __DELETED__ ya no es fuente del repo.
    if (EXCLUDED_DIRS.has(entry) || entry.startsWith('__DELETED__')) continue
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) out.push(...(await walk(full)))
    else out.push(full)
  }
  return out
}

const targets = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const roots = targets.length > 0 ? targets.map((t) => resolve(ROOT, t)) : [ROOT]

let files = []
for (const root of roots) {
  const info = await stat(root)
  if (info.isDirectory()) files.push(...(await walk(root)))
  else files.push(root)
}
files = files.filter(
  (f) => TEXT_EXTENSIONS.test(f) && !EXCLUDED_FILES.has(f.split('/').pop() ?? '')
)

const hits = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  const lines = content.split('\n')
  for (const term of TERMS) {
    for (let i = 0; i < lines.length; i++) {
      term.pattern.lastIndex = 0
      const match = term.pattern.exec(lines[i])
      if (match) {
        hits.push({
          file: relative(ROOT, file),
          line: i + 1,
          term: term.name,
          excerpt: lines[i].trim().slice(0, 80)
        })
      }
    }
  }
}

if (hits.length > 0) {
  console.error(`\nTerminologia restringida (${hits.length} hits):`)
  for (const h of hits) console.error(`  - ${h.file}:${h.line} [${h.term}] ${h.excerpt}`)
  console.error('\nVer scripts/lint-terminology.mjs (cabecera) para el porque de cada regla.\n')
  process.exit(1)
}

console.log('Terminologia OK: sin residuos de otro cliente ni violaciones de reglas de marca.')
