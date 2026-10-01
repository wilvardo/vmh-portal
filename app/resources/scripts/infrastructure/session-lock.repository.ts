import { SESSION_REFRESH_LOCK } from '../domain/session.const'

interface RunExclusiveParams<T> {
  /** Trabajo que no debe correr en dos pestanas a la vez. */
  task: () => Promise<T>
}

/**
 * Corre un trabajo bajo el candado de renovacion, compartido por todas las
 * pestanas del portal en el navegador (Web Locks).
 *
 * El API rota el token de renovacion en cada uso y lee un segundo uso del mismo
 * token como robo: revoca toda la familia de la sesion. El single-flight de
 * `useSession` evita eso dentro de una pestana; este candado lo evita entre
 * pestanas, incluida la app instalada abierta junto al navegador.
 *
 * Respaldo: un navegador sin Web Locks (anterior a Safari 15.4) corre el
 * trabajo sin candado. Ahi queda solo la relectura del almacenamiento que hace
 * `useSession` antes de renovar, que reduce la carrera pero no la cierra.
 *
 * @param params Trabajo a correr.
 * @returns Lo que devuelva el trabajo.
 * @throws Lo que lance el trabajo.
 */
export const runWithSessionLock = async <T>(params: RunExclusiveParams<T>): Promise<T> => {
  // El tipo dice que siempre existe; en navegadores viejos y en algunos
  // entornos sin pantalla llega ausente o en nulo.
  const locks: LockManager | null | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.locks

  if (typeof locks?.request !== 'function') return params.task()

  return locks.request(SESSION_REFRESH_LOCK, { mode: 'exclusive' }, () => params.task())
}
