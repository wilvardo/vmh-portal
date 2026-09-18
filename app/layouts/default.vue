<template>
  <div class="portal-shell">
    <main class="portal-shell__content">
      <slot />
    </main>

    <Toast />
  </div>
</template>

<script setup lang="ts">
// Forma de las pantallas con sesion del portal. Movil primero: una sola columna
// centrada, sin barra lateral. El encabezado con la identidad y la salida llega
// con el caso de uso de sesion.
</script>

<style lang="scss" scoped>
.portal-shell {
  min-block-size: 100dvh;
  background: var(--color-bg-body);

  &__content {
    inline-size: 100%;
    max-inline-size: 42rem;
    margin-inline: auto;
    padding: var(--space-5) var(--space-4);
  }
}
</style>
