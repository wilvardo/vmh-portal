#!/usr/bin/env node
// Guard de seguridad de datos para agentes (hook PreToolUse de Claude Code).
// Bloquea escrituras/DDL/borrados contra la BD (Neon MCP `run_sql` y comandos
// Bash) y evita que la app o los tests se ejecuten apuntando a un host de
// produccion. La politica completa vive en `.claude/rules/data-safety.md`;
// este archivo es la fuente de verdad de la logica que la hace cumplir.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Palabras clave SQL que implican escritura, DDL o cambio de permisos.
 * Su sola presencia marca la sentencia como no-lectura (bloqueo).
 * `ANALYZE`/`VACUUM`/`SET` se incluyen a proposito aunque a veces acompanen
 * a un `EXPLAIN` benigno: el bloqueo conservador es preferible a dejar pasar
 * una escritura, y el usuario siempre puede correr la consulta a mano.
 */
const SQL_WRITE_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE',
  'CALL',
  'DO',
  'COPY',
  'VACUUM',
  'REINDEX',
  'REFRESH',
  'COMMENT',
  'LOCK',
  'SET',
  'ANALYZE',
  'CLUSTER'
]

/** Primeras palabras admitidas para considerar una sentencia de solo lectura. */
const SQL_READ_STARTERS = ['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'VALUES', 'TABLE']

/** Patrones de comando Bash que tocan o borran una BD de forma destructiva. */
const BASH_DESTRUCTIVE_PATTERNS = [
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|COLUMN|VIEW|TYPE|SEQUENCE)\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bmigration:(fresh|reset|rollback|refresh)\b/i,
  /\bdb:(wipe|seed|drop)\b/i,
  /\bprisma\s+migrate\s+reset\b/i,
  /\bprisma\s+db\s+push\b/i,
  /\btypeorm\b[^\n]*\bschema:drop\b/i,
  /\bsequelize\b[^\n]*\bdb:drop\b/i,
  /\bknex\b[^\n]*\bmigrate:rollback\b/i,
  /\b(psql|mysql|mysqladmin|mongosh|mongo|redis-cli|pg_dump|pg_dumpall|pg_restore)\b/i
]

/** Comandos que arrancan la app o los tests: disparan el guard de host prod. */
const BASH_RUNTIME_PATTERNS = [
  /\b(nuxt|nuxi)\b[^\n]*\b(dev|build|preview|start|generate)\b/i,
  /\bpnpm\s+(run\s+)?(dev|build|preview|start|generate|test|test:watch|test:coverage)\b/i,
  /\b(vitest|playwright)\b/i
]

/**
 * Quita comentarios SQL (bloque y de linea) para analizar la sentencia limpia.
 * @param {string} sql
 * @returns {string}
 */
function stripSqlComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

/**
 * Clasifica una sentencia SQL como de solo lectura o no. Es conservador: ante
 * cualquier ambiguedad la marca como no-lectura para forzar el bloqueo.
 * @param {string} rawSql
 * @returns {{ readOnly: boolean, reason: string }}
 */
export function classifyNeonSql(rawSql) {
  const cleaned = stripSqlComments(String(rawSql ?? '')).trim()
  if (!cleaned) {
    return { readOnly: false, reason: 'SQL vacio o ilegible.' }
  }
  const withoutTrailing = cleaned.replace(/;\s*$/, '')
  if (withoutTrailing.includes(';')) {
    return { readOnly: false, reason: 'Multiples sentencias (;) no permitidas en modo lectura.' }
  }
  const upper = withoutTrailing.toUpperCase()
  for (const keyword of SQL_WRITE_KEYWORDS) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      return { readOnly: false, reason: `Palabra clave de escritura/DDL detectada: ${keyword}.` }
    }
  }
  const firstWord = upper.match(/^[A-Z]+/)?.[0] ?? ''
  if (!SQL_READ_STARTERS.includes(firstWord)) {
    return {
      readOnly: false,
      reason: `La sentencia no inicia con una palabra de solo lectura (inicia con "${firstWord}").`
    }
  }
  return { readOnly: true, reason: 'Sentencia de solo lectura.' }
}

/**
 * Extrae los hosts declarados en el contenido de un `.env` a partir de las
 * variables `BASE_API_PATH` y `SOCKET`.
 * @param {string} envContent
 * @returns {string[]}
 */
export function extractEnvHosts(envContent) {
  const hosts = []
  for (const line of String(envContent ?? '').split('\n')) {
    const match = line.match(/^\s*(BASE_API_PATH|SOCKET)\s*=\s*(.+?)\s*$/)
    if (!match) continue
    const value = match[2].replace(/^["']|["']$/g, '')
    try {
      hosts.push(new URL(value).host.toLowerCase())
    } catch {
      // El valor no es una URL parseable: no aporta host, se ignora.
    }
  }
  return hosts
}

/**
 * Devuelve el primer host que coincide con la lista de hosts de produccion.
 * La coincidencia es por substring, sin distinguir mayusculas.
 * @param {string[]} hosts
 * @param {string[]} prodHosts
 * @returns {string | null}
 */
export function findProdHost(hosts, prodHosts) {
  for (const host of hosts) {
    for (const prod of prodHosts) {
      const needle = String(prod ?? '')
        .trim()
        .toLowerCase()
      if (needle && host.includes(needle)) {
        return host
      }
    }
  }
  return null
}

/**
 * Clasifica un comando Bash: destructivo de BD, o arranque de app/tests contra
 * un host de produccion. Cualquiera de los dos casos bloquea.
 * @param {string} command
 * @param {{ envContent: string, prodHosts: string[] }} context
 * @returns {{ blocked: boolean, reason: string }}
 */
export function classifyBashCommand(command, context) {
  const cmd = String(command ?? '')
  for (const pattern of BASH_DESTRUCTIVE_PATTERNS) {
    if (pattern.test(cmd)) {
      return {
        blocked: true,
        reason: `Comando destructivo o cliente de BD detectado (patron: ${pattern}).`
      }
    }
  }
  if (BASH_RUNTIME_PATTERNS.some((pattern) => pattern.test(cmd))) {
    const prodHost = findProdHost(extractEnvHosts(context.envContent), context.prodHosts)
    if (prodHost) {
      return {
        blocked: true,
        reason: `El .env apunta a un host de produccion (${prodHost}). No se ejecuta app/tests contra prod.`
      }
    }
  }
  return { blocked: false, reason: '' }
}

/**
 * Lee stdin completo (el JSON que el hook entrega por la entrada estandar).
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((res) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => res(data))
    process.stdin.on('error', () => res(''))
  })
}

/**
 * Lee un archivo devolviendo cadena vacia si no existe o no es legible.
 * @param {string} path
 * @returns {string}
 */
function safeReadFile(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
  }
}

/**
 * Lee la lista de hosts de produccion desde el JSON de configuracion.
 * @param {string} path
 * @returns {string[]}
 */
function readProdHosts(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(parsed.hosts) ? parsed.hosts : []
  } catch {
    return []
  }
}

/**
 * Emite el motivo a stderr y termina con codigo 2 (Claude Code lo interpreta
 * como bloqueo del tool y devuelve el mensaje al modelo).
 * @param {string} message
 * @returns {never}
 */
function block(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

/**
 * Punto de entrada del hook: evalua el tool entrante y bloquea si la politica
 * lo indica. Un JSON ilegible no bloquea (fail-open acotado a la lectura de
 * stdin) para no romper todo comando Bash ante un payload inesperado.
 * @returns {Promise<void>}
 */
async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  let payload
  try {
    payload = JSON.parse(await readStdin())
  } catch {
    process.exit(0)
  }
  const toolName = payload.tool_name ?? ''
  const toolInput = payload.tool_input ?? {}

  if (toolName === 'mcp__Neon__run_sql') {
    const { readOnly, reason } = classifyNeonSql(toolInput.sql)
    if (!readOnly) {
      block(
        `[data-safety] run_sql bloqueado: ${reason} Solo se permiten lecturas (SELECT/EXPLAIN/SHOW).`
      )
    }
    process.exit(0)
  }

  if (toolName === 'Bash') {
    const envContent = safeReadFile(resolve(projectDir, '.env'))
    const prodHosts = readProdHosts(resolve(projectDir, 'scripts/agent-safety/prod-hosts.json'))
    const { blocked, reason } = classifyBashCommand(toolInput.command, { envContent, prodHosts })
    if (blocked) {
      block(`[data-safety] Bash bloqueado: ${reason}`)
    }
    process.exit(0)
  }

  process.exit(0)
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main()
}
