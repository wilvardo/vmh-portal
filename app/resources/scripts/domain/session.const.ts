import { AUTH_ROLE, type AuthRole } from './auth-role.enum'

/**
 * Clave de almacenamiento de la sesion. Lleva el nombre del portal para que dos
 * superficies de la plataforma abiertas en el mismo navegador no se pisen: es
 * exactamente lo que pasa cuando quien administra el estudio tambien entrena.
 */
export const SESSION_STORAGE_KEY = 'vmh-portal-session'

/**
 * Ruta de la pantalla de acceso.
 *
 * Es la raiz, no `/login` como en el panel. El portal se comparte por enlace y
 * se abre desde el telefono: la direccion corta es la que la gente escribe y la
 * que cabe en un mensaje.
 */
export const LOGIN_PATH = '/'

/**
 * Primer acceso: quien nacio con cuenta (desde la agenda del sitio o desde el
 * mostrador) define aqui su contrasena con un codigo que le llega al correo.
 */
export const FIRST_ACCESS_PATH = '/primer-acceso'

/**
 * Parametro con el que el acceso le pasa al primer acceso el correo que la
 * persona ya escribio, para no hacerla teclearlo dos veces.
 */
export const FIRST_ACCESS_EMAIL_QUERY = 'correo'

/** Solicitud de restablecimiento de contrasena. */
export const PASSWORD_RECOVERY_PATH = '/recuperar-contrasena'

/**
 * Pantalla donde se fija una contrasena a partir de un enlace.
 *
 * Sirve a los dos caminos que emiten ese enlace: quien olvido su contrasena y
 * quien fue dado de alta en el mostrador y nunca tuvo una. Es la misma pantalla
 * porque es el mismo token y el mismo desenlace.
 */
export const SET_PASSWORD_PATH = '/establecer-contrasena'

/** Tablero del atleta: a donde aterriza quien ya tiene sesion. */
export const POST_LOGIN_REDIRECT_PATH = '/inicio'

/**
 * Semana de sesiones del atleta: ver horarios, reservar y cancelar.
 *
 * Privada: la cubre el guardia global como cualquier ruta que no este en
 * `PUBLIC_PATHS`.
 */
export const SCHEDULE_PATH = '/horarios'

/**
 * Pagos propios del atleta: folio, fecha, forma de pago y monto.
 *
 * Privada: la cubre el guardia global como cualquier ruta que no este en
 * `PUBLIC_PATHS`.
 */
export const PAYMENTS_PATH = '/pagos'

/**
 * Rutas exactas que no requieren sesion.
 *
 * Son el acceso, el primer acceso y la recuperacion, y ninguna mas. El alta ya
 * no vive en el portal: la cuenta nace al agendar en el sitio o en el mostrador. Fail-closed: lo que
 * no este aqui exige sesion.
 */
export const PUBLIC_PATHS: readonly string[] = [
  LOGIN_PATH,
  FIRST_ACCESS_PATH,
  PASSWORD_RECOVERY_PATH,
  SET_PASSWORD_PATH
]

/**
 * Roles con acceso al portal. Fail-closed, igual que en el panel y por el mismo
 * motivo: la puerta se abre por lista, no por descarte.
 *
 * Solo el atleta. Es la imagen espejo de la regla del panel: quien trabaja en
 * el estudio tiene su herramienta y no tiene nada que hacer aqui, del mismo
 * modo que un atleta no entra al panel. Si algun dia direccion quiere ver el
 * portal como lo ve un atleta, la respuesta es una cuenta de atleta de prueba,
 * no abrirle la puerta a su rol.
 */
export const PORTAL_ALLOWED_ROLES: readonly AuthRole[] = [AUTH_ROLE.ATHLETE]

/**
 * Parametro con el que el portal avisa por que expulso a la persona a la
 * pantalla de acceso (sesion vencida, rol sin permiso).
 */
export const LOGIN_REASON_QUERY = 'motivo'

/** Motivos con los que el portal devuelve a la pantalla de acceso. */
export const LOGIN_REASON = {
  /** La sesion expiro o fue revocada por el servidor. */
  EXPIRED: 'sesion-expirada',
  /** La cuenta es valida pero su rol no entra al portal. */
  FORBIDDEN: 'sin-acceso'
} as const

/** Motivo de expulsion a la pantalla de acceso. */
export type LoginReason = (typeof LOGIN_REASON)[keyof typeof LOGIN_REASON]
