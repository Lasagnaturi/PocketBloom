<template>
  <section>
    <article class="card">
      <div class="card-header">
        <div>
          <h3>Conti</h3>
          <p class="muted-text">Visualizza, gestisci e valuta rapidamente i tuoi conti in valuta locale ed EUR.</p>
        </div>
      </div>

      <div class="summary-row">
        <div class="card summary-block">
          <h4>Totale per valuta</h4>
          <p class="muted-text"><strong>Grand total in EUR:</strong> {{ formatBalance(totalInEur, 'EUR') }}</p>
          <div class="currency-list" v-if="Object.keys(balanceByCurrency).length">
            <div class="currency-row" v-for="(value, currency) in balanceByCurrency" :key="currency">
              <span>{{ currency }}</span>
              <strong>{{ formatBalance(value, currency) }}</strong>
              <small>
                ≈ {{ formatBalance(convertToEur(value, currency), 'EUR') }} · {{ currencyPercentages[currency]?.toFixed(1) }}%
              </small>
            </div>
          </div>
          <p class="muted-text" v-else>Nessun conto presente.</p>
        </div>
        <div class="summary-card summary-rate-card" >
          <h4>Asset type in EUR</h4>
          <div class="currency-list" v-if="assetTypeLabels.length">
            <div class="currency-row" v-for="type in assetTypeLabels" :key="type">
              <span>{{ type }}</span>
              <strong>{{ formatBalance(assetTypeBalances[type], 'EUR') }}</strong>
              <small>{{ assetTypePercentages[type]?.toFixed(1) }}% del totale</small>
            </div>
          </div>
          <p class="muted-text" v-else>Nessun asset type presente.</p>
        </div>
        <div class="summary-card summary-rate-card" v-if="hasChfRate">
          <strong>{{ formatForeignExchangeRate('CHF') }}</strong>
          <span>1 CHF = EUR</span>
          <small class="summary-note" v-if="ratesLastUpdated">Aggiornato: {{ ratesLastUpdated }}</small>
        </div>
      </div>
    </article>

    <article class="card card-collapsible" ref="formSection">
      <div class="collapsible-header">
        <div>
          <h3>{{ isEditing ? 'Modifica conto' : 'Aggiungi conto' }}</h3>
          <p class="muted-text">
            {{ isEditing ? 'Aggiorna i dettagli del conto esistente.' : 'Crea un nuovo conto per tenere traccia del patrimonio.' }}
          </p>
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
            <option v-for="type in accountTypeOptions" :key="type">{{ type }}</option>
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
        <div class="form-field" style="align-self: end; display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn-primary" type="submit">
            {{ isEditing ? 'Salva modifiche' : 'Aggiungi conto' }}
          </button>
          <button v-if="isEditing" class="btn-tertiary" type="button" @click="cancelEdit">
            Annulla
          </button>
        </div>
      </form>
    </article>

    <article class="card">
      <div class="card-header">
        <div>
          <h3>Filtri</h3>
          <p class="muted-text">Mostra solo i conti aperti per concentrarti sui saldi attivi.</p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field checkbox-field">
          <label class="form-label" for="onlyOpen">
            <input id="onlyOpen" type="checkbox" v-model="showOpenOnly" />
            Mostra solo conti aperti
          </label>
        </div>
      </div>
    </article>

    <article class="card card-collapsible">
      <div class="collapsible-header">
        <div>
          <h3>Aggiorna saldi</h3>
          <p class="muted-text">Aggiorna rapidamente i saldi dei conti ancora aperti.</p>
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

    <article class="card">
      <div class="card-header">
        <div>
          <h3>Asset type</h3>
          <p class="muted-text">Segmenta i conti per tipo; questa sezione è pronta per il grafico a torta futuro.</p>
        </div>
      </div>
      <div class="asset-type-grid">
        <div class="asset-type-pill" v-for="(count, type) in assetTypeCounts" :key="type">
          <strong>{{ type }}</strong>
          <span>{{ count }}</span>
        </div>
      </div>
    </article>

    <div class="card">
      <h3>Elenco conti</h3>
      <div v-if="filteredAccounts.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Valuta</th>
              <th>Saldo</th>
              <th>Note</th>
              <th>Apertura</th>
              <th>Chiusura</th>
              <th>Stato</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in filteredAccounts" :key="account.id">
              <td>{{ account.name }}</td>
              <td>{{ account.type }}</td>
              <td>{{ account.currency }}</td>
              <td>{{ formatBalance(account.balance, account.currency) }}</td>
              <td>{{ account.note ?? '-' }}</td>
              <td>{{ account.openedAt ? formatDate(account.openedAt) : '-' }}</td>
              <td>{{ account.closedAt ? formatDate(account.closedAt) : '-' }}</td>
              <td>{{ account.closed ? 'Chiuso' : 'Aperto' }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-secondary" type="button" @click="setEditAccount(account)">
                    Modifica
                  </button>
                  <button class="btn-secondary" type="button" @click="toggleAccountStatus(account.id)">
                    {{ account.closed ? 'Riapri' : 'Chiudi' }}
                  </button>
                  <button class="btn-tertiary" type="button" @click="removeAccount(account.id)">Elimina</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Nessun conto corrisponde ai criteri. Aggiungi un conto per iniziare.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useAppStore, Account } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const accounts = computed(() => store.accounts)
const currencyOptions = computed(() => store.supportedCurrencies)
const accountTypeOptions = ['C/C', 'C/D', 'Varie']
const formOpen = ref(false)
const balanceFormOpen = ref(false)
const getTodayDate = () => new Date().toISOString().slice(0, 10)
const balanceDate = ref(getTodayDate())
const balanceInputs = reactive<Record<string, number>>({})
const editingAccountId = ref<string | null>(null)
const showOpenOnly = ref(false)
const formSection = ref<HTMLElement | null>(null)
const exchangeRates = reactive<Record<string, number>>({ EUR: 1 })
const rateError = ref('')
const ratesLastUpdated = ref('')

const form = reactive({
  name: '',
  type: 'Liquidity',
  currency: store.supportedCurrencies[0] || 'EUR',
  balance: 0,
  note: '',
  closed: false,
})

const isEditing = computed(() => Boolean(editingAccountId.value))

const filteredAccounts = computed(() =>
  accounts.value.filter((account) => (showOpenOnly.value ? !account.closed : true))
)

const openAccounts = computed(() => store.accounts.filter((account) => !account.closed))
const openCount = computed(() => filteredAccounts.value.filter((account) => !account.closed).length)
const closedCount = computed(() => filteredAccounts.value.filter((account) => account.closed).length)

const balanceByCurrency = computed(() => {
  return filteredAccounts.value.reduce((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + account.balance
    return acc
  }, {} as Record<string, number>)
})

const assetTypeCounts = computed(() => {
  return accounts.value.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

const totalInEur = computed(() => {
  return Object.entries(balanceByCurrency.value).reduce((sum, [currency, amount]) => {
    if (currency === 'EUR') {
      return sum + amount
    }

    const rate = exchangeRates[currency]
    if (!rate || rate === 0) {
      return sum
    }

    return sum + amount / rate
  }, 0)
})

function convertToEur(value: number, currency: string) {
  const rate = exchangeRates[currency]
  if (!rate || rate === 0) {
    return 0
  }
  return value / rate
}

function formatForeignExchangeRate(currency: string) {
  const rate = exchangeRates[currency]
  if (!rate || rate === 0) {
    return '-'
  }
  const inverseRate = 1 / rate
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(inverseRate)
}

const currencyLabels = computed(() => Object.keys(balanceByCurrency.value))
const foreignCurrencyLabels = computed(() => currencyLabels.value.filter((currency) => currency !== 'EUR'))
const hasForeignCurrencies = computed(() => foreignCurrencyLabels.value.length > 0)
const chfRate = computed(() => exchangeRates['CHF'] ?? 0)
const hasChfRate = computed(() => chfRate.value > 0)
const currencyTotalsInEur = computed(() => {
  return Object.fromEntries(
    Object.entries(balanceByCurrency.value).map(([currency, amount]) => [
      currency,
      currency === 'EUR' ? amount : convertToEur(amount, currency),
    ]),
  )
})
const currencyPercentages = computed(() => {
  const total = totalInEur.value || 0
  return Object.fromEntries(
    Object.entries(currencyTotalsInEur.value).map(([currency, eurValue]) => [
      currency,
      total ? (eurValue / total) * 100 : 0,
    ]),
  )
})

const mapAssetType = (type: string) => {
  const normalized = type?.toLowerCase?.().trim() || ''
  if (normalized === 'c/c' || normalized === 'conto corrente' || normalized === 'liquidity' || normalized === 'bank') {
    return 'C/C'
  }
  if (normalized === 'c/d' || normalized === 'conto deposito') {
    return 'C/D'
  }
  return 'Varie'
}

const assetTypeBalances = computed(() => {
  return filteredAccounts.value.reduce((acc, account) => {
    const eurValue = account.currency === 'EUR' ? account.balance : convertToEur(account.balance, account.currency)
    const assetType = mapAssetType(account.type)
    acc[assetType] = (acc[assetType] || 0) + eurValue
    return acc
  }, {} as Record<string, number>)
})
const assetTypeLabels = computed(() => Object.keys(assetTypeBalances.value))
const assetTypeChartLabels = computed(() => assetTypeLabels.value.filter((type) => Math.abs(assetTypeBalances.value[type] ?? 0) > 0))
const assetTypeValues = computed(() => assetTypeLabels.value.map((type) => assetTypeBalances.value[type]))
const assetTypeChartValues = computed(() => assetTypeChartLabels.value.map((type) => Math.abs(assetTypeBalances.value[type] ?? 0)))
const canRenderAssetChart = computed(() => assetTypeChartLabels.value.length > 0)
const assetTypePercentages = computed(() => {
  const total = totalInEur.value || 0
  return Object.fromEntries(
    assetTypeLabels.value.map((type) => [
      type,
      total ? (assetTypeBalances.value[type] / total) * 100 : 0,
    ]),
  )
})

const fetchExchangeRates = async () => {
  rateError.value = ''
  const currencies = currencyLabels.value.filter((currency) => currency !== 'EUR')
  if (!currencies.length) {
    ratesLastUpdated.value = new Date().toLocaleString('it-IT')
    return
  }

  try {
    const symbols = Array.from(new Set(currencies)).join(',')
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=EUR&to=${symbols}`)
    if (!response.ok) {
      throw new Error('Impossibile recuperare i tassi di cambio')
    }

    const data = await response.json()
    if (!data?.rates) {
      throw new Error('Risposta tassi non valida')
    }

    Object.entries(data.rates).forEach(([currency, rate]) => {
      exchangeRates[currency] = Number(rate)
    })
    ratesLastUpdated.value = new Date().toLocaleString('it-IT')
  } catch (error) {
    rateError.value = 'Impossibile caricare i tassi online. Visualizzo i totali senza conversione.'
  }
}

watch(currencyLabels, fetchExchangeRates, { immediate: true })

const resetForm = () => {
  form.name = ''
  form.type = 'Liquidity'
  form.currency = store.supportedCurrencies[0] || 'EUR'
  form.balance = 0
  form.note = ''
  form.closed = false
  editingAccountId.value = null
}

const submitAccount = () => {
  if (!form.name.trim()) {
    return
  }

  const account: Account = {
    id: editingAccountId.value ?? createId('account'),
    name: form.name.trim(),
    type: form.type,
    currency: form.currency,
    balance: Number(form.balance),
    note: form.note.trim() || undefined,
    closed: form.closed,
  }

  if (editingAccountId.value) {
    store.updateAccount(account)
  } else {
    store.addAccount(account)
  }

  resetForm()
  formOpen.value = false
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

const setEditAccount = (account: Account) => {
  editingAccountId.value = account.id
  form.name = account.name
  form.type = account.type || 'Liquidity'
  form.currency = account.currency
  form.balance = account.balance
  form.note = account.note ?? ''
  form.closed = account.closed ?? false
  formOpen.value = true
  nextTick(() => {
    formSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

const cancelEdit = () => {
  resetForm()
  formOpen.value = false
}

const toggleForm = () => {
  if (!formOpen.value) {
    resetForm()
  }
  formOpen.value = !formOpen.value
}

const toggleBalanceForm = () => {
  if (!balanceFormOpen.value) {
    balanceDate.value = getTodayDate()
    openAccounts.value.forEach((account) => {
      balanceInputs[account.id] = Number(account.balance.toFixed(2))
    })
  }
  balanceFormOpen.value = !balanceFormOpen.value
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
