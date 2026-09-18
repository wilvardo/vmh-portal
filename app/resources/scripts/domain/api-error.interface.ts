/**
 * Cuerpo de error del API. Todo error de `vmh-api` sale con esta forma sin
 * excepcion (contrato del nucleo, USVMH1783637220000).
 */
export interface ApiError {
  /** Encabezado del mensaje, en español y para personas. */
  title: string
  /** Cuerpo del mensaje, en español y para personas. */
  detail: string
  /** Slug del titulo. Se registra, nunca se muestra. */
  key: string
  /** Codigo `VMH.<AREA>.<NOMBRE>`. Se registra, nunca se muestra. */
  code: string
}
