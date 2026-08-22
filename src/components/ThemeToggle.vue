<script setup lang="ts">
import { THEMES, useTheme, type Theme } from '@/composables/useTheme'

const { theme, setTheme } = useTheme()

const LABELS: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'Match system theme',
}
</script>

<template>
  <div class="group" role="group" aria-label="Theme">
    <button
      v-for="option in THEMES"
      :key="option"
      class="option"
      type="button"
      :aria-pressed="theme === option"
      :title="LABELS[option]"
      @click="setTheme(option)"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <template v-if="option === 'light'">
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            />
          </template>
          <path
            v-else-if="option === 'dark'"
            d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
          />
          <template v-else>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8" />
          </template>
        </g>
      </svg>
      <span class="sr-only">{{ LABELS[option] }}</span>
    </button>
  </div>
</template>

<style scoped>
.group {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.option {
  display: grid;
  place-items: center;
  inline-size: 2rem;
  block-size: 2rem;
  border: 0;
  border-radius: calc(var(--radius-sm) - 2px);
  background: none;
  color: var(--text-muted);
  cursor: pointer;
}

.option:hover {
  color: var(--text);
}

.option[aria-pressed='true'] {
  background: var(--accent);
  color: var(--accent-contrast);
}
</style>
