<template>
  <aside v-if="isVisible" class="app-update-prompt" role="status">
    <div class="app-update-prompt__text">
      <p class="app-update-prompt__title">{{ $t('app_update_title') }}</p>
      <p class="app-update-prompt__detail">{{ $t('app_update_detail') }}</p>
    </div>
    <div class="app-update-prompt__actions">
      <Button
        variant="text"
        severity="secondary"
        :label="$t('app_update_later')"
        :disabled="isUpdating"
        @click="dismiss"
      />
      <Button
        variant="outlined"
        severity="secondary"
        :label="isUpdating ? $t('app_update_action_busy') : $t('app_update_action')"
        :loading="isUpdating"
        :aria-busy="isUpdating"
        @click="update"
      />
    </div>
  </aside>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
