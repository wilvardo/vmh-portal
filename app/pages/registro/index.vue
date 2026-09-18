<template>
  <section class="register">
    <!-- Alta terminada: la misma pantalla cambia de estado en vez de navegar,
         para no perder el correo que hay que repetirle a la persona. -->
    <template v-if="account">
      <header class="register__heading">
        <h1 class="register__title">{{ $t('register_done_title') }}</h1>
        <p class="register__subtitle">{{ doneDetail }}</p>
      </header>

      <p class="register__hint">{{ $t('register_done_hint') }}</p>

      <NuxtLink class="register__link" :to="resendPath">{{ $t('register_done_resend') }}</NuxtLink>
      <NuxtLink class="register__link" :to="loginPath">{{ $t('register_sign_in') }}</NuxtLink>
    </template>

    <template v-else>
      <header class="register__heading">
        <div class="register__lockup">
          <img class="register__isotype" src="/logos/isotipo.svg" alt="" width="28" height="28" />
          <span class="register__brand-name">{{ brandName }}</span>
        </div>

        <h1 class="register__title">{{ $t('register_title') }}</h1>
        <p class="register__subtitle">{{ $t('register_subtitle') }}</p>
      </header>

      <Message
        v-if="errorTitle"
        class="register__notice"
        severity="error"
        :closable="false"
        role="alert"
      >
        <span class="register__notice-title">{{ errorTitle }}</span>
        <span v-if="errorDetail" class="register__notice-detail">{{ errorDetail }}</span>
      </Message>

      <form class="register__form" novalidate @submit.prevent="submit">
        <div class="input-box">
          <label for="register-first-name">{{ $t('register_first_name_label') }}</label>
          <InputText
            id="register-first-name"
            v-model="values.firstName"
            name="given-name"
            autocomplete="given-name"
            fluid
            :invalid="Boolean(fieldErrors.firstName)"
            :disabled="isSubmitting"
          />
          <small v-if="fieldErrors.firstName" class="register__field-error">
            {{ fieldErrors.firstName }}
          </small>
        </div>

        <div class="input-box">
          <label for="register-last-name">{{ $t('register_last_name_label') }}</label>
          <InputText
            id="register-last-name"
            v-model="values.lastName"
            name="family-name"
            autocomplete="family-name"
            fluid
            :invalid="Boolean(fieldErrors.lastName)"
            :disabled="isSubmitting"
          />
          <small v-if="fieldErrors.lastName" class="register__field-error">
            {{ fieldErrors.lastName }}
          </small>
        </div>

        <div class="input-box">
          <label for="register-email">{{ $t('register_email_label') }}</label>
          <InputText
            id="register-email"
            v-model="values.email"
            type="email"
            name="email"
            autocomplete="email"
            inputmode="email"
            fluid
            :invalid="Boolean(fieldErrors.email)"
            :disabled="isSubmitting"
          />
          <small v-if="fieldErrors.email" class="register__field-error">
            {{ fieldErrors.email }}
          </small>
        </div>

        <div class="input-box">
          <label for="register-phone">{{ $t('register_phone_label') }}</label>
          <InputText
            id="register-phone"
            v-model="values.phone"
            name="tel"
            autocomplete="tel-national"
            inputmode="numeric"
            fluid
            :invalid="Boolean(fieldErrors.phone)"
            :disabled="isSubmitting"
          />
          <small v-if="fieldErrors.phone" class="register__field-error">
            {{ fieldErrors.phone }}
          </small>
        </div>

        <div class="input-box">
          <label for="register-password">{{ $t('register_password_label') }}</label>
          <Password
            v-model="values.password"
            input-id="register-password"
            :feedback="false"
            toggle-mask
            fluid
            :invalid="Boolean(fieldErrors.password)"
            :disabled="isSubmitting"
            :input-props="{ name: 'new-password', autocomplete: 'new-password' }"
          />
          <small v-if="fieldErrors.password" class="register__field-error">
            {{ fieldErrors.password }}
          </small>
          <small v-else class="register__hint">{{ $t('register_password_hint') }}</small>
        </div>

        <div class="register__privacy">
          <Checkbox
            v-model="values.privacyAccepted"
            input-id="register-privacy"
            binary
            :invalid="Boolean(fieldErrors.privacyAccepted)"
            :disabled="isSubmitting"
          />
          <label for="register-privacy">{{ $t('register_privacy_label') }}</label>
        </div>
        <small v-if="fieldErrors.privacyAccepted" class="register__field-error">
          {{ fieldErrors.privacyAccepted }}
        </small>

        <Button
          class="register__submit"
          type="submit"
          :label="isSubmitting ? $t('register_submit_pending') : $t('register_submit')"
          :loading="isSubmitting"
          :aria-busy="isSubmitting"
          fluid
        />
      </form>

      <footer class="register__closing">
        <span>{{ $t('register_has_account') }}</span>
        <NuxtLink class="register__link" :to="loginPath">{{ $t('register_sign_in') }}</NuxtLink>
      </footer>
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
