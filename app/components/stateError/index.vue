<template>
  <section class="state-error" role="alert">
    <svg
      class="state-error__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
    <h2 class="state-error__title">{{ title }}</h2>
    <p v-if="detail" class="state-error__detail">{{ detail }}</p>
    <Button
      v-if="retryLabel"
      class="state-error__retry"
      variant="outlined"
      severity="secondary"
      :label="retryLabel"
      :loading="busy"
      :aria-busy="busy"
      @click="$emit('retry')"
    />
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
