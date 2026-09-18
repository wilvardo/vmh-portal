/**
 * Estado de la membresia tal como lo manda el API.
 *
 * Son seis y no cuatro: a los estados que la base guarda se suman "por vencer"
 * y "sin membresia", que el API deriva al leer. El portal no los recalcula ni
 * los interpreta, solo decide como se ven.
 */
export type MembershipDisplayStatus =
  | 'activa'
  | 'por-vencer'
  | 'suspendida'
  | 'morosa'
  | 'vencida'
  | 'sin-membresia'

/** Proximo cobro de una membresia mensual. */
export interface NextPayment {
  /** Fecha en la que toca pagar, en formato ISO. */
  dueDate: string

  /** Importe congelado al contratar. */
  amount: number
}

/** Membresia del atleta. */
export interface MyMembership {
  id: number | null
  displayStatus: MembershipDisplayStatus
  serviceName: string | null
  planName: string | null
  paymentMode: string | null
  startsAt: string | null
  endsAt: string | null
  nextPayment: NextPayment | null
}

/** Datos de contacto del atleta. */
export interface MyProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
}

/** Respuesta completa del perfil propio. */
export interface MyProfileView {
  profile: MyProfile
  membership: MyMembership
}
