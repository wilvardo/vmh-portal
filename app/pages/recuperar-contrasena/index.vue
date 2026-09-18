<template>
  <section class="recovery">
    <header class="recovery__heading">
      <h1 class="recovery__title">{{ $t('recovery_title') }}</h1>
      <p class="recovery__subtitle">{{ $t('recovery_subtitle') }}</p>
    </header>

    <Message
      v-if="errorTitle"
      class="recovery__notice"
      severity="error"
      :closable="false"
      role="alert"
    >
      <span class="recovery__notice-title">{{ errorTitle }}</span>
      <span v-if="errorDetail" class="recovery__notice-detail">{{ errorDetail }}</span>
    </Message>

    <!-- El mensaje es el mismo exista o no la cuenta y se muestra tal como lo
         manda el API: cambiar de tono segun el resultado seria reintroducir en
         la interfaz la enumeracion que el endpoint evita. -->
    <Message v-if="sentMessage" severity="success" :closable="false" role="status">
      {{ sentMessage }}
    </Message>

    <form class="recovery__form" novalidate @submit.prevent="submit">
      <div class="input-box">
        <label for="recovery-email">{{ $t('recovery_email_label') }}</label>
        <InputText
          id="recovery-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          fluid
          :disabled="isSubmitting"
        />
      </div>

      <Button
        type="submit"
        :label="isSubmitting ? $t('recovery_pending') : $t('recovery_submit')"
        :loading="isSubmitting"
        :aria-busy="isSubmitting"
        fluid
      />
    </form>

    <NuxtLink class="recovery__link" :to="loginPath">{{ $t('recovery_back') }}</NuxtLink>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
