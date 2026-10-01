<template>
  <section class="home">
    <pageHeader :eyebrow="$t('home_eyebrow')" :title="greeting" :support="$t('home_subtitle')" />

    <!-- Carga con la forma del tablero: aviso y sesiones a la izquierda,
         membresia y datos a la derecha. Nunca un spinner de pagina completa. -->
    <div
      v-if="tablero.isLoading.value && !tablero.view.value"
      class="home__grid"
      aria-busy="true"
      :aria-label="$t('home_loading')"
    >
      <div class="home__main">
        <Skeleton height="5rem" border-radius="0.5rem" />
        <Skeleton height="9rem" border-radius="0.5rem" />
      </div>
      <div class="home__aside">
        <Skeleton height="11rem" border-radius="0.5rem" />
        <Skeleton height="13rem" border-radius="0.5rem" />
      </div>
    </div>

    <!-- Un tablero vacio y un tablero que fallo se ven igual, y quien ve el
         primero cree que perdio su membresia: el error se dice. Sin red se
         dice eso, porque la salida es otra. -->
    <stateOffline
      v-else-if="tablero.errorTitle.value && !isOnline"
      :busy="tablero.isLoading.value"
      @retry="tablero.refresh()"
    />

    <stateError
      v-else-if="tablero.errorTitle.value"
      :title="tablero.errorTitle.value"
      :detail="$t('home_load_error_detail')"
      :retry-label="$t('home_retry')"
      :busy="tablero.isLoading.value"
      @retry="tablero.refresh()"
    />

    <!-- Dos columnas en escritorio: lo que hay que hacer (aviso y sesiones) a
         la izquierda, lo que se consulta (membresia y datos) a la derecha. En
         el telefono se apilan en ese mismo orden de importancia. -->
    <div v-else-if="tablero.view.value" class="home__grid">
      <div class="home__main">
        <evaluationNotice
          :evaluation-completed-at="tablero.view.value.initialEvaluationCompletedAt"
          :reservations="tablero.view.value.upcomingReservations"
        />

        <upcomingSessions
          :reservations="tablero.view.value.upcomingReservations"
          :now="clock"
          @cancel="askCancel"
        />
      </div>

      <div class="home__aside">
        <!-- Solo aparece donde se puede instalar y mientras no se descarte. -->
        <appInstallCard />

        <membershipCard :membership="tablero.view.value.membership" :site-url="siteUrl" />

        <profileCard
          :profile="tablero.view.value.profile"
          :legal-links="legalLinks"
          @edit="openEditor"
        />
      </div>
    </div>

    <!-- Se monta siempre y se controla con v-model:visible: tras cancelar, o si
         la reserva ya habia cambiado en otra pestana, el tablero se relee. -->
    <reservationCancelDialog
      v-model:visible="cancelDialog.isOpen.value"
      :reservation="cancelDialog.reservation.value"
      @settled="tablero.refresh()"
    />

    <Drawer
      v-model:visible="editor.isOpen.value"
      position="bottom"
      :header="$t('profile_editor_title')"
    >
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

        <fieldset class="home__group">
          <legend class="home__group-title">{{ $t('profile_editor_emergency_title') }}</legend>
          <p class="home__note">{{ $t('profile_editor_emergency_note') }}</p>

          <div class="input-box">
            <label for="profile-emergency-name">{{ $t('profile_editor_emergency_name') }}</label>
            <InputText
              id="profile-emergency-name"
              v-model="editor.values.emergencyContactName"
              autocomplete="off"
              fluid
              :invalid="Boolean(editor.fieldErrors.value.emergencyContactName)"
              :disabled="editor.isSaving.value"
            />
            <small v-if="editor.fieldErrors.value.emergencyContactName" class="home__field-error">
              {{ editor.fieldErrors.value.emergencyContactName }}
            </small>
          </div>

          <div class="input-box">
            <label for="profile-emergency-phone">{{ $t('profile_editor_emergency_phone') }}</label>
            <InputText
              id="profile-emergency-phone"
              v-model="editor.values.emergencyContactPhone"
              autocomplete="off"
              inputmode="numeric"
              fluid
              :invalid="Boolean(editor.fieldErrors.value.emergencyContactPhone)"
              :disabled="editor.isSaving.value"
            />
            <small v-if="editor.fieldErrors.value.emergencyContactPhone" class="home__field-error">
              {{ editor.fieldErrors.value.emergencyContactPhone }}
            </small>
          </div>
        </fieldset>

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
