<template>
  <section class="upcoming-sessions">
    <h2 class="upcoming-sessions__title">{{ $t('home_sessions_title') }}</h2>

    <p v-if="items.length === 0" class="upcoming-sessions__empty">
      {{ $t('home_sessions_empty') }}
    </p>

    <ul v-else class="upcoming-sessions__list">
      <li v-for="item in items" :key="item.id" class="upcoming-sessions__item">
        <span class="upcoming-sessions__name">{{ item.name }}</span>
        <span class="upcoming-sessions__when">
          <span class="upcoming-sessions__day">{{ item.day }}</span>
          <span class="upcoming-sessions__time">{{ item.time }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
