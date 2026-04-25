<template>
  <section>
    <div class="card">
      <h3>Backup & Sync</h3>
      <p>Gestisci il salvataggio locale e la sincronizzazione cloud. Il login rimane persistente finché il token rimane valido.</p>

      <div class="form-grid" style="max-width: 520px; margin-top: 20px;">
        <div class="card card-secondary">
          <h4>Backup locale</h4>
          <div class="form-grid" style="margin-top: 12px;">
            <button class="btn-primary" type="button" @click="exportJson">Esporta JSON</button>
            <label class="form-field" style="margin: 0;">
              <span class="form-label">Importa JSON</span>
              <input class="form-input" type="file" accept="application/json" @change="importJson">
            </label>
          </div>
          <button class="btn-secondary" type="button" @click="clearAll">Cancella dati locali</button>
        </div>

        <div class="card card-secondary">
          <h4>Backup cloud</h4>
          <p class="helper-text" style="margin-top: 0;">Sincronizza con il provider selezionato nelle impostazioni.</p>
          <div class="form-grid" style="margin-top: 12px;">
            <div class="form-field">
              <label class="form-label">Cloud provider</label>
              <p>{{ cloudProviderLabel }}</p>
            </div>
            <div class="form-field">
              <label class="form-label">Dropbox App Key</label>
              <p>{{ store.cloudConfig?.appKey || 'Non impostata' }}</p>
            </div>
            <div class="form-field">
              <label class="form-label">Percorso backup</label>
              <p>{{ store.cloudConfig?.path || 'Nessun percorso impostato' }}</p>
            </div>
            <div class="form-field">
              <label class="form-label">Stato connessione</label>
              <p>{{ connectionStatus }}</p>
            </div>
          </div>
          <div class="form-grid" style="margin-top: 10px; gap: 8px;">
            <button class="btn-primary" type="button" @click="manualDownloadCloud" :disabled="!canUseCloud">Scarica dal cloud</button>
            <button class="btn-secondary" type="button" @click="manualUploadCloud" :disabled="!canUseCloud">Carica sul cloud</button>
            <button class="btn-tertiary" type="button" @click="checkConnection" :disabled="!canVerifyCloud">{{ verifyButtonLabel }}</button>
          </div>
          <p class="helper-text" style="margin-top: 8px;">Se non funziona, controlla App Key e Percorso in Impostazioni.</p>
        </div>
      </div>

      <p v-if="message" class="helper-text">{{ message }}</p>
      <p class="helper-text">Ultimo sync locale: {{ store.lastSync || 'mai' }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { exportDataBlob, parseImportedData } from '@/utils/persistence'

const store = useAppStore()
const message = ref('')
const connectionMessage = ref('')

const cloudProviderLabel = computed(() => (store.cloudProvider === 'dropbox' ? 'Dropbox' : 'Nessun cloud'))

const supportedCloudProvider = computed(() => store.cloudProvider === 'dropbox')
const canUseCloud = computed(() => store.cloudProvider === 'dropbox' && !!store.cloudConfig?.token && !!store.cloudConfig?.path)
const canVerifyCloud = computed(() => store.cloudProvider === 'dropbox' && !!store.cloudConfig?.appKey)
const verifyButtonLabel = computed(() => 'Verifica connessione Dropbox')
const connectionStatus = computed(() => {
  if (store.cloudProvider !== 'dropbox') {
    return 'Dropbox non connesso'
  }
  if (!store.cloudConfig?.appKey) {
    return 'App Key Dropbox non impostata'
  }
  if (!store.cloudConfig?.token) {
    return 'Token non impostato'
  }
  if (!store.cloudConfig?.path) {
    return 'Percorso backup non impostato'
  }
  return connectionMessage.value || `Configurazione ${cloudProviderLabel.value} pronta`
})

const exportJson = () => {
  const payload = {
    baseCurrency: store.baseCurrency,
    theme: store.theme,
    cloudProvider: store.cloudProvider,
    cloudConfig: store.cloudConfig,
    autoBackup: store.autoBackup,
    supportedCurrencies: store.supportedCurrencies,
    investmentCategories: store.investmentCategories,
    accounts: store.accounts,
    entries: store.entries,
    investments: store.investments,
    investmentLots: store.investmentLots,
    lastSync: new Date().toISOString(),
  }
  const blob = exportDataBlob(payload)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'pocketbloom-backup.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  message.value = 'Backup esportato con successo.'
}

const importJson = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) {
    return
  }

  try {
    const file = target.files[0]
    const data = await parseImportedData(file)
    await store.importData(data)
    message.value = 'Dati importati correttamente.'
  } catch (error) {
    console.error(error)
    message.value = 'Errore nell’importazione. Controlla il file JSON.'
  } finally {
    target.value = ''
  }
}

const clearAll = () => {
  store.clear()
  message.value = 'Dati locali cancellati. Ricarica la pagina per ripartire.'
}

const manualDownloadCloud = async () => {
  if (!canUseCloud.value) {
    message.value = `Configura ${cloudProviderLabel.value} in Impostazioni prima di scaricare.`
    return
  }

  try {
    const cloudData = await store.downloadCloudBackup()
    if (!cloudData) {
      message.value = 'Nessun backup cloud trovato sul percorso configurato.'
      return
    }

    await store.importData(cloudData)
    message.value = 'Dati scaricati dal cloud e importati con successo.'
  } catch (error) {
    console.error(error)
    message.value = 'Errore scaricando i dati dal cloud.'
  }
}

const manualUploadCloud = async () => {
  if (!canUseCloud.value) {
    message.value = `Configura ${cloudProviderLabel.value} in Impostazioni prima di caricare.`
    return
  }

  try {
    await store.uploadCloudBackup()
    message.value = 'Dati caricati sul cloud con successo.'
  } catch (error) {
    console.error(error)
    message.value = 'Errore caricando i dati sul cloud.'
  }
}

const checkConnection = async () => {
  if (store.cloudProvider === 'none') {
    message.value = 'Seleziona un provider cloud nelle impostazioni prima di verificare la connessione.'
    return
  }
  if (!canVerifyCloud.value) {
    message.value = `Imposta App Key Dropbox nelle Impostazioni prima di verificare la connessione.`
    return
  }

  try {
    const valid = await store.verifyCloudCredentials()
    if (valid) {
      connectionMessage.value = `Connessione ${cloudProviderLabel.value} valida.`
      message.value = `Token ${cloudProviderLabel.value} valido.`
    } else {
      connectionMessage.value = `Connessione ${cloudProviderLabel.value} non valida.`
      message.value = `Token ${cloudProviderLabel.value} non valido o scaduto. Riconnetti in Impostazioni.`
    }
  } catch (error) {
    console.error(error)
    connectionMessage.value = `Connessione ${cloudProviderLabel.value} non valida.`
    message.value = `Token ${cloudProviderLabel.value} non valido o scaduto.`
  }
}
</script>
