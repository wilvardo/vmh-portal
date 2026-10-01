<template>
  <main class="app-error">
    <div class="app-error__brand">
      <img class="app-error__isotype" src="/logos/isotipo.svg" alt="" width="24" height="24" />
      <span class="app-error__wordmark">{{ brandName }}</span>
    </div>

    <section class="app-error__body" :aria-labelledby="'app-error-title'">
      <svg
        class="app-error__icon"
        :class="`app-error__icon--${kind}`"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <template v-if="kind === 'offline'">
          <path d="M12 18l.01 0" />
          <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
          <path
            d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2"
          />
          <path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374" />
          <path d="M3 3l18 18" />
        </template>
        <template v-else-if="kind === 'not-found'">
          <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
          <path d="M8 10h4" />
        </template>
        <template v-else>
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </template>
      </svg>

      <p class="app-error__eyebrow">{{ eyebrow }}</p>
      <h1 id="app-error-title" class="app-error__title">
        {{ title }}<span class="app-error__mark" aria-hidden="true">.</span>
      </h1>
      <p class="app-error__detail">{{ detail }}</p>

      <!-- Botones nativos a proposito: esta pantalla tiene que pintarse aunque
           lo demas haya fallado, sin depender de la libreria de componentes. -->
      <div class="app-error__actions">
        <button
          v-if="kind !== 'not-found'"
          type="button"
          class="app-error__secondary"
          @click="reload"
        >
          {{ retryLabel }}
        </button>
        <button type="button" class="app-error__action" @click="clearError({ redirect: '/' })">
          {{ backHome }}
        </button>
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import type { NuxtError } from '#app'
import { PORTAL_BRAND_NAME } from '~/resources/scripts/constants/portal.const'

/** Las tres caras de la pantalla de error. */
type ErrorKind = 'not-found' | 'offline' | 'generic'

/**
 * Entrada de error de Nuxt. Es el unico `.vue` del portal que lleva su script en
 * linea: Nuxt exige el archivo en `app/error.vue` y no admite la carpeta de
 * slice del resto de las vistas.
 *
 * Tres caras: la ruta no existe, el dispositivo esta sin red (la app instalada
 * abre sin conexion y algo no pudo cargar) o cualquier otra falla. Sus textos
 * salen del locale global (`i18n/locales/es.json`), reservado justo para lo que
 * no pertenece a ningun slice. No depende de nada mas: tiene que poder
 * renderizarse cuando lo demas fallo.
 */
export default defineComponent({
  name: 'AppError',
  props: {
    /** Error que Nuxt no pudo renderizar. */
    error: {
      type: Object as PropType<NuxtError>,
      required: true
    }
  },
  setup(props) {
    const i18n = useI18n()

    const kind = computed<ErrorKind>(() => {
      if (props.error.statusCode === 404) return 'not-found'
      if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'

      return 'generic'
    })

    const eyebrow = computed(() =>
      kind.value === 'not-found'
        ? i18n.t('error_not_found_eyebrow')
        : kind.value === 'offline'
          ? i18n.t('error_offline_eyebrow')
          : i18n.t('error_generic_eyebrow')
    )

    const title = computed(() =>
      kind.value === 'not-found'
        ? i18n.t('error_not_found_title')
        : kind.value === 'offline'
          ? i18n.t('error_offline_title')
          : i18n.t('error_generic_title')
    )

    const detail = computed(() =>
      kind.value === 'not-found'
        ? i18n.t('error_not_found_message')
        : kind.value === 'offline'
          ? i18n.t('error_offline_message')
          : i18n.t('error_generic_message')
    )

    const backHome = computed(() => i18n.t('error_back_home'))
    const retryLabel = computed(() => i18n.t('error_retry'))

    /** Vuelve a cargar la pantalla en la que fallo, para reintentar sin perder la ruta. */
    const reload = (): void => {
      window.location.reload()
    }

    return {
      kind,
      eyebrow,
      title,
      detail,
      backHome,
      retryLabel,
      reload,
      clearError,
      brandName: PORTAL_BRAND_NAME
    }
  }
})
</script>

<style lang="scss" scoped>
.app-error {
  display: flex;
  flex-direction: column;
  min-block-size: 100dvh;
  padding: var(--space-5) var(--space-5) calc(var(--space-10) + env(safe-area-inset-bottom));
  background: var(--color-bg);

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__isotype {
    inline-size: var(--icon-md);
    block-size: var(--icon-md);
  }

  &__wordmark {
    font-family: var(--font-display);
    font-size: var(--app-fs-table);
    font-weight: var(--fw-medium);
    letter-spacing: var(--tracking-wordmark);
    color: var(--color-fg);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    text-align: center;
  }

  &__icon {
    inline-size: var(--icon-xl);
    block-size: var(--icon-xl);
    margin-block-end: var(--space-2);
    color: var(--color-danger-fg);

    // Sin red o sin pagina no es una falla del sistema: va en el acento.
    &--offline,
    &--not-found {
      color: var(--color-primary);
    }
  }

  &__eyebrow {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--app-fs-label);
    font-weight: var(--fw-medium);
    letter-spacing: var(--tracking-caption);
    text-transform: uppercase;
    color: var(--color-fg-muted);
  }

  &__title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    font-weight: var(--fw-medium);
    letter-spacing: var(--tracking-tight);
    color: var(--color-fg);
  }

  &__mark {
    color: var(--color-primary);
  }

  &__detail {
    margin: 0;
    max-inline-size: 42ch;
    font-size: var(--app-fs-table);
    color: var(--color-fg-secondary);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin-block-start: var(--space-4);
  }

  // Mismo boton que el primario del sistema: pill, geometrica y caja alta.
  &__action,
  &__secondary {
    min-block-size: var(--app-control-h);
    padding-inline: var(--space-5);
    font-family: var(--font-display);
    font-size: var(--app-fs-label);
    font-weight: var(--fw-medium);
    letter-spacing: var(--tracking-button);
    border-radius: var(--radius-pill);
    cursor: pointer;

    &:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring-color);
      outline-offset: var(--focus-ring-offset);
    }
  }

  &__action {
    text-transform: uppercase;
    color: var(--color-on-primary);
    background: var(--color-primary);
    border: 0;

    @media (hover: hover) {
      &:hover {
        background: var(--color-primary-strong);
      }
    }
  }

  &__secondary {
    font-size: var(--app-fs-meta);
    color: var(--color-fg);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
  }
}
</style>
