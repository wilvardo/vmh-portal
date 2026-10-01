import {
  buildSiteExitUrl,
  resolveBlockExit,
  resolvePersonalBlock
} from '../domain/booking-notice.helpers'
import type { BookingNoticeText, BookingNoticeView } from '../domain/booking-notice.interface'
import type { BookingExit, PersonalBlockCode } from '../domain/booking-notice.type'
import type { WeekSchedule } from '../domain/schedule.interface'

interface BookingNoticeMessages {
  /** Causa y salida de cada rechazo de la persona, ya traducidas. */
  notices: Readonly<Record<PersonalBlockCode, BookingNoticeText>>
  /** Texto de cada enlace de salida. */
  exits: Readonly<Record<BookingExit, string>>
}

interface UseBookingNoticeParams {
  /** Semana cargada. */
  schedule: Ref<WeekSchedule | null>
  /** Direccion del sitio publico; puede faltar. */
  siteUrl: string
  /** Textos ya traducidos. */
  messages: BookingNoticeMessages
}

interface UseBookingNoticeReturn {
  /** Aviso de la semana, o `null` si nada de la persona le impide reservar. */
  notice: ComputedRef<BookingNoticeView | null>
}

/**
 * Aviso unico de por que la persona no puede reservar esta semana.
 *
 * Cuando el bloqueo es suyo (sin membresia, membresia que no esta activa,
 * mensualidad vencida, evaluacion por hacer) le cierra todos los
 * entrenamientos por igual: decirlo en cada tarjeta seria repetir lo mismo
 * veinte veces. Se dice una vez, arriba de la semana, con la causa y la salida.
 * La causa la decide el API (`bookingBlockedBy`); el portal solo la nombra.
 *
 * @param params Semana, sitio y textos.
 * @returns El aviso listo para pintarse.
 */
export const useBookingNotice = (params: UseBookingNoticeParams): UseBookingNoticeReturn => {
  const notice = computed<BookingNoticeView | null>(() => {
    const schedule = params.schedule.value
    if (schedule === null) return null

    const code = resolvePersonalBlock(schedule)
    if (code === null) return null

    const exit = resolveBlockExit(code)
    const exitUrl = exit === null ? '' : buildSiteExitUrl(params.siteUrl, exit)

    return {
      ...params.messages.notices[code],
      exitUrl,
      exitLabel: exit === null || exitUrl === '' ? '' : params.messages.exits[exit]
    }
  })

  return { notice }
}
