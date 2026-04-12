import { ref } from 'vue'

export function useStock() {
  const prices = ref<Record<string, number | null>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const apiBase = import.meta.env.VITE_YAHOO_PROXY_URL || '/api/yahoo'

  async function fetchPrices(tickers: string[]) {
    const normalized = tickers
      .map((ticker) => ticker.trim().toUpperCase())
      .filter((ticker) => ticker.length > 0)

    if (!normalized.length) {
      prices.value = {}
      return
    }

    loading.value = true
    error.value = null

    try {
      const nextPrices: Record<string, number | null> = {}

      await Promise.all(
        normalized.map(async (ticker) => {
          try {
            const url = `${apiBase}?ticker=${encodeURIComponent(ticker)}`
            const response = await fetch(url)
            if (!response.ok) {
              const message = response.status === 403
                ? 'Accesso negato: proxy Yahoo non valido o limite superato.'
                : `Errore proxy Yahoo: ${response.status}`
              throw new Error(message)
            }

            const data = await response.json()
            const price = typeof data?.price === 'number' ? data.price : null

            if (price == null || Number.isNaN(price)) {
              throw new Error('Dati non disponibili per il ticker')
            }

            nextPrices[ticker] = price
          } catch (fetchError: any) {
            nextPrices[ticker] = null
            error.value = fetchError?.message || 'Errore durante il recupero del prezzo.'
          }
        })
      )

      prices.value = nextPrices
    } catch (err: any) {
      if (!error.value) {
        error.value = err?.message || 'Impossibile aggiornare i prezzi dal proxy Yahoo.'
      }
    } finally {
      loading.value = false
    }
  }

  return {
    prices,
    loading,
    error,
    fetchPrices,
  }
}
