<template>
  <section>
    <div class="card">
      <h3>Conti</h3>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Valuta</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ account.type }}</td>
              <td>{{ account.currency }}</td>
              <td>{{ formatBalance(account.balance, account.currency) }}</td>
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
const accounts = computed(() => store.accounts)

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
