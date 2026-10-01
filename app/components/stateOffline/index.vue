<template>
  <section class="state-offline" role="status">
    <svg
      class="state-offline__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 18l.01 0" />
      <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
      <path d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2" />
      <path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374" />
      <path d="M3 3l18 18" />
    </svg>
    <h2 class="state-offline__title">{{ $t('state_offline_title') }}</h2>
    <p class="state-offline__detail">{{ $t('state_offline_detail') }}</p>
    <Button
      class="state-offline__retry"
      variant="outlined"
      severity="secondary"
      :label="busy ? $t('state_offline_retrying') : $t('state_offline_retry')"
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
