import type { PropType } from 'vue'
import type { PortalNavIconName } from '~/resources/scripts/domain/portal-nav-icon.type'

/**
 * Icono de linea de un destino de la navegacion del portal (Tabler, una sola
 * tinta). Es decorativo: el nombre del destino siempre va escrito junto a el.
 */
export default defineComponent({
  name: 'portalNavIcon',
  props: {
    /** Destino al que corresponde el icono. */
    name: { type: String as PropType<PortalNavIconName>, required: true }
  }
})
