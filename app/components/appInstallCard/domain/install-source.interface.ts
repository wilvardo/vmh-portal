/**
 * Lo que la invitacion a instalar necesita del modulo PWA. Subconjunto de `$pwa`
 * (`@vite-pwa/nuxt`) sin depender de la libreria ni de Vue en el dominio.
 */
export interface InstallSource {
  /** El navegador capturo su aviso nativo y se puede mostrar. */
  showInstallPrompt: { readonly value: boolean }
  /** El portal ya corre instalado. */
  isPWAInstalled: { readonly value: boolean }
  /** Muestra el aviso nativo del sistema. */
  install: () => Promise<unknown>
  /** Descarta el aviso nativo y no vuelve a ofrecerlo. */
  cancelInstall: () => void
}
