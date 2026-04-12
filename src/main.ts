import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAppStore } from '@/stores/app'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const appStore = useAppStore()
appStore.init().then(() => {
  watch(
    () => appStore.theme.mode,
    (mode) => {
      document.documentElement.dataset.theme = mode
    },
    { immediate: true }
  )

  app.mount('#app')
})
