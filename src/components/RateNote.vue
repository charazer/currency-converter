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

const message = computed(() =>
  props.error instanceof ApiError ? props.error.message : 'Something went wrong.',
)

const canRetry = computed(() => !(props.error instanceof ApiError) || props.error.retryable)
</script>

<template>
  <div class="note">
    <p v-if="error" class="error">
      <span>{{ message }}</span>
      <button v-if="canRetry" class="retry" type="button" @click="$emit('retry')">Retry</button>
    </p>
    <p v-else-if="isLoading" class="muted">Fetching rates…</p>
    <p v-else-if="rate !== null" class="rate tabular">
      1 {{ base }} = {{ formatRate(rate, locale) }} {{ quote }}
      <span v-if="date" class="muted"> · {{ formatDate(date, locale) }}</span>
      <span v-if="isStale" class="muted"> · showing saved rates</span>
    </p>
    <p v-else class="muted">No rate available for this pair.</p>
  </div>
</template>

<style scoped>
.note {
  min-block-size: 1.5rem;
  font-size: var(--font-sm);
  text-align: center;
}

.muted {
  color: var(--text-muted);
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
