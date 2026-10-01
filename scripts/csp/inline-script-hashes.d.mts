// Declaraciones de tipos para `inline-script-hashes.mjs`. Permiten que la spec
// (TS estricto) importe las funciones puras sin recurrir a `any`.

export function cspHash(content: string): string

export function collectInlineScriptHashes(html: string): string[]

export function collectFromDirectory(dir: string): string[]
