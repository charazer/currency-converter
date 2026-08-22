<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import AmountField from '@/components/AmountField.vue'
import CurrencySelect from '@/components/CurrencySelect.vue'
import RateNote from '@/components/RateNote.vue'
import SwapButton from '@/components/SwapButton.vue'
import { useConverter } from '@/composables/useConverter'
import { useCurrencies } from '@/composables/useCurrencies'
import { useLocale } from '@/composables/useLocale'
import { formatCanonical, isEmpty } from '@/lib/numberParse'
import { getNumberSymbols } from '@/lib/numberFormat'

const { locale } = useLocale()
const { currencies, isLoading: currenciesLoading } = useCurrencies()
const {
  base,
  quote,
  baseAmount,
  quoteAmount,
  rate,
  date,
  isStale,
  isLoading,
  error,
  refetch,
  setBaseAmount,
  setQuoteAmount,
  setBase,
  setQuote,
  swap,
} = useConverter()

const symbols = computed(() => getNumberSymbols(locale.value))
const ready = computed(() => rate.value !== null)

const announcement = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined

// Announcing every keystroke would make a screen reader unusable.
watch([baseAmount, quoteAmount, base, quote], () => {
  clearTimeout(announceTimer)
  announceTimer = setTimeout(() => {
    if (isEmpty(baseAmount.value) || isEmpty(quoteAmount.value)) {
      announcement.value = ''
      return
    }
    announcement.value = `${formatCanonical(baseAmount.value, symbols.value)} ${base.value} equals ${formatCanonical(quoteAmount.value, symbols.value)} ${quote.value}`
  }, 400)
})

onUnmounted(() => clearTimeout(announceTimer))
</script>

<template>
  <section class="card" aria-label="Currency converter">
    <div class="row">
      <AmountField
        input-id="amount-from"
        label="From"
        :model-value="baseAmount"
        :currency="base"
        :locale="locale"
        :disabled="!ready"
        @update:model-value="setBaseAmount"
      />
      <CurrencySelect
        input-id="currency-from"
        label="Convert from"
        :model-value="base"
        :currencies="currencies"
        :disabled="currenciesLoading"
        @update:model-value="setBase"
      />
    </div>

    <div class="divider">
      <SwapButton :disabled="!ready" @swap="swap" />
    </div>

    <div class="row">
      <AmountField
        input-id="amount-to"
        label="To"
        :model-value="quoteAmount"
        :currency="quote"
        :locale="locale"
        :disabled="!ready"
        @update:model-value="setQuoteAmount"
      />
      <CurrencySelect
        input-id="currency-to"
        label="Convert to"
        :model-value="quote"
        :currencies="currencies"
        :disabled="currenciesLoading"
        @update:model-value="setQuote"
      />
    </div>
  </section>

  <RateNote
    :base="base"
    :quote="quote"
    :rate="rate"
    :date="date"
    :locale="locale"
    :is-loading="isLoading"
    :is-stale="isStale"
    :error="error"
    @retry="refetch()"
  />

  <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
</template>

<style scoped>
.card {
  display: grid;
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.row {
  display: grid;
  grid-template-columns: 1fr 7.5rem;
  gap: var(--space-4);
  align-items: end;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--space-3);
  align-items: center;
  margin-block: var(--space-4);
}

.divider::before,
.divider::after {
  content: '';
  block-size: 1px;
  background: var(--border);
}
</style>
