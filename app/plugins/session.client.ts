/**
 * Recupera la sesion guardada antes de que corra el guardia de rutas y mantiene
 * al portal sincronizado con las demas pestanas abiertas.
 *
 * Sin este plugin, el atleta que recarga la pagina o llega desde el enlace de
 * un correo vuelve al acceso aunque su sesion siga guardada: el guardia decide
 * con la sesion en memoria, y nadie la habia leido del almacenamiento.
 *
 * Va en un plugin (y no en el middleware) porque los plugins corren una sola vez
 * al arrancar: leer el almacenamiento en cada navegacion seria trabajo repetido,
 * y el middleware necesita la sesion ya en memoria para decidir.
 */
export default defineNuxtPlugin(() => {
  const { restoreSession, syncAcrossTabs } = useSession()

  restoreSession()
  syncAcrossTabs()
})
