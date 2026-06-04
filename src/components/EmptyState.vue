<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  line-height: 1;
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--color-text-tertiary);
  line-height: 1.5;
  max-width: 280px;
}
</style>
