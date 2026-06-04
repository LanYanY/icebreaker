import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category } from '@/types/category'
import { DEFAULT_CATEGORIES } from '@/types/category'

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref<Category[]>(DEFAULT_CATEGORIES)
  const currentCategoryId = ref<string>('light')
  
  // 计算属性
  const currentCategory = computed(() => 
    categories.value.find(c => c.id === currentCategoryId.value)
  )
  
  const sortedCategories = computed(() => 
    [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  
  // 方法
  function setCurrentCategory(categoryId: string) {
    currentCategoryId.value = categoryId
  }
  
  function getCategoryById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }
  
  function getCategoryName(id: string): string {
    return categories.value.find(c => c.id === id)?.name || id
  }
  
  return {
    categories,
    currentCategoryId,
    currentCategory,
    sortedCategories,
    setCurrentCategory,
    getCategoryById,
    getCategoryName
  }
})
