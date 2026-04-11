<template>
  <section>
    <article class="card card-collapsible">
      <div class="collapsible-header">
        <div>
          <h3>Aggiungi conto</h3>
        </div>
        <button class="btn-secondary btn-icon" type="button" @click="toggleForm">
          {{ formOpen ? '−' : '+' }}
        </button>
      </div>

      <form v-if="formOpen" class="form-grid" @submit.prevent="submitAccount">
        <div class="form-field">
          <label class="form-label" for="accountName">Nome conto</label>
          <input id="accountName" v-model="form.name" class="form-input" placeholder="Conto corrente" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountType">Tipo</label>
          <select id="accountType" v-model="form.type" class="form-select">
            <option>Bank</option>
            <option>Wallet</option>
            <option>Broker</option>
            <option>Savings</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountCurrency">Valuta</label>
          <select id="accountCurrency" v-model="form.currency" class="form-select">
            <option v-for="currency in currencyOptions" :key="currency" :value="currency">{{ currency }}</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountBalance">Saldo</label>
          <input id="accountBalance" v-model.number="form.balance" class="form-input" type="number" step="0.01" placeholder="0" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="accountNote">Note</label>
          <input id="accountNote" v-model="form.note" class="form-input" placeholder="Es. conto principale">
        </div>
        <div class="form-field">
          <label class="form-label" for="accountClosed">
            <input id="accountClosed" type="checkbox" v-model="form.closed">
            Conto chiuso
          </label>
        </div>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Aggiungi conto</button>
        </div>
      </form>
    </article>

    <article class="card card-collapsible">
      <div class="collapsible-header">
        <div>
          <h3>Aggiorna saldi</h3>
        </div>
        <button class="btn-secondary btn-icon" type="button" @click="toggleBalanceForm">
          {{ balanceFormOpen ? '−' : '+' }}
        </button>
      </div>

      <form v-if="balanceFormOpen" class="form-grid" @submit.prevent="saveBalances">
        <div class="form-field">
          <label class="form-label" for="balanceDate">Data aggiornamento</label>
          <input id="balanceDate" type="date" v-model="balanceDate" class="form-input">
        </div>
        <div v-if="openAccounts.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Conto</th>
                <th>Valuta</th>
                <th>Saldo aggiornato</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in openAccounts" :key="account.id">
                <td>{{ account.name }}</td>
                <td>{{ account.currency }}</td>
                <td>
                  <input
                    v-model.number="balanceInputs[account.id]"
                    class="form-input"
                    type="number"
                    step="0.01"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>Nessun conto aperto disponibile per l'aggiornamento saldo.</p>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Salva saldi</button>
        </div>
      </form>
    </article>

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
              <th>Apertura</th>
              <th>Chiusura</th>
              <th>Stato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ account.type }}</td>
              <td>{{ account.currency }}</td>
              <td>{{ formatBalance(account.balance, account.currency) }}</td>
              <td>{{ account.openedAt ? formatDate(account.openedAt) : '-' }}</td>
              <td>{{ account.closedAt ? formatDate(account.closedAt) : '-' }}</td>
              <td>{{ account.closed ? 'Chiuso' : 'Aperto' }}</td>
              <td>
                <button class="btn-tertiary" type="button" @click="toggleAccountStatus(account.id)">
                  {{ account.closed ? 'Riapri' : 'Chiudi' }}
                </button>
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
import { computed, reactive, ref } from 'vue'
import { useAppStore, Account } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const accounts = computed(() => store.accounts)
const openAccounts = computed(() => store.accounts.filter((account) => !account.closed))
const currencyOptions = computed(() => store.supportedCurrencies)
const formOpen = ref(false)
const balanceFormOpen = ref(false)
const balanceDate = ref(new Date().toISOString().slice(0, 10))
const balanceInputs = reactive<Record<string, number>>({})

const form = reactive({
  name: '',
  type: 'Bank',
  currency: store.supportedCurrencies[0] || 'EUR',
  balance: 0,
  note: '',
  closed: false,
})

const toggleForm = () => {
  formOpen.value = !formOpen.value
}

const toggleBalanceForm = () => {
  if (!balanceFormOpen.value) {
    openAccounts.value.forEach((account) => {
      balanceInputs[account.id] = account.balance
    })
    balanceDate.value = new Date().toISOString().slice(0, 10)
  }
  balanceFormOpen.value = !balanceFormOpen.value
}

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
    closed: form.closed,
  }

  store.addAccount(account)
  form.name = ''
  form.type = 'Bank'
  form.currency = 'EUR'
  form.balance = 0
  form.note = ''
  form.closed = false
}

const saveBalances = () => {
  openAccounts.value.forEach((account) => {
    const newBalance = Number(balanceInputs[account.id] ?? account.balance)
    store.updateAccountBalance(account.id, newBalance)
  })
  balanceFormOpen.value = false
}

const removeAccount = (id: string) => {
  store.removeAccount(id)
}

const toggleAccountStatus = (id: string) => {
  store.toggleAccountStatus(id)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString))
}

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(value)
}
</script>
