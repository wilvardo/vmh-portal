<template>
  <article class="schedule-session-card" :data-state="state">
    <header class="schedule-session-card__header">
      <span class="schedule-session-card__time">{{ time }}</span>
      <span v-if="stateLabel" class="schedule-session-card__state">
        <Tag :severity="stateSeverity" :value="stateLabel" />
      </span>
    </header>

    <p class="schedule-session-card__title">{{ title }}</p>
    <p v-if="session.professionalName" class="schedule-session-card__with">
      {{ $t('session_card_with', { name: session.professionalName }) }}
    </p>

    <p class="schedule-session-card__meta">
      <span>{{ $t('session_card_duration', { minutes: session.durationMinutes }) }}</span>
      <span v-if="showsSpots">
        {{ $t('session_card_spots', { remaining: session.remaining, capacity: session.capacity }) }}
      </span>
    </p>

    <div v-if="canBook || reservation" class="schedule-session-card__actions">
      <Button
        v-if="canBook"
        variant="outlined"
        severity="secondary"
        :label="bookLabel"
        @click="$emit('book', session)"
      />

      <template v-else-if="reservation">
        <Button
          v-if="reservation.isCancellable"
          variant="outlined"
          severity="danger"
          :label="$t('session_card_cancel')"
          @click="$emit('cancel', session)"
        />
        <p v-else class="schedule-session-card__note">{{ $t('session_card_cancel_closed') }}</p>
      </template>
    </div>
  </article>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
