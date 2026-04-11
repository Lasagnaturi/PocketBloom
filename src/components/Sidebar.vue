<template>
  <aside class="sidebar">
    <h1>PocketBloom</h1>
    <nav>
      <ul class="nav-list">
        <li><RouterLink to="/">Dashboard</RouterLink></li>
        <li><RouterLink to="/conti">Conti</RouterLink></li>
        <li><RouterLink to="/entrate">Entrate</RouterLink></li>
        <li><RouterLink to="/investimenti">Investimenti</RouterLink></li>
        <li><RouterLink to="/backup">Backup</RouterLink></li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({
  name: 'AppSidebar',
})
</script>
