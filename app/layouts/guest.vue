<template>
  <div class="guest-shell">
    <div class="guest-shell__content">
      <!-- Entrar o recuperar la contrasena necesitan red: se avisa antes de
           que la persona escriba nada. -->
      <offlineBanner class="guest-shell__offline" />
      <slot />
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
// Forma de las pantallas sin sesion del portal: lienzo completo, movil primero.
// La composicion la pone cada pantalla; las usan el acceso, el primer acceso y
// la recuperacion de contrasena.
</script>

<style lang="scss" scoped>
.guest-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-block-size: 100dvh;
  padding: var(--space-4);
  background: var(--color-bg-body);

  &__content {
    inline-size: 100%;
    max-inline-size: 26rem;
  }

  &__offline {
    margin-block-end: var(--space-4);
  }
}
</style>
