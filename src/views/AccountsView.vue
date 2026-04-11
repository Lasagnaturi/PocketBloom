<template>
  <section>
    <div class="card">
      <h3>Conti</h3>
      <form class="form-grid" @submit.prevent="submitAccount">
        <div class="form-field">
          <label class="form-label" for="accountName">Nome conto</label>
          <input class="form-input" id="accountName" v-model="form.name" placeholder="Conto corrente" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountType">Tipo</label>
          <select class="form-select" id="accountType" v-model="form.type">
            <option>Bank</option>
            <option>Wallet</option>
            <option>Broker</option>
            <option>Savings</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountCurrency">Valuta</label>
          <select class="form-select" id="accountCurrency" v-model="form.currency">
            <option>EUR</option>
            <option>USD</option>
            <option>GBP</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountBalance">Saldo</label>
          <input class="form-input" id="accountBalance" v-model.number="form.balance" type="number" step="0.01" placeholder="0" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountNote">Note</label>
          <input class="form-input" id="accountNote" v-model="form.note" placeholder="Es. conto principale">
        </div>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Aggiungi conto</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>Elenco conti</h3>
      <div v-if="accounts.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Valuta</th>
              <th>Saldo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ account.type }}</td>
              <td>{{ account.currency }}</td>
              <td>{{ formatBalance(account.balance, account.currency) }}</td>
              <td>
                <button class="btn-tertiary" type="button" @click="removeAccount(account.id)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Nessun conto presente. Aggiungi un nuovo conto per iniziare.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore, Account } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const accounts = computed(() => store.accounts)

const form = reactive({
  name: '',
  type: 'Bank',
  currency: 'EUR',
  balance: 0,
  note: '',
})

const submitAccount = () => {
  if (!form.name.trim()) {
    return
  }

  const account: Account = {
    id: createId('account'),
    name: form.name.trim(),
    type: form.type,
    currency: form.currency,
    balance: Number(form.balance),
    note: form.note.trim() || undefined,
  }

  store.addAccount(account)
  form.name = ''
  form.type = 'Bank'
  form.currency = 'EUR'
  form.balance = 0
  form.note = ''
}

const removeAccount = (id: string) => {
  store.removeAccount(id)
}

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
