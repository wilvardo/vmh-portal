<template>
  <section class="my-payments">
    <pageHeader
      :eyebrow="$t('my_payments_eyebrow')"
      :title="$t('my_payments_title')"
      :support="$t('my_payments_subtitle')"
    />

    <div
      v-if="list.isLoading.value && list.payments.value.length === 0"
      class="my-payments__loading"
      aria-busy="true"
      :aria-label="$t('my_payments_loading')"
    >
      <Skeleton v-for="index in 3" :key="index" height="3rem" border-radius="0.5rem" />
    </div>

    <Message v-else-if="list.errorTitle.value" severity="error" :closable="false" role="alert">
      <span>{{ list.errorTitle.value }}</span>
      <Button
        variant="text"
        severity="secondary"
        :label="$t('my_payments_retry')"
        @click="list.refresh()"
      />
    </Message>

    <div v-else-if="list.isEmpty.value" class="my-payments__empty">
      <svg
        class="my-payments__empty-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2" />
        <path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5m2 0v1.5m0 -9v1.5" />
      </svg>
      <p class="my-payments__empty-title">{{ $t('my_payments_empty_title') }}</p>
      <p class="my-payments__empty-detail">{{ $t('my_payments_empty_detail') }}</p>
    </div>

    <template v-else>
      <!-- Un solo bloque de lista con columnas en escritorio; en el telefono
           cada pago se apila con su monto a la derecha. -->
      <div class="my-payments__block">
        <div class="my-payments__columns" aria-hidden="true">
          <span>{{ $t('my_payments_col_plan') }}</span>
          <span>{{ $t('my_payments_col_date') }}</span>
          <span>{{ $t('my_payments_col_detail') }}</span>
          <span class="my-payments__columns-amount">{{ $t('my_payments_col_amount') }}</span>
        </div>

        <ul class="my-payments__list">
          <li
            v-for="payment in list.payments.value"
            :key="payment.paymentId"
            class="my-payments__item"
            :class="{ 'my-payments__item--voided': payment.isVoided }"
          >
            <div class="my-payments__main">
              <span class="my-payments__plan-cell">
                <span class="my-payments__plan">{{ payment.planName }}</span>
                <span v-if="payment.isVoided" class="my-payments__voided">
                  {{ $t('my_payments_voided') }}
                </span>
              </span>
              <span class="my-payments__when">{{ dateLabel(payment.paidAtLocal) }}</span>
              <span class="my-payments__detail">
                {{ $t('my_payments_folio', { folio: payment.paymentId }) }} ·
                {{ methodLabel(payment.method) }}
              </span>
            </div>

            <span
              class="my-payments__amount"
              :class="{ 'my-payments__amount--struck': payment.isVoided }"
            >
              {{ amountLabel(payment.amount) }}
            </span>
          </li>
        </ul>

        <p class="my-payments__count">{{ countLabel }}</p>
      </div>

      <Button
        v-if="list.hasMore.value"
        class="my-payments__more"
        variant="outlined"
        severity="secondary"
        :label="list.isLoading.value ? $t('my_payments_more_pending') : $t('my_payments_more')"
        :loading="list.isLoading.value"
        :aria-busy="list.isLoading.value"
        @click="list.loadMore()"
      />

      <p v-if="list.moreFailed.value" class="my-payments__more-failed" role="alert">
        {{ $t('my_payments_more_error') }}
      </p>
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
