interface UseSignOutParams {
  /** Cierra la sesion local y revoca la renovacion en el API. */
  closeSession: () => Promise<void>
  /** Lleva a la pantalla de acceso. El caso de uso no navega por su cuenta. */
  goToLogin: () => Promise<void>
}

interface UseSignOutReturn {
  /** Indica si la salida esta en curso, para no dispararla dos veces. */
  isSigningOut: Ref<boolean>
  /** Cierra la sesion y lleva al acceso. */
  signOut: () => Promise<void>
}

/**
 * Caso de uso de "Salir" del tablero.
 *
 * Salir cierra la sesion en el servidor, no solo en el navegador: borrar el par
 * local dejaba viva la renovacion en el API, y quien la hubiera copiado podia
 * seguir entrando. Por eso recibe `closeSession` y no `endSession`.
 *
 * Se navega aunque el API no confirme la revocacion: `closeSession` ya borro la
 * sesion local y absorbe el fallo, y dejar a la persona en el tablero seria
 * dejarla atrapada.
 *
 * @param params Cierre de sesion y navegacion, inyectados.
 * @returns El estado de la salida y la accion.
 */
export const useSignOut = (params: UseSignOutParams): UseSignOutReturn => {
  const isSigningOut = ref(false)

  const signOut = async (): Promise<void> => {
    if (isSigningOut.value) return

    isSigningOut.value = true

    try {
      await params.closeSession()
      await params.goToLogin()
    } finally {
      isSigningOut.value = false
    }
  }

  return { isSigningOut, signOut }
}
