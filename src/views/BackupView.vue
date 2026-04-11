<template>
  <section>
    <div class="card">
      <h3>Backup & Sync</h3>
      <p>Esporta il tuo profilo in un file JSON e importalo quando vuoi su un altro dispositivo.</p>
      <div class="form-grid" style="max-width: 520px; margin-top: 20px;">
        <button class="btn-primary" type="button" @click="exportJson">Esporta JSON</button>
        <label class="form-field">
          <span class="form-label">Importa JSON</span>
          <input class="form-input" type="file" accept="application/json" @change="importJson">
        </label>
        <button class="btn-secondary" type="button" @click="clearAll">Cancella dati locali</button>
      </div>
      <p v-if="message" class="helper-text">{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { exportDataBlob, parseImportedData } from '@/utils/persistence'

const store = useAppStore()
const message = ref('')

const exportJson = () => {
  const payload = {
    baseCurrency: store.baseCurrency,
    theme: store.theme,
    accounts: store.accounts,
    entries: store.entries,
    investments: store.investments,
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
    store.importData(data)
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
</script>
