<template>
  <!-- Una sola pieza dueña de la navegacion, la cuenta y la salida, que se pinta
       en tres lugares: la barra lateral (escritorio), la barra superior y la de
       pestañas (telefono). La raiz no ocupa caja: cada parte se acomoda en la
       reticula del layout. -->
  <div class="portal-header">
    <aside class="portal-header__sidebar">
      <div class="portal-header__brand">
        <img
          class="portal-header__isotype"
          src="/logos/isotipo.svg"
          alt=""
          width="20"
          height="20"
        />
        <span class="portal-header__brand-name">{{ brandName }}</span>
        <span class="portal-header__brand-tag" :title="brandDescriptor">{{
          $t('portal_header_brand_tag')
        }}</span>
      </div>

      <nav class="portal-header__nav" :aria-label="$t('portal_header_nav_label')">
        <p class="portal-header__nav-label" aria-hidden="true">
          {{ $t('portal_header_nav_group') }}
        </p>
        <NuxtLink
          v-for="link in links"
          :key="link.path"
          class="portal-header__link"
          :class="{ 'portal-header__link--active': link.isActive }"
          :to="link.path"
          :aria-current="link.isActive ? 'page' : undefined"
        >
          <portalNavIcon class="portal-header__link-icon" :name="link.icon" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <header class="portal-header__bar">
      <span class="portal-header__mobile-brand">
        <img
          class="portal-header__isotype"
          src="/logos/isotipo.svg"
          alt=""
          width="20"
          height="20"
        />
        <span class="portal-header__brand-name">{{ brandName }}</span>
      </span>

      <p v-if="currentLabel" class="portal-header__screen">{{ currentLabel }}</p>

      <div class="portal-header__session">
        <span v-if="user" class="portal-header__account">
          <span class="portal-header__initials" aria-hidden="true">{{ initials }}</span>
          <span class="portal-header__identity">
            <span class="portal-header__name">{{ displayName }}</span>
            <span class="portal-header__role">{{ $t('portal_header_role') }}</span>
          </span>
        </span>

        <!-- Salida de solo icono: el texto viaja en la etiqueta accesible y en
             el tooltip, y cambia a gerundio mientras se cierra la sesion. -->
        <Button
          v-tooltip.bottom="signOutLabel"
          class="portal-header__sign-out"
          variant="text"
          severity="secondary"
          :loading="isSigningOut"
          :aria-busy="isSigningOut"
          :aria-label="signOutLabel"
          @click="signOut"
        >
          <svg
            v-if="!isSigningOut"
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
        </Button>
      </div>
    </header>

    <!-- En el telefono los tres destinos van abajo, al alcance del pulgar: con
         tres opciones un menu escondido costaria un toque mas cada vez. -->
    <nav class="portal-header__tabbar" :aria-label="$t('portal_header_nav_label')">
      <NuxtLink
        v-for="link in links"
        :key="link.path"
        class="portal-header__tab"
        :class="{ 'portal-header__tab--active': link.isActive }"
        :to="link.path"
        :aria-current="link.isActive ? 'page' : undefined"
      >
        <portalNavIcon class="portal-header__tab-icon" :name="link.icon" />
        <span>{{ link.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
