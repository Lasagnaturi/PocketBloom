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

        <div v-if="settings.cloudProvider !== 'none'" class="form-field">
          <label class="form-label" for="cloudToken">Access Token</label>
          <input
            id="cloudToken"
            v-model="settings.cloudConfig.token"
            class="form-input"
            type="password"
            :placeholder="tokenPlaceholder"
          />
          <p class="helper-text">Inserisci un token di accesso per {{ providerName }}. Il login rimane persistente finché il token rimane valido.</p>
        </div>

        <div v-if="settings.cloudProvider !== 'none'" class="form-field">
          <label class="form-label" for="cloudRefreshToken">Refresh Token</label>
          <input
            id="cloudRefreshToken"
            v-model="settings.cloudConfig.refreshToken"
            class="form-input"
            type="password"
            placeholder="Inserisci il refresh token"
          />
          <p class="helper-text">Inserisci un refresh token per rinnovare automaticamente l'access token quando scade.</p>
        </div>

        <div v-if="settings.cloudProvider === 'google-drive' || settings.cloudProvider === 'one-drive'" class="form-field">
          <label class="form-label" for="cloudClientId">Client ID</label>
          <input
            id="cloudClientId"
            v-model="settings.cloudConfig.clientId"
            class="form-input"
            placeholder="Inserisci il client ID"
          />
          <p class="helper-text">Il client ID serve per rinnovare il token con Google Drive o OneDrive.</p>
        </div>

        <div v-if="settings.cloudProvider === 'google-drive' || settings.cloudProvider === 'one-drive'" class="form-field">
          <label class="form-label" for="cloudClientSecret">Client Secret</label>
          <input
            id="cloudClientSecret"
            v-model="settings.cloudConfig.clientSecret"
            class="form-input"
            type="password"
            placeholder="Inserisci il client secret (se richiesto)"
          />
          <p class="helper-text">Il client secret è necessario per alcune app Google/OneDrive. Lascia vuoto se non usi un client secret.</p>
        </div>

        <div v-if="settings.cloudProvider !== 'none'" class="form-field">
          <label class="form-label" for="cloudPath">Percorso backup</label>
          <input
            id="cloudPath"
            v-model="settings.cloudConfig.path"
            class="form-input"
            placeholder="/pocketbloom-backup.json"
          />
          <p class="helper-text">Il file verrà salvato in {{ providerName }} in questo percorso o con questo nome.</p>
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
      <p class="helper-text">Valuta base: {{ settings.baseCurrency }}. Backup cloud: {{ settings.cloudProvider === 'none' ? 'disabilitato' : providerName }}.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const currencyOptions = ['EUR', 'CHF']

const settings = reactive({
  baseCurrency: store.baseCurrency,
  cloudProvider: store.cloudProvider || 'none',
  cloudConfig: {
    token: store.cloudConfig?.token || '',
    refreshToken: store.cloudConfig?.refreshToken || '',
    clientId: store.cloudConfig?.clientId || '',
    clientSecret: store.cloudConfig?.clientSecret || '',
    path: store.cloudConfig?.path || '/pocketbloom-backup.json',
  },
  autoBackup: store.autoBackup,
  supportedCurrencies: [...store.supportedCurrencies] as string[],
  investmentCategories: [...store.investmentCategories] as string[],
})

const providerName = computed(() => {
  switch (settings.cloudProvider) {
    case 'dropbox':
      return 'Dropbox'
    case 'google-drive':
      return 'Google Drive'
    case 'one-drive':
      return 'OneDrive'
    default:
      return 'cloud'
  }
})

const tokenPlaceholder = computed(() => {
  switch (settings.cloudProvider) {
    case 'dropbox':
      return 'Inserisci il token Dropbox'
    case 'google-drive':
      return 'Inserisci il token Google Drive'
    case 'one-drive':
      return 'Inserisci il token OneDrive'
    default:
      return 'Inserisci il token'
  }
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
  store.cloudConfig = {
    token: settings.cloudConfig.token?.trim(),
    refreshToken: settings.cloudConfig.refreshToken?.trim(),
    clientId: settings.cloudConfig.clientId?.trim(),
    clientSecret: settings.cloudConfig.clientSecret?.trim(),
    path: settings.cloudConfig.path?.trim(),
  }
  store.autoBackup = settings.autoBackup
  store.supportedCurrencies = [...settings.supportedCurrencies]
  store.investmentCategories = [...settings.investmentCategories]
  store.save()
}
</script>
