/**
 * Indica si un destino de la navegacion es la pantalla en la que se esta.
 *
 * Cuenta tambien una ruta hija (`/horarios/lo-que-sea`) para que el enlace siga
 * marcado si la pantalla crece con subrutas, pero no una que solo comparte el
 * prefijo de texto (`/horarios-viejos`).
 *
 * @param currentPath Ruta actual, sin query ni hash.
 * @param itemPath Ruta del destino.
 * @returns `true` si el destino es la pantalla actual.
 */
export const isNavItemActive = (currentPath: string, itemPath: string): boolean =>
  currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
