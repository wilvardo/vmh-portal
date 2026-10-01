import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/**
 * Iconos de la app instalable del portal. La fuente vive en `pwa/app-icon.svg`
 * (isotipo sobre el navy de la marca) y el generador escribe los PNG en
 * `public/`: se versionan para que el build no dependa de generarlos.
 *
 * Se regeneran con `pnpm pwa:icons` cuando cambia la fuente.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background: '#0d1b2a' }
    },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#0d1b2a' } }
  },
  images: ['pwa/app-icon.svg']
})
