import { defineStore } from 'pinia'
import { saveData, loadData, clearData } from '@/utils/persistence'
import {
  downloadDropboxBackup,
  uploadDropboxBackup,
  verifyDropboxToken,
  downloadGoogleDriveBackup,
  uploadGoogleDriveBackup,
  verifyGoogleDriveToken,
  downloadOneDriveBackup,
  uploadOneDriveBackup,
  verifyOneDriveToken,
  getGoogleDriveAccessToken,
  getOneDriveAccessToken,
} from '@/services/cloud'
import type { PocketBloomData } from '@/utils/persistence'

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

export type CloudProvider = 'none' | 'google-drive' | 'dropbox' | 'one-drive'

export interface CloudConfig {
  token?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  path?: string
}

const isCloudProvider = (value: unknown): value is CloudProvider =>
  value === 'none' || value === 'google-drive' || value === 'dropbox' || value === 'one-drive'

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
        this.accounts = persisted.accounts.map((account) => ({ ...account, closed: account.closed ?? false }))
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
    async ensureCloudToken() {
      if (this.cloudProvider === 'dropbox' || this.cloudProvider === 'none') {
        return
      }

      const { token, refreshToken, clientId, clientSecret } = this.cloudConfig
      if (!token && !refreshToken) {
        return
      }

      if (this.cloudProvider === 'google-drive') {
        const result = await getGoogleDriveAccessToken({ token, refreshToken, clientId, clientSecret })
        if (result.token !== token || result.refreshToken !== refreshToken) {
          this.cloudConfig.token = result.token
          if (result.refreshToken) {
            this.cloudConfig.refreshToken = result.refreshToken
          }
          saveData(this.getCloudPayload())
        }
      } else if (this.cloudProvider === 'one-drive') {
        const result = await getOneDriveAccessToken({ token, refreshToken, clientId, clientSecret })
        if (result.token !== token || result.refreshToken !== refreshToken) {
          this.cloudConfig.token = result.token
          if (result.refreshToken) {
            this.cloudConfig.refreshToken = result.refreshToken
          }
          saveData(this.getCloudPayload())
        }
      }
    },
    async uploadCloudBackup() {
      await this.ensureCloudToken()
      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path) {
        throw new Error('Token e percorso richiesti per il backup cloud.')
      }

      const payload = this.getCloudPayload()
      const content = JSON.stringify(payload)

      if (this.cloudProvider === 'dropbox') {
        await uploadDropboxBackup(token, path, content)
      } else if (this.cloudProvider === 'google-drive') {
        await uploadGoogleDriveBackup(token, path, content)
      } else if (this.cloudProvider === 'one-drive') {
        await uploadOneDriveBackup(token, path, content)
      }
    },
    async downloadCloudBackup(): Promise<PocketBloomData | null> {
      await this.ensureCloudToken()
      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path) {
        return null
      }

      let content = ''
      if (this.cloudProvider === 'dropbox') {
        content = await downloadDropboxBackup(token, path)
      } else if (this.cloudProvider === 'google-drive') {
        content = await downloadGoogleDriveBackup(token, path)
      } else if (this.cloudProvider === 'one-drive') {
        content = await downloadOneDriveBackup(token, path)
      }

      if (!content) {
        return null
      }

      return JSON.parse(content) as PocketBloomData
    },
    async verifyCloudCredentials(): Promise<boolean> {
      await this.ensureCloudToken()
      const token = this.cloudConfig?.token
      if (!token) {
        return false
      }

      if (this.cloudProvider === 'dropbox') {
        await verifyDropboxToken(token)
      } else if (this.cloudProvider === 'google-drive') {
        await verifyGoogleDriveToken(token)
      } else if (this.cloudProvider === 'one-drive') {
        await verifyOneDriveToken(token)
      }

      return true
    },
    async syncCloudOnStartup() {
      const token = this.cloudConfig?.token
      const path = this.cloudConfig?.path
      if (!token || !path || this.cloudProvider === 'none') {
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

      if (this.autoBackup && this.cloudProvider !== 'none') {
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
        openedAt: account.openedAt ?? now,
        closedAt: account.closed ? now : account.closedAt,
      })
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
      this.accounts = data.accounts.map((account) => ({ ...account, closed: account.closed ?? false }))
      this.entries = data.entries
      this.investments = data.investments
      this.investmentLots = data.investmentLots ?? []
      await this.save()
    },
  },
})
