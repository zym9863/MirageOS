import { writable } from 'svelte/store'

// 进程状态存储
export const processes = writable([])
export const currentProcess = writable(null)
export const schedulingAlgorithm = writable('FCFS')
export const isRunning = writable(false)
export const currentTime = writable(0)

// 进程管理函数
export const processStore = {
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
  }
}