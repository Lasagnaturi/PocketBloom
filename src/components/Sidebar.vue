<template>
  <aside
    class="sidebar"
    :class="{ collapsed: collapsed && !hovered, 'mobile-open': mobileOpen }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="sidebar-brand">
      <span class="brand-icon">🌸</span>
      <h1 v-if="!collapsed || hovered || isMobile">PocketBloom</h1>
      <button class="mobile-menu-toggle" type="button" @click="toggleMobileMenu" aria-label="Apri menu">
        ☰
      </button>
    </div>

    <nav>
      <ul class="nav-list">
        <li>
          <RouterLink to="/" @click="closeMobileMenu">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/conti" @click="closeMobileMenu">
            <span class="nav-icon">💼</span>
            <span class="nav-text">Conti</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/entrate" @click="closeMobileMenu">
            <span class="nav-icon">💰</span>
            <span class="nav-text">Entrate</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/investimenti" @click="closeMobileMenu">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Investimenti</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/backup" @click="closeMobileMenu">
            <span class="nav-icon">☁️</span>
            <span class="nav-text">Backup</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/impostazioni" @click="closeMobileMenu">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Impostazioni</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="sidebar-bottom">
      <button class="icon-btn theme-toggle" type="button" @click="toggleTheme" :title="themeTooltip">
        {{ themeIcon }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const collapsed = ref(true)
const hovered = ref(false)
const mobileOpen = ref(false)

const themeIcon = computed(() => (appStore.theme.mode === 'dark' ? '☀️' : '🌙'))
const themeTooltip = computed(() =>
  appStore.theme.mode === 'dark' ? 'Vai in modalità chiara' : 'Vai in modalità scura'
)

const toggleTheme = () => {
  appStore.toggleTheme()
}

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const updateMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 900px)').matches
}

const toggleMobileMenu = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobileMenu = () => {
  mobileOpen.value = false
}

onMounted(() => {
  updateMobile()
  mediaQuery = window.matchMedia('(max-width: 900px)')
  mediaQuery.addEventListener('change', updateMobile)
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateMobile)
  }
})
</script>
