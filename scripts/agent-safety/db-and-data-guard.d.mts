// Declaraciones de tipos para el hook `db-and-data-guard.mjs`. Permiten que la
// spec (TS estricto) importe las funciones puras sin recurrir a `any`.

export function classifyNeonSql(rawSql: string): { readOnly: boolean; reason: string }

export function classifyBashCommand(
  command: string,
  context: { envContent: string; prodHosts: string[] },
): { blocked: boolean; reason: string }

export function extractEnvHosts(envContent: string): string[]

export function findProdHost(hosts: string[], prodHosts: string[]): string | null
