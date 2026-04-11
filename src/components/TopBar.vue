<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">Benvenuto in PocketBloom</p>
      <h2>{{ pageTitle }}</h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() =>
  route.name === 'Dashboard' ? 'Panoramica del patrimonio' : route.name || ''
)
</script>

<style scoped>
.eyebrow {
  margin: 0 0 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}

.btn-secondary {
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary-soft);
  color: var(--primary);
}
</style>
