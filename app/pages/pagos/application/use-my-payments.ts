import type { MyPayment, MyPaymentsPage } from '../domain/my-payments.interface'

interface UseMyPaymentsParams {
  /** Peticion al API, ya cableada. */
  load: (page: number) => Promise<MyPaymentsPage>
  /** Encabezado del fallo de carga, ya traducido. */
  loadErrorTitle: string
}

interface UseMyPaymentsReturn {
  /** Pagos pintados, de todas las tandas pedidas. */
  payments: Ref<MyPayment[]>
  /** Pagos propios en total. */
  total: Ref<number>
  /** Hay una carga en curso. */
  isLoading: Ref<boolean>
  /** Encabezado del error de la primera carga, o cadena vacia. */
  errorTitle: Ref<string>
  /** `true` si fallo la ultima peticion de pagos anteriores. */
  moreFailed: Ref<boolean>
  /** `true` cuando quedan tandas por pedir. */
  hasMore: ComputedRef<boolean>
  /** `true` cuando ya cargo y no hay un solo pago. */
  isEmpty: ComputedRef<boolean>
  /** Carga la primera tanda. */
  refresh: () => Promise<void>
  /** Pide la siguiente tanda y la suma abajo. */
  loadMore: () => Promise<void>
}

/**
 * Caso de uso de "Mis pagos": la primera tanda y las anteriores bajo pedido.
 *
 * Se piden por tandas y se suman abajo, en vez de paginar: se lee desde el
 * telefono, y "ver anteriores" es mas natural que saltar de pagina. Un fallo al
 * pedir mas no borra lo que ya estaba pintado.
 *
 * @param params Peticion y texto del error.
 * @returns El estado de la lista y sus acciones.
 */
export const useMyPayments = (params: UseMyPaymentsParams): UseMyPaymentsReturn => {
  const payments = ref<MyPayment[]>([])
  const total = ref(0)
  const page = ref(0)
  const lastPage = ref(0)
  const isLoading = ref(false)
  const errorTitle = ref('')
  const hasLoaded = ref(false)
  const moreFailed = ref(false)

  const hasMore = computed<boolean>(() => page.value < lastPage.value)
  const isEmpty = computed<boolean>(
    () => hasLoaded.value && !isLoading.value && payments.value.length === 0
  )

  /**
   * Carga la primera tanda y reemplaza lo pintado.
   *
   * @returns Promesa que resuelve cuando termino, con exito o sin el.
   */
  const refresh = async (): Promise<void> => {
    isLoading.value = true
    errorTitle.value = ''

    try {
      const first = await params.load(1)
      payments.value = first.payments
      total.value = first.total
      page.value = first.page
      lastPage.value = first.lastPage
      hasLoaded.value = true
    } catch (error: unknown) {
      console.error('useMyPayments: no se pudieron cargar los pagos', error)
      payments.value = []
      errorTitle.value = params.loadErrorTitle
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Pide la tanda siguiente y la suma abajo.
   *
   * @returns Promesa que resuelve cuando termino, con exito o sin el.
   */
  const loadMore = async (): Promise<void> => {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true
    moreFailed.value = false

    try {
      const next = await params.load(page.value + 1)
      payments.value = [...payments.value, ...next.payments]
      total.value = next.total
      page.value = next.page
      lastPage.value = next.lastPage
    } catch (error: unknown) {
      console.error('useMyPayments: no se pudieron cargar pagos anteriores', error)
      moreFailed.value = true
    } finally {
      isLoading.value = false
    }
  }

  return {
    payments,
    total,
    isLoading,
    errorTitle,
    moreFailed,
    hasMore,
    isEmpty,
    refresh,
    loadMore
  }
}
