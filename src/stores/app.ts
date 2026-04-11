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
  name: string
  category: string
  currency: string
  value: number
  performance: number
}

export interface ThemeSettings {
  mode: 'light' | 'dark'
}

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: { mode: 'light' } as ThemeSettings,
    baseCurrency: 'EUR',
    accounts: [] as Account[],
    entries: [] as Entry[],
    investments: [] as Investment[],
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
        this.accounts = persisted.accounts
        this.entries = persisted.entries
        this.investments = persisted.investments
        this.lastSync = persisted.lastSync ?? ''
      }
    },
    save() {
      const payload: PocketBloomData = {
        baseCurrency: this.baseCurrency,
        theme: this.theme,
        accounts: this.accounts,
        entries: this.entries,
        investments: this.investments,
      }
      saveData(payload)
    },
    clear() {
      clearData()
      this.accounts = []
      this.entries = []
      this.investments = []
      this.baseCurrency = 'EUR'
      this.lastSync = ''
    },
    toggleTheme() {
      this.theme.mode = this.theme.mode === 'light' ? 'dark' : 'light'
      this.save()
    },
    addAccount(account: Account) {
      this.accounts.push(account)
      this.save()
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
    addInvestment(investment: Investment) {
      this.investments.push(investment)
      this.save()
    },
    removeInvestment(investmentId: string) {
      this.investments = this.investments.filter((item) => item.id !== investmentId)
      this.save()
    },
    importData(data: PocketBloomData) {
      this.baseCurrency = data.baseCurrency
      this.theme = data.theme
      this.accounts = data.accounts
      this.entries = data.entries
      this.investments = data.investments
      this.save()
    },
  },
})
