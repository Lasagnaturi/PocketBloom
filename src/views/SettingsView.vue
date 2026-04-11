<template>
  <section>
    <div class="card">
      <h3>Impostazioni</h3>
      <form class="form-grid" @submit.prevent="saveSettings">
        <div class="form-field">
          <label class="form-label" for="baseCurrency">Valuta base</label>
          <select id="baseCurrency" v-model="settings.baseCurrency" class="form-select">
            <option v-for="currency in currencyOptions" :key="currency" :value="currency">{{ currency }}</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="cloudProvider">Provider backup cloud</label>
          <select id="cloudProvider" v-model="settings.cloudProvider" class="form-select">
            <option value="none">Nessuno</option>
            <option value="google-drive">Google Drive</option>
            <option value="dropbox">Dropbox</option>
            <option value="one-drive">OneDrive</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="autoBackup">Backup automatico</label>
          <select id="autoBackup" v-model="settings.autoBackup" class="form-select">
            <option :value="false">No</option>
            <option :value="true">Sì</option>
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="defaultCurrencies">Valute disponibili</label>
          <div class="form-field">
            <label><input v-model="settings.supportedCurrencies" type="checkbox" value="EUR"> EUR</label>
            <label><input v-model="settings.supportedCurrencies" type="checkbox" value="CHF"> CHF</label>
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">Categorie investimenti</label>
          <div class="category-list">
            <span v-for="(category, index) in settings.investmentCategories" :key="category" class="category-chip">
              {{ category }}
              <button type="button" class="btn-tertiary btn-small" @click="removeCategory(index)">x</button>
            </span>
          </div>
          <div class="category-add">
            <input v-model="newCategory" class="form-input" placeholder="Nuova categoria" />
            <button class="btn-secondary" type="button" @click="addCategory">Aggiungi</button>
          </div>
        </div>

        <div class="form-field" style="align-self: end;">
          <button class="btn-primary" type="submit">Salva impostazioni</button>
        </div>
      </form>
      <p class="helper-text">Valuta base: {{ settings.baseCurrency }}. Backup cloud: {{ settings.cloudProvider === 'none' ? 'disabilitato' : settings.cloudProvider }}.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const currencyOptions = ['EUR', 'CHF']

const settings = reactive({
  baseCurrency: store.baseCurrency,
  cloudProvider: store.cloudProvider || 'none',
  autoBackup: store.autoBackup,
  supportedCurrencies: [...store.supportedCurrencies] as string[],
  investmentCategories: [...store.investmentCategories] as string[],
})

const newCategory = ref('')

const addCategory = () => {
  const name = newCategory.value.trim()
  if (name && !settings.investmentCategories.includes(name)) {
    settings.investmentCategories.push(name)
    newCategory.value = ''
  }
}

const removeCategory = (index: number) => {
  settings.investmentCategories.splice(index, 1)
}

const saveSettings = () => {
  store.baseCurrency = settings.baseCurrency
  store.cloudProvider = settings.cloudProvider
  store.autoBackup = settings.autoBackup
  store.supportedCurrencies = [...settings.supportedCurrencies]
  store.investmentCategories = [...settings.investmentCategories]
  store.save()
}
</script>
