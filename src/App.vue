<script setup lang="ts">
import ConverterCard from '@/components/ConverterCard.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <div class="shell">
    <header class="head">
      <h1>Currency Converter</h1>
      <ThemeToggle />
    </header>
    <main class="main">
      <ConverterCard />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-rows: auto 1fr;
  min-block-size: 100dvh;
  padding: var(--space-4);
}

.head {
  display: flex;
  gap: var(--space-3);
  justify-content: space-between;
  align-items: center;
  padding-block: var(--space-3);
}

h1 {
  font-size: var(--font-lg);
  font-weight: 600;
}

.main {
  display: grid;
  gap: var(--space-4);
  align-content: center;
  justify-self: center;
  inline-size: min(100%, 40rem);
  padding-block-end: var(--space-8);
}
</style>
