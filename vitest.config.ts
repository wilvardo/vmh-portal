import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    // Los tests de componente que necesiten el runtime de Nuxt declaran
    // `// @vitest-environment nuxt` en su cabecera (usa `mountSuspended`).
    environmentOptions: {
      nuxt: {
        overrides: {
          runtimeConfig: {
            public: {
              BASE_API_PATH: 'http://127.0.0.1:3399/api'
            }
          }
        }
      }
    },
    passWithNoTests: true,
    include: ['app/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**/*.{ts,vue}'],
      exclude: ['app/**/*.{test,spec}.ts', 'app/**/domain/locales/**']
    }
  }
})
