<template>
  <div class="app-shell">
    <Sidebar />
    <div class="app-content">
      <TopBar />
      <main class="page-container">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
</script>
