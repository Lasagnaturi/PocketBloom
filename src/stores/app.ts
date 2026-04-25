import { defineStore } from 'pinia'
import { saveData, loadData, clearData } from '@/utils/persistence'
import {
  createDropboxAuthUrl,
  exchangeDropboxAuthorizationCode,
  refreshDropboxAccessToken,
  downloadDropboxBackup,
  uploadDropboxBackup,
  verifyDropboxToken,
} from '@/services/cloud'
import type { PocketBloomData } from '@/utils/persistence'

let cloudTokenValidationPromise: Promise<boolean> | null = null
let cloudTokenValidatedFor: string | null = null
let cloudTokenValidatedAt = 0

export interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  note?: string
  closed?: boolean
  openedAt?: string
  closedAt?: string
}

export interface Entry {
  id: string
  label: string
  category: string
  amount: number
  currency: string
  date: string
  frequency: 'una tantum' | 'ricorrente'
}

export interface Investment {
  id: string
  ticker: string
  isin?: string
  category: string
  currency: string
  note?: string
  lastPrice?: number
  lastPriceAt?: string
}

export interface InvestmentLot {
  id: string
  ticker: string
  category: string
  currency: string
  quantity: number
  purchasePrice: number
  date: string
}

export interface ThemeSettings {
  mode: 'light' | 'dark'
}

export type CloudProvider = 'none' | 'dropbox'

export interface CloudConfig {
  appKey?: string
  token?: string
  refreshToken?: string
  path?: string
}

const isCloudProvider = (value: unknown): value is CloudProvider =>
  value === 'none' || value === 'dropbox'

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: { mode: 'light' } as ThemeSettings,
    baseCurrency: 'EUR',
    cloudProvider: 'none' as CloudProvider,
    cloudConfig: {} as CloudConfig,
    autoBackup: false,
    supportedCurrencies: ['EUR', 'CHF'] as string[],
    investmentCategories: ['ETF', 'Crypto'] as string[],
    accounts: [] as Account[],
    entries: [] as Entry[],
    investments: [] as Investment[],
    investmentLots: [] as InvestmentLot[],
    lastSync: '' as string,
  }),
  getters: {
    totalBalance: (state) => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    accountCount: (state) => state.accounts.length,
    entryCount: (state) => state.entries.length,
    investmentCount: (state) => state.investments.length,
    recentAccounts: (state) => [...state.accounts].slice(-3).reverse(),
    recentEntries: (state) => [...state.entries].slice(-3).reverse(),
    netWorth: (state) => state.accounts.reduce((sum, account) => sum + account.balance, 0),
  },
  actions: {
    async init() {
      const persisted = loadData()
      if (persisted) {
        this.baseCurrency = persisted.baseCurrency
        this.theme = persisted.theme
        this.cloudProvider = isCloudProvider(persisted.cloudProvider) ? persisted.cloudProvider : 'none'
        this.cloudConfig = persisted.cloudConfig ?? {}
        this.autoBackup = persisted.autoBackup ?? false
        this.supportedCurrencies = persisted.supportedCurrencies ?? ['EUR', 'CHF']
        this.investmentCategories = persisted.investmentCategories ?? ['ETF', 'Crypto']
        this.accounts = persisted.accounts.map((account) => ({
          ...account,
          type: account.type || 'Liquidity',
          closed: account.closed ?? false,
        }))
        this.entries = persisted.entries
        this.investments = persisted.investments
        this.investmentLots = persisted.investmentLots ?? []
        this.lastSync = persisted.lastSync ?? ''
      }

      await this.syncCloudOnStartup()
    },
    getCloudPayload(): PocketBloomData {
      return {
        baseCurrency: this.baseCurrency,
        theme: this.theme,
        cloudProvider: this.cloudProvider,
        cloudConfig: this.cloudConfig,
        autoBackup: this.autoBackup,
        supportedCurrencies: this.supportedCurrencies,
        investmentCategories: this.investmentCategories,
        accounts: this.accounts,
        entries: this.entries,
        investments: this.investments,
        investmentLots: this.investmentLots,
        lastSync: new Date().toISOString(),
      }
    },
    async ensureCloudToken(): Promise<boolean> {
      if (this.cloudProvider !== 'dropbox') {
        return false
      }

      const { token, refreshToken, appKey } = this.cloudConfig
      if (!token && !refreshToken) {
        return false
      }

      if (token && token === cloudTokenValidatedFor && Date.now() - cloudTokenValidatedAt < 60_000) {
        return true
      }

      if (cloudTokenValidationPromise) {
        return cloudTokenValidationPromise
      }

      cloudTokenValidationPromise = (async () => {
        try {
          if (token) {
            const validToken = await verifyDropboxToken(token)
            if (validToken) {
              cloudTokenValidatedFor = token
              cloudTokenValidatedAt = Date.now()
              return true
            }

            console.warn('Dropbox token invalid or expired')
            this.cloudConfig.token = undefined
          }

          if (!refreshToken || !appKey) {
            console.warn('Dropbox refresh token or app key missing.')
            return false
          }

          try {
            const result = await refreshDropboxAccessToken(appKey, refreshToken)
            this.cloudConfig.token = result.accessToken
            if (result.refreshToken) {
              this.cloudConfig.refreshToken = result.refreshToken
            }
            cloudTokenValidatedFor = result.accessToken
            cloudTokenValidatedAt = Date.now()
            saveData(this.getCloudPayload())
            return true
          } catch (error) {
            console.warn('Dropbox refresh token failed:', error)
            return false
          }
        } finally {
          cloudTokenValidationPromise = null
        }
      })()

      return cloudTokenValidationPromise
    },
    async initiateDropboxAuth(): Promise<string> {
      const appKey = this.cloudConfig?.appKey
      if (!appKey) {
        throw new Error('Inserisci l\'App Key Dropbox prima di connettere l\'account.')
      }

      const redirectUri = `${window.location.origin}/impostazioni`
      return await createDropboxAuthUrl(appKey, redirectUri)
    },
    async completeDropboxAuth(code: string, state: string) {
      const appKey = this.cloudConfig?.appKey
      if (!appKey) {
        throw new Error('App Key Dropbox mancante.')
      }

      const redirectUri = `${window.location.origin}/impostazioni`
      const result = await exchangeDropboxAuthorizationCode(appKey, code, redirectUri, state)
      this.cloudConfig.token = result.accessToken
      this.cloudConfig.refreshToken = result.refreshToken
      this.cloudProvider = 'dropbox'
      saveData(this.getCloudPayload())
    },
    disconnectDropbox() {
      this.cloudProvider = 'none'
      this.cloudConfig = {}
      saveData(this.getCloudPayload())
    },
    async uploadCloudBackup() {
      const valid = await this.ensureCloudToken()
      if (!valid) {
        throw new Error('Dropbox non autenticato. Controlla le credenziali o riconnettiti.')
      }

      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path) {
        throw new Error('Token e percorso richiesti per il backup Dropbox.')
      }

      const payload = this.getCloudPayload()
      const content = JSON.stringify(payload)

      await uploadDropboxBackup(token, path, content)
    },
    async downloadCloudBackup(): Promise<PocketBloomData | null> {
      const valid = await this.ensureCloudToken()
      if (!valid) {
        return null
      }

      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path) {
        return null
      }

      const content = await downloadDropboxBackup(token, path)
      if (!content) {
        return null
      }

      return JSON.parse(content) as PocketBloomData
    },
    async verifyCloudCredentials(): Promise<boolean> {
      return await this.ensureCloudToken()
    },
    async syncCloudOnStartup() {
      if (this.cloudProvider !== 'dropbox') {
        return
      }

      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path) {
        return
      }

      try {
        const cloudData = await this.downloadCloudBackup()
        if (!cloudData) {
          return
        }

        const localData = loadData()
        const cloudTimestamp = cloudData.lastSync ? new Date(cloudData.lastSync).getTime() : 0
        const localTimestamp = localData?.lastSync ? new Date(localData.lastSync).getTime() : 0

        if (!localData || cloudTimestamp > localTimestamp) {
          await this.importData(cloudData)
        } else if (this.autoBackup && localTimestamp > cloudTimestamp) {
          await this.uploadCloudBackup()
        }
      } catch (error) {
        console.warn('Cloud sync startup failed:', error)
      }
    },
    async save() {
      const payload: PocketBloomData = {
        baseCurrency: this.baseCurrency,
        theme: this.theme,
        cloudProvider: this.cloudProvider,
        cloudConfig: this.cloudConfig,
        autoBackup: this.autoBackup,
        supportedCurrencies: this.supportedCurrencies,
        investmentCategories: this.investmentCategories,
        accounts: this.accounts,
        entries: this.entries,
        investments: this.investments,
        investmentLots: this.investmentLots,
        lastSync: new Date().toISOString(),
      }
      saveData(payload)

      if (this.autoBackup && this.cloudProvider === 'dropbox') {
        void this.uploadCloudBackup().catch((error) => {
          console.warn('Cloud backup failed:', error)
        })
      }
    },
    clear() {
      clearData()
      this.accounts = []
      this.entries = []
      this.investments = []
      this.investmentLots = []
      this.baseCurrency = 'EUR'
      this.cloudProvider = 'none'
      this.cloudConfig = {}
      this.autoBackup = false
      this.supportedCurrencies = ['EUR', 'CHF']
      this.investmentCategories = ['ETF', 'Crypto']
      this.lastSync = ''
    },
    toggleTheme() {
      this.theme.mode = this.theme.mode === 'light' ? 'dark' : 'light'
      this.save()
    },
    addInvestment(investment: Investment) {
      this.investments.push(investment)
      this.save()
    },
    removeInvestment(investmentId: string) {
      this.investments = this.investments.filter((item) => item.id !== investmentId)
      this.save()
    },
    addInvestmentLot(lot: InvestmentLot) {
      this.investmentLots.push(lot)
      this.save()
    },
    removeInvestmentLot(lotId: string) {
      this.investmentLots = this.investmentLots.filter((lot) => lot.id !== lotId)
      this.save()
    },
    addAccount(account: Account) {
      const now = new Date().toISOString()
      this.accounts.push({
        ...account,
        type: account.type || 'Liquidity',
        openedAt: account.openedAt ?? now,
        closedAt: account.closed ? now : account.closedAt,
      })
      this.save()
    },
    updateAccount(account: Account) {
      const index = this.accounts.findIndex((item) => item.id === account.id)
      if (index === -1) {
        return
      }

      const existing = this.accounts[index]
      const now = new Date().toISOString()
      const closedAt = existing.closed
        ? account.closed
          ? existing.closedAt ?? now
          : undefined
        : account.closed
        ? account.closedAt ?? now
        : undefined

      this.accounts[index] = {
        ...existing,
        ...account,
        type: account.type || existing.type || 'Liquidity',
        openedAt: existing.openedAt ?? account.openedAt ?? now,
        closedAt,
      }
      this.save()
    },
    updateAccountBalance(accountId: string, balance: number) {
      const index = this.accounts.findIndex((account) => account.id === accountId)
      if (index !== -1) {
        this.accounts[index].balance = balance
        this.save()
      }
    },
    toggleAccountStatus(accountId: string) {
      const index = this.accounts.findIndex((account) => account.id === accountId)
      if (index !== -1) {
        const closed = !this.accounts[index].closed
        this.accounts[index].closed = closed
        this.accounts[index].closedAt = closed ? new Date().toISOString() : undefined
        this.save()
      }
    },
    removeAccount(accountId: string) {
      this.accounts = this.accounts.filter((account) => account.id !== accountId)
      this.save()
    },
    addEntry(entry: Entry) {
      this.entries.push(entry)
      this.save()
    },
    removeEntry(entryId: string) {
      this.entries = this.entries.filter((entry) => entry.id !== entryId)
      this.save()
    },
    async importData(data: PocketBloomData) {
      this.baseCurrency = data.baseCurrency
      this.theme = data.theme
      this.cloudProvider = isCloudProvider(data.cloudProvider) ? data.cloudProvider : 'none'
      this.cloudConfig = data.cloudConfig ?? {}
      this.autoBackup = data.autoBackup ?? false
      this.supportedCurrencies = data.supportedCurrencies ?? ['EUR', 'CHF']
      this.investmentCategories = data.investmentCategories ?? ['ETF', 'Crypto']
      this.accounts = data.accounts.map((account) => ({
        ...account,
        type: account.type || 'Liquidity',
        closed: account.closed ?? false,
      }))
      this.entries = data.entries
      this.investments = data.investments
      this.investmentLots = data.investmentLots ?? []
      await this.save()
    },
  },
})
