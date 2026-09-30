import type { MembershipDisplayStatus, MyMembership, MyProfileView } from './membership.interface'
import { DATE_LOCALE, PAYMENT_MODE_LABEL_KEY, SITE_CONTACT_ANCHOR } from './membership.const'
import { parseUpcomingReservations } from './upcoming-reservation.helpers'

/** Estados que el API puede devolver, para validar lo que llega por la red. */
const KNOWN_STATUSES: readonly string[] = [
  'activa',
  'por-vencer',
  'pendiente-de-pago',
  'suspendida',
  'morosa',
  'vencida',
  'sin-membresia'
]

/**
 * Lee un instante que el contrato admite nulo.
 *
 * @param value Valor que llego por la red.
 * @returns El instante, `null` si llego nulo, o `undefined` si no cumple el
 *   contrato (ausente o ilegible).
 */
const parseInstantOrNull = (value: unknown): string | null | undefined => {
  if (value === null) return null
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value
  return undefined
}

/**
 * Lee un texto que el API puede mandar nulo.
 *
 * @param value Valor crudo.
 * @returns El texto, o `null` si no es texto o viene vacio.
 */
const readNullableText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null

/**
 * Valida que un valor tenga la forma del perfil del contrato del API.
 *
 * Se usa sobre datos que vienen de la red, donde nada garantiza la forma. Un
 * estado desconocido descarta la respuesta completa en vez de pintar una
 * tarjeta sin saber que dice: el portal no inventa estados. Lo mismo una lista
 * de reservas rota: un tablero que dice "no tienes sesiones" cuando si las hay
 * es peor que uno que avisa que no pudo leer.
 *
 * @param value Valor a validar.
 * @returns El perfil validado, o `null` si no cumple el contrato.
 */
export const parseProfileView = (value: unknown): MyProfileView | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as {
    profile?: unknown
    membership?: unknown
    initialEvaluationCompletedAt?: unknown
    upcomingReservations?: unknown
  }
  const profile = candidate.profile as Record<string, unknown> | undefined
  const membership = candidate.membership as Record<string, unknown> | undefined

  if (profile === undefined || membership === undefined) return null

  const isProfileValid =
    typeof profile.id === 'number' &&
    typeof profile.firstName === 'string' &&
    typeof profile.lastName === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.phone === 'string'

  if (!isProfileValid) return null
  if (typeof membership.displayStatus !== 'string') return null
  if (!KNOWN_STATUSES.includes(membership.displayStatus)) return null

  const upcomingReservations = parseUpcomingReservations(candidate.upcomingReservations)
  if (upcomingReservations === null) return null

  const evaluatedAt = parseInstantOrNull(candidate.initialEvaluationCompletedAt)
  if (evaluatedAt === undefined) return null

  return {
    profile: {
      id: profile.id as number,
      firstName: profile.firstName as string,
      lastName: profile.lastName as string,
      email: profile.email as string,
      phone: profile.phone as string,
      // Un contacto ausente o con otra forma se lee como "sin capturar": el
      // tablero pide completarlo en vez de descartar todo el perfil.
      emergencyContactName: readNullableText(profile.emergencyContactName),
      emergencyContactPhone: readNullableText(profile.emergencyContactPhone)
    },
    // El API ya valida la forma del contrato; aqui solo se verifico el estado,
    // que es lo unico que decide como se pinta la tarjeta.
    membership: membership as unknown as MyMembership,
    initialEvaluationCompletedAt: evaluatedAt,
    upcomingReservations
  }
}

/**
 * Indica si un estado exige una accion de la persona.
 *
 * Es lo que decide si la tarjeta lleva un llamado o solo informa: una
 * membresia morosa, por vencer, vencida o suspendida pide algo; una activa no.
 * La suspendida tambien: sin llamado, la persona solo ve que no puede reservar
 * y no sabe a quien acudir.
 *
 * @param status Estado presentable.
 * @returns `true` si hay algo que hacer al respecto.
 */
export const needsAction = (status: MembershipDisplayStatus): boolean =>
  status === 'morosa' || status === 'por-vencer' || status === 'vencida' || status === 'suspendida'

/**
 * Clave de texto de la modalidad de pago de una membresia.
 *
 * @param mode Modalidad tal como la manda el API (`monthly`, `upfront`).
 * @returns La clave a traducir, o cadena vacia si no hay modalidad o el portal
 *   no la conoce (la fila no se pinta antes que nombrarla mal).
 */
export const paymentModeLabelKey = (mode: string | null): string =>
  mode === null ? '' : (PAYMENT_MODE_LABEL_KEY[mode] ?? '')

/**
 * Enlace al contacto del estudio en el sitio publico.
 *
 * @param siteUrl Direccion base del sitio; puede faltar en el entorno.
 * @returns El enlace al formulario de contacto del inicio, o cadena vacia sin
 *   sitio configurado (no se pinta un enlace que no lleva a ningun lado).
 */
export const studioContactUrl = (siteUrl: string): string =>
  siteUrl.trim() === '' ? '' : `${siteUrl.trim().replace(/\/+$/, '')}/${SITE_CONTACT_ANCHOR}`

/**
 * Escribe un dia del calendario con dia y mes.
 *
 * La fecha viaja como dia pelado (`YYYY-MM-DD`) y se lee como medianoche
 * local: convertirla como instante UTC la correria al dia anterior en Mexico.
 *
 * @param value Fecha ISO sin hora, o `null`.
 * @returns Dia y mes, por ejemplo "30 de septiembre"; un guion sin fecha.
 */
export const formatDayMonth = (value: string | null): string =>
  value === null
    ? '—'
    : new Date(`${value}T00:00:00`).toLocaleDateString(DATE_LOCALE, {
        day: 'numeric',
        month: 'long'
      })

/**
 * Escribe un importe en pesos tal como lo manda el API.
 *
 * No recalcula nada: solo le da formato de moneda al numero del servidor.
 *
 * @param amount Importe en pesos.
 * @returns El importe con signo y centavos, por ejemplo "$9,000.00".
 */
export const formatAmount = (amount: number): string =>
  amount.toLocaleString(DATE_LOCALE, { style: 'currency', currency: 'MXN' })
