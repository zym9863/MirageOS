import { writable } from 'svelte/store'

// 进程状态存储
export const processes = writable([])
export const currentProcess = writable(null)
export const schedulingAlgorithm = writable('FCFS')
export const isRunning = writable(false)
export const currentTime = writable(0)
export const timeQuantum = writable(2)
export const schedulingStats = writable({
  completedProcesses: 0,
  totalProcesses: 0,
  averageWaitingTime: 0,
  averageTurnaroundTime: 0
})
export const isSimulationCompleted = writable(false)

// 进程管理函数
export const processStore = {
  // 更新整个系统状态（从服务器端同步）
  updateSystemState: (systemState) => {
    processes.set(systemState.processes || [])
    currentProcess.set(systemState.currentProcess || null)
    currentTime.set(systemState.currentTime || 0)
    schedulingAlgorithm.set(systemState.algorithm || 'FCFS')
    timeQuantum.set(systemState.timeQuantum || 2)
    schedulingStats.set(systemState.stats || {
      completedProcesses: 0,
      totalProcesses: 0,
      averageWaitingTime: 0,
      averageTurnaroundTime: 0
    })
    isSimulationCompleted.set(systemState.isCompleted || false)
  },

  // 保留原有的本地操作函数（主要用于向后兼容）
  addProcess: (process) => {
    processes.update(list => [...list, {
      ...process,
      id: Date.now() + Math.random(),
      state: 'ready',
      arrivalTime: 0,
      remainingTime: process.burstTime,
      waitingTime: 0,
      turnaroundTime: 0
    }])
  },

  removeProcess: (processId) => {
    processes.update(list => list.filter(p => p.id !== processId))
  },

  updateProcess: (processId, updates) => {
    processes.update(list =>
      list.map(p => p.id === processId ? {...p, ...updates} : p)
    )
  },

  clearProcesses: () => {
    processes.set([])
    currentProcess.set(null)
    currentTime.set(0)
    schedulingStats.set({
      completedProcesses: 0,
      totalProcesses: 0,
      averageWaitingTime: 0,
      averageTurnaroundTime: 0
    })
    isSimulationCompleted.set(false)
  }
}