<template>
  <section>
    <div class="dashboard-header">
      <div>
        <p class="eyebrow">Selettore temporale</p>
        <h2>Panoramica del patrimonio</h2>
      </div>
      <label class="time-selector">
        <span>Periodo</span>
        <select v-model="selectedYear">
          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
        </select>
      </label>
    </div>

    <div class="summary-grid">
      <div class="card">
        <h3>Patrimonio netto</h3>
        <p>{{ formatBalance(netWorth, baseCurrency) }}</p>
      </div>
      <div class="card">
        <h3>Conti</h3>
        <p>{{ accountCount }}</p>
      </div>
      <div class="card">
        <h3>Entrate</h3>
        <p>{{ entryCount }}</p>
      </div>
      <div class="card">
        <h3>Investimenti</h3>
        <p>{{ investmentCount }}</p>
      </div>
    </div>

    <div class="card">
      <h3>Ultimi conti aggiunti</h3>
      <div v-if="recentAccounts.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Saldo</th>
              <th>Valuta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in recentAccounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ formatBalance(account.balance, account.currency) }}</td>
              <td>{{ account.currency }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Nessun conto ancora creato. Vai in Conti per aggiungere il primo patrimonio.</p>
    </div>

    <div class="card">
      <h3>Ultime entrate</h3>
      <div v-if="recentEntries.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Voce</th>
              <th>Importo</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in recentEntries" :key="entry.id">
              <td>{{ entry.label }}</td>
              <td>{{ formatBalance(entry.amount, entry.currency) }}</td>
              <td>{{ entry.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Nessuna entrata ancora registrata.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const currentYear = new Date().getFullYear()
const selectedYear = ref('YTD')
const yearOptions = computed(() => {
  const years = new Set<string>(store.entries.map((entry) => new Date(entry.date).getFullYear().toString()))
  years.add(currentYear.toString())
  return ['YTD', ...Array.from(years).sort((a, b) => Number(b) - Number(a))]
})

const netWorth = computed(() => store.netWorth)
const accountCount = computed(() => store.accountCount)
const entryCount = computed(() => store.entryCount)
const investmentCount = computed(() => store.investmentCount)
const recentAccounts = computed(() => store.recentAccounts)
const recentEntries = computed(() => {
  const year = selectedYear.value
  const entries = store.entries.filter((entry) => {
    const entryYear = new Date(entry.date).getFullYear().toString()
    return year === 'YTD' ? entryYear === currentYear.toString() : entryYear === year
  })
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
})
const baseCurrency = computed(() => store.baseCurrency)

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
