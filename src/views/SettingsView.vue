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
          <label class="form-label" for="dropboxAppKey">Dropbox App Key</label>
          <input
            id="dropboxAppKey"
            v-model="settings.cloudConfig.appKey"
            class="form-input"
            placeholder="Inserisci la App Key Dropbox"
          />
          <p class="helper-text">La App Key serve per avviare il login OAuth con Dropbox. Non devi inserire manualmente un access token.</p>
        </div>

        <div class="form-field" style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn-primary" type="button" @click="connectDropbox">Connetti a Dropbox</button>
          <button class="btn-secondary" type="button" @click="disconnectDropbox" v-if="isConnected">Disconnetti Dropbox</button>
        </div>

        <div class="form-field">
          <label class="form-label" for="cloudPath">Percorso backup</label>
          <input
            id="cloudPath"
            v-model="settings.cloudConfig.path"
            class="form-input"
            placeholder="/pocketbloom-backup.json"
          />
          <p class="helper-text">Il file verrà salvato su Dropbox con questo nome o percorso.</p>
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

      <p class="helper-text">Valuta base: {{ settings.baseCurrency }}. Stato Dropbox: {{ connectionStatus }}.</p>
      <p class="helper-text">Una volta connesso, PocketBloom gestirà automaticamente l'access token e lo rinnoverà con il refresh token.</p>
      <p v-if="message" class="helper-text">{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const currencyOptions = ['EUR', 'CHF']
const message = ref('')

const settings = reactive({
  baseCurrency: store.baseCurrency,
  cloudConfig: {
    appKey: store.cloudConfig?.appKey || '',
    token: store.cloudConfig?.token || '',
    refreshToken: store.cloudConfig?.refreshToken || '',
    path: store.cloudConfig?.path || '/pocketbloom-backup.json',
  },
  autoBackup: store.autoBackup,
  supportedCurrencies: [...store.supportedCurrencies] as string[],
  investmentCategories: [...store.investmentCategories] as string[],
})

const newCategory = ref('')

const isConnected = computed(() => store.cloudProvider === 'dropbox' && !!store.cloudConfig?.token)
const connectionStatus = computed(() => {
  if (store.cloudProvider !== 'dropbox') {
    return 'Non connesso'
  }
  if (!store.cloudConfig?.token) {
    return 'Token Dropbox non impostato'
  }
  return 'Connesso a Dropbox'
})

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
  store.cloudConfig = {
    appKey: settings.cloudConfig.appKey?.trim(),
    token: store.cloudConfig?.token,
    refreshToken: store.cloudConfig?.refreshToken,
    path: settings.cloudConfig.path?.trim(),
  }
  store.autoBackup = settings.autoBackup
  store.supportedCurrencies = [...settings.supportedCurrencies]
  store.investmentCategories = [...settings.investmentCategories]
  store.save()
}

const connectDropbox = async () => {
  try {
    saveSettings()
    const authUrl = await store.initiateDropboxAuth()
    window.location.href = authUrl
  } catch (error) {
    console.error(error)
    message.value = 'Impossibile avviare la connessione a Dropbox. Controlla la App Key.'
  }
}

const disconnectDropbox = () => {
  store.disconnectDropbox()
  message.value = 'Dropbox disconnesso.'
}

onMounted(async () => {
  if (route.query.code && route.query.state) {
    try {
      saveSettings()
      const code = route.query.code as string
      const state = route.query.state as string
      await store.completeDropboxAuth(code, state)
      message.value = 'Dropbox connesso con successo.'
      router.replace({ path: '/impostazioni', query: {} })
    } catch (error) {
      console.error(error)
      message.value = 'Connessione Dropbox fallita. Riprova.'
    }
  }
})
</script>
