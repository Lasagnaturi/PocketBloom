import type { Account, Entry, Investment, InvestmentLot, ThemeSettings, CloudConfig, CloudProvider } from '@/stores/app'

const STORAGE_KEY = 'pocketbloom-data'

export interface PocketBloomData {
  baseCurrency: string
  theme: ThemeSettings
  cloudProvider: CloudProvider
  cloudConfig: CloudConfig
  autoBackup: boolean
  supportedCurrencies: string[]
  investmentCategories: string[]
  accounts: Account[]
  entries: Entry[]
  investments: Investment[]
  investmentLots: InvestmentLot[]
  lastSync?: string
}

export function saveData(data: PocketBloomData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Unable to save PocketBloom data:', error)
  }
}

export function loadData(): PocketBloomData | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as PocketBloomData
  } catch (error) {
    console.warn('PocketBloom load failed:', error)
    return null
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportDataBlob(data: PocketBloomData) {
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

export function parseImportedData(file: File): Promise<PocketBloomData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as PocketBloomData
        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
