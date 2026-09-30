<template>
  <section class="schedule">
    <header class="schedule__heading">
      <div class="schedule__heading-text">
        <h1 class="schedule__title">{{ $t('schedule_title') }}</h1>
        <p class="schedule__subtitle">{{ $t('schedule_subtitle') }}</p>
      </div>

      <Button
        variant="text"
        severity="secondary"
        :label="$t('schedule_current_week')"
        :disabled="week.isLoading.value"
        @click="week.current()"
      />
    </header>

    <nav class="schedule__week-nav" :aria-label="$t('schedule_title')">
      <Button
        v-tooltip.bottom="$t('schedule_previous_week')"
        class="schedule__week-step"
        variant="text"
        severity="secondary"
        :aria-label="$t('schedule_previous_week')"
        :disabled="week.isLoading.value"
        @click="week.previous()"
      >
        <svg
          class="schedule__week-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M15 6l-6 6l6 6" />
        </svg>
      </Button>

      <span class="schedule__range" aria-live="polite">{{ view?.range ?? '' }}</span>

      <Button
        v-tooltip.bottom="$t('schedule_next_week')"
        class="schedule__week-step"
        variant="text"
        severity="secondary"
        :aria-label="$t('schedule_next_week')"
        :disabled="week.isLoading.value"
        @click="week.next()"
      >
        <svg
          class="schedule__week-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M9 6l6 6l-6 6" />
        </svg>
      </Button>
    </nav>

    <div v-if="professionals.length > 1" class="schedule__professionals">
      <span id="schedule-professional-label" class="schedule__professionals-label">
        {{ $t('schedule_professional_label') }}
      </span>
      <SelectButton
        v-model="selectedProfessional"
        :options="professionalOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-labelledby="schedule-professional-label"
      />
    </div>

    <div v-if="week.isLoading.value && !view" class="schedule__loading" aria-busy="true">
      <Skeleton v-for="index in 3" :key="index" height="7rem" border-radius="1rem" />
    </div>

    <!-- Un fallo no deja pintada la semana anterior: se dice y se reintenta. -->
    <Message v-else-if="week.errorTitle.value" severity="error" :closable="false" role="alert">
      <span>{{ week.errorTitle.value }}</span>
      <Button
        variant="text"
        severity="secondary"
        :label="$t('schedule_retry')"
        @click="week.refresh()"
      />
    </Message>

    <div v-else-if="view && view.isEmpty" class="schedule__empty">
      <svg
        class="schedule__empty-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M4 11h16" />
      </svg>
      <p class="schedule__empty-title">{{ $t('schedule_empty_title') }}</p>
      <p class="schedule__empty-detail">{{ $t('schedule_empty_detail') }}</p>
    </div>

    <template v-else-if="view">
      <section
        v-if="view.evaluationPending"
        class="schedule__evaluation"
        aria-labelledby="schedule-evaluation-title"
      >
        <h2 id="schedule-evaluation-title" class="schedule__section-title">
          {{ $t('schedule_evaluation_title') }}
        </h2>
        <p class="schedule__section-detail">{{ $t('schedule_evaluation_detail') }}</p>

        <p v-if="view.evaluations.length === 0" class="schedule__day-empty">
          {{ $t('schedule_evaluation_none') }}
        </p>

        <scheduleSessionCard
          v-for="session in view.evaluations"
          :key="session.sessionSlotId"
          :session="session"
          @book="booking.open"
          @cancel="openCancel"
        />
      </section>

      <section
        v-for="day in view.days"
        :key="day.date"
        class="schedule__day"
        :aria-labelledby="`schedule-day-${day.date}`"
      >
        <h2 :id="`schedule-day-${day.date}`" class="schedule__day-title">
          <span>{{ day.heading }}</span>
          <Tag v-if="day.isToday" severity="info" :value="$t('schedule_today')" />
        </h2>

        <p v-if="day.sessions.length === 0" class="schedule__day-empty">
          {{ $t('schedule_day_empty') }}
        </p>

        <scheduleSessionCard
          v-for="session in day.sessions"
          :key="session.sessionSlotId"
          :session="session"
          @book="booking.open"
          @cancel="openCancel"
        />
      </section>
    </template>

    <Dialog
      :visible="booking.isOpen.value"
      modal
      :header="$t('schedule_book_title')"
      :closable="!booking.isBooking.value"
      class="schedule__dialog"
      @update:visible="booking.close()"
    >
      <div v-if="selectedSummary && booking.selected.value" class="schedule__dialog-body">
        <p class="schedule__dialog-label">{{ selectedSummary.label }}</p>
        <p class="schedule__dialog-when">{{ selectedSummary.when }}</p>
        <p v-if="selectedSummary.professionalName" class="schedule__dialog-note">
          {{ $t('schedule_book_with', { name: selectedSummary.professionalName }) }}
        </p>
        <p class="schedule__dialog-note">
          {{ $t('schedule_book_spots', { remaining: booking.selected.value.remaining }) }}
        </p>
        <p v-if="booking.selected.value.sessionType === 'evaluation'" class="schedule__dialog-note">
          {{ $t('schedule_book_evaluation_note') }}
        </p>
      </div>

      <template #footer>
        <Button
          variant="text"
          severity="secondary"
          :label="$t('schedule_book_back')"
          :disabled="booking.isBooking.value"
          @click="booking.close()"
        />
        <Button
          :label="
            booking.isBooking.value ? $t('schedule_book_pending') : $t('schedule_book_confirm')
          "
          :loading="booking.isBooking.value"
          :aria-busy="booking.isBooking.value"
          @click="booking.confirm()"
        />
      </template>
    </Dialog>

    <reservationCancelDialog
      v-model:visible="isCancelOpen"
      :reservation="cancelTarget"
      @settled="week.refresh()"
    />
  </section>
</template>

<script lang="ts">
import Script from './script'

export default Script
</script>

<style lang="scss" scoped>
@use './style.scss';
</style>
