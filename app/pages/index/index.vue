<template>
  <section class="access">
    <header class="access__heading">
      <div class="access__lockup">
        <img class="access__isotype" src="/logos/isotipo.svg" alt="" width="28" height="28" />
        <span class="access__brand-name">{{ brandName }}</span>
      </div>

      <h1 class="access__title">{{ $t('login_title') }}</h1>
      <p class="access__subtitle">{{ $t('login_subtitle') }}</p>
    </header>

    <!-- Los avisos viven sobre el formulario, nunca dentro de un campo: el que
         explica por que se cerro la sesion no pertenece a ninguno. -->
    <Message
      v-if="noticeMessage"
      class="access__notice"
      severity="warn"
      :closable="false"
      role="status"
    >
      <span class="access__notice-title">{{ noticeMessage }}</span>
    </Message>

    <Message
      v-if="errorTitle"
      class="access__notice"
      severity="error"
      :closable="false"
      role="alert"
    >
      <span class="access__notice-title">{{ errorTitle }}</span>
      <span v-if="errorDetail" class="access__notice-detail">{{ errorDetail }}</span>
      <!-- La cuenta existe y la contrasena era correcta: lo unico que falta es
           el enlace del correo, asi que se ofrece aqui mismo en vez de dejar a
           la persona buscando donde pedirlo. -->
      <NuxtLink v-if="needsVerification" class="access__notice-action" :to="resendPath">
        {{ $t('login_resend') }}
      </NuxtLink>
    </Message>

    <form class="access__form" novalidate @submit.prevent="submit">
      <div class="input-box">
        <label for="login-email">{{ $t('login_email_label') }}</label>
        <InputText
          id="login-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="username"
          inputmode="email"
          fluid
          :disabled="isSubmitting"
        />
      </div>

      <div class="input-box">
        <label for="login-password">{{ $t('login_password_label') }}</label>
        <Password
          v-model="password"
          input-id="login-password"
          :feedback="false"
          toggle-mask
          fluid
          :disabled="isSubmitting"
          :input-props="{ name: 'password', autocomplete: 'current-password' }"
        />
      </div>

      <!-- Excepcion documentada al boton fantasma: es la accion principal de la
           pantalla y el siguiente paso critico, asi que va solido. -->
      <Button
        class="access__submit"
        type="submit"
        :label="isSubmitting ? $t('login_submit_pending') : $t('login_submit')"
        :loading="isSubmitting"
        :aria-busy="isSubmitting"
        fluid
      />

      <NuxtLink class="access__link" :to="passwordRecoveryPath">{{ $t('login_forgot') }}</NuxtLink>
    </form>

    <footer class="access__closing">
      <span>{{ $t('login_no_account') }}</span>
      <NuxtLink class="access__link" :to="registerPath">{{ $t('login_register') }}</NuxtLink>
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
