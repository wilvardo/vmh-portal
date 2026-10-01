/**
 * Cada cuanto avanza el reloj de pantalla. Medio minuto basta para que una
 * accion que el tiempo ya cerro desaparezca antes de que alguien la toque, sin
 * repintar la pantalla cada segundo.
 */
const CLOCK_TICK_MS = 30_000

/**
 * Reloj de pantalla: la hora actual como estado reactivo.
 *
 * Sirve para que lo que el API calculo "al momento de responder" se apague
 * solo cuando el tiempo lo cierra (la ventana de cancelacion, una sesion que ya
 * empezo) sin volver a preguntar. Ademas de avanzar cada medio minuto, se pone
 * al dia al volver a la pestana: un telefono que estuvo en la bolsa congela los
 * temporizadores y regresaria con la hora vieja.
 *
 * Su razon de ser es un temporizador del navegador (excepcion documentada de
 * `architecture.md`). Se limpia al desmontar quien lo uso.
 *
 * @returns La hora actual, reactiva.
 */
export const useClock = (): Readonly<Ref<Date>> => {
  const now = ref(new Date())

  if (import.meta.server) return now

  const tick = (): void => {
    now.value = new Date()
  }

  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') tick()
  }

  const timer = setInterval(tick, CLOCK_TICK_MS)
  document.addEventListener('visibilitychange', onVisibility)

  onScopeDispose(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return now
}
