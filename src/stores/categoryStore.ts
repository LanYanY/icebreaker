import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category } from '@/types/category'
import type { ModeId } from '@/types/mode'
import { ALL_CATEGORIES, getCategoriesForMode, getNextCategoryId, getModeById, isValidMode } from '@/types/mode'
import { useSettingStore } from './settingStore'

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const currentCategoryId = ref<string>('random')
  const cycleMode = ref<boolean>(false)
  const cycleCategoryIdByMode = ref<Record<ModeId, string>>({
    icebreaker: 'random',
    intimacy: 'intimacy_random',
  })

  // 当前模式（从settingStore获取）
  const currentMode = computed<ModeId>(() => {
    const settingStore = useSettingStore()
    const mode = settingStore.userSetting.currentMode
    return isValidMode(mode) ? mode : 'icebreaker'
  })

  // 当前模式的分类
  const categories = computed<Category[]>(() => {
    return getCategoriesForMode(currentMode.value)
  })

  // 计算属性
  const currentCategory = computed(() =>
    categories.value.find(c => c.id === currentCategoryId.value)
  )

  const sortedCategories = computed(() =>
    [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder)
  )

  // 下一个分类（用于循环模式）
  const nextCategoryId = computed(() => {
    return getNextCategoryId(currentMode.value, currentCategoryId.value)
  })

  // 方法
  function setCurrentCategory(categoryId: string) {
    // 验证分类属于当前模式
    const isValid = categories.value.some(c => c.id === categoryId)
    if (!isValid) {
      // Fallback 到当前模式第一个分类
      const firstCategory = sortedCategories.value[0]
      currentCategoryId.value = firstCategory?.id || 'random'
      return
    }
    currentCategoryId.value = categoryId
  }

  /**
   * 切换模式并适配分类
   */
  function switchMode(mode: ModeId) {
    const modeConfig = getModeById(mode)
    if (!modeConfig) return

    // 恢复该模式上次使用的分类（如果有且有效）
    const savedCategoryId = cycleCategoryIdByMode.value[mode]
    const modeCategories = getCategoriesForMode(mode)
    const validCategory = modeCategories.find(c => c.id === savedCategoryId)

    if (validCategory) {
      currentCategoryId.value = savedCategoryId
    } else {
      // 使用该模式第一个分类
      const firstCategory = [...modeCategories].sort((a, b) => a.sortOrder - b.sortOrder)[0]
      currentCategoryId.value = firstCategory?.id || modeConfig.categoryIds[0]
    }
  }

  function toggleCycleMode() {
    cycleMode.value = !cycleMode.value
  }

  /** 抽卡成功后调用：循环模式下自动推进到下一个分类 */
  function advanceCategory() {
    // 保存当前模式的分类选择
    cycleCategoryIdByMode.value[currentMode.value] = currentCategoryId.value

    if (cycleMode.value) {
      currentCategoryId.value = nextCategoryId.value
      // 保存新模式的分类
      cycleCategoryIdByMode.value[currentMode.value] = currentCategoryId.value
    }
  }

  function getCategoryById(id: string): Category | undefined {
    return ALL_CATEGORIES.find(c => c.id === id)
  }

  function getCategoryName(id: string): string {
    return ALL_CATEGORIES.find(c => c.id === id)?.name || id
  }

  function getCategoryIcon(id: string): string {
    return ALL_CATEGORIES.find(c => c.id === id)?.icon || '❓'
  }

  return {
    currentCategoryId,
    cycleMode,
    cycleCategoryIdByMode,
    currentMode,
    categories,
    currentCategory,
    sortedCategories,
    nextCategoryId,
    setCurrentCategory,
    switchMode,
    toggleCycleMode,
    advanceCategory,
    getCategoryById,
    getCategoryName,
    getCategoryIcon,
  }
})
