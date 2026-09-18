# Testing

Los tests **no son opcionales**. Todo slice con lógica o componente con comportamiento se entrega con su prueba en el mismo turn. Un cambio sin su test correspondiente se considera **incompleto**, y el CI (`pnpm test`) bloquea el merge de un test rojo.

## Runner y ubicación

- Runner: **[Vitest](https://vitest.dev/)** con **[`@nuxt/test-utils`](https://nuxt.com/docs/getting-started/testing)**. Config en `vitest.config.ts` (entorno `happy-dom` por default).
- Los archivos de prueba viven **junto al código que prueban** (colocados en el slice), no en una carpeta `tests/` separada:
  - Helper de dominio → `domain/<slug>.helpers.spec.ts` al lado de `domain/<slug>.helpers.ts`.
  - Composable → `application/use-<slug>.spec.ts`.
  - Repositorio → `infrastructure/<slug>.repository.spec.ts`.
  - Componente → `index.spec.ts` en la raíz del slice.
- Nombre: `<slug>.spec.ts` (o `index.spec.ts` para el componente). El patrón de descubrimiento es `app/**/*.{test,spec}.ts` y `tests/**/*.{test,spec}.ts`.

## Qué se prueba por capa

La arquitectura hexagonal dicta qué probar y cómo. Cada capa se prueba en su nivel, sin arrastrar dependencias de las de afuera.

### `domain/` — obligatorio, es lo más barato de probar

- **Helpers puros** (`<slug>.helpers.ts`): entran por parámetro, devuelven valor, sin estado. Son funciones puras → test directo de entrada/salida, incluyendo casos borde (vacío, `null`, límites de las constantes del dominio).
- No requieren mocks: no tocan Vue, Nuxt ni servicios. Si un helper necesita un mock, probablemente no pertenece a `domain/`.

### `application/` — obligatorio cuando hay lógica de caso de uso

- **Composables `use-*`**: se prueban inyectándoles sus dependencias como mocks planos (el diseño de `application/` ya exige recibir `showToast`, `messages`, `user`, config, etc. por parámetro — ver `architecture.md`). Mock plano, no mock de hook de Nuxt.
- Cubrir: el camino feliz, el `catch` (que traduzca el error a la UX esperada — toast llamado, lista vacía, loader off) y las ramas condicionales relevantes.
- Los repos que consume el composable se mockean (`vi.fn()` que resuelve/rechaza), no se llama al backend real.

### `infrastructure/` — probar el mapeo y los guards

- **Repositorios**: verificar que mapean el response crudo del backend al tipo del slice (descartando campos extra) y que respetan el params object. Mockear el cliente HTTP (`vi.mock('ofetch', ...)` o el `useApi()` inyectado) y afirmar sobre el resultado mapeado. **El descarte de campos extra se prueba explícitamente**: es lo que evita que un dato del backend que nadie declaró termine en pantalla.
- **Guards de navegador**: si el repo accede a `window`/`localStorage`/`document`, probar que un contenido corrupto, ausente o de una versión anterior se trata como "sin dato" y no como un error que tumbe la aplicación.

### Componentes (`index.vue` + `script.ts`)

- Componentes **con comportamiento** (emiten eventos, tienen estado, reaccionan a props): montar con `mountSuspended` de `@nuxt/test-utils` y afirmar sobre el render y los `emit`.
- Los tests de componente que necesiten el runtime de Nuxt declaran en su cabecera:
  ```ts
  // @vitest-environment nuxt
  ```
- Lo mismo aplica a los composables **globales** (`useApi`, `useSession`) y a cualquier
  slice que dependa de `useState`, `useRuntimeConfig` o `useRoute`: entorno `nuxt` y
  `mockNuxtImport` para sustituir los auto-imports (`useToast`, `useI18n`, `navigateTo`).
  Los composables de `application/` **no** deberían necesitarlo: si reciben todo por
  inyección, corren en `happy-dom` sin runtime de Nuxt. Que un caso de uso exija el
  entorno `nuxt` es señal de que está invocando un hook que no le toca.
- Componentes **presentacionales triviales** (un botón que emite un `click` sin lógica): un smoke test que verifique que renderiza y emite es suficiente; no se sobre-testea.

## Reglas de escritura de tests

- **En español** los `describe`/`it` (mismo idioma que comentarios y JSDoc). Clases, funciones y variables en inglés.
- **Aislar la unidad**: mockear las dependencias de las capas externas, nunca golpear red, `localStorage` real ni el reloj del sistema sin controlarlo (`vi.useFakeTimers()` cuando aplique).
- **Cero `any`** también en los tests. Tipar los mocks. Sin `// @ts-ignore` salvo justificación documentada (aplica `code-style.md` y `forbidden.md`).
- **Datos inventados, nunca datos reales de personas.** El panel opera sobre datos personales de atletas y personal: ningún nombre, correo o teléfono real entra a un test, un fixture o una captura (ver `data-safety.md`).
- **Un comportamiento por `it`**. El nombre del `it` describe el comportamiento esperado, no la implementación.
- **Sin `console.log`** dejado en el test. Limpiar mocks entre casos (`vi.clearAllMocks()` en `afterEach` o `beforeEach`).
- Cubrir el **camino de error**, no solo el feliz: es donde más regresiona el código.

## Scripts

| Comando | Uso |
|---|---|
| `pnpm test` | Corre toda la suite una vez (lo que corre el CI). |
| `pnpm test:watch` | Modo watch durante el desarrollo. |
| `pnpm test:coverage` | Suite + reporte de cobertura (v8) en `text` + `html`. |

## Cobertura

- La cobertura se mide sobre `app/**/*.{ts,vue}` (excluye `*.spec.ts` y `domain/locales/**`).
- No se persigue un porcentaje ciego: se persigue que **toda la lógica de negocio** (helpers, casos de uso, mapeos, guards) esté cubierta. Un helper de `domain/` sin test es un fallo de la revisión, no una métrica opcional.

## Definición de "hecho" respecto a tests

Un slice está entregado, respecto a testing, cuando:

- Cada helper de `domain/` con lógica tiene su `.spec.ts`.
- Cada composable de `application/` con ramas (feliz + error) tiene su `.spec.ts`.
- Cada repositorio con mapeo o guard SSR tiene su `.spec.ts`.
- Cada componente con comportamiento tiene su `index.spec.ts`.
- `pnpm test` pasa en verde localmente antes de reportar la tarea como completa.
