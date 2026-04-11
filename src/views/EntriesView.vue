<template>
  <section>
    <div class="card">
      <h3>Entrate</h3>
      <form class="form-grid" @submit.prevent="submitEntry">
        <div class="form-field">
          <label class="form-label" for="entryLabel">Voce</label>
          <input class="form-input" id="entryLabel" v-model="form.label" placeholder="Stipendio" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="entryCategory">Categoria</label>
          <select class="form-select" id="entryCategory" v-model="form.category">
            <option>Stipendio</option>
            <option>Freelance</option>
            <option>Investimenti</option>
            <option>Altro</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="entryAmount">Importo</label>
          <input class="form-input" id="entryAmount" type="number" step="0.01" v-model.number="form.amount" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="entryCurrency">Valuta</label>
          <select class="form-select" id="entryCurrency" v-model="form.currency">
            <option>EUR</option>
            <option>USD</option>
            <option>GBP</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="entryDate">Data</label>
          <input class="form-input" id="entryDate" type="date" v-model="form.date" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="entryFrequency">Frequenza</label>
          <select class="form-select" id="entryFrequency" v-model="form.frequency">
            <option>una tantum</option>
            <option>ricorrente</option>
          </select>
        </div>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Aggiungi entrata</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Elenco entrate</h3>
      <div v-if="entries.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Voce</th>
              <th>Categoria</th>
              <th>Importo</th>
              <th>Valuta</th>
              <th>Data</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id">
              <td>{{ entry.label }}</td>
              <td>{{ entry.category }}</td>
              <td>{{ formatBalance(entry.amount, entry.currency) }}</td>
              <td>{{ entry.currency }}</td>
              <td>{{ entry.date }}</td>
              <td>
                <button class="btn-tertiary" type="button" @click="removeEntry(entry.id)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Nessuna entrata registrata. Aggiungi la prima entrata.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore, Entry } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const entries = computed(() => store.entries)

const form = reactive({
  label: '',
  category: 'Stipendio',
  amount: 0,
  currency: 'EUR',
  date: new Date().toISOString().slice(0, 10),
  frequency: 'una tantum' as Entry['frequency'],
})

const submitEntry = () => {
  if (!form.label.trim() || !form.date) {
    return
  }

  const entry: Entry = {
    id: createId('entry'),
    label: form.label.trim(),
    category: form.category,
    amount: Number(form.amount),
    currency: form.currency,
    date: form.date,
    frequency: form.frequency,
  }

  store.addEntry(entry)
  form.label = ''
  form.category = 'Stipendio'
  form.amount = 0
  form.currency = 'EUR'
  form.date = new Date().toISOString().slice(0, 10)
  form.frequency = 'una tantum'
}

const removeEntry = (id: string) => {
  store.removeEntry(id)
}

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
