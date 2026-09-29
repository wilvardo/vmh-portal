<template>
  <section
    v-if="notice"
    class="evaluation-notice"
    :class="{ 'evaluation-notice--pending': notice.kind === 'schedule' }"
  >
    <template v-if="notice.kind === 'schedule'">
      <h2 class="evaluation-notice__title">{{ $t('evaluation_notice_schedule_title') }}</h2>
      <p class="evaluation-notice__detail">{{ $t('evaluation_notice_schedule_detail') }}</p>
      <NuxtLink class="evaluation-notice__action" :to="schedulePath">
        {{ $t('evaluation_notice_schedule_action') }}
      </NuxtLink>
    </template>

    <template v-else>
      <h2 class="evaluation-notice__title">{{ bookedTitle }}</h2>
      <p class="evaluation-notice__detail">{{ $t('evaluation_notice_booked_detail') }}</p>
    </template>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
