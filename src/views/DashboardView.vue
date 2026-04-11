<template>
  <section>
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
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const netWorth = computed(() => store.netWorth)
const accountCount = computed(() => store.accountCount)
const entryCount = computed(() => store.entryCount)
const investmentCount = computed(() => store.investmentCount)
const recentAccounts = computed(() => store.recentAccounts)
const recentEntries = computed(() => store.recentEntries)
const baseCurrency = computed(() => store.baseCurrency)

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
