import { PORTAL_BRAND_DESCRIPTOR } from '~/resources/scripts/constants/portal.const'

/**
 * Raiz del portal. Hoy es el andamiaje: enseña el descriptor de la marca y nada
 * mas. El formulario de acceso, la renovacion de sesion y el reparto por rol
 * llegan con el caso de uso de sesion, que tambien convierte esta ruta en la
 * pantalla de entrada real.
 */
export default defineComponent({
  name: 'portalRoot',

  setup() {
    return { descriptor: PORTAL_BRAND_DESCRIPTOR }
  }
})
