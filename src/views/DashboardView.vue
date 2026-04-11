<template>
  <section>
    <div class="summary-grid">
      <div class="card">
        <h3>Patrimonio netto</h3>
        <p>€ 72.300</p>
      </div>
      <div class="card">
        <h3>Conti</h3>
        <p>{{ accountCount }}</p>
      </div>
      <div class="card">
        <h3>Entrate</h3>
        <p>{{ entriesCount }}</p>
      </div>
    </div>
    <div class="card" style="margin-top: 24px;">
      <h3>Prossimi passi</h3>
      <ul>
        <li>Aggiungi conti e entrate</li>
        <li>Configura backup cloud</li>
        <li>Visualizza patrimonio in tempo reale</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const accountCount = computed(() => store.accountCount)
const entriesCount = computed(() => store.entries.length)
</script>
