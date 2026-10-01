<template>
  <article class="profile-card">
    <header class="profile-card__header">
      <h2 class="profile-card__label">{{ $t('profile_card_label') }}</h2>
      <Button
        class="profile-card__edit"
        severity="secondary"
        outlined
        :label="$t('profile_card_edit')"
        @click="requestEdit"
      />
    </header>

    <dl class="profile-card__facts">
      <div class="profile-card__fact">
        <dt>{{ $t('profile_card_name') }}</dt>
        <dd>{{ fullName }}</dd>
      </div>
      <div class="profile-card__fact">
        <dt>{{ $t('profile_card_email') }}</dt>
        <dd>{{ profile.email }}</dd>
      </div>
      <div class="profile-card__fact">
        <dt>{{ $t('profile_card_phone') }}</dt>
        <dd>{{ profile.phone }}</dd>
      </div>
      <div v-if="hasEmergencyContact" class="profile-card__fact">
        <dt>{{ $t('profile_card_emergency') }}</dt>
        <dd>{{ emergencyLine }}</dd>
      </div>
    </dl>

    <!-- Avisa sin bloquear: el tablero sigue sirviendo, pero el contacto es a
         quien se llama si algo pasa en una sesion. -->
    <Message
      v-if="!hasEmergencyContact"
      class="profile-card__missing"
      severity="warn"
      :closable="false"
      role="status"
    >
      <span class="profile-card__missing-title">{{ $t('profile_card_emergency_missing') }}</span>
      <span class="profile-card__missing-detail">
        {{ $t('profile_card_emergency_missing_detail') }}
      </span>
    </Message>

    <nav v-if="legalLinks" class="profile-card__legal" :aria-label="$t('profile_card_legal_label')">
      <a class="profile-card__link" :href="legalLinks.privacy" target="_blank" rel="noopener">
        {{ $t('profile_card_privacy') }}
      </a>
      <a class="profile-card__link" :href="legalLinks.terms" target="_blank" rel="noopener">
        {{ $t('profile_card_terms') }}
      </a>
    </nav>
  </article>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
