# Auditoria de cumplimiento — paso obligatorio antes de reportar listo

Antes de reportar cualquier tarea como "lista" / "completa" / "terminada" en este repo, ejecuta **mentalmente la checklist completa de abajo y reporta cada item como OK verificado, X violado, o N/A**. Si encuentras un X, vuelve a editar y solo entonces reporta listo.

Si la respuesta tiene cambios en uno o mas archivos `.vue`, `.ts`, `.scss` o `.json` del proyecto, esta checklist aplica. Para respuestas puramente conversacionales, salta directo a la respuesta.

## Que valida la maquina vs que valida el review

| Herramienta | Enforza |
|---|---|
| **ESLint** (`pnpm lint`) | `any`, `console.log`, clases legacy, **fronteras hexagonales**, **cliente HTTP solo en infrastructure**, import de `@tabler/icons-vue`, **JSDoc en funciones exportadas**. |
| **Stylelint** (`pnpm lint:styles`) | Sin hex/`rgb()` literal en propiedades de color; tokens (`var(--color-*)`)/`color-mix`. |
| **lint-terminology** (`pnpm lint:terminology`) | Frontera de cliente (producto de origen, stack y tipografia del esqueleto retirado), reglas de marca (sufijo IMPI, plazos fuera de catalogo) y **emojis**. |
| **check-conventions** (`pnpm check:conventions`) | Naming kebab-case, sufijos de categoria en `domain/`, **tests colocados**. |
| **typecheck** (`pnpm typecheck`) | TS estricto, import del `script` sin extension. |
| **Vitest** (`pnpm test`) | Suite en verde. |
| **commitlint** | Conventional Commits. |

Corre todo junto con **`pnpm validate`**. Lo que queda a review: el **idioma** (codigo en ingles / JSDoc en espanol), el JSDoc de funciones **internas**, la autonomia i18n por slice, la densidad correcta del panel, que el preset (y no un parche de pagina) sostenga la apariencia, y que el test realmente **pruebe algo util**.

## Checklist por archivo tocado

### 1. TypeScript / Composition API

- [ ] Sin `any`, `// @ts-ignore`, `// @ts-expect-error` sin justificar.
- [ ] Sin `console.log`; `console.error` solo en `catch` con prefijo identificable.
- [ ] Funciones publicas / composables / repos / tipos publicos con JSDoc en espanol, sin `@example`.
- [ ] Composables de `application/` reciben mensajes, peticiones y navegacion por inyeccion (salvo excepciones de `architecture.md`).
- [ ] Repos con `params: FooParams` (object unico) que devuelven el tipo del slice y descartan campos extra.
- [ ] Accesos a `window`/`document`/`localStorage` con guard.
- [ ] Constantes en SCREAMING_SNAKE_CASE en `domain/<slug>.const.ts`.

### 2. Vue Template

- [ ] Todo texto visible usa `$t('clave')` — cero hardcoded.
- [ ] La marca NUNCA escrita literal con sufijo; siempre via `PANEL_BRAND_NAME`.
- [ ] Iconos como SVG directo de tablericons.com con `currentColor`, `aria-hidden` y `focusable="false"`.
- [ ] Componentes de PrimeVue configurados con sus props, no con clases utilitarias.
- [ ] Una sola accion primaria por vista; botones segun `components.md`.
- [ ] Un `h1` por pagina; controles accesibles (`aria-label`, `aria-expanded`, foco visible).

### 3. Estilos (`.scss`)

- [ ] Todo color via token o `color-mix`.
- [ ] BEM: bloque raiz unico kebab-case, `&__elemento`, `&--modifier`; sin selectores profundos.
- [ ] Sin selectores de clases internas de PrimeVue en el slice (van al preset o a `_primevue-overrides.scss`).
- [ ] `@media` con custom-media (`--bp-*`); sin px hardcoded en media queries.
- [ ] Densidad de panel respetada (campo 36px, fila 44px, cuerpo 14px).
- [ ] Textos variables truncan con elipsis (`min-width: 0` en flex; `minmax(0, 1fr)` en grid).

### 4. i18n (`*.json`)

- [ ] Toda clave que el slice usa vive en su `domain/locales/<slice>.es.json` (autonomia total).
- [ ] El archivo cubre el 100% de las claves que el template/script usa.
- [ ] Sin claves nuevas de slice en `i18n/locales/es.json` (reservado a textos sin slice: error, arranque, avisos del cliente HTTP).
- [ ] `mergeLocaleMessage` ANTES de invocar composables que dependan de esas claves.

### 5. Arquitectura del slice

- [ ] Presentacional: solo `index.vue` + `script.ts` + `style.scss` (+ locales si tiene textos propios). Con logica: estructura hexagonal completa.
- [ ] `domain/` no importa de Vue/Nuxt/PrimeVue/servicios; `application/` pasa por `infrastructure/`.
- [ ] El API se consume por `useApi()` desde un repositorio, nunca inline.
- [ ] Los cinco estados presentes en toda vista con datos remotos.

### 6. Reglas de negocio

- [ ] Ninguna validacion ni calculo que el API no tenga se implemento "mientras tanto". Si falta, se reporta.
- [ ] Importes y ahorros pintados como los devuelve el servidor.
- [ ] Errores mostrados con `title`/`detail`; `key` y `code` solo registrados.

### 7. Tests (`*.spec.ts`)

- [ ] Cada helper de `domain/`, composable con ramas y repositorio tiene su spec colocado.
- [ ] `describe`/`it` en espanol; cero `any`; camino de error cubierto.
- [ ] Datos de prueba inventados, nunca datos reales de personas.
- [ ] `pnpm test` en verde antes de reportar.

### 8. Forbidden cross-check

- [ ] Ninguna entrada de `forbidden.md` violada, empezando por la frontera de cliente.

## Como reportar la auditoria

Al final de la respuesta, antes del summary, una linea concisa:

> **Compliance:** 8/8 secciones OK — sin forbidden violado, BEM + tokens, i18n autonomo por slice, hexagonal respetada, cliente HTTP unico, tests presentes y en verde.

Si hay X o N/A, documentar cual y por que. Sin esta linea, la tarea **no esta entregada**.
