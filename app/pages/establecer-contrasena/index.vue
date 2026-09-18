<template>
  <section class="set-password">
    <template v-if="isDone">
      <header class="set-password__heading">
        <h1 class="set-password__title">{{ successMessage }}</h1>
      </header>

      <NuxtLink class="set-password__link" :to="loginPath">
        {{ $t('set_password_sign_in') }}
      </NuxtLink>
    </template>

    <template v-else>
      <header class="set-password__heading">
        <h1 class="set-password__title">{{ $t('set_password_title') }}</h1>
        <p class="set-password__subtitle">{{ $t('set_password_subtitle') }}</p>
      </header>

      <Message
        v-if="errorTitle"
        class="set-password__notice"
        severity="error"
        :closable="false"
        role="alert"
      >
        <span class="set-password__notice-title">{{ errorTitle }}</span>
        <span v-if="errorDetail" class="set-password__notice-detail">{{ errorDetail }}</span>
        <NuxtLink class="set-password__notice-action" :to="recoveryPath">
          {{ $t('set_password_request_new') }}
        </NuxtLink>
      </Message>

      <form class="set-password__form" novalidate @submit.prevent="submit">
        <div class="input-box">
          <label for="set-password-value">{{ $t('set_password_label') }}</label>
          <Password
            v-model="password"
            input-id="set-password-value"
            :feedback="false"
            toggle-mask
            fluid
            :disabled="isSubmitting"
            :input-props="{ name: 'new-password', autocomplete: 'new-password' }"
          />
          <small class="set-password__hint">{{ $t('set_password_hint') }}</small>
        </div>

        <div class="input-box">
          <label for="set-password-confirmation">{{ $t('set_password_confirm_label') }}</label>
          <Password
            v-model="confirmation"
            input-id="set-password-confirmation"
            :feedback="false"
            toggle-mask
            fluid
            :disabled="isSubmitting"
            :input-props="{ name: 'confirm-password', autocomplete: 'new-password' }"
          />
        </div>

        <Button
          type="submit"
          :label="isSubmitting ? $t('set_password_pending') : $t('set_password_submit')"
          :loading="isSubmitting"
          :aria-busy="isSubmitting"
          fluid
        />
      </form>
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
