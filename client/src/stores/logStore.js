import { writable } from 'svelte/store'

const MAX_LOGS = 100 // 保留最近 100 条日志

// 创建日志存储
const createLogStore = () => {
  const { subscribe, update } = writable([])

  return {
    subscribe,
    // 添加新日志
    addLog: (log) => update(logs => {
      const newLogs = [...logs, log]
      // 如果超过最大条数，删除最早的日志
      if (newLogs.length > MAX_LOGS) {
        return newLogs.slice(newLogs.length - MAX_LOGS)
      }
      return newLogs
    }),
    // 清空所有日志
    clearLogs: () => update(() => [])
  }
}

export const logStore = createLogStore()
