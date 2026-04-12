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
          <label class="form-label" for="investmentTicker">Ticker</label>
          <input id="investmentTicker" v-model="form.ticker" class="form-input" placeholder="es. AAPL, BTC-USD" required>
        </div>
        <div class="form-field">
          <label class="form-label" for="investmentIsin">ISIN</label>
          <input id="investmentIsin" v-model="form.isin" class="form-input" placeholder="Es. US0378331005">
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
          <h3>Aggiungi lotti</h3>
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
              <th>Prezzo medio acquisto</th>
              <th>Quantità totale</th>
              <th>Valore stimato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="investment in investments" :key="investment.id">
              <td>
                <a
                  :href="`https://finance.yahoo.com/quote/${encodeURIComponent(investment.ticker)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ investment.ticker }}
                </a>
              </td>
              <td>{{ investment.category }}</td>
              <td>
                <span v-if="averagePurchasePrice(investment.ticker) !== null">
                  {{ formatBalance(averagePurchasePrice(investment.ticker)!, investment.currency) }}
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ formatQuantity(totalQuantity(investment.ticker)) }}</td>
              <td>
                <span v-if="averagePurchasePrice(investment.ticker) !== null">
                  {{ formatBalance(averagePurchasePrice(investment.ticker)! * totalQuantity(investment.ticker), investment.currency) }}
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <div style="display: inline-flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn-secondary" type="button" @click="openSellModal(investment)">Vendi</button>
                  <button class="btn-tertiary" type="button" @click="removeInvestment(investment.id)">Elimina</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Non ci sono investimenti registrati. Aggiungi un ticker per iniziare.</p>
    </div>

    <div class="card">
      <h3>Lotti acquistati</h3>
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

    <div v-if="sellModalOpen" class="modal-overlay" @click.self="closeSellModal">
      <div class="modal-card">
        <h3>Vendi lotti - {{ selectedSaleInvestment?.ticker }}</h3>
        <form class="form-grid" @submit.prevent="submitSellLots">
          <div class="form-field">
            <label class="form-label" for="sellDate">Data vendita</label>
            <input id="sellDate" v-model="sellForm.date" type="date" class="form-input" required />
          </div>
          <div class="form-field">
            <label class="form-label" for="sellQuantity">Quantità venduta</label>
            <input id="sellQuantity" v-model.number="sellForm.quantity" type="number" step="0.0001" class="form-input" placeholder="Quantità" required />
          </div>
          <div class="form-field">
            <label class="form-label" for="sellPrice">Prezzo vendita</label>
            <input id="sellPrice" v-model.number="sellForm.price" type="number" step="0.01" class="form-input" placeholder="Prezzo" required />
          </div>
          <span v-if="sellError" class="helper-text error-text">{{ sellError }}</span>
          <div class="form-field form-inline" style="justify-content: flex-end; gap: 12px;">
            <button class="btn-tertiary" type="button" @click="closeSellModal">Annulla</button>
            <button class="btn-primary" type="submit">Conferma vendita</button>
          </div>
        </form>
      </div>
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
const sellModalOpen = ref(false)
const selectedSaleInvestment = ref<Investment | null>(null)
const sellError = ref('')

const form = reactive({
  ticker: '',
  isin: '',
  category: store.investmentCategories[0] || 'ETF',
  currency: store.supportedCurrencies[0] || 'EUR',
  note: '',
  manualPrice: null as number | null,
  initialLotQuantity: 0,
  initialLotDate: new Date().toISOString().slice(0, 10),
})

const sellForm = reactive({
  quantity: 0,
  price: 0,
  date: new Date().toISOString().slice(0, 10),
})

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

const openSellModal = (investment: Investment) => {
  selectedSaleInvestment.value = investment
  sellForm.quantity = 0
  sellForm.price = investment.lastPrice ?? 0
  sellForm.date = new Date().toISOString().slice(0, 10)
  sellError.value = ''
  sellModalOpen.value = true
}

const closeSellModal = () => {
  sellModalOpen.value = false
  selectedSaleInvestment.value = null
  sellError.value = ''
}

const submitInvestment = () => {
  if (!form.ticker.trim()) {
    return
  }

  const ticker = form.ticker.trim().toUpperCase()
  const price = form.manualPrice != null ? form.manualPrice : undefined
  const investment: Investment = {
    id: createId('investment'),
    ticker,
    isin: form.isin.trim() || undefined,
    category: form.category,
    currency: form.currency,
    note: form.note.trim() || undefined,
    lastPrice: price,
    lastPriceAt: price != null ? new Date().toISOString() : undefined,
  }

  store.addInvestment(investment)

  if (form.initialLotQuantity > 0 && price != null && form.initialLotDate) {
    const lot: InvestmentLot = {
      id: createId('investment-lot'),
      ticker,
      category: form.category,
      currency: form.currency,
      quantity: Number(form.initialLotQuantity),
      purchasePrice: Number(price),
      date: form.initialLotDate,
    }
    store.addInvestmentLot(lot)
  }

  form.ticker = ''
  form.isin = ''
  form.category = store.investmentCategories[0] || 'ETF'
  form.currency = store.supportedCurrencies[0] || 'EUR'
  form.note = ''
  form.manualPrice = null
  form.initialLotQuantity = 0
  form.initialLotDate = new Date().toISOString().slice(0, 10)
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

const removeLotQuantity = (ticker: string, quantity: number) => {
  let remaining = quantity
  const relevantLots = investmentLots.value
    .filter((lot) => lot.ticker.toUpperCase() === ticker.toUpperCase())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const lot of relevantLots) {
    if (remaining <= 0) {
      break
    }

    if (lot.quantity <= remaining) {
      remaining -= lot.quantity
      store.removeInvestmentLot(lot.id)
    } else {
      const updatedLot: InvestmentLot = {
        ...lot,
        quantity: Number((lot.quantity - remaining).toFixed(4)),
      }
      remaining = 0
      store.removeInvestmentLot(lot.id)
      store.addInvestmentLot(updatedLot)
    }
  }
}

const submitSellLots = () => {
  if (!selectedSaleInvestment.value) {
    return
  }

  if (sellForm.quantity <= 0 || sellForm.price <= 0) {
    sellError.value = 'Inserisci quantità e prezzo validi.'
    return
  }

  const total = totalQuantity(selectedSaleInvestment.value.ticker)
  if (sellForm.quantity > total) {
    sellError.value = 'La quantità venduta supera il totale disponibile.'
    return
  }

  removeLotQuantity(selectedSaleInvestment.value.ticker, sellForm.quantity)
  selectedSaleInvestment.value.lastPrice = sellForm.price
  selectedSaleInvestment.value.lastPriceAt = new Date().toISOString()
  closeSellModal()
}

const totalQuantity = (ticker: string) => {
  return investmentLots.value
    .filter((lot) => lot.ticker.toUpperCase() === ticker.toUpperCase())
    .reduce((sum, lot) => sum + lot.quantity, 0)
}

const averagePurchasePrice = (ticker: string) => {
  const lots = investmentLots.value.filter((lot) => lot.ticker.toUpperCase() === ticker.toUpperCase())
  const totalQty = lots.reduce((sum, lot) => sum + lot.quantity, 0)

  if (totalQty === 0) {
    return null
  }

  const totalCost = lots.reduce((sum, lot) => sum + lot.purchasePrice * lot.quantity, 0)
  return totalCost / totalQty
}

const formatQuantity = (value: number) => {
  return value.toFixed(4).replace('.', ',')
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
