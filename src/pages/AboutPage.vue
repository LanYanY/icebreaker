<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { App } from '@capacitor/app'

const appVersion = ref('1.0.0')

onMounted(async () => {
  try {
    const info = await App.getInfo()
    appVersion.value = info.version || '1.0.0'
  } catch {
    // web fallback
    appVersion.value = '1.0.0'
  }
})
</script>

<template>
  <div class="about-page">
    <header class="page-header">
      <h1 class="page-title">关于</h1>
    </header>

    <div class="about-content">
      <!-- App Info -->
      <div class="about-card app-info">
        <div class="app-icon">🎴</div>
        <h2 class="app-name">开场白</h2>
        <p class="app-slogan">一张卡，打开一个话题</p>
        <span class="app-version">v{{ appVersion }}</span>
      </div>

      <!-- Description -->
      <div class="about-card">
        <h3 class="card-title">关于应用</h3>
        <p class="card-text">
          开场白是一款个人自用的破冰话题卡牌应用。通过抽卡的形式，帮助你在社交场合中自然地开启对话。
          支持 AI 生成和离线题库两种模式，涵盖多种话题分类，从轻松闲聊到深度交流。
        </p>
      </div>

      <!-- Features -->
      <div class="about-card">
        <h3 class="card-title">功能特点</h3>
        <ul class="feature-list">
          <li>🎲 6 大话题分类，覆盖不同场景</li>
          <li>🤖 AI 智能生成，千变万化不重复</li>
          <li>📚 120+ 离线题库，无需联网即可使用</li>
          <li>🔄 分类循环模式，自动轮换话题</li>
          <li>📤 分享精美卡片图片</li>
          <li>🌙 深色模式支持</li>
        </ul>
      </div>

      <!-- Tech Stack -->
      <div class="about-card">
        <h3 class="card-title">技术栈</h3>
        <div class="tech-tags">
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">Vite</span>
          <span class="tech-tag">Capacitor</span>
          <span class="tech-tag">Pinia</span>
          <span class="tech-tag">Dexie.js</span>
        </div>
      </div>

      <!-- Rights -->
      <div class="about-card">
        <h3 class="card-title">权利信息</h3>
        <p class="card-text">
          本应用为个人自用工具，不收集任何用户数据。
          所有问题内容由 AI 生成或来自离线题库，仅供娱乐参考。
          用户配置的 API Key 仅存储在本地设备，不会上传至任何服务器。
        </p>
      </div>

      <!-- Copyright -->
      <div class="copyright">
        <p>© 2026 开场白 Opening Line</p>
        <p class="copyright-sub">Personal Use Only · Made with ❤️</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  padding: var(--spacing-lg);
  min-height: 100%;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
}

.app-info {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.app-icon {
  font-size: 56px;
  margin-bottom: var(--spacing-md);
}

.app-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.app-slogan {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
}

.app-version {
  display: inline-block;
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.card-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.feature-list li:last-child {
  border-bottom: none;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tech-tag {
  font-size: var(--font-size-xs);
  color: var(--color-accent-primary);
  background-color: rgba(232, 160, 191, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.copyright {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.copyright p {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.copyright-sub {
  font-size: var(--font-size-xs) !important;
  margin-top: var(--spacing-xs);
  opacity: 0.6;
}
</style>
