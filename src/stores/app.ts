import { defineStore } from 'pinia'

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

export interface ThemeSettings {
  mode: 'light' | 'dark'
}

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: { mode: 'light' } as ThemeSettings,
    baseCurrency: 'EUR',
    accounts: [] as Account[],
    entries: [] as Entry[],
  }),
  getters: {
    totalBalance: (state) => state.accounts.reduce((sum, account) => sum + account.balance, 0),
    accountCount: (state) => state.accounts.length,
  },
  actions: {
    toggleTheme() {
      this.theme.mode = this.theme.mode === 'light' ? 'dark' : 'light'
    },
    addAccount(account: Account) {
      this.accounts.push(account)
    },
    addEntry(entry: Entry) {
      this.entries.push(entry)
    },
  },
})
