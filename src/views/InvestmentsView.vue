<template>
  <section>
    <article class="card card-collapsible">
      <div class="collapsible-header">
        <div>
          <h3>Aggiungi investimento</h3>
        </div>
        <button class="btn-secondary btn-icon" type="button" @click="toggleForm">
          {{ formOpen ? '−' : '+' }}
        </button>
      </div>

      <form v-if="formOpen" class="form-grid" @submit.prevent="submitInvestment">
        <div class="form-field">
          <label class="form-label" for="investmentTicker">Ticker Yahoo</label>
          <input id="investmentTicker" v-model="form.ticker" class="form-input" placeholder="es. AAPL, BTC-USD" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentCategory">Categoria</label>
          <select id="investmentCategory" v-model="form.category" class="form-select">
            <option v-for="category in investmentCategories" :key="category" :value="category">{{ category }}</option>
          </select>
        </div>
        <div class="form-field form-inline compact-row" style="align-items: flex-end; gap: 0.75rem; flex-wrap: wrap;">
          <div class="inline-field">
            <label class="form-label compact-label" for="manualPrice">Prezzo</label>
            <input id="manualPrice" v-model.number="form.manualPrice" type="number" step="0.01" class="form-input compact-input" placeholder="Prezzo" required />
          </div>
          <div class="inline-field" style="margin-top: 1.4rem;">
            <button class="btn-secondary compact-button" type="button" @click="fetchTickerPrice" :disabled="priceLoading || !form.ticker">
              {{ priceLoading ? 'Recupero...' : 'Recupera valore' }}
            </button>
          </div>
          <div class="inline-field">
            <label class="form-label compact-label" for="investmentCurrency">Valuta</label>
            <select id="investmentCurrency" v-model="form.currency" class="form-select compact-input" required>
              <option v-for="currency in currencyOptions" :key="currency" :value="currency">{{ currency }}</option>
            </select>
          </div>
          <div class="inline-field">
            <label class="form-label compact-label" for="initialLotQuantity">Qty</label>
            <input id="initialLotQuantity" v-model.number="form.initialLotQuantity" class="form-input compact-input" type="number" step="0.0001" placeholder="Qty" required />
          </div>
          <div class="inline-field">
            <label class="form-label compact-label" for="initialLotDate">Data</label>
            <input id="initialLotDate" v-model="form.initialLotDate" class="form-input compact-input" type="date" required />
          </div>
          <span v-if="tickerPrice !== null" class="helper-text">Ultimo: {{ formatBalance(tickerPrice, form.currency) }}</span>
          <span v-if="priceError" class="helper-text error-text">{{ priceError }}</span>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentNote">Note</label>
          <input id="investmentNote" v-model="form.note" class="form-input" placeholder="Es. ETF mondo">
        </div>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Aggiungi investimento</button>
        </div>
      </form>
    </article>

    <article class="card card-collapsible">
      <div class="collapsible-header">
        <div>
          <h3>Aggiorna lotti</h3>
        </div>
        <button class="btn-secondary btn-icon" type="button" @click="toggleLotForm">
          {{ lotFormOpen ? '−' : '+' }}
        </button>
      </div>

      <form v-if="lotFormOpen" class="form-grid" @submit.prevent="submitBatchLots">
        <div class="form-field">
          <label class="form-label" for="lotDate">Data acquisto</label>
          <input id="lotDate" type="date" v-model="lotDate" class="form-input" required>
        </div>
        <div v-if="investments.length" class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Categoria</th>
                <th>Quantità</th>
                <th>Prezzo acquisto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="investment in investments" :key="investment.id">
                <td>{{ investment.ticker }}</td>
                <td>{{ investment.category }}</td>
                <td>
                  <input
                    v-model.number="lotInputs[investment.id].quantity"
                    class="form-input"
                    type="number"
                    step="0.0001"
                    placeholder="0"
                  />
                </td>
                <td>
                  <input
                    v-model.number="lotInputs[investment.id].purchasePrice"
                    class="form-input"
                    type="number"
                    step="0.01"
                    placeholder="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>Prima aggiungi un investimento per poter registrare i nuovi lotti.</p>
        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Salva lotti</button>
        </div>
      </form>
    </article>

    <div class="card">
      <h3>Elenco investimenti</h3>
      <div v-if="investments.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Categoria</th>
              <th>Ultimo prezzo</th>
              <th>Quantità totale</th>
              <th>Valore stimato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="investment in investments" :key="investment.id">
              <td>{{ investment.ticker }}</td>
              <td>{{ investment.category }}</td>
              <td>{{ investment.lastPrice ? formatBalance(investment.lastPrice, investment.currency) : '-' }}</td>
              <td>{{ formatQuantity(totalQuantity(investment.ticker)) }}</td>
              <td>{{ investment.lastPrice ? formatBalance(investment.lastPrice * totalQuantity(investment.ticker), investment.currency) : '-' }}</td>
              <td>
                <button class="btn-tertiary" type="button" @click="removeInvestment(investment.id)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Non ci sono investimenti registrati. Aggiungi un ticker per iniziare.</p>
    </div>

    <div class="card">
      <h3>Storico lotti</h3>
      <div v-if="investmentLots.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Quantità</th>
              <th>Prezzo acquisto</th>
              <th>Data</th>
              <th>Totale</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="lot in investmentLots" :key="lot.id">
              <td>{{ lot.ticker }}</td>
              <td>{{ formatQuantity(lot.quantity) }}</td>
              <td>{{ formatBalance(lot.purchasePrice, lot.currency) }}</td>
              <td>{{ formatDate(lot.date) }}</td>
              <td>{{ formatBalance(lot.purchasePrice * lot.quantity, lot.currency) }}</td>
              <td>
                <button class="btn-tertiary" type="button" @click="removeLot(lot.id)">Elimina</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Non ci sono lotti acquistati. Usa il form per registrare un nuovo acquisto.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useAppStore, Investment, InvestmentLot } from '@/stores/app'
import { createId } from '@/utils/uid'

const store = useAppStore()
const investments = computed(() => store.investments)
const investmentLots = computed(() => store.investmentLots)
const investmentCategories = computed(() => store.investmentCategories)
const currencyOptions = computed(() => store.supportedCurrencies)
const formOpen = ref(false)
const lotFormOpen = ref(false)
const priceLoading = ref(false)
const priceError = ref('')
const tickerPrice = ref<number | null>(null)

const form = reactive({
  ticker: '',
  category: store.investmentCategories[0] || 'ETF',
  currency: store.supportedCurrencies[0] || 'EUR',
  note: '',
  manualPrice: null as number | null,
  initialLotQuantity: 0,
  initialLotDate: new Date().toISOString().slice(0, 10),
})

const priceCache = reactive<Record<string, { price: number; fetchedAt: number }>>({})
const lotDate = ref(new Date().toISOString().slice(0, 10))
const lotInputs = reactive<Record<string, { quantity: number; purchasePrice: number }>>({})

const initializeLotInputs = () => {
  investments.value.forEach((investment) => {
    if (!lotInputs[investment.id]) {
      lotInputs[investment.id] = { quantity: 0, purchasePrice: 0 }
    }
  })
}

watchEffect(() => {
  investments.value.forEach((investment) => {
    if (!lotInputs[investment.id]) {
      lotInputs[investment.id] = { quantity: 0, purchasePrice: 0 }
    }
  })
})

const toggleForm = () => {
  formOpen.value = !formOpen.value
}

const toggleLotForm = () => {
  initializeLotInputs()
  lotFormOpen.value = !lotFormOpen.value
}

const fetchTickerPrice = async () => {
  const symbol = form.ticker.trim().toUpperCase()
  if (!symbol) {
    return
  }

  const cached = priceCache[symbol]
  const now = Date.now()
  if (cached && now - cached.fetchedAt < 15 * 60 * 1000) {
    tickerPrice.value = cached.price
    priceError.value = ''
    return
  }

  priceError.value = ''
  priceLoading.value = true
  tickerPrice.value = null

  try {
    const response = await fetch(`/api/yahoo?symbols=${encodeURIComponent(symbol)}`)
    if (!response.ok) {
      if (response.status === 429) {
        priceError.value = 'Servizio quote temporaneamente non disponibile. Riprova tra qualche minuto.'
      }
      return
    }

    const data = await response.json()
    const quote = data?.quoteResponse?.result?.[0]
    if (!quote || quote.regularMarketPrice == null) {
      priceError.value = 'Ticker non trovato.'
      return
    }

    tickerPrice.value = Number(quote.regularMarketPrice)
    priceCache[symbol] = {
      price: tickerPrice.value,
      fetchedAt: now,
    }
  } catch (error) {
    priceError.value = 'Impossibile recuperare il valore per il ticker.'
  } finally {
    priceLoading.value = false
  }
}

const submitInvestment = () => {
  if (!form.ticker.trim()) {
    return
  }

  const ticker = form.ticker.trim().toUpperCase()
  const price = form.manualPrice != null ? form.manualPrice : tickerPrice.value
  const investment: Investment = {
    id: createId('investment'),
    ticker,
    category: form.category,
    currency: form.currency,
    note: form.note.trim() || undefined,
    lastPrice: price ?? undefined,
    lastPriceAt: price != null ? new Date().toISOString() : undefined,
  }

  store.addInvestment(investment)

  const lotPrice = price
  if (form.initialLotQuantity > 0 && lotPrice != null && form.initialLotDate) {
    const lot: InvestmentLot = {
      id: createId('investment-lot'),
      ticker,
      category: form.category,
      currency: form.currency,
      quantity: Number(form.initialLotQuantity),
      purchasePrice: Number(lotPrice),
      date: form.initialLotDate,
    }
    store.addInvestmentLot(lot)
  }

  form.ticker = ''
  form.category = store.investmentCategories[0] || 'ETF'
  form.currency = store.supportedCurrencies[0] || 'EUR'
  form.note = ''
  form.manualPrice = null
  form.initialLotQuantity = 0
  form.initialLotDate = new Date().toISOString().slice(0, 10)
  tickerPrice.value = null
  priceError.value = ''
}

const submitBatchLots = () => {
  if (!lotDate.value) {
    return
  }

  const lotsToSave = investments.value
    .map((investment) => ({
      investment,
      input: lotInputs[investment.id],
    }))
    .filter((item) => item.input?.quantity > 0 && item.input?.purchasePrice > 0)
    .map((item) => {
      const lot: InvestmentLot = {
        id: createId('investment-lot'),
        ticker: item.investment.ticker,
        category: item.investment.category,
        currency: item.investment.currency,
        quantity: Number(item.input.quantity),
        purchasePrice: Number(item.input.purchasePrice),
        date: lotDate.value,
      }
      return lot
    })

  lotsToSave.forEach((lot) => store.addInvestmentLot(lot))
  lotFormOpen.value = false
}

const removeInvestment = (id: string) => {
  store.removeInvestment(id)
}

const removeLot = (id: string) => {
  store.removeInvestmentLot(id)
}

const totalQuantity = (ticker: string) => {
  return investmentLots.value
    .filter((lot) => lot.ticker.toUpperCase() === ticker.toUpperCase())
    .reduce((sum, lot) => sum + lot.quantity, 0)
}

const formatQuantity = (value: number) => {
  return value.toFixed(4)
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
