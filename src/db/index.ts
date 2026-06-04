import Dexie, { type EntityTable } from 'dexie'
import type { Question } from '@/types/question'

// 定义数据库结构
interface IceCardDB extends Dexie {
  questions: EntityTable<Question, 'id'>
  favorites: EntityTable<Question, 'id'>
  hiddenQuestions: EntityTable<{ hash: string; createdAt: number }, 'hash'>
  settings: EntityTable<{ key: string; value: string }, 'key'>
}

// 创建数据库实例
const db = new Dexie('IceCardDB') as IceCardDB

// 定义表结构
db.version(1).stores({
  questions: 'id, category, hash, createdAt, favorite, hidden',
  favorites: 'id, category, hash, createdAt',
  hiddenQuestions: 'hash, createdAt',
  settings: 'key'
})

export default db

// 数据库操作函数
export async function addQuestion(question: Question): Promise<string> {
  return await db.questions.add(question) as string
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  return await db.questions.get(id) as Question | undefined
}

export async function getQuestionsByCategory(category: string, limit = 50): Promise<Question[]> {
  const questions = await db.questions
    .where('category')
    .equals(category)
    .reverse()
    .sortBy('createdAt')
  
  return questions.slice(0, limit) as Question[]
}

export async function getRecentQuestions(category: string, limit = 50): Promise<string[]> {
  const questions = await db.questions
    .where('category')
    .equals(category)
    .reverse()
    .sortBy('createdAt')
  
  return (questions as Question[]).slice(0, limit).map(q => q.text)
}

export async function getAllQuestions(): Promise<Question[]> {
  return await db.questions.orderBy('createdAt').reverse().toArray() as Question[]
}

export async function getFavoriteQuestions(): Promise<Question[]> {
  return await db.questions.where('favorite').equals(1).reverse().sortBy('createdAt') as Question[]
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const question = await db.questions.get(id) as Question | undefined
  if (!question) return false
  
  await db.questions.update(id, { favorite: !question.favorite })
  return !question.favorite
}

export async function hideQuestion(hash: string): Promise<void> {
  await db.hiddenQuestions.put({ hash, createdAt: Date.now() })
}

export async function isQuestionHidden(hash: string): Promise<boolean> {
  const record = await db.hiddenQuestions.get(hash)
  return !!record
}

export async function getHiddenHashes(): Promise<Set<string>> {
  const records = await db.hiddenQuestions.toArray()
  return new Set(records.map(r => r.hash))
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.questions.delete(id)
}

export async function clearAllQuestions(): Promise<void> {
  await db.questions.clear()
}

export async function clearAllFavorites(): Promise<void> {
  await db.questions.where('favorite').equals(1).modify({ favorite: false })
}

export async function clearAllHistory(): Promise<void> {
  await db.questions.clear()
}

// 设置相关操作
export async function getSetting(key: string): Promise<string | undefined> {
  const record = await db.settings.get(key)
  return record?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.settings.delete(key)
}
