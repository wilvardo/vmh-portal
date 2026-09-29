<template>
  <header class="portal-header">
    <div class="portal-header__bar">
      <span v-if="user" class="portal-header__account">
        <span class="portal-header__initials" aria-hidden="true">{{ initials }}</span>
        <span class="portal-header__name">{{ displayName }}</span>
      </span>

      <Button
        class="portal-header__sign-out"
        variant="text"
        severity="secondary"
        :loading="isSigningOut"
        :aria-busy="isSigningOut"
        @click="signOut"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M15 4.5H7.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H15" />
          <path d="M13.5 12h7m-3-3 3 3-3 3" />
        </svg>
        {{ isSigningOut ? $t('portal_header_signing_out') : $t('portal_header_sign_out') }}
      </Button>
    </div>

    <nav class="portal-header__nav" :aria-label="$t('portal_header_nav_label')">
      <NuxtLink
        v-for="link in links"
        :key="link.path"
        class="portal-header__link"
        :class="{ 'portal-header__link--active': link.isActive }"
        :to="link.path"
        :aria-current="link.isActive ? 'page' : undefined"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </header>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
