<template>
  <section>
    <div class="card">
      <h3>Investimenti</h3>
      <form class="form-grid" @submit.prevent="submitInvestment">
        <div class="form-field">
          <label class="form-label" for="investmentName">Nome asset</label>
          <input class="form-input" id="investmentName" v-model="form.name" placeholder="ETF MSCI World" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentCategory">Categoria</label>
          <select class="form-select" id="investmentCategory" v-model="form.category">
            <option>Azioni</option>
            <option>ETF</option>
            <option>Crypto</option>
            <option>Fondi</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentCurrency">Valuta</label>
          <select class="form-select" id="investmentCurrency" v-model="form.currency">
            <option>EUR</option>
            <option>USD</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentValue">Valore</label>
          <input class="form-input" id="investmentValue" type="number" step="0.01" v-model.number="form.value" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentPerformance">Performance %</label>
          <input class="form-input" id="investmentPerformance" type="number" step="0.1" v-model.number="form.performance">
        </div>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Aggiungi investimento</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Elenco investimenti</h3>
      <div v-if="investments.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Categoria</th>
              <th>Valore</th>
              <th>Performance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="investment in investments" :key="investment.id">
              <td>{{ investment.name }}</td>
              <td>{{ investment.category }}</td>
              <td>{{ formatBalance(investment.value, investment.currency) }}</td>
              <td>{{ investment.performance }}%</td>
              <td>
                <button class="btn-tertiary" type="button" @click="removeInvestment(investment.id)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Non ci sono investimenti registrati. Aggiungi il primo asset.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore, Investment } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const investments = computed(() => store.investments)

const form = reactive({
  name: '',
  category: 'Azioni',
  currency: 'EUR',
  value: 0,
  performance: 0,
})

const submitInvestment = () => {
  if (!form.name.trim()) {
    return
  }

  const investment: Investment = {
    id: createId('investment'),
    name: form.name.trim(),
    category: form.category,
    currency: form.currency,
    value: Number(form.value),
    performance: Number(form.performance),
  }

  store.addInvestment(investment)
  form.name = ''
  form.category = 'Azioni'
  form.currency = 'EUR'
  form.value = 0
  form.performance = 0
}

const removeInvestment = (id: string) => {
  store.removeInvestment(id)
}

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
