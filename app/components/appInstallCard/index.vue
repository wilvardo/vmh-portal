<template>
  <section v-if="mode !== INSTALL_MODE.NONE" class="app-install-card">
    <img class="app-install-card__icon" src="/pwa/pwa-64x64.png" alt="" width="40" height="40" />

    <div class="app-install-card__text">
      <h2 class="app-install-card__title">{{ $t('app_install_title') }}</h2>
      <p v-if="mode === INSTALL_MODE.PROMPT" class="app-install-card__detail">
        {{ $t('app_install_prompt_detail') }}
      </p>
      <p v-else class="app-install-card__detail">
        <!-- Icono de Compartir de iOS: es lo que la persona busca en la barra. -->
        <svg
          class="app-install-card__share"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"
          />
          <path d="M12 14v-11" />
          <path d="M9 6l3 -3l3 3" />
        </svg>
        {{ $t('app_install_ios_detail') }}
      </p>
    </div>

    <div class="app-install-card__actions">
      <Button
        variant="text"
        severity="secondary"
        :label="
          mode === INSTALL_MODE.PROMPT ? $t('app_install_dismiss') : $t('app_install_ios_dismiss')
        "
        @click="dismiss"
      />
      <Button
        v-if="mode === INSTALL_MODE.PROMPT"
        variant="outlined"
        severity="secondary"
        :label="isInstalling ? $t('app_install_action_busy') : $t('app_install_action')"
        :loading="isInstalling"
        :aria-busy="isInstalling"
        @click="install"
      />
    </div>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
