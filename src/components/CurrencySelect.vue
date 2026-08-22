<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import type { Currency } from '@/api/types'

const props = defineProps<{
  modelValue: string
  currencies: readonly Currency[]
  label: string
  inputId: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const input = useTemplateRef<HTMLInputElement>('input')
const list = useTemplateRef<HTMLUListElement>('list')

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (needle === '') return props.currencies
  return props.currencies.filter(
    (currency) =>
      currency.code.toLowerCase().includes(needle) || currency.name.toLowerCase().includes(needle),
  )
})

const activeOption = computed(() => filtered.value[activeIndex.value] ?? null)

watch(filtered, () => {
  activeIndex.value = 0
})

watch(activeIndex, async () => {
  await nextTick()
  list.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
})

function show(): void {
  if (props.disabled) return
  open.value = true
  query.value = ''
  activeIndex.value = Math.max(
    props.currencies.findIndex((currency) => currency.code === props.modelValue),
    0,
  )
}

function hide(): void {
  open.value = false
  query.value = ''
}

function select(code: string): void {
  emit('update:modelValue', code)
  hide()
  input.value?.blur()
}

function move(delta: number): void {
  const count = filtered.value.length
  if (count === 0) return
  activeIndex.value = (activeIndex.value + delta + count) % count
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!open.value) show()
      else move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!open.value) show()
      else move(-1)
      break
    case 'Home':
      if (open.value) {
        event.preventDefault()
        activeIndex.value = 0
      }
      break
    case 'End':
      if (open.value) {
        event.preventDefault()
        activeIndex.value = Math.max(filtered.value.length - 1, 0)
      }
      break
    case 'Enter':
      if (open.value && activeOption.value !== null) {
        event.preventDefault()
        select(activeOption.value.code)
      }
      break
    case 'Escape':
      if (open.value) {
        event.preventDefault()
        hide()
      }
      break
    default:
      break
  }
}

function onInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value
  open.value = true
}
</script>

<template>
  <div class="combo">
    <label class="sr-only" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      ref="input"
      role="combobox"
      class="control"
      type="text"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="`${inputId}-listbox`"
      :aria-activedescendant="
        open && activeOption ? `${inputId}-option-${activeOption.code}` : undefined
      "
      :value="open ? query : modelValue"
      :placeholder="modelValue"
      :disabled="disabled"
      @input="onInput"
      @focus="show"
      @blur="hide"
      @keydown="onKeydown"
    />
    <ul
      v-show="open"
      :id="`${inputId}-listbox`"
      ref="list"
      class="listbox"
      role="listbox"
      :aria-label="label"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -- the APG combobox pattern keeps focus on the input and tracks the active option via aria-activedescendant -->
      <li
        v-for="(currency, index) in filtered"
        :id="`${inputId}-option-${currency.code}`"
        :key="currency.code"
        class="option"
        role="option"
        :aria-selected="currency.code === modelValue"
        :data-active="index === activeIndex"
        @mousedown.prevent="select(currency.code)"
        @mousemove="activeIndex = index"
      >
        <span class="code tabular">{{ currency.code }}</span>
        <span class="name">{{ currency.name }}</span>
      </li>
      <li v-if="filtered.length === 0" class="option option--empty">No match</li>
    </ul>
  </div>
</template>

<style scoped>
.combo {
  position: relative;
}

.control {
  inline-size: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-weight: 600;
  text-align: start;
  text-transform: uppercase;
  cursor: pointer;
}

.control:focus {
  cursor: text;
}

.listbox {
  position: absolute;
  z-index: 10;
  inset-inline: 0;
  inset-block-start: calc(100% + var(--space-1));
  max-block-size: 16rem;
  margin: 0;
  padding: var(--space-1);
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow);
  list-style: none;
}

.option {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.option[data-active='true'] {
  background: var(--accent);
  color: var(--accent-contrast);
}

.option--empty {
  color: var(--text-muted);
  cursor: default;
}

.code {
  font-weight: 600;
}

.name {
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--font-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.option[data-active='true'] .name {
  color: inherit;
}
</style>
