<script setup lang="ts"></script>

<template>
  <main class="shell">
    <h1>Currency Converter</h1>
    <p class="muted">Scaffold in place. Conversion arrives in milestone 4.</p>
  </main>
</template>

<style scoped>
.shell {
  display: grid;
  gap: var(--space-2);
  place-content: center;
  min-block-size: 100dvh;
  padding: var(--space-4);
  text-align: center;
}

h1 {
  font-size: var(--font-xl);
  font-weight: 600;
}

.muted {
  color: var(--text-muted);
}
</style>
