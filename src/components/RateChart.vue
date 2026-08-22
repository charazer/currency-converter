<script setup lang="ts">
import { computed, ref } from 'vue'

import { useRateHistory } from '@/composables/useRates'
import { daysAgo, today } from '@/lib/dates'
import { formatDate, formatRate } from '@/lib/numberFormat'

const props = defineProps<{ base: string; quote: string; locale: string }>()

const RANGES = [
  { days: 30, label: '30D', name: 'Last 30 days' },
  { days: 90, label: '90D', name: 'Last 90 days' },
  { days: 365, label: '1Y', name: 'Last year' },
] as const

const VIEW_W = 300
const VIEW_H = 72
const PAD = 4

const range = ref<(typeof RANGES)[number]['days']>(30)
const hovered = ref<number | null>(null)

const from = computed(() => daysAgo(range.value))
const to = computed(() => today())
const enabled = computed(() => props.base !== props.quote)

const { points, isLoading, isFetching, isError } = useRateHistory(
  () => props.base,
  () => props.quote,
  from,
  to,
  enabled,
)

const hasSeries = computed(() => points.value.length >= 2)

const stateMessage = computed(() => {
  if (isError.value) return 'History is unavailable right now.'
  if (isLoading.value || isFetching.value) return 'Loading history…'
  return 'Not enough history for this pair.'
})

const bounds = computed(() => {
  const rates = points.value.map((point) => point.rate)
  const min = Math.min(...rates)
  const max = Math.max(...rates)
  // A perfectly flat series would divide by zero; render it down the middle instead.
  return { min, max, span: max - min || 1 }
})

const geometry = computed(() =>
  points.value.map((point, index) => {
    const divisor = points.value.length - 1 || 1
    const x = PAD + (index / divisor) * (VIEW_W - 2 * PAD)
    const ratio = (point.rate - bounds.value.min) / bounds.value.span
    const y = VIEW_H - PAD - ratio * (VIEW_H - 2 * PAD)
    return { x, y, ...point }
  }),
)

const line = computed(() =>
  geometry.value.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' '),
)

const area = computed(() => {
  const first = geometry.value[0]
  const last = geometry.value[geometry.value.length - 1]
  if (first === undefined || last === undefined) return ''
  return `${line.value} L${last.x} ${VIEW_H} L${first.x} ${VIEW_H} Z`
})

const latest = computed(() => points.value[points.value.length - 1] ?? null)
const active = computed(() =>
  hovered.value === null ? latest.value : (points.value[hovered.value] ?? null),
)
const marker = computed(() =>
  hovered.value === null ? null : (geometry.value[hovered.value] ?? null),
)

const summary = computed(() => {
  if (latest.value === null) return ''
  return `${props.base} to ${props.quote} over the ${RANGES.find((entry) => entry.days === range.value)?.name.toLowerCase() ?? ''}: low ${formatRate(bounds.value.min, props.locale)}, high ${formatRate(bounds.value.max, props.locale)}, latest ${formatRate(latest.value.rate, props.locale)}.`
})

function onMove(event: PointerEvent): void {
  const target = event.currentTarget as SVGSVGElement
  const rect = target.getBoundingClientRect()
  if (rect.width === 0 || points.value.length === 0) return
  const ratio = (event.clientX - rect.left) / rect.width
  const index = Math.round(ratio * (points.value.length - 1))
  hovered.value = Math.min(Math.max(index, 0), points.value.length - 1)
}
</script>

<template>
  <section v-if="enabled" class="chart" aria-label="Rate history">
    <header class="head">
      <div class="ranges" role="group" aria-label="Chart range">
        <button
          v-for="option in RANGES"
          :key="option.days"
          class="range"
          type="button"
          :aria-pressed="range === option.days"
          :title="option.name"
          @click="range = option.days"
        >
          <span class="label">{{ option.label }}</span>
          <span class="sr-only">{{ option.name }}</span>
        </button>
      </div>
      <p class="readout tabular" :class="{ 'is-invisible': !active }">
        <span class="value">{{ active ? formatRate(active.rate, locale) : '—' }}</span>
        <span class="muted">{{ active ? formatDate(active.date, locale) : '' }}</span>
      </p>
    </header>

    <!-- Fixed height: the chart must not resize the page as it loads or changes range. -->
    <div class="plotarea">
      <svg
        v-if="hasSeries"
        class="plot"
        :class="{ 'is-pending': isFetching }"
        :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="summary"
        @pointermove="onMove"
        @pointerleave="hovered = null"
      >
        <path :d="area" class="fill" />
        <path :d="line" class="stroke" vector-effect="non-scaling-stroke" />
        <line
          v-if="marker"
          class="marker"
          :x1="marker.x"
          :x2="marker.x"
          y1="0"
          :y2="VIEW_H"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <p v-else class="state muted" role="status">{{ stateMessage }}</p>
    </div>

    <p class="bounds muted tabular" :class="{ 'is-invisible': !hasSeries }">
      <span>Low {{ hasSeries ? formatRate(bounds.min, locale) : '—' }}</span>
      <span>High {{ hasSeries ? formatRate(bounds.max, locale) : '—' }}</span>
    </p>
  </section>
</template>

<style scoped>
.chart {
  display: grid;
  gap: var(--space-2);
}

.head {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.ranges {
  display: flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.range {
  padding: var(--space-1) var(--space-3);
  border: 0;
  border-radius: calc(var(--radius-sm) - 2px);
  background: none;
  color: var(--text-muted);
  font-size: var(--font-xs);
  font-weight: 600;
  cursor: pointer;
}

.range[aria-pressed='true'] {
  background: var(--accent);
  color: var(--accent-contrast);
}

.readout {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  font-size: var(--font-sm);
}

.value {
  font-weight: 600;
}

.plotarea {
  /* Children must stretch: a centred grid item cannot resolve `block-size: 100%`, and the SVG
     would fall back to its viewBox aspect ratio and paint over everything below it. */
  display: grid;
  block-size: 4.5rem;
}

.state {
  place-self: center;
}

.plot {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: 0;
  overflow: hidden;
  touch-action: none;
  transition: opacity 150ms ease;
}

.plot.is-pending {
  opacity: 0.4;
}

/* Hidden but still occupying its space, so the surrounding content cannot move. */
.is-invisible {
  visibility: hidden;
}

.fill {
  fill: var(--accent);
  opacity: 0.1;
}

.stroke {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.marker {
  stroke: var(--text-muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.bounds {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-xs);
}

.muted {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
</style>
