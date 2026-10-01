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

  modules: ['@primevue/nuxt-module', '@nuxtjs/i18n', '@nuxt/eslint', '@vite-pwa/nuxt'],

  // App instalable (PWA). El service worker guarda SOLO la cascara de la app
  // -JS, CSS, iconos y fuentes- para que abra sin red y diga que no hay
  // conexion. NUNCA guarda respuestas del API: traen datos personales del
  // atleta y su sesion, y lo que se muestra siempre sale del servidor.
  pwa: {
    registerType: 'prompt',
    manifest: {
      id: '/',
      name: `${PORTAL_BRAND_NAME} · ${PORTAL_BRAND_DESCRIPTOR}`,
      short_name: PORTAL_BRAND_NAME,
      description: PORTAL_DESCRIPTION,
      lang: 'es-MX',
      dir: 'ltr',
      start_url: '/inicio',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      // Superficie de la barra superior y nieve del lienzo (tokens.css).
      theme_color: '#ffffff',
      background_color: '#f7f7f7',
      categories: ['health', 'fitness', 'lifestyle'],
      icons: [
        { src: '/pwa/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/pwa/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      // `nuxt generate` escribe la misma cascara HTML por cada ruta (~590 KB
      // cada una por los estilos en linea del tema). Basta `index.html`: es el
      // respaldo de toda navegacion. Precargar las nueve sumaba 5 MB.
      globPatterns: ['**/*.{js,css,png,svg,ico,webmanifest}', 'index.html'],
      // SPA: toda navegacion sin red cae en la cascara y el router resuelve. El
      // modulo precarga `index.html` con la URL `/`, asi que el respaldo es `/`.
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      // Toma el control de la pestaña apenas se activa: sin esto, en la primera
      // visita la pagina no queda controlada y "Actualizar" no recargaba.
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'vmh-fonts-css' }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'vmh-fonts',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] }
          }
        }
      ]
    },
    client: {
      // La invitacion a instalar se descarta una vez y no vuelve a insistir.
      installPrompt: 'vmh-portal-install-dismissed',
      // Una sesion abierta toda la tarde tambien se entera de la version nueva.
      periodicSyncForUpdates: 60 * 60
    },
    // En desarrollo no hay service worker: cachearia el servidor de Vite.
    devOptions: { enabled: false }
  },

  // Lo retirado con prefijo __DELETED__ se conserva en disco hasta borrarlo a
  // mano. Nuxt no lo enruta, no lo auto-importa ni lo compila aunque alguien lo
  // regrese por error a app/.
  ignore: ['**/__DELETED__*', '**/__DELETED__*/**'],

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
      // `viewport-fit=cover`: instalada, la app ocupa la pantalla entera y las
      // pestañas inferiores respetan la zona segura con `env(safe-area-inset-*)`.
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      // El titulo base es el descriptor: la plantilla ya agrega la marca, y
      // usar la marca en ambos lados produce "VMH · VMH".
      title: PORTAL_BRAND_DESCRIPTOR,
      titleTemplate: `%s · ${PORTAL_BRAND_NAME}`,
      htmlAttrs: {
        lang: 'es-MX'
      },
      meta: [
        { name: 'description', content: PORTAL_DESCRIPTION },
        // Mismo color que `theme_color` del manifiesto: la barra del sistema
        // continua la barra superior del portal.
        { name: 'theme-color', content: '#ffffff' },
        // iOS no lee el manifiesto para esto: sin estas metas la app instalada
        // abre como pestaña de Safari.
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: PORTAL_BRAND_NAME },
        // Superficie privada: fuera de buscadores. Se refuerza con public/robots.txt
        // y, si el hosting lo permite, con el header `X-Robots-Tag: noindex`.
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logos/isotipo.svg' },
        { rel: 'icon', href: '/pwa/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/pwa/apple-touch-icon-180x180.png' },
        // Manifiesto en el HTML que sale del build, no inyectado en el cliente:
        // Safari de iOS y los validadores leen el documento tal como llega.
        { rel: 'manifest', href: '/manifest.webmanifest' },
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
      // todavia no tiene membresia y para enlazar el aviso de privacidad y los
      // terminos. Sin ella esa tarjeta pierde su boton y los enlaces legales no
      // se pintan, pero el resto del portal no se entera.
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
