<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingStore } from '@/stores/settingStore'
import { useUpdateStore } from '@/stores/updateStore'
import { App } from '@capacitor/app'
import BottomNav from '@/components/BottomNav.vue'

const settingStore = useSettingStore()
const updateStore = useUpdateStore()

onMounted(async () => {
  await settingStore.initSettings()
  // 应用主题
  document.documentElement.setAttribute('data-theme', settingStore.userSetting.theme)

  // 静默检查版本更新（24小时频率限制）
  try {
    const info = await App.getInfo()
    updateStore.setCurrentVersion(info.version || '')
    await updateStore.loadState()
    await updateStore.checkUpdate(true)
  } catch {
    // 静默失败
  }
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
