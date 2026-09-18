import type { MembershipDisplayStatus, MyMembership, MyProfileView } from './membership.interface'

/** Estados que el API puede devolver, para validar lo que llega por la red. */
const KNOWN_STATUSES: readonly string[] = [
  'activa',
  'por-vencer',
  'suspendida',
  'morosa',
  'vencida',
  'sin-membresia'
]

/**
 * Valida que un valor tenga la forma del perfil del contrato del API.
 *
 * Se usa sobre datos que vienen de la red, donde nada garantiza la forma. Un
 * estado desconocido descarta la respuesta completa en vez de pintar una
 * tarjeta sin saber que dice: el portal no inventa estados.
 *
 * @param value Valor a validar.
 * @returns El perfil validado, o `null` si no cumple el contrato.
 */
export const parseProfileView = (value: unknown): MyProfileView | null => {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as { profile?: unknown; membership?: unknown }
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

  return {
    profile: {
      id: profile.id as number,
      firstName: profile.firstName as string,
      lastName: profile.lastName as string,
      email: profile.email as string,
      phone: profile.phone as string
    },
    membership: membership as unknown as MyMembership
  }
}

/**
 * Indica si un estado exige una accion de la persona.
 *
 * Es lo que decide si la tarjeta lleva un llamado o solo informa: una
 * membresia morosa o por vencer pide algo; una activa no.
 *
 * @param status Estado presentable.
 * @returns `true` si hay algo que hacer al respecto.
 */
export const needsAction = (status: MembershipDisplayStatus): boolean =>
  status === 'morosa' || status === 'por-vencer' || status === 'vencida'
