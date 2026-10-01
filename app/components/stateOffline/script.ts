import stateOfflineEs from './domain/locales/state-offline.es.json'

/**
 * Pantalla de una vista que no pudo cargar porque no hay red. Sustituye al
 * error generico: sin conexion nadie hizo nada mal, y la salida es esperar y
 * reintentar, no avisar al estudio.
 *
 * Sus textos son propios: dicen lo mismo en cualquier vista del portal.
 */
export default defineComponent({
  name: 'stateOffline',
  props: {
    /** Si el reintento esta en curso. */
    busy: { type: Boolean, default: false }
  },
  emits: ['retry'],
  setup() {
    const i18n = useI18n()
    i18n.mergeLocaleMessage('es', stateOfflineEs)
  }
})
