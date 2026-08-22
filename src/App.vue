<script setup lang="ts">
import ConverterCard from '@/components/ConverterCard.vue'
import LocaleSelect from '@/components/LocaleSelect.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <div class="shell">
    <header class="bar">
      <div class="bar-inner">
        <div class="brand">
          <img class="mark" src="/favicon/favicon.ico" alt="" width="24" height="24" />
          <h1>Currency Converter</h1>
        </div>
        <div class="tools">
          <LocaleSelect />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="main">
      <ConverterCard />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  /* Without an explicit minmax(0,…) the implicit column sizes to max-content and the whole page
     grows wider than the viewport. */
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-block-size: 100dvh;
}

.bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 20;
  border-block-end: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(12px);
}

.bar-inner {
  display: flex;
  gap: var(--space-3);
  justify-content: space-between;
  align-items: center;
  inline-size: min(100%, 72rem);
  min-block-size: var(--header-height);
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: var(--space-2);
}

.brand {
  display: flex;
  gap: var(--space-2);
  flex: 0 1 auto;
  align-items: center;
  min-inline-size: 0;
}

.mark {
  flex: none;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  border-radius: var(--radius-full);
}

h1 {
  min-inline-size: 0;
  overflow: hidden;
  font-size: var(--font-lg);
  font-weight: 650;
  letter-spacing: -0.015em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tools {
  display: flex;
  gap: var(--space-2);
  flex: 1 1 auto;
  justify-content: flex-end;
  align-items: center;
  min-inline-size: 0;
}

.main {
  inline-size: min(100%, var(--content-width));
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: clamp(var(--space-5), 5vh, var(--space-7)) var(--space-8);
}

/* The title is the first thing to give up room; the controls stay reachable. */
@media (width < 26rem) {
  .bar-inner {
    gap: var(--space-2);
    padding-inline: var(--space-3);
  }

  .main {
    padding-inline: var(--space-3);
  }

  h1 {
    font-size: var(--font-md);
  }

  .mark {
    display: none;
  }
}
</style>
