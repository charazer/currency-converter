<script setup lang="ts">
import ConverterCard from '@/components/ConverterCard.vue'
</script>

<template>
  <div class="shell">
    <header class="head">
      <h1>Currency Converter</h1>
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
  padding-block: var(--space-3);
}

h1 {
  font-size: var(--font-lg);
  font-weight: 600;
  text-align: center;
}

.main {
  display: grid;
  gap: var(--space-4);
  align-content: center;
  justify-self: center;
  inline-size: min(100%, 28rem);
  padding-block-end: var(--space-8);
}
</style>
