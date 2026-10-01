import { REALTIME_REFRESH_DEBOUNCE_MS } from '~/resources/scripts/domain/realtime.const'
import type { RealtimeConnection } from '~/resources/scripts/domain/realtime.interface'
import { openRealtimeConnection } from '~/resources/scripts/infrastructure/realtime.repository'

interface UseRealtimeParams {
  /** Canales que la pantalla quiere escuchar; puede cambiar con el tiempo. */
  channels: MaybeRefOrGetter<string[]>
  /** Que hacer cuando alguno anuncia un cambio: normalmente, volver a consultar. */
  onChange: () => void
  /** Espera antes de reaccionar, para juntar una rafaga en una sola consulta. */
  debounceMs?: number
}

/**
 * Escucha canales de tiempo real del API y avisa cuando hay que volver a
 * consultar.
 *
 * Sigue la forma de `useRealtime` de `vmh-website`, con lo que el portal
 * necesita ademas: el pase de la sesion en el saludo (el canal de la agenda es
 * privado), varios canales a la vez, **antirrebote** -abrir la semana o bloquear
 * un rango llega como una rafaga y debe costar una sola consulta-, reconexion
 * que vuelve a consultar lo que se perdio mientras no hubo canal, y limpieza al
 * desmontar o cuando la sesion se cierra (en esta pestana o en otra): un canal
 * privado no se queda abierto sin nadie firmado.
 *
 * **Degradacion obligatoria.** Si el canal no conecta, la pantalla funciona
 * igual: el canal es una comodidad para no recargar y la fuente de verdad sigue
 * siendo la consulta al endpoint. Lo que llega no trae datos, solo el aviso; lo
 * que ve cada rol lo decide el endpoint al que se vuelve a preguntar.
 *
 * Invoca `useRuntimeConfig` y `useSession` porque la conexion necesita la URL
 * del API y el pase vigente (excepcion documentada de `architecture.md`).
 *
 * @param params Canales, que hacer ante un cambio y cuanto esperar.
 */
export const useRealtime = (params: UseRealtimeParams): void => {
  if (import.meta.server) return

  const config = useRuntimeConfig()
  const { accessToken, renewSession } = useSession()
  const debounceMs = params.debounceMs ?? REALTIME_REFRESH_DEBOUNCE_MS

  let connection: RealtimeConnection | null = null
  let subscribed: string[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  /** Junta los avisos que llegan seguidos en una sola reaccion. */
  const scheduleChange = (): void => {
    if (timer !== null) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      params.onChange()
    }, debounceMs)
  }

  /**
   * Abre la conexion la primera vez que hace falta.
   *
   * @returns La conexion viva, o `null` si no se pudo abrir.
   */
  const ensureConnection = (): RealtimeConnection | null => {
    if (connection !== null) return connection

    try {
      connection = openRealtimeConnection({
        baseUrl: String(config.public.BASE_API_PATH),
        pageOrigin: window.location.origin,
        readToken: () => accessToken.value,
        renewToken: async () => (await renewSession())?.accessToken ?? null,
        onChange: scheduleChange,
        onResync: scheduleChange
      })
    } catch (error: unknown) {
      console.error('useRealtime: no se pudo abrir el canal de tiempo real', error)
    }

    return connection
  }

  /** Suelta la conexion y lo pendiente. */
  const teardown = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null

    connection?.close()
    connection = null
    subscribed = []
  }

  watch(accessToken, (token) => {
    if (token === null) teardown()
  })

  watch(
    () => [...new Set(toValue(params.channels))],
    (next) => {
      const live = next.length === 0 ? connection : ensureConnection()
      if (live === null) return

      for (const channel of subscribed) {
        if (!next.includes(channel)) live.unsubscribe(channel)
      }
      for (const channel of next) live.subscribe(channel)

      subscribed = next
    },
    { immediate: true }
  )

  onScopeDispose(teardown)
}
