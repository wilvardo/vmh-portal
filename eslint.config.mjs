// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import boundaries from 'eslint-plugin-boundaries'
import jsdoc from 'eslint-plugin-jsdoc'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default withNuxt(
  // Artefactos generados por el editor de Claude Design: no son fuente del repo
  // (support.js ya esta en prototipo/.gitignore, pero ESLint si lo ve).
  {
    ignores: ['prototipo/support.js', 'prototipo/_versiones/**', 'prototipo/_to_delete/**']
  },

  // Codigo retirado con prefijo __DELETED__: se conserva en disco hasta que se
  // borre a mano, pero ya no es fuente del repo ni se revisa.
  {
    ignores: ['**/__DELETED__*/**', '**/__DELETED__*']
  },

  // Reglas duras del proyecto (ver .claude/rules/forbidden.md y code-style.md).
  {
    rules: {
      // Cero `console.log` en produccion; solo `console.error` (catch con prefijo).
      'no-console': ['error', { allow: ['error'] }],
      // Cero `any` (TS estricto).
      '@typescript-eslint/no-explicit-any': 'error',
      // Iconos: SVG directo de tablericons.com, no el paquete de componentes.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@tabler/icons-vue',
              message:
                'Iconos como SVG directo de tablericons.com (stroke="currentColor"). No importes componentes del paquete. Ver components.md -> Iconos.'
            }
          ]
        }
      ],
      // Clases utilitarias legacy prohibidas en templates: en el panel la
      // apariencia sale del preset de PrimeVue, no de clases sueltas.
      'vue/no-restricted-class': [
        'error',
        'btn-block',
        'btn-primary',
        'btn-secondary',
        'btn-success',
        'btn-danger',
        'form-control',
        'box',
        'card'
      ],
      // Nombres de componente multi-palabra no aplican al patron del repo
      // (carpetas Vue tipo `panelHeader`); se relaja.
      'vue/multi-word-component-names': 'off'
    }
  },

  // El cliente HTTP es uno solo. Ningun slice habla con el API por su cuenta:
  // sin esto, el Bearer, la renovacion de sesion y el aviso global de fallo se
  // reimplementarian mal en cada pantalla.
  {
    files: ['app/**/*.{ts,vue}'],
    ignores: [
      'app/composables/use-api.ts',
      'app/composables/use-api.spec.ts',
      'app/resources/scripts/infrastructure/**'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'ofetch',
              message:
                'Habla con el API por `useApi()`. El cliente HTTP directo solo vive en infrastructure/ y en el propio useApi. Ver architecture.md.'
            },
            {
              name: '@tabler/icons-vue',
              message:
                'Iconos como SVG directo de tablericons.com (stroke="currentColor"). No importes componentes del paquete. Ver components.md -> Iconos.'
            }
          ]
        }
      ]
    }
  },

  // Fronteras hexagonales verificables por lint (arquitectura como codigo).
  {
    files: ['app/**/*.{ts,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json'
        }
      },
      'boundaries/elements': [
        { type: 'domain', pattern: 'domain/**' },
        { type: 'application', pattern: 'application/**' },
        { type: 'infrastructure', pattern: 'infrastructure/**' }
      ]
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { types: 'domain' } },
              disallow: {
                to: { element: { types: { anyOf: ['application', 'infrastructure'] } } }
              },
              message:
                'Regla hexagonal: domain/ no puede importar de application/ ni infrastructure/ (cero Vue/Nuxt/servicios).'
            },
            {
              from: { element: { types: 'infrastructure' } },
              disallow: {
                to: { element: { types: 'application' } }
              },
              message: 'Regla hexagonal: infrastructure/ solo puede importar de domain/.'
            }
          ]
        }
      ]
    }
  },

  // JSDoc obligatorio en el codigo de aplicacion (exportado; ver code-style.md).
  {
    files: ['app/**/*.{ts,vue}'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            FunctionExpression: true,
            ArrowFunctionExpression: true,
            MethodDefinition: true
          },
          contexts: ['ExportNamedDeclaration > VariableDeclaration']
        }
      ],
      'jsdoc/require-description': 'error'
    }
  },

  // Tests: no requieren JSDoc (helpers de prueba, callbacks de describe/it).
  {
    files: ['app/**/*.{spec,test}.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off'
    }
  },

  // Scripts CLI de Node (herramientas del repo y del prototipo): `console.log`
  // es la salida legitima del comando, no un log olvidado.
  {
    files: ['scripts/**/*.{mjs,ts,js}', 'prototipo/**/*.{mjs,ts,js}'],
    rules: {
      'no-console': 'off'
    }
  },

  // Prettier al final: desactiva las reglas de formato de ESLint que chocan.
  eslintConfigPrettier
)
