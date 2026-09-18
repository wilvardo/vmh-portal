<template>
  <section class="home">
    <header class="home__heading">
      <div>
        <h1 class="home__title">{{ greeting }}</h1>
        <p class="home__subtitle">{{ $t('home_subtitle') }}</p>
      </div>

      <Button
        class="home__sign-out"
        severity="secondary"
        text
        :label="$t('home_sign_out')"
        @click="signOut"
      />
    </header>

    <ProgressSpinner v-if="tablero.isLoading.value && !tablero.view.value" />

    <!-- Un tablero vacio y un tablero que fallo se ven igual, y quien ve el
         primero cree que perdio su membresia: el error se dice. -->
    <Message
      v-else-if="tablero.errorTitle.value"
      severity="error"
      :closable="false"
      role="alert"
    >
      <span>{{ tablero.errorTitle.value }}</span>
      <Button text size="small" :label="$t('home_retry')" @click="tablero.refresh()" />
    </Message>

    <template v-else-if="tablero.view.value">
      <membershipCard :membership="tablero.view.value.membership" :site-url="siteUrl" />

      <section class="home__block">
        <h2 class="home__block-title">{{ $t('home_sessions_title') }}</h2>
        <!-- Hueco declarado del siguiente tramo: la agenda del atleta. Se deja
             visible y explicado en vez de fingir que no existe. -->
        <p class="home__block-empty">{{ $t('home_sessions_empty') }}</p>
      </section>

      <Button
        class="home__edit"
        severity="secondary"
        outlined
        :label="$t('home_edit_profile')"
        @click="openEditor"
      />
    </template>

    <Drawer v-model:visible="editor.isOpen.value" position="bottom" :header="$t('profile_editor_title')">
      <form class="home__form" novalidate @submit.prevent="editor.submit()">
        <Message v-if="editor.errorTitle.value" severity="error" :closable="false" role="alert">
          {{ editor.errorTitle.value }}
        </Message>

        <div class="input-box">
          <label for="profile-first-name">{{ $t('profile_editor_first_name') }}</label>
          <InputText
            id="profile-first-name"
            v-model="editor.values.firstName"
            autocomplete="given-name"
            fluid
            :invalid="Boolean(editor.fieldErrors.value.firstName)"
            :disabled="editor.isSaving.value"
          />
          <small v-if="editor.fieldErrors.value.firstName" class="home__field-error">
            {{ editor.fieldErrors.value.firstName }}
          </small>
        </div>

        <div class="input-box">
          <label for="profile-last-name">{{ $t('profile_editor_last_name') }}</label>
          <InputText
            id="profile-last-name"
            v-model="editor.values.lastName"
            autocomplete="family-name"
            fluid
            :disabled="editor.isSaving.value"
          />
        </div>

        <div class="input-box">
          <label for="profile-phone">{{ $t('profile_editor_phone') }}</label>
          <InputText
            id="profile-phone"
            v-model="editor.values.phone"
            autocomplete="tel-national"
            inputmode="numeric"
            fluid
            :invalid="Boolean(editor.fieldErrors.value.phone)"
            :disabled="editor.isSaving.value"
          />
          <small v-if="editor.fieldErrors.value.phone" class="home__field-error">
            {{ editor.fieldErrors.value.phone }}
          </small>
        </div>

        <p class="home__note">{{ $t('profile_editor_email_note') }}</p>

        <div class="home__form-actions">
          <Button
            type="button"
            severity="secondary"
            text
            :label="$t('profile_editor_cancel')"
            :disabled="editor.isSaving.value"
            @click="editor.close()"
          />
          <Button
            type="submit"
            :label="editor.isSaving.value ? $t('profile_editor_saving') : $t('profile_editor_save')"
            :loading="editor.isSaving.value"
          />
        </div>
      </form>
    </Drawer>
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
