<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingStore } from '@/stores/settingStore'
import BottomNav from '@/components/BottomNav.vue'

const settingStore = useSettingStore()

onMounted(async () => {
  await settingStore.initSettings()
  // 应用主题
  document.documentElement.setAttribute('data-theme', settingStore.userSetting.theme)
})
</script>

<template>
  <div class="app-container">
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background-color: var(--color-bg-primary);
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
