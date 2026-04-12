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
      <div class="dashboard-card-header">
        <div>
          <h3>Valore attuale investimenti</h3>
          <p class="helper-text">Aggiorna i prezzi in tempo reale tramite proxy Yahoo.</p>
        </div>
        <button class="btn-secondary btn-small" type="button" @click="refreshPrices" :disabled="loading">
          {{ loading ? 'Aggiornando...' : 'Aggiorna prezzi' }}
        </button>
      </div>

      <div v-if="investmentValues.length" class="investment-chart">
        <div class="summary-row">
          <span>Totale investimenti</span>
          <span v-for="item in totalValues" :key="item.currency">{{ formatBalance(item.total, item.currency) }}</span>
        </div>

        <div class="chart-row" v-for="item in investmentValues" :key="item.key">
          <div class="chart-row-title">
            <span>{{ item.ticker }}</span>
            <span class="muted">{{ item.currency }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: `${(item.value / maxValue) * 100}%` }"></div>
          </div>
          <div class="chart-value">{{ formatBalance(item.value, item.currency) }}</div>
        </div>
      </div>

      <p v-else class="helper-text">Nessun investimento disponibile per il grafico.</p>
      <p v-if="error" class="helper-text error-text">{{ error }}</p>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useStock } from '@/composables/useStock'

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
const { prices, loading, error, fetchPrices } = useStock()

const uniqueInvestments = computed(() => {
  const map = new Map<string, { ticker: string; currency: string }>()
  store.investments.forEach((investment) => {
    const key = `${investment.ticker.toUpperCase()}:${investment.currency}`
    if (!map.has(key)) {
      map.set(key, {
        ticker: investment.ticker.toUpperCase(),
        currency: investment.currency,
      })
    }
  })
  return Array.from(map.values())
})

const tickersToFetch = computed(() => uniqueInvestments.value.map((item) => item.ticker))

const totalQuantity = (ticker: string) => {
  return store.investmentLots
    .filter((lot) => lot.ticker.toUpperCase() === ticker.toUpperCase())
    .reduce((sum, lot) => sum + lot.quantity, 0)
}

const investmentValues = computed(() => {
  return uniqueInvestments.value.map((item) => {
    const quantity = totalQuantity(item.ticker)
    const price = prices.value[item.ticker] ?? 0
    return {
      key: `${item.ticker}:${item.currency}`,
      ticker: item.ticker,
      currency: item.currency,
      quantity,
      price,
      value: Number((price * quantity).toFixed(2)),
    }
  })
})

const maxValue = computed(() => Math.max(...investmentValues.value.map((item) => item.value), 1))

const totalValues = computed(() => {
  const totals = new Map<string, number>()
  investmentValues.value.forEach((item) => {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.value)
  })
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }))
})

const refreshPrices = async () => {
  await fetchPrices(tickersToFetch.value)
}

onMounted(() => {
  refreshPrices()
})

watch(tickersToFetch, () => {
  refreshPrices()
})

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
