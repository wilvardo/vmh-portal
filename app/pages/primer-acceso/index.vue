<template>
  <section class="first-access">
    <header class="first-access__heading">
      <p class="first-access__step">
        {{ $t('first_access_step', { current: stepPosition, total: totalSteps }) }}
      </p>
      <h1 class="first-access__title">{{ $t('first_access_title') }}</h1>
      <p v-if="step === steps.EMAIL" class="first-access__subtitle">
        {{ $t('first_access_email_subtitle') }}
      </p>
      <p v-else-if="step === steps.CODE" class="first-access__subtitle">
        {{ $t('first_access_code_subtitle', { email }) }}
      </p>
      <p v-else class="first-access__subtitle">{{ $t('first_access_password_subtitle') }}</p>
    </header>

    <Message
      v-if="errorTitle"
      class="first-access__notice"
      severity="error"
      :closable="false"
      role="alert"
    >
      <span class="first-access__notice-title">{{ errorTitle }}</span>
      <span v-if="errorDetail" class="first-access__notice-detail">{{ errorDetail }}</span>
    </Message>

    <!-- El acuse es el mismo exista o no la cuenta y se muestra tal como lo
         manda el API: cambiar de tono segun el resultado reintroduciria en la
         interfaz la enumeracion que el endpoint evita. -->
    <Message
      v-if="sentMessage && step === steps.CODE && !errorTitle"
      severity="success"
      :closable="false"
      role="status"
    >
      {{ sentMessage }}
    </Message>

    <form
      v-if="step === steps.EMAIL"
      class="first-access__form"
      novalidate
      @submit.prevent="sendCode"
    >
      <div class="input-box">
        <label for="first-access-email">{{ $t('first_access_email_label') }}</label>
        <InputText
          id="first-access-email"
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
        :label="isSubmitting ? $t('first_access_email_pending') : $t('first_access_email_submit')"
        :loading="isSubmitting"
        :aria-busy="isSubmitting"
        fluid
      />
    </form>

    <form
      v-else-if="step === steps.CODE"
      class="first-access__form"
      novalidate
      @submit.prevent="confirmCode"
    >
      <div class="input-box">
        <label for="first-access-code">{{ $t('first_access_code_label') }}</label>
        <InputText
          id="first-access-code"
          v-model="code"
          class="first-access__code"
          type="text"
          name="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          aria-describedby="first-access-code-hint"
          fluid
        />
        <small id="first-access-code-hint" class="first-access__hint">
          {{ $t('first_access_code_hint') }}
        </small>
      </div>

      <Button type="submit" :label="$t('first_access_code_submit')" fluid />

      <div class="first-access__resend" aria-live="polite">
        <Button
          v-if="canResend || isResending"
          type="button"
          variant="text"
          severity="secondary"
          :label="isResending ? $t('first_access_resend_pending') : $t('first_access_resend')"
          :loading="isResending"
          :aria-busy="isResending"
          @click="resendCode"
        />
        <span v-else class="first-access__hint">
          {{ $t('first_access_resend_wait', { seconds: resendSecondsLeft }) }}
        </span>
      </div>

      <button type="button" class="first-access__link" @click="changeEmail">
        {{ $t('first_access_change_email') }}
      </button>
    </form>

    <form v-else class="first-access__form" novalidate @submit.prevent="submitPassword">
      <!-- Campo oculto para que el gestor de contrasenas asocie la nueva
           contrasena con el correo correcto. -->
      <input
        class="first-access__username"
        type="email"
        name="username"
        autocomplete="username"
        :value="email"
        readonly
        tabindex="-1"
        aria-hidden="true"
      />

      <div class="input-box">
        <label for="first-access-password">{{ $t('first_access_password_label') }}</label>
        <Password
          v-model="password"
          input-id="first-access-password"
          :feedback="false"
          toggle-mask
          fluid
          :disabled="isSubmitting"
          :input-props="{
            name: 'new-password',
            autocomplete: 'new-password',
            'aria-describedby': 'first-access-password-hint'
          }"
        />
        <small id="first-access-password-hint" class="first-access__hint">
          {{ $t('first_access_password_hint') }}
        </small>
      </div>

      <div class="input-box">
        <label for="first-access-confirmation">
          {{ $t('first_access_password_confirm_label') }}
        </label>
        <Password
          v-model="confirmation"
          input-id="first-access-confirmation"
          :feedback="false"
          toggle-mask
          fluid
          :disabled="isSubmitting"
          :input-props="{ name: 'confirm-password', autocomplete: 'new-password' }"
        />
      </div>

      <Button
        type="submit"
        :label="
          isSubmitting ? $t('first_access_password_pending') : $t('first_access_password_submit')
        "
        :loading="isSubmitting"
        :aria-busy="isSubmitting"
        fluid
      />

      <button
        type="button"
        class="first-access__link"
        :disabled="isSubmitting"
        @click="backToCode"
      >
        {{ $t('first_access_back_to_code') }}
      </button>
    </form>

    <footer class="first-access__closing">
      <span>{{ $t('first_access_has_password') }}</span>
      <NuxtLink class="first-access__link" :to="loginPath">{{ $t('first_access_sign_in') }}</NuxtLink>
      <NuxtLink class="first-access__link" :to="recoveryPath">
        {{ $t('first_access_forgot') }}
      </NuxtLink>
    </footer>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
