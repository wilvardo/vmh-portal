<template>
  <section class="upcoming-sessions">
    <h2 class="upcoming-sessions__title">{{ $t('home_sessions_title') }}</h2>

    <div v-if="items.length === 0" class="upcoming-sessions__empty">
      <p class="upcoming-sessions__empty-text">{{ $t('home_sessions_empty') }}</p>
      <NuxtLink class="upcoming-sessions__empty-action" :to="schedulePath">
        {{ $t('home_sessions_empty_action') }}
      </NuxtLink>
    </div>

    <ul v-else class="upcoming-sessions__list">
      <li v-for="item in items" :key="item.id" class="upcoming-sessions__item">
        <div class="upcoming-sessions__info">
          <span class="upcoming-sessions__name">{{ item.name }}</span>
          <span class="upcoming-sessions__when">
            <span class="upcoming-sessions__day">{{ item.day }}</span>
            <span class="upcoming-sessions__time">{{ item.time }}</span>
          </span>
        </div>

        <!-- Destructivo con texto, nunca solo icono (components.md). -->
        <Button
          v-if="item.isCancellable"
          class="upcoming-sessions__cancel"
          variant="outlined"
          severity="danger"
          :label="$t('home_session_cancel')"
          @click="$emit('cancel', item)"
        />
        <p v-else class="upcoming-sessions__closed">{{ $t('home_session_cancel_closed') }}</p>
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
