# Arquitectura

> **Nota de rutas (Nuxt 4).** El proyecto usa el directorio `app/` como `srcDir`
> (`future.compatibilityVersion: 4`). Todo el codigo de aplicacion vive bajo `app/`
> (`app/components/`, `app/pages/`, `app/composables/`, `app/plugins/`,
> `app/middleware/`, `app/layouts/`, `app/assets/`, `app/resources/`). La config raiz
> (`nuxt.config.ts`), `design-system/`, `theme/`, `i18n/` y `public/` permanecen en la raiz.

## Stack y entry points

- Nuxt 4 (`app/` srcDir, `compatibilityVersion: 4`, **`ssr: false`** — panel interno detras de sesion), Vue 3, TypeScript estricto.
- **PrimeVue 4** via `@primevue/nuxt-module`, con **preset propio** en `theme/primevue-preset.ts` alimentado por los tokens del design system. La libreria NO impone su apariencia: el MASTER manda sobre el preset y el preset manda sobre los componentes.
- `@nuxtjs/i18n` con `useI18n()`. Locale unico actual: **`es`**, strategy `'no_prefix'`. Si el panel se vuelve bilingue, se registra el idioma en `nuxt.config.ts` y se agregan los `<slice>.<lang>.json`.
- **Sesion propia**, sin libreria de auth: `useSession()` guarda el par de credenciales, `useApi()` firma y renueva, y `app/middleware/auth.global.ts` protege las rutas. Ver "Sesion" abajo.
- **Estado global**: hoy solo la sesion, resuelta con `useState` de Nuxt. Pinia se agrega cuando exista estado global real que lo justifique. No adelantar dependencias.
- Tokens del DS en `design-system/tokens/` (CSS custom properties). Es una **copia sincronizada** de la fuente del sistema: no se edita aqui (ver `styles.md`).

## Vertical slicing + hexagonal por componente

Todo componente con logica mas alla de presentacion pura usa esta forma. **El mismo patron aplica a `pages/<slug>/`** (entry de ruta). Nuxt registra como ruta unicamente los archivos `.vue` gracias al hook `pages:extend` de `nuxt.config.ts`; los `.ts`/`.json` del slice no se exponen como rutas.

```
app/components/<nombreComponente>/
  index.vue                <- template + import del script
  script.ts                <- defineComponent con setup() orquestador
  style.scss               <- estilos scoped del componente
  domain/                  <- tipos e invariantes puros (cero dependencias externas)
    <slug>.interface.ts    <- interfaces TS (formas de objeto del slice)
    <slug>.enum.ts         <- enums TS o constantes `as const` que actuan como enum
    <slug>.type.ts         <- type aliases (uniones, intersecciones, branded types)
    <slug>.const.ts        <- constantes de configuracion del dominio
    <slug>.helpers.ts      <- funciones puras del dominio
    locales/               <- mensajes i18n del slice (ver i18n.md)
      <slice>.<lang>.json
  application/             <- composables `use*` (casos de uso, orquestan dominio + infra)
    use-<slug>.ts
  infrastructure/          <- adaptadores: useApi(), storage, servicios HTTP
    <slug>.repository.ts
```

### Reglas de dependencia entre capas

- `domain/` no importa de `application/` ni de `infrastructure/`. Cero Vue, cero Nuxt, cero PrimeVue.
- `application/` puede importar de `domain/` y de `infrastructure/`. Aqui viven los composables y la orquestacion.
- `infrastructure/` puede importar de `domain/`. Es el unico lugar donde se tocan `useApi()`, `localStorage`, `window`, `navigator`.
- `script.ts` solo importa composables de `application/` (y mensajes de i18n + tipos puros) y los expone al template. Cero logica de negocio en `script.ts`.

Las tres reglas las verifica ESLint (`eslint-plugin-boundaries`): no son documentacion, son lint.

### Import del `script.ts` en el `index.vue`

El `<script lang="ts">` del `index.vue` reexporta su orquestador **sin extension**: `import Script from './script'` (nunca `'./script.ts'`). Un `import` con `.ts` explicito **falla `pnpm typecheck`** (TS2691) y por tanto el CI.

```vue
<script lang="ts">
import Script from './script'

export default Script
</script>
```

### `definePageMeta` no existe en este repo

El patron `script.ts` es incompatible con `definePageMeta`: Nuxt lo extrae en tiempo de compilacion del `<script setup>` del `.vue`, y aqui el script vive en un archivo aparte. Lo que normalmente se declararia ahi se resuelve en middleware global:

- **Layout** → `app/middleware/layout.global.ts` (armazon de trabajo vs. armazon de acceso).
- **Proteccion de ruta** → `app/middleware/auth.global.ts`.

Si una vista nueva necesita un layout distinto, se agrega la regla al middleware; no se abre un `<script setup>` paralelo en el SFC (el compilador de Vue no admite dos `setup`).

## Sesion

Tres piezas, cada una con una sola responsabilidad:

| Pieza | Responsabilidad |
|---|---|
| `app/resources/scripts/infrastructure/auth.repository.ts` | Habla con `/api/auth/*`. Mapea la respuesta al contrato del panel y descarta lo que no declara. |
| `app/composables/use-session.ts` | Estado de la sesion, persistencia, renovacion **single-flight** y sincronizacion entre pestañas. |
| `app/middleware/auth.global.ts` | Guardia fail-closed: quien no tiene sesion o rol de panel no pasa. |

Reglas que no se relajan:

1. **Un solo intento de renovacion a la vez.** El API rota el refresh en cada uso: dos renovaciones concurrentes con el mismo token se leen como reuso y el servidor revoca toda la familia de la sesion. El single-flight de `use-session.ts` es lo que evita cerrar la sesion de una persona por abrir dos pestañas.
2. **El rol se valida en el panel Y en el API.** La frontera dura es del servidor; el guardia del panel existe para no mostrar una pantalla en blanco a quien no tiene acceso.
3. **La contrasena no se guarda en ningun lado**, ni siquiera en memoria despues del intento.

## Consumo del API

- **Todo** endpoint se consume con `useApi()` desde un repositorio de `infrastructure/`, nunca inline en un componente. ESLint prohibe importar el cliente HTTP crudo fuera de `infrastructure/` y del propio `useApi()`.
- La URL base vive SOLO en `BASE_API_PATH` (`.env`).
- `useApi()` ya resuelve: Bearer, renovacion ante 401 con un reintento, y aviso global ante fallo de red o 5xx. Los 4xx los traduce a interfaz quien hizo la llamada.
- El contrato de error del API es `{ title, detail, key, code }`: se muestra `title` como encabezado y `detail` como cuerpo. `key` y `code` **nunca** se muestran; se registran.
- Toda vista con datos remotos implementa los cinco estados: default / loading (Skeleton) / empty / error (reintentar) / success.

## Nomenclatura

### General

- Carpetas y archivos en `kebab-case` salvo el folder del componente (que mantiene su nombre Vue, ej. `panelHeader/`).
- Composables siempre prefijados `use-*.ts`.
- Sufijos obligatorios: `.repository.ts` para repositorios.
- Clases y funciones en ingles; comentarios y JSDoc en espanol.

### Archivos por categoria de declaracion

Separar por categoria en archivos distintos. **Un archivo no mezcla categorias**:

| Categoria | Sufijo | Contenido |
|---|---|---|
| Interfaces TS | `<slug>.interface.ts` | Formas de objeto. Una interface principal por archivo. |
| Enums | `<slug>.enum.ts` | `enum X` nativo o `const X = { ... } as const`. |
| Type aliases | `<slug>.type.ts` | Uniones, intersecciones, branded types, `Pick`/`Omit` derivados. |
| Constantes | `<slug>.const.ts` | Limites, etiquetas, claves de storage, tablas inmutables. SCREAMING_SNAKE_CASE. |
| Funciones puras del dominio | `<slug>.helpers.ts` | Sin estado, sin Vue, sin Nuxt. Reciben todo por parametro. JSDoc. |
| Repositorios | `<slug>.repository.ts` | Adaptadores HTTP / storage / browser API. |
| Composables | `use-<slug>.ts` | Casos de uso de la capa de aplicacion. |

Convenciones de naming:
- El `<slug>` describe el concepto, no la categoria. `plan.interface.ts` (correcto), no `plan-interface.ts` ni `interfaces.ts`.
- Una interface central por archivo. Tipos satelite (<=2) pueden convivir si comparten la raiz semantica.
- En **import** referenciar el archivo por su `<slug>` sin la categoria: `import type { Foo } from '../domain/foo.interface'`.

## Inyeccion de dependencias en composables de `application/`

Los composables de `application/` **no** invocan hooks de la capa de presentacion: `useI18n`, `useToast`, `useRuntimeConfig`, `navigateTo`. Reciben los valores ya resueltos (mensajes traducidos, funciones de navegacion, peticiones ya cableadas a su URL base). Es lo que los vuelve testeables sin runtime de Nuxt.

Excepciones permitidas (documentar el motivo en el JSDoc):
- `useRoute` cuando el composable existe para derivar valores de la ruta.
- Composables cuya **unica responsabilidad es un concern de runtime del navegador** (atajos de teclado, observers, timers): el API del navegador es su razon de ser.
- Los composables globales `useApi()` y `useSession()`: el aviso global y la URL del API son su responsabilidad declarada.

## Forma de los repositorios (`infrastructure/`)

1. **Params object obligatorio.** Toda funcion de repository toma un unico parametro `params: FooParams`. Nunca listas posicionales.
2. **Devuelven tipos del slice, no el modelo crudo del backend.** El repo mapea el response al tipo declarado en `domain/<slug>.interface.ts`. Los campos extra que devuelva el backend se descartan en el mapeo — no se filtran a la interfaz "por si acaso".
3. **Defensivos ante ausencia de navegador.** Todo acceso a `window`, `localStorage`, `document` se guarda con `typeof window === 'undefined'` y devuelve un fallback documentado.
4. **Propagan errores.** Documentar con `@throws`. La traduccion a experiencia de usuario es responsabilidad de `application/`.

## Alias de interfaces globales por slice

Cuando un slice consume una interface global (`~/resources/scripts/domain/*`), debe re-exportarla en su `domain/` como **alias propio**. Application e infrastructure del slice referencian el alias local, no la interface global directa.

## SOLID aplicado al proyecto

- **S**: un archivo, una responsabilidad. `script.ts` >~120 lineas o `setup()` con >4 composables -> evaluar split. Composable con "y" en el nombre -> dos composables.
- **O**: extender via composicion, props y slots; no modificar componentes existentes para casos nuevos.
- **L**: componentes que comparten contrato (mismas props/events) son intercambiables; sin eventos extra que el padre no pueda ignorar.
- **I**: tipos pequenos por consumidor (`Pick<X, '...'>` o tipo local segmentado); nada de mega-interfaces.
- **D**: `application/` depende de funciones tipadas de `infrastructure/` y de deps inyectadas, nunca de `useApi()` ni servicios concretos; `domain/` no depende de nada salvo TypeScript.
