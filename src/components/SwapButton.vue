<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
defineEmits<{ swap: [] }>()
</script>

<template>
  <button class="swap" type="button" :disabled="disabled" @click="$emit('swap')">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M7 4v14m0 0-3.5-3.5M7 18l3.5-3.5M17 20V6m0 0-3.5 3.5M17 6l3.5 3.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="sr-only">Swap currencies</span>
  </button>
</template>

<style scoped>
.swap {
  display: grid;
  place-items: center;
  inline-size: var(--control-md);
  block-size: var(--control-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--control-bg);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}

.swap:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--control-bg-hover);
  color: var(--accent);
}

.swap:active:not(:disabled) {
  transform: rotate(180deg);
}

.swap:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>
