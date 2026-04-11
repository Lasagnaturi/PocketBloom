import { defineStore } from 'pinia';
export const useAppStore = defineStore('app', {
    state: () => ({
        theme: { mode: 'light' },
        baseCurrency: 'EUR',
        accounts: [],
        entries: [],
    }),
    getters: {
        totalBalance: (state) => state.accounts.reduce((sum, account) => sum + account.balance, 0),
        accountCount: (state) => state.accounts.length,
    },
    actions: {
        toggleTheme() {
            this.theme.mode = this.theme.mode === 'light' ? 'dark' : 'light';
        },
        addAccount(account) {
            this.accounts.push(account);
        },
        addEntry(entry) {
            this.entries.push(entry);
        },
    },
});
//# sourceMappingURL=app.js.map