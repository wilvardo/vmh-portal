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

/** Alta de cuenta. */
export const REGISTER_PATH = '/registro'

/**
 * Confirmacion del correo. El token llega como query, no como segmento, porque
 * asi es como el API ya arma el enlace que manda en el correo.
 */
export const VERIFY_EMAIL_PATH = '/verificar-correo'

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
 * Rutas exactas que no requieren sesion.
 *
 * Son todas las del alta y la recuperacion, y ninguna mas. Fail-closed: lo que
 * no este aqui exige sesion.
 */
export const PUBLIC_PATHS: readonly string[] = [
  LOGIN_PATH,
  REGISTER_PATH,
  VERIFY_EMAIL_PATH,
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
