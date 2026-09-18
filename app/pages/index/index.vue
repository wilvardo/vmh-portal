<template>
  <div class="access">
    <h1 class="access__title">{{ descriptor }}</h1>
    <p class="access__detail">
      La pantalla de acceso llega con el caso de uso de sesion. Este andamiaje existe para que el
      portal arranque, compile y se valide de punta a punta.
    </p>
  </div>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
.access {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: center;

  &__title {
    font-family: var(--font-display);
    font-size: var(--fs-h3);
    color: var(--color-fg);
  }

  &__detail {
    color: var(--color-fg-muted);
  }
}
</style>
