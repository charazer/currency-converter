<script setup lang="ts">
import { computed } from 'vue'

import { pairKey, useFavourites, type Pair } from '@/composables/useFavourites'

const props = defineProps<{ base: string; quote: string }>()
const emit = defineEmits<{ select: [Pair] }>()

const { favourites, isFavourite, toggle, remove } = useFavourites()

const current = computed<Pair>(() => ({ base: props.base, quote: props.quote }))
const starred = computed(() => isFavourite(current.value))
</script>

<template>
  <div class="favourites">
    <button
      class="star"
      type="button"
      :aria-pressed="starred"
      :title="starred ? 'Remove from favourites' : 'Save as favourite'"
      @click="toggle(current)"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path
          d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z"
          :fill="starred ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
        />
      </svg>
      <span class="sr-only">
        {{ starred ? 'Remove' : 'Save' }} {{ base }} to {{ quote }} as a favourite
      </span>
    </button>

    <ul v-if="favourites.length > 0" class="list" aria-label="Favourite pairs">
      <li v-for="pair in favourites" :key="pairKey(pair)" class="chip">
        <button class="load" type="button" @click="emit('select', pair)">
          {{ pair.base }} → {{ pair.quote }}
        </button>
        <button
          class="drop"
          type="button"
          :title="`Remove ${pair.base} to ${pair.quote}`"
          @click="remove(pair)"
        >
          <span aria-hidden="true">×</span>
          <span class="sr-only">Remove {{ pair.base }} to {{ pair.quote }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="empty">Star a pair to keep it handy.</p>
  </div>
</template>

<style scoped>
.favourites {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
}

.star {
  display: grid;
  place-items: center;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.star[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent);
}

.list {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.load,
.drop {
  border: 0;
  background: none;
  color: var(--text);
  font-size: var(--font-sm);
  cursor: pointer;
}

.load {
  padding: var(--space-2) var(--space-3);
  font-variant-numeric: tabular-nums;
}

.load:hover {
  color: var(--accent);
}

.drop {
  padding-inline: var(--space-2);
  border-inline-start: 1px solid var(--border);
  color: var(--text-muted);
  line-height: 1;
}

.drop:hover {
  color: var(--danger);
}

.empty {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
