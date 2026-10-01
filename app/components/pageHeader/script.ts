import { splitPageTitle } from './domain/page-header.helpers'
import type { PageTitleParts } from './domain/page-header.interface'

/**
 * Encabezado canonico de una pantalla de la app: etiqueta en caja alta, el unico
 * `h1` de la vista con el punto final en el acento, una linea de apoyo y, a la
 * derecha, las acciones de la pantalla.
 *
 * Es la firma del sitio publico a escala de herramienta (VMH-31). No declara
 * textos propios: los inyecta la pantalla que lo usa, desde SU locale.
 */
export default defineComponent({
  name: 'pageHeader',
  props: {
    /** Titulo de la pantalla, ya traducido. */
    title: { type: String, required: true },
    /** Etiqueta en caja alta sobre el titulo. Vacia = sin etiqueta. */
    eyebrow: { type: String, default: '' },
    /** Linea de apoyo bajo el titulo. Vacia = sin apoyo. */
    support: { type: String, default: '' }
  },
  setup(props) {
    const titleParts = computed<PageTitleParts>(() => splitPageTitle(props.title))

    return { titleParts }
  }
})
