import postcssGlobalData from '@csstools/postcss-global-data'
import postcssCustomMedia from 'postcss-custom-media'
import VmhPreset from './theme/primevue-preset'
import { PRIMEVUE_LOCALE_ES } from './theme/primevue-locale'
import {
  PORTAL_BRAND_DESCRIPTOR,
  PORTAL_BRAND_NAME,
  PORTAL_DESCRIPTION
} from './app/resources/scripts/constants/portal.const'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-20',

  future: {
    compatibilityVersion: 4
  },

  // Portal detras de sesion: no hay SEO que ganar y el primer render solo tiene
  // sentido con la sesion ya resuelta en el navegador.
  ssr: false,

  devtools: {
    enabled: false
  },

  modules: ['@primevue/nuxt-module', '@nuxtjs/i18n', '@nuxt/eslint'],

  i18n: {
    locales: [{ code: 'es', name: 'Espanol', file: 'es.json' }],
    defaultLocale: 'es',
    strategy: 'no_prefix'
  },

  css: ['~~/design-system/tokens/tokens.css', '~/assets/design-system/main.scss'],

  primevue: {
    options: {
      theme: {
        preset: VmhPreset,
        options: {
          // La marca VMH es light-first y NUNCA va en tema oscuro (MASTER 4.3):
          // se desactiva el conmutador de la libreria para que ningun componente
          // resuelva su paleta contra un `.dark` que este proyecto no declara.
          darkModeSelector: false,
          cssLayer: false
        }
      },
      // El portal no anima nada que no sea feedback de estado (MASTER 11.3).
      ripple: false,
      locale: PRIMEVUE_LOCALE_ES
    },
    directives: {
      include: ['Tooltip']
    }
  },

  // Filtra el descubrimiento automatico de paginas: solo los `.vue` cuentan como
  // rutas. Permite que cada `pages/<slug>/` use el slice hexagonal (script.ts,
  // domain/, application/, infrastructure/) sin que Nuxt los registre como rutas.
  hooks: {
    'pages:extend'(pages) {
      const isPageFile = (file: string | undefined): boolean =>
        Boolean(file && file.endsWith('.vue'))

      type PageEntry = (typeof pages)[number]
      const filterTree = (entries: PageEntry[]): PageEntry[] =>
        entries
          .filter((entry) => isPageFile(entry.file))
          .map((entry) => ({
            ...entry,
            children: entry.children ? filterTree(entry.children) : entry.children
          }))

      const filtered = filterTree(pages)
      pages.length = 0
      pages.push(...filtered)
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      // El titulo base es el descriptor: la plantilla ya agrega la marca, y
      // usar la marca en ambos lados produce "VMH · VMH".
      title: PORTAL_BRAND_DESCRIPTOR,
      titleTemplate: `%s · ${PORTAL_BRAND_NAME}`,
      htmlAttrs: {
        lang: 'es-MX'
      },
      meta: [
        { name: 'description', content: PORTAL_DESCRIPTION },
        { name: 'theme-color', content: '#f7f7f7' },
        // Superficie privada: fuera de buscadores. Se refuerza con public/robots.txt
        // y, si el hosting lo permite, con el header `X-Robots-Tag: noindex`.
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logos/isotipo.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          // Mismas familias que el sitio publico: la identidad no cambia entre
          // superficies, solo la densidad (MASTER 14).
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Jost:wght@300..600&family=Inter:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    public: {
      // URL de vmh-api. El portal es una SPA: todo lo que viva aqui es visible en
      // el navegador. Nunca secretos.
      BASE_API_PATH: process.env.BASE_API_PATH,
      // URL del sitio publico. El portal la usa para mandar a contratar a quien
      // todavia no tiene membresia. Sin ella esa tarjeta pierde su boton, pero
      // el resto del portal no se entera.
      SITE_BASE_URL: process.env.SITE_BASE_URL,
      appVersion: process.env.npm_package_version || ''
    }
  },

  devServer: {
    // 3002: el sitio publico ocupa 3000 y el panel 3001, y los tres se levantan
    // a la vez contra el mismo API. Es el puerto que ya espera PORTAL_URL en el
    // entorno del API, de donde salen los enlaces de los correos.
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(`${process.env.PORT}`) || 3002
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api']
        }
      },
      // PostCSS: habilita custom-media tipo `@media (--bp-lg)` consumiendo las
      // definiciones globales de design-system/tokens/breakpoints.css.
      postcss: {
        plugins: [
          postcssGlobalData({
            files: ['./design-system/tokens/breakpoints.css']
          }),
          postcssCustomMedia()
        ]
      }
    }
  }
})
