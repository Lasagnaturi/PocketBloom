import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import AccountsView from '@/views/AccountsView.vue'
import EntriesView from '@/views/EntriesView.vue'
import InvestmentsView from '@/views/InvestmentsView.vue'
import BackupView from '@/views/BackupView.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/conti', name: 'Conti', component: AccountsView },
  { path: '/entrate', name: 'Entrate', component: EntriesView },
  { path: '/investimenti', name: 'Investimenti', component: InvestmentsView },
  { path: '/backup', name: 'Backup', component: BackupView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
