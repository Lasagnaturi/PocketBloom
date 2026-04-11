<template>
  <section>
    <div class="card">
      <h3>Entrate</h3>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Voce</th>
              <th>Categoria</th>
              <th>Importo</th>
              <th>Valuta</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id">
              <td>{{ entry.label }}</td>
              <td>{{ entry.category }}</td>
              <td>{{ formatAmount(entry.amount, entry.currency) }}</td>
              <td>{{ entry.currency }}</td>
              <td>{{ entry.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const entries = computed(() => store.entries)
const formatAmount = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
