// Valida convenciones del repo que ningun linter cubre, para atrapar cambios
// hechos a mano que violen las reglas. Enforza lo mecanico y objetivo:
//   1. Sin espacios en nombres de archivo bajo `app/`.
//   2. Nombres de archivo en kebab-case (los folders de componente camelCase son
//      validos y no se revisan aqui; ver architecture.md -> Nomenclatura).
//   3. `domain/` usa sufijos de categoria (.interface/.enum/.type/.const/.helpers).
//   4. Todo archivo de logica (helpers, use-*, *.repository, establish-*) trae su
//      `.spec.ts` colocado (regla de tests obligatorios; ver testing.md).
// El idioma (codigo en ingles / JSDoc en español) y la calidad del test se
// validan en review: ningun check automatico detecta el idioma natural.

import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const APP_DIR = 'app'

/** Recorre `dir` recursivamente y devuelve la lista de archivos (rutas relativas). */
const walk = (dir) => {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

// `_?` admite el guion bajo inicial de los partials SCSS (`_utilities.scss`).
const KEBAB_FILE = /^_?[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)*\.(ts|vue|scss|json)$/
const DOMAIN_SUFFIX = /\.(interface|enum|type|const|helpers|spec)\.ts$/
const LOGIC_FILE =
  /(\.helpers\.ts|\.repository\.ts)$|(^|\/)use-[a-z0-9-]+\.ts$|(^|\/)establish-[a-z0-9-]+\.ts$/

const files = walk(APP_DIR)
const violations = []

for (const file of files) {
  const name = basename(file)

  // 1. Sin espacios.
  if (name.includes(' ')) {
    violations.push(`Espacio en el nombre: ${file}`)
  }

  // 2. Kebab-case (solo archivos .ts/.vue/.scss/.json).
  if (/\.(ts|vue|scss|json)$/.test(name) && !KEBAB_FILE.test(name)) {
    violations.push(`Nombre no kebab-case: ${file}`)
  }

  // 3. domain/ con sufijo de categoria (excepto locales/).
  if (file.includes('/domain/') && name.endsWith('.ts') && !file.includes('/locales/')) {
    if (!DOMAIN_SUFFIX.test(name)) {
      violations.push(
        `domain/ sin sufijo de categoria (.interface/.enum/.type/.const/.helpers): ${file}`
      )
    }
  }

  // 4. Archivo de logica sin test colocado.
  const isSpec = name.endsWith('.spec.ts') || name.endsWith('.test.ts')
  if (name.endsWith('.ts') && !isSpec && LOGIC_FILE.test(file)) {
    const spec = file.replace(/\.ts$/, '.spec.ts')
    if (!existsSync(spec)) {
      violations.push(`Logica sin test colocado: ${file} (falta ${basename(spec)})`)
    }
  }
}

if (violations.length > 0) {
  console.error(`\nConvenciones incumplidas (${violations.length}):`)
  for (const v of violations) console.error(`  - ${v}`)
  console.error('\nVer .claude/rules/architecture.md (Nomenclatura) y testing.md.\n')
  process.exit(1)
}

console.log('Convenciones OK: naming, sufijos de domain y tests colocados.')
