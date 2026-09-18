<template>
  <div class="app-error">
    <h1 class="app-error__title">{{ title }}</h1>
    <p class="app-error__detail">{{ detail }}</p>
    <button type="button" class="app-error__action" @click="clearError({ redirect: '/' })">
      Volver al inicio
    </button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import type { NuxtError } from '#app'

/**
 * Entrada de error de Nuxt. Es el unico `.vue` del portal que lleva su script en
 * linea: Nuxt exige el archivo en `app/error.vue` y no admite la carpeta de
 * slice del resto de las vistas.
 *
 * Deliberadamente sin dependencias: esta pantalla tiene que poder renderizarse
 * cuando lo demas fallo.
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
    const title = computed(() =>
      props.error.statusCode === 404 ? 'No encontramos esta pagina' : 'Algo no salio bien'
    )

    const detail = computed(() =>
      props.error.statusCode === 404
        ? 'La direccion que abriste no existe o cambio de lugar.'
        : 'Vuelve a intentarlo en un momento. Si sigue pasando, avisa al estudio.'
    )

    return { title, detail, clearError }
  }
})
</script>

<style lang="scss" scoped>
.app-error {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
  justify-content: center;
  min-block-size: 100dvh;
  padding: var(--space-6);
  text-align: center;

  &__title {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    color: var(--color-fg);
  }

  &__detail {
    max-inline-size: 42ch;
    color: var(--color-fg-muted);
  }

  &__action {
    padding: var(--space-3) var(--space-5);
    font: inherit;
    color: var(--color-on-primary);
    cursor: pointer;
    background: var(--color-primary);
    border: 0;
    border-radius: var(--radius-pill);
  }
}
</style>
