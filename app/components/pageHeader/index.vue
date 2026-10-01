<template>
  <header class="page-header">
    <div class="page-header__lead">
      <p v-if="eyebrow" class="page-header__eyebrow eyebrow">{{ eyebrow }}</p>
      <h1 class="page-header__title">
        {{ titleParts.text
        }}<span v-if="titleParts.mark" class="page-header__mark">{{ titleParts.mark }}</span>
      </h1>
      <p v-if="support" class="page-header__support">{{ support }}</p>
      <slot name="note" />
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
