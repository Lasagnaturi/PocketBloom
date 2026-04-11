<template>
  <aside
    class="sidebar"
    :class="{ collapsed: collapsed && !hovered }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="sidebar-brand">
      <span class="brand-icon">🌸</span>
      <h1 v-if="!collapsed || hovered">PocketBloom</h1>
    </div>

    <nav>
      <ul class="nav-list">
        <li>
          <RouterLink to="/">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/conti">
            <span class="nav-icon">💼</span>
            <span class="nav-text">Conti</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/entrate">
            <span class="nav-icon">💰</span>
            <span class="nav-text">Entrate</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/investimenti">
            <span class="nav-icon">📈</span>
            <span class="nav-text">Investimenti</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/backup">
            <span class="nav-icon">☁️</span>
            <span class="nav-text">Backup</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/impostazioni">
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
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const collapsed = ref(true)
const hovered = ref(false)

const themeIcon = computed(() => (appStore.theme.mode === 'dark' ? '☀️' : '🌙'))
const themeTooltip = computed(() =>
  appStore.theme.mode === 'dark' ? 'Vai in modalità chiara' : 'Vai in modalità scura'
)

const toggleTheme = () => {
  appStore.toggleTheme()
}
</script>
