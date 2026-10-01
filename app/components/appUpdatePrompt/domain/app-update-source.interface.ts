/**
 * Lo que el aviso de version nueva necesita del service worker. Es un
 * subconjunto de `$pwa` (`@vite-pwa/nuxt`) para no depender de la libreria ni
 * de Vue en el dominio.
 */
export interface AppUpdateSource {
  /** `true` cuando hay una version nueva esperando a activarse. */
  needRefresh: { readonly value: boolean }
  /** Activa la version en espera; con `true` recarga la pagina despues. */
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  /** Descarta el aviso hasta la siguiente version. */
  cancelPrompt: () => Promise<void>
}
