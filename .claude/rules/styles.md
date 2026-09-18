# Estilos

Dos reglas innegociables al escribir SCSS:

1. **BEM siempre.**
2. **Tokens del design-system, no valores de color a mano.**

## De donde salen los tokens

`design-system/` es una **copia sincronizada** de la fuente del sistema de diseño de la plataforma (la misma que consume `vmh-website`). **No se edita en este repo.** Un cambio de token nace en el sistema de diseño, entra en su `CHANGELOG.md` con el contraste verificado, y baja a las tres superficies. Editar `tokens.css` aqui produce una divergencia silenciosa entre el sitio publico, el portal y el panel.

Jerarquia (MASTER 0.1): referencia del cliente > `MASTER.md` > `tokens.css` > overrides por pagina > codigo. Si el codigo contradice al MASTER, el codigo esta mal.

## BEM

Cada componente declara un unico bloque raiz con el nombre del componente en `kebab-case`; elementos y modificadores cuelgan de el via nesting con `&`:

```scss
.panel-header {
  &__session { ... }
  &__session--compact { ... }
  &--inverted { ... }
}
```

Reglas:
- Un solo bloque por archivo. Si necesitas un segundo bloque, probablemente es otro componente.
- Sin selectores anidados profundos (`.a .b .c`). Si necesitas alcanzar un nodo interno, dale un `&__elemento` propio.
- Sin `id` selectors.
- **Sin selectores de clases internas de PrimeVue** (`.p-button`, `.p-inputtext`) dentro del `style.scss` de un slice. Eso vive en el preset o en `_primevue-overrides.scss`. Ver `components.md`.

## Tokens

Todo color proviene de `design-system/tokens/tokens.css`. Los componentes consumen **alias semanticos** (`--color-fg`, `--color-surface`, `--color-primary`), nunca las primitivas de la rampa (`--color-primary-600`) salvo en graficas y estados decorativos documentados.

| Concepto | Token |
|---|---|
| Marca | `--color-primary` / `--color-primary-strong` / `--color-primary-soft` / `--color-on-primary` |
| Superficies | `--color-bg` / `--color-surface` / `--color-surface-sunken` / `--color-bg-dark` |
| Texto | `--color-fg` / `--color-fg-secondary` / `--color-fg-muted` / `--color-fg-inverse` |
| Bordes | `--color-border` / `--color-border-strong` |
| Estados | `--color-success-*` / `--color-warning-*` / `--color-danger-*` / `--color-info-*` (`-bg`, `-border`, `-fg`) |
| Tipografia | `--font-display` (Jost) / `--font-body` (Inter) / `--fs-*` / `--fw-*` / `--tracking-*` |
| Espaciado | `--space-1` … `--space-24` (grid de 4pt) |
| Densidad del panel | `--field-height-sm` (36) / `--touch-target` (44) / `--header-height-scrolled` |
| Radios | `--radius-sm` (inputs, chips) / `--radius-md` / `--radius-lg` (cards) / `--radius-pill` (botones) |
| Elevacion | `--elevation-1` … `--elevation-3` |
| Motion | `--motion-instant|fast|base|slow` / `--ease-out` / `--ease-in-out` |
| Capas | `--z-base|raised|sticky|header|drawer|modal|toast|tooltip` |
| Foco | `--focus-ring-color` / `--focus-ring-width` / `--focus-ring-offset` / `--focus-halo` |

### Convenciones de uso

- **Opacidades sobre un token**: `color-mix(in srgb, var(--color-bg-dark) 60%, transparent)` en vez de un rgba a mano.
- **Breakpoints**: custom-media de `design-system/tokens/breakpoints.css`. `@media (--bp-lg) { ... }` mobile-first y `@media (--bp-lg-down) { ... }` para max-width. No hardcodear px en `@media`.
- **Capas**: solo los tokens `--z-*`. Nada de `z-index: 9999` ni de valores negativos para esconder.
- **Motion**: tope de 300ms en interfaz. El panel **no anima nada que no sea feedback de estado** (MASTER 11.3): los reveals editoriales del sitio publico no existen aqui.
- **Hover**: siempre dentro de `@media (hover: hover)`, para no dejar estados pegados en pantallas tactiles.

## Densidad del panel

| Elemento | Medida |
|---|---|
| Campo y boton | `--field-height-sm` (36px) |
| Fila de tabla | 44px |
| Padding de card | 16-20px (`--space-4`/`--space-5`) |
| Cuerpo | `--fs-body-sm` (14px) |

## Truncado de texto con elipsis

Todo texto de contenido variable (datos del API, nombres, etiquetas) trunca cuando no quepa:

```scss
.bloque__elemento {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

Habilitadores obligatorios: `min-width: 0` en padres flex; `minmax(0, 1fr)` en tracks de grid con texto truncable. Sin ellos una celda ancha empuja el layout y aparece scroll horizontal en toda la pagina.

## Lo que NO se hace

- Sin `!important`, salvo el ajuste de capas de PrimeVue documentado en `_primevue-overrides.scss`.
- Sin colores hex/rgb directos en propiedades de color — solo `var(--...)` o `color-mix(...)`. (Enforzado por Stylelint, incluido el archivo de overrides.)
- Sin px magicos: ante duda, token o `clamp` existente.
- Sin tema oscuro. VMH es light-first y el conmutador de PrimeVue esta desactivado a proposito.
- Sin estilos inline en templates (`style="..."`) salvo valores calculados en runtime.
- Sin estilos de layout global dentro de un `<style>` de layout: eso vive en `app/assets/design-system/_shell.scss`, donde Stylelint si lo revisa.
