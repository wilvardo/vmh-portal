<template>
  <section class="verify">
    <ProgressSpinner v-if="status === 'checking'" class="verify__spinner" />
    <p v-if="status === 'checking'" class="verify__subtitle">{{ $t('verify_checking') }}</p>

    <template v-if="status === 'confirmed'">
      <header class="verify__heading">
        <h1 class="verify__title">{{ $t('verify_confirmed_title') }}</h1>
        <p class="verify__subtitle">{{ successMessage }}</p>
      </header>

      <NuxtLink class="verify__link" :to="loginPath">{{ $t('verify_sign_in') }}</NuxtLink>
    </template>

    <!-- Enlace roto: los tres desenlaces se ven igual y los tres ofrecen el
         reenvio, que es lo unico que la persona puede hacer al respecto. -->
    <Message
      v-if="errorTitle"
      class="verify__notice"
      severity="error"
      :closable="false"
      role="alert"
    >
      <span class="verify__notice-title">{{ errorTitle }}</span>
      <span v-if="errorDetail" class="verify__notice-detail">{{ errorDetail }}</span>
    </Message>

    <form v-if="status !== 'checking' && status !== 'confirmed'" class="verify__form" novalidate @submit.prevent="resend">
      <header class="verify__heading">
        <h2 class="verify__title">{{ $t('verify_resend_title') }}</h2>
        <p class="verify__subtitle">{{ $t('verify_resend_detail') }}</p>
      </header>

      <div class="input-box">
        <label for="verify-email">{{ $t('verify_email_label') }}</label>
        <InputText
          id="verify-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          fluid
          :disabled="isResending"
        />
      </div>

      <Button
        type="submit"
        :label="isResending ? $t('verify_resend_pending') : $t('verify_resend_submit')"
        :loading="isResending"
        :aria-busy="isResending"
        fluid
      />

      <!-- El mensaje del reenvio es el mismo exista o no la cuenta: se muestra
           tal como lo manda el API, sin adornarlo. -->
      <Message v-if="resendMessage" severity="success" :closable="false" role="status">
        {{ resendMessage }}
      </Message>

      <NuxtLink class="verify__link" :to="loginPath">{{ $t('verify_sign_in') }}</NuxtLink>
    </form>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
