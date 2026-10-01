/**
 * Estado de error canonico de una vista con datos: el `title` (y, si hay, el
 * `detail`) del API y un boton para reintentar.
 *
 * No declara textos propios: es una pieza generica y los textos los inyecta la
 * vista que la usa, desde SU locale. `key` y `code` del error nunca llegan aqui.
 */
export default defineComponent({
  name: 'stateError',
  props: {
    /** Titulo del error, normalmente el `title` del API. */
    title: { type: String, required: true },
    /** Explicacion breve. Vacia = sin explicacion. */
    detail: { type: String, default: '' },
    /** Etiqueta del reintento. Vacia = sin boton. */
    retryLabel: { type: String, default: '' },
    /** Si el reintento esta en curso. */
    busy: { type: Boolean, default: false }
  },
  emits: ['retry']
})
