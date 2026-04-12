import { defineStore } from 'pinia'
import { saveData, loadData, clearData } from '@/utils/persistence'
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

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: { mode: 'light' } as ThemeSettings,
    baseCurrency: 'EUR',
    cloudProvider: 'none',
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
    init() {
      const persisted = loadData()
      if (persisted) {
        this.baseCurrency = persisted.baseCurrency
        this.theme = persisted.theme
        this.cloudProvider = persisted.cloudProvider ?? 'none'
        this.autoBackup = persisted.autoBackup ?? false
        this.supportedCurrencies = persisted.supportedCurrencies ?? ['EUR', 'CHF']
        this.investmentCategories = persisted.investmentCategories ?? ['ETF', 'Crypto']
        this.accounts = persisted.accounts.map((account) => ({ ...account, closed: account.closed ?? false }))
        this.entries = persisted.entries
        this.investments = persisted.investments
        this.investmentLots = persisted.investmentLots ?? []
        this.lastSync = persisted.lastSync ?? ''
      }
    },
    save() {
      const payload: PocketBloomData = {
        baseCurrency: this.baseCurrency,
        theme: this.theme,
        cloudProvider: this.cloudProvider,
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
    },
    clear() {
      clearData()
      this.accounts = []
      this.entries = []
      this.investments = []
      this.investmentLots = []
      this.baseCurrency = 'EUR'
      this.cloudProvider = 'none'
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
    importData(data: PocketBloomData) {
      this.baseCurrency = data.baseCurrency
      this.theme = data.theme
      this.cloudProvider = data.cloudProvider ?? 'none'
      this.autoBackup = data.autoBackup ?? false
      this.supportedCurrencies = data.supportedCurrencies ?? ['EUR', 'CHF']
      this.investmentCategories = data.investmentCategories ?? ['ETF', 'Crypto']
      this.accounts = data.accounts.map((account) => ({ ...account, closed: account.closed ?? false }))
      this.entries = data.entries
      this.investments = data.investments
      this.investmentLots = data.investmentLots ?? []
      this.save()
    },
  },
})
