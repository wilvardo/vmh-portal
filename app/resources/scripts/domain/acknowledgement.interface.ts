/**
 * Respuesta de los endpoints que solo confirman que la peticion se atendio
 * (recuperacion de contrasena, codigo de primer acceso).
 */
export interface Acknowledgement {
  /** Texto en espanol listo para mostrar, tal como lo manda el API. */
  message: string
}
