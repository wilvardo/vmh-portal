/**
 * Config de Stylelint del panel. Enforza las reglas de color del design system
 * documentadas en `.claude/rules/styles.md` de forma verificable por lint:
 * - Cero colores en hex/rgb literal (`color-no-hex`).
 * - Todo color de una propiedad `*color`/`fill`/`stroke` debe venir de un token
 *   (`var(--color-*)`), `color-mix(...)` u otra funcion, nunca un literal.
 *
 * Se lintea solo el SCSS de `app/` — incluido `_primevue-overrides.scss`, que es
 * justo donde mas facil seria colar un hex de la libreria. Los tokens fuente
 * viven en `design-system/tokens/*.css` y definen los hex a proposito, por lo
 * que NO se incluyen aqui.
 */
export default {
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'color-no-hex': true,
    'declaration-property-value-disallowed-list': [
      { '/color$/': [/rgba?\(/i, /hsla?\(/i] },
      {
        message: 'Sin rgb()/hsl() literal en color: usa var(--color-*) o color-mix (styles.md).'
      }
    ],
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'fill', 'stroke'],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'currentcolor',
          'inherit',
          'initial',
          'unset',
          'none'
        ],
        disableFix: true
      }
    ]
  }
}
