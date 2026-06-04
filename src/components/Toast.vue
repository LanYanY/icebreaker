<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const visible = ref(props.show)
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.show) {
    startTimer()
  }
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

function startTimer() {
  if (timer) {
    clearTimeout(timer)
  }
  
  timer = setTimeout(() => {
    visible.value = false
    emit('close')
  }, props.duration || 2000)
}

function handleClose() {
  visible.value = false
  emit('close')
}
</script>

<template>
  <teleport to="body">
    <transition name="toast">
      <div v-if="visible" class="toast" :class="type">
        <span class="toast-message">{{ message }}</span>
        <button class="toast-close" @click="handleClose">×</button>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  z-index: 1000;
  max-width: 90%;
}

.toast.success {
  border-color: var(--color-success);
}

.toast.error {
  border-color: var(--color-error);
}

.toast.info {
  border-color: var(--color-info);
}

.toast-message {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.toast-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.toast-enter-active {
  transition: all var(--duration-normal) ease;
}

.toast-leave-active {
  transition: all var(--duration-normal) ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
