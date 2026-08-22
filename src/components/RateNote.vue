<script setup lang="ts">
import { computed } from 'vue'

import { ApiError } from '@/api/errors'
import { formatDate, formatRate } from '@/lib/numberFormat'

const props = defineProps<{
  base: string
  quote: string
  rate: number | null
  date: string | null
  locale: string
  isLoading: boolean
  isStale: boolean
  error: unknown
}>()

defineEmits<{ retry: [] }>()

const hasError = computed(() => props.error !== null && props.error !== undefined)

const message = computed(() =>
  props.error instanceof ApiError ? props.error.message : 'Something went wrong.',
)

const canRetry = computed(() => !(props.error instanceof ApiError) || props.error.retryable)

/** With a rate on screen a failure is only a refresh problem, so it must not replace the rate. */
const secondary = computed(() => {
  if (hasError.value) {
    return props.rate === null ? message.value : 'Could not refresh — showing saved rates.'
  }
  return props.isStale ? 'Showing saved rates.' : ''
})
</script>

<template>
  <div class="note">
    <p v-if="rate !== null" class="rate tabular">
      1 {{ base }} = {{ formatRate(rate, locale) }} {{ quote }}
      <span v-if="date" class="muted"> · {{ formatDate(date, locale) }}</span>
    </p>
    <p v-else-if="isLoading" class="muted">Fetching rates…</p>
    <p v-else-if="!hasError" class="muted">No rate available for this pair.</p>

    <p class="secondary" :class="{ 'is-invisible': secondary === '', error: hasError }">
      <span>{{ secondary }}</span>
      <button v-if="hasError && canRetry" class="retry" type="button" @click="$emit('retry')">
        Retry
      </button>
    </p>
  </div>
</template>

<style scoped>
.note {
  display: grid;
  gap: var(--space-1);
  /* Reserved so the secondary line appearing cannot move the chart below it. */
  min-block-size: 2.5rem;
  align-content: center;
  font-size: var(--font-sm);
  text-align: center;
}

.muted {
  color: var(--text-muted);
}

.secondary {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  color: var(--text-muted);
  font-size: var(--font-xs);
}

.error {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  color: var(--danger);
}

.retry {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}
</style>
