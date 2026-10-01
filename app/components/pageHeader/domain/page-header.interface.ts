/** Titulo de pantalla separado en su texto y su signo final de marca. */
export interface PageTitleParts {
  /** Texto del titulo sin el punto final. */
  text: string
  /** Punto final que se pinta en el acento, o vacio si el titulo no lo lleva. */
  mark: string
}
