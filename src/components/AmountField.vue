<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { getCurrencyFractionDigits, getNumberSymbols } from '@/lib/numberFormat'
import {
  caretAfterMeaningful,
  countMeaningfulBefore,
  formatCanonical,
  isEmpty,
  normaliseCanonical,
  parseAmount,
  type CanonicalAmount,
  type ParseFailure,
} from '@/lib/numberParse'

const props = defineProps<{
  modelValue: CanonicalAmount
  currency: string
  locale: string
  label: string
  inputId: string
  disabled?: boolean
  readonlyHint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [CanonicalAmount]
  focus: []
}>()

const HINTS: Record<ParseFailure, string> = {
  'invalid-character': 'Digits and a decimal separator only.',
  'multiple-decimals': 'Only one decimal separator is allowed.',
  negative: 'Enter a positive amount.',
  'too-many-digits': 'That is as many digits as this field takes.',
}

const symbols = computed(() => getNumberSymbols(props.locale))
const displayed = ref(formatCanonical(props.modelValue, symbols.value))
const hint = ref<ParseFailure | null>(null)
/** Set when this component caused the model change, so the echo does not fight the caret. */
const selfEdited = ref(false)

watch([() => props.modelValue, symbols], () => {
  if (selfEdited.value) {
    selfEdited.value = false
    return
  }
  displayed.value = formatCanonical(props.modelValue, symbols.value)
})

function onInput(event: Event): void {
  const el = event.target as HTMLInputElement
  const raw = el.value
  const caret = el.selectionStart ?? raw.length
  const result = parseAmount(raw, symbols.value)

  if (!result.ok) {
    hint.value = result.reason
    const previous = displayed.value
    const added = Math.max(raw.length - previous.length, 0)
    el.value = previous
    const restored = Math.max(caret - added, 0)
    el.setSelectionRange(restored, restored)
    return
  }

  hint.value = null
  const meaningful = countMeaningfulBefore(raw, caret, symbols.value)
  const formatted = formatCanonical(result.value, symbols.value)

  displayed.value = formatted
  el.value = formatted
  const next = caretAfterMeaningful(formatted, meaningful, symbols.value)
  el.setSelectionRange(next, next)

  selfEdited.value = true
  emit('update:modelValue', result.value)
}

function onFocus(event: FocusEvent): void {
  emit('focus')
  ;(event.target as HTMLInputElement).select()
}

function onBlur(): void {
  hint.value = null
  if (isEmpty(props.modelValue)) return

  const settled = normaliseCanonical(props.modelValue, getCurrencyFractionDigits(props.currency))
  displayed.value = formatCanonical(settled, symbols.value)
  emit('update:modelValue', settled)
}
</script>

<template>
  <div class="field">
    <label class="label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      class="amount tabular"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      :value="displayed"
      :disabled="disabled"
      :placeholder="readonlyHint"
      :aria-describedby="hint ? `${inputId}-hint` : undefined"
      :aria-invalid="hint ? true : undefined"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <p v-if="hint" :id="`${inputId}-hint`" class="hint" role="status">{{ HINTS[hint] }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: var(--space-1);
  min-inline-size: 0;
}

.label {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.amount {
  inline-size: 100%;
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--font-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.amount::placeholder {
  color: var(--text-muted);
  font-weight: 400;
  opacity: 0.6;
}

.amount:disabled {
  color: var(--text-muted);
}

.hint {
  color: var(--danger);
  font-size: var(--font-xs);
}
</style>
