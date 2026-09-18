#!/usr/bin/env node
/**
 * Candado de tokens del portal.
 *
 * El SCSS del portal hoy no tiene un solo valor de color en literal. Este script
 * existe para que siga siendo cierto cuando se implemente el rediseño: el
 * prototipo es HTML con estilos en linea y copiarlo tal cual mete de golpe la
 * deuda que el sitio publico tardo meses en acumular.
 *
 * Falla el proceso si encuentra:
 *   - color en literal (hex, rgb, rgba, hsl) fuera de los archivos permitidos
 *   - letter-spacing que no salga de un token
 *   - border-radius con valor propio en vez de --radius-*
 *   - z-index numerico en vez de --z-*
 *   - sombra escrita a mano en vez de --elevation-* / --shadow-*
 *
 * Uso: node scripts/lint-tokens.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.join(import.meta.dirname, '..')
const OBJETIVO = [path.join(RAIZ, 'app'), path.join(RAIZ, 'theme')]

/** Los tokens son el unico lugar donde un color puede vivir en literal. */
const EXENTOS = [/design-system[/\\]tokens[/\\]/, /node_modules/, /\.spec\./]

const REGLAS = [
  {
    id: 'color-en-literal',
    prueba: /(?<![\w-])(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g,
    /** color-mix y las funciones de color de Sass sobre un token si valen. */
    perdona: (linea) => /var\(--/.test(linea) && /color-mix|rgb\(from|hsl\(from/.test(linea),
    mensaje:
      'Color en literal. Usa un alias semantico de tokens.css; si no existe, agregalo ahi con su ratio de contraste.'
  },
  {
    id: 'tracking-en-literal',
    prueba: /letter-spacing:\s*(?!.*var\(--)[^;]+;/g,
    mensaje:
      'letter-spacing con valor propio. La escala vive en --tracking-* (MASTER 5.3): wordmark .34, caption .22, label .16, boton .04, display .01, y los tres negativos.'
  },
  {
    id: 'radio-en-literal',
    prueba: /border-radius:\s*(?!.*(var\(--|50%|999px|0;|0 ))[^;]+;/g,
    mensaje:
      'border-radius con valor propio. Usa --radius-sm/md/lg/pill. En el portal el tope es --radius-lg.'
  },
  {
    id: 'z-index-en-literal',
    prueba: /z-index:\s*(?!.*(var\(--|auto|0;))-?\d+/g,
    mensaje: 'z-index numerico. La escala cerrada vive en --z-* (MASTER 18).'
  },
  {
    id: 'sombra-a-mano',
    prueba: /box-shadow:\s*(?!.*(var\(--|none))[^;]+;/g,
    mensaje:
      'Sombra escrita a mano. Usa --elevation-1/2/3. Y recuerda: nunca borde y sombra en la misma pieza.'
  }
]

const archivos = []
const recorrer = (dir) => {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorrer(p)
    else if (/\.(scss|css|vue|ts)$/.test(e.name) && !EXENTOS.some((r) => r.test(p)))
      archivos.push(p)
  }
}
OBJETIVO.forEach(recorrer)

const hallazgos = []
for (const archivo of archivos) {
  const lineas = fs.readFileSync(archivo, 'utf8').split('\n')
  lineas.forEach((linea, i) => {
    if (/^\s*(\/\/|\/\*|\*)/.test(linea)) return
    for (const regla of REGLAS) {
      regla.prueba.lastIndex = 0
      const m = regla.prueba.exec(linea)
      if (!m) continue
      if (regla.perdona?.(linea)) continue
      hallazgos.push({
        archivo: path.relative(RAIZ, archivo),
        linea: i + 1,
        regla,
        valor: m[0].trim()
      })
    }
  })
}

if (!hallazgos.length) {
  console.log(`Candado de tokens: limpio. ${archivos.length} archivos revisados.`)
  process.exit(0)
}

const porRegla = new Map()
for (const h of hallazgos) porRegla.set(h.regla.id, [...(porRegla.get(h.regla.id) ?? []), h])

console.error(
  `\nCandado de tokens: ${hallazgos.length} hallazgos en ${archivos.length} archivos.\n`
)
for (const [id, lista] of porRegla) {
  console.error(`  ${id} — ${lista.length}`)
  console.error(`  ${lista[0].regla.mensaje}`)
  for (const h of lista.slice(0, 8))
    console.error(`     ${h.archivo}:${h.linea}  ${h.valor.slice(0, 70)}`)
  if (lista.length > 8) console.error(`     … y ${lista.length - 8} mas`)
  console.error('')
}
process.exit(1)
