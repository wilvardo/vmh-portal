import offlineBannerEs from './domain/locales/offline-banner.es.json'

/**
 * Franja que avisa que el dispositivo se quedo sin red. Va arriba del lienzo en
 * las dos formas del portal: lo ya cargado se sigue viendo, pero puede no estar
 * al dia y reservar o cancelar necesitan conexion.
 *
 * No bloquea nada: el navegador puede equivocarse, y la respuesta del API es la
 * que dice si una accion se pudo.
 */
export default defineComponent({
  name: 'offlineBanner',
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', offlineBannerEs)

    const { isOnline } = useNetworkStatus()

    return { isOnline }
  }
})
