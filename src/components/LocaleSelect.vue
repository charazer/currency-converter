<script setup lang="ts">
import { computed } from 'vue'

import { SUPPORTED_LOCALES, useLocale } from '@/composables/useLocale'

const SAMPLE = 1234567.89

const { locale, override, systemLocale, setLocale } = useLocale()

function nameOf(code: string): string {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

/** The choice is about how numbers look, so each option shows what it does. */
function sampleOf(code: string): string {
  return new Intl.NumberFormat(code, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(SAMPLE)
}

const options = computed(() =>
  SUPPORTED_LOCALES.map((code) => ({ code, label: `${nameOf(code)} · ${sampleOf(code)}` })).sort(
    (a, b) => a.label.localeCompare(b.label, locale.value),
  ),
)

const systemLabel = computed(() => `System · ${sampleOf(systemLocale.value)}`)

function onChange(event: Event): void {
  const { value } = event.target as HTMLSelectElement
  setLocale(value === 'system' ? null : value)
}
</script>

<template>
  <div class="locale">
    <label class="sr-only" for="locale">Number format</label>
    <select id="locale" class="select" :value="override ?? 'system'" @change="onChange">
      <option value="system">{{ systemLabel }}</option>
      <option v-for="option in options" :key="option.code" :value="option.code">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.locale {
  flex: 0 1 auto;
  min-inline-size: 0;
}

.select {
  inline-size: 14rem;
  max-inline-size: 100%;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--font-xs);
  cursor: pointer;
}

.select:hover {
  color: var(--text);
}
</style>
