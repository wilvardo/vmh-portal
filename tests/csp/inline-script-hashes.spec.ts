import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  collectFromDirectory,
  collectInlineScriptHashes,
  cspHash
} from '../../scripts/csp/inline-script-hashes.mjs'

const CONFIG_SCRIPT = 'window.__NUXT__={};window.__NUXT__.config={public:{}}'
const IMPORT_MAP = '{"imports":{"#entry":"/_nuxt/entry.js"}}'

/** Cascara como la que escribe `nuxt generate` con `ssr: false`. */
const shell = `<!DOCTYPE html><html><head>
<script type="importmap">${IMPORT_MAP}</script>
<script type="module" src="/_nuxt/entry.js" crossorigin></script>
</head><body><div id="__nuxt"></div>
<script>${CONFIG_SCRIPT}</script>
<script type="application/json" data-nuxt-data="nuxt-app" id="__NUXT_DATA__">[{"a":1}]</script>
</body></html>`

describe('cspHash', () => {
  it('calcula el SHA-256 en base64 que espera el navegador', () => {
    const expected = createHash('sha256').update('alert(1)', 'utf8').digest('base64')

    expect(cspHash('alert(1)')).toBe(`'sha256-${expected}'`)
  })

  it('respeta los bytes UTF-8 exactos', () => {
    expect(cspHash('ñ')).not.toBe(cspHash('n'))
  })
})

describe('collectInlineScriptHashes', () => {
  it('toma el mapa de importacion y la configuracion en linea', () => {
    expect(collectInlineScriptHashes(shell)).toEqual([cspHash(IMPORT_MAP), cspHash(CONFIG_SCRIPT)])
  })

  it('ignora los scripts con src y los bloques de datos JSON', () => {
    const hashes = collectInlineScriptHashes(shell)

    expect(hashes).not.toContain(cspHash('[{"a":1}]'))
    expect(hashes).toHaveLength(2)
  })

  it('no repite el hash de un script que aparece dos veces', () => {
    expect(collectInlineScriptHashes(`${shell}<script>${CONFIG_SCRIPT}</script>`)).toHaveLength(2)
  })

  it('un documento sin scripts en linea no da hashes', () => {
    expect(collectInlineScriptHashes('<html><script src="/a.js"></script></html>')).toEqual([])
  })
})

describe('collectFromDirectory', () => {
  it('junta los hashes de todas las paginas generadas sin repetir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vmh-portal-csp-'))
    writeFileSync(join(dir, 'index.html'), shell)
    mkdirSync(join(dir, 'horarios'))
    writeFileSync(join(dir, 'horarios', 'index.html'), shell)
    writeFileSync(join(dir, 'sw.js'), 'self.addEventListener("fetch", () => {})')

    expect(collectFromDirectory(dir)).toEqual([cspHash(IMPORT_MAP), cspHash(CONFIG_SCRIPT)].sort())
  })
})
