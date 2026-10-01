<template>
  <div class="portal-shell">
    <portalHeader />

    <main class="portal-shell__content">
      <!-- Sin red, lo ya cargado se sigue viendo con esta franja encima. -->
      <offlineBanner class="portal-shell__offline" />
      <slot />
    </main>

    <Toast />
  </div>
</template>

<script setup lang="ts">
// Forma de las pantallas con sesion del portal (VMH-31): la misma estructura
// del panel -barra lateral, barra superior y lienzo a todo el ancho- y, en el
// telefono, barra superior con pestañas abajo. La reticula vive en
// `assets/design-system/_shell.scss`.
</script>
