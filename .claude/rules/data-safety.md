# Seguridad de datos frente a agentes

Candados que impiden que un asistente de IA altere o borre datos, y que fuerzan
que solo lea cuando es estrictamente necesario y bajo aprobacion. Nacen de un
incidente real (un agente altero una base de datos durante una sesion de tests).

> **Contexto de este repo.** `vmh-landlord` es una SPA de Nuxt que **no habla con
> ninguna base de datos**: todo pasa por `vmh-api`. Las tres reglas de esquema del
> API (todo cambio por migracion reversible, ninguna migracion integrada se edita,
> ningun dato de arranque por SQL suelto) **no aplican aqui** porque este repo no
> tiene esquema que proteger. Lo que si aplica son los candados a nivel del
> harness: que puede *hacer* el agente desde esta carpeta.

## Postura

- **Escrituras, DDL y borrados: bloqueo duro, sin excepcion.** El agente nunca
  ejecuta `INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER/CREATE/GRANT` ni migraciones
  destructivas, ni por MCPs de BD ni por Bash.
- **Lecturas: solo si son estrictamente necesarias y con aprobacion manual.**
- **Aislar datos: nunca apuntar a produccion.** El agente no puede arrancar la
  app ni los tests si el `.env` apunta a un host de produccion.

## Enforcement en Claude Code (duro)

Vive en `.claude/settings.json` (committed, politica de equipo) y en el hook
`scripts/agent-safety/db-and-data-guard.mjs` (`PreToolUse` sobre `Bash` y las
tools de BD): bloquea patrones destructivos y, para comandos que arrancan
app/tests, bloquea si el `.env` apunta a un host listado en
`scripts/agent-safety/prod-hosts.json` (placeholders = capa inerte hasta
configurar los dominios reales).

La logica del guard esta cubierta por `tests/agent-safety/db-and-data-guard.spec.ts`.
Un guard sin test es falsa seguridad.

## Datos personales en el panel

El panel muestra datos de personas reales (LFPDPPP). Reglas de trabajo:

- **Nunca pegar datos reales de atletas** en tests, fixtures, capturas de pantalla
  compartidas ni mensajes de commit. Los tests usan datos inventados.
- El panel **no persiste PII** en el navegador mas alla de la sesion: nombre,
  correo y rol de quien esta firmado. Nada mas entra a `localStorage`.
- Ninguna traza (`console.error` incluido) escribe contrasenas ni tokens.

### Limitaciones conocidas

- La deteccion es por substring sobre el texto del comando: seguro-por-defecto
  (falso positivo, no falso negativo).
- El guard corre en cada comando Bash; es el costo de la red de seguridad.
- Si `stdin` no trae un JSON legible, el guard no bloquea (fail-open acotado).
