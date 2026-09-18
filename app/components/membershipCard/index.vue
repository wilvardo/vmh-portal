<template>
  <article class="membership-card" :data-status="membership.displayStatus">
    <header class="membership-card__header">
      <span class="membership-card__label">{{ $t('membership_label') }}</span>
      <Tag :severity="severity" :value="$t(`membership_status_${membership.displayStatus}`)" />
    </header>

    <!-- Sin membresia no es un error y no se pinta como tal: nadie hizo nada
         mal, es una invitacion a contratar. -->
    <template v-if="membership.displayStatus === 'sin-membresia'">
      <p class="membership-card__empty">{{ $t('membership_empty_detail') }}</p>
      <a v-if="siteUrl" class="membership-card__action" :href="siteUrl">
        {{ $t('membership_empty_action') }}
      </a>
    </template>

    <template v-else>
      <h2 class="membership-card__plan">{{ membership.serviceName }}</h2>
      <p class="membership-card__detail">{{ membership.planName }}</p>

      <dl class="membership-card__facts">
        <div class="membership-card__fact">
          <dt>{{ $t('membership_valid_until') }}</dt>
          <dd>{{ formattedEndsAt }}</dd>
        </div>

        <div v-if="membership.nextPayment" class="membership-card__fact">
          <dt>{{ $t('membership_next_payment') }}</dt>
          <dd>{{ formattedNextPayment }}</dd>
        </div>
      </dl>

      <p v-if="actionMessage" class="membership-card__call">{{ actionMessage }}</p>
    </template>
  </article>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
