<template>
  <Dialog
    class="reservation-cancel-dialog"
    :visible="visible"
    modal
    :header="$t('reservation_cancel_title')"
    :closable="!isCancelling"
    @update:visible="close"
  >
    <div v-if="reservation" class="reservation-cancel-dialog__body">
      <p class="reservation-cancel-dialog__question">{{ $t('reservation_cancel_question') }}</p>

      <p class="reservation-cancel-dialog__session">
        <span class="reservation-cancel-dialog__label">{{ reservation.label }}</span>
        <span class="reservation-cancel-dialog__when">{{ reservation.when }}</span>
      </p>

      <p class="reservation-cancel-dialog__warning">{{ $t('reservation_cancel_warning') }}</p>

      <div class="input-box reservation-cancel-dialog__reason">
        <label for="reservation-cancel-reason">{{ $t('reservation_cancel_reason_label') }}</label>
        <Textarea
          id="reservation-cancel-reason"
          v-model="reason"
          rows="2"
          auto-resize
          fluid
          :maxlength="reasonMaxLength"
          :disabled="isCancelling"
          :placeholder="$t('reservation_cancel_reason_placeholder')"
          aria-describedby="reservation-cancel-reason-help"
        />
        <small id="reservation-cancel-reason-help" class="reservation-cancel-dialog__help">
          {{ $t('reservation_cancel_reason_help') }}
        </small>
      </div>
    </div>

    <template #footer>
      <Button
        variant="text"
        severity="secondary"
        :label="$t('reservation_cancel_keep')"
        :disabled="isCancelling"
        @click="close"
      />
      <!-- Solido rojo solo aqui, dentro de la confirmacion (components.md). -->
      <Button
        severity="danger"
        :label="isCancelling ? $t('reservation_cancel_pending') : $t('reservation_cancel_confirm')"
        :loading="isCancelling"
        :aria-busy="isCancelling"
        @click="confirm"
      />
    </template>
  </Dialog>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
