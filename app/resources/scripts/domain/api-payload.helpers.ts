/**
 * Lectores de una respuesta cruda del API.
 *
 * **Existen aqui, y no copiados en cada slice, porque ya iban por la copia
 * numero doce.** Doce implementaciones identicas del mismo trio significan doce
 * lugares donde arreglar el dia que una tenga un defecto, y once que se quedan
 * con el defecto porque nadie recordo que existian.
 *
 * Los slices anteriores siguen con su copia local: migrarlos es trabajo aparte
 * y no se hace de paso. Lo que se evita aqui es agregar la trece.
 */

/**
 * Lee un campo de un objeto desconocido sin confiar en su forma.
 *
 * @param source Valor crudo recibido del API.
 * @param key Campo a leer.
 * @returns El valor, o `undefined` si el origen no es un objeto.
 */
export const readField = (source: unknown, key: string): unknown => {
  if (typeof source !== 'object' || source === null) return undefined

  return (source as Record<string, unknown>)[key]
}

/**
 * Interpreta un campo como numero finito.
 *
 * @param source Valor crudo recibido del API.
 * @param key Campo a leer.
 * @returns El numero, o `null` si falta o no es interpretable.
 */
export const readNumber = (source: unknown, key: string): number | null => {
  const value = readField(source, key)

  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Interpreta un campo como texto.
 *
 * @param source Valor crudo recibido del API.
 * @param key Campo a leer.
 * @returns El texto, o `null` si falta o no es una cadena.
 */
export const readText = (source: unknown, key: string): string | null => {
  const value = readField(source, key)

  return typeof value === 'string' ? value : null
}

/**
 * Interpreta un campo como bandera.
 *
 * Solo el booleano verdadero cuenta: un `1`, un `"true"` o un objeto no se
 * toman por afirmativos, porque un contrato que manda esas cosas ya se rompio y
 * conviene que se note.
 *
 * @param source Valor crudo recibido del API.
 * @param key Campo a leer.
 * @returns `true` solo cuando el campo es exactamente `true`.
 */
export const readFlag = (source: unknown, key: string): boolean => readField(source, key) === true
