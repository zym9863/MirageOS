// 进程调度控制器
export class ProcessScheduler {
  constructor() {
    this.processes = []
    this.currentProcess = null
    this.schedulingAlgorithm = 'FCFS'
    this.timeQuantum = 2
    this.currentTime = 0
    this.timeSliceCounter = 0 // 用于RR算法的时间片计数
  }

  addProcess(process) {
    process.arrivalTime = this.currentTime
    process.remainingTime = process.burstTime
    process.state = 'ready'
    process.waitingTime = 0
    process.turnaroundTime = 0
    this.processes.push(process)
    return process
  }

  removeProcess(processId) {
    this.processes = this.processes.filter(p => p.id !== processId)
    // 如果删除的是当前进程，清空当前进程
    if (this.currentProcess && this.currentProcess.id === processId) {
      this.currentProcess = null
      this.timeSliceCounter = 0
    }
  }

  setSchedulingAlgorithm(algorithm) {
    this.schedulingAlgorithm = algorithm
    // 切换算法时重置当前进程和时间片计数
    if (this.currentProcess && this.currentProcess.state === 'running') {
      this.currentProcess.state = 'ready'
      this.currentProcess = null
    }
    this.timeSliceCounter = 0
  }

  // 先来先服务 (FCFS)
  fcfsSchedule() {
    return this.processes
      .filter(p => p.state === 'ready')
      .sort((a, b) => a.arrivalTime - b.arrivalTime)
  }

  // 最短作业优先 (SJF)
  sjfSchedule() {
    return this.processes
      .filter(p => p.state === 'ready')
      .sort((a, b) => a.burstTime - b.burstTime)
  }

  // 优先级调度
  prioritySchedule() {
    return this.processes
      .filter(p => p.state === 'ready')
      .sort((a, b) => b.priority - a.priority)
  }

  // 时间片轮转 (RR)
  roundRobinSchedule() {
    return this.processes.filter(p => p.state === 'ready')
  }

  getNextProcess() {
    let readyQueue = []
    
    switch (this.schedulingAlgorithm) {
      case 'FCFS':
        readyQueue = this.fcfsSchedule()
        break
      case 'SJF':
        readyQueue = this.sjfSchedule()
        break
      case 'Priority':
        readyQueue = this.prioritySchedule()
        break
      case 'RR':
        readyQueue = this.roundRobinSchedule()
        break
      default:
        readyQueue = this.fcfsSchedule()
    }

    return readyQueue[0] || null
  }

  executeStep() {
    // 如果没有当前进程或当前进程不在运行状态，选择下一个进程
    if (!this.currentProcess || this.currentProcess.state !== 'running') {
      this.currentProcess = this.getNextProcess()
      if (this.currentProcess) {
        this.currentProcess.state = 'running'
        this.timeSliceCounter = 0 // 重置时间片计数
      }
    }

    // 执行当前进程
    if (this.currentProcess) {
      this.currentProcess.remainingTime--
      this.timeSliceCounter++

      // 检查进程是否完成
      if (this.currentProcess.remainingTime <= 0) {
        this.currentProcess.state = 'terminated'
        this.currentProcess.turnaroundTime = this.currentTime + 1
        this.currentProcess = null
        this.timeSliceCounter = 0
      }
      // 检查时间片轮转是否需要切换进程
      else if (this.schedulingAlgorithm === 'RR' && this.timeSliceCounter >= this.timeQuantum) {
        this.currentProcess.state = 'ready'
        this.currentProcess = null
        this.timeSliceCounter = 0
      }
    }

    // 更新等待时间
    this.processes.forEach(process => {
      if (process.state === 'ready') {
        process.waitingTime++
      }
    })

    this.currentTime++
    return this.getSystemState()
  }

  // 重置调度器状态
  reset() {
    this.processes.forEach(process => {
      process.state = 'ready'
      process.remainingTime = process.burstTime
      process.waitingTime = 0
      process.turnaroundTime = 0
    })
    this.currentProcess = null
    this.currentTime = 0
    this.timeSliceCounter = 0
  }

  // 清空所有进程并重置状态
  clear() {
    this.processes = []
    this.currentProcess = null
    this.currentTime = 0
    this.timeSliceCounter = 0
  }

  // 设置时间片大小
  setTimeQuantum(quantum) {
    this.timeQuantum = quantum
    // 如果当前是RR算法且有正在运行的进程，重置时间片计数
    if (this.schedulingAlgorithm === 'RR' && this.currentProcess) {
      this.timeSliceCounter = 0
    }
  }

  // 检查是否所有进程都已完成
  isAllProcessesCompleted() {
    return this.processes.every(p => p.state === 'terminated') && !this.currentProcess
  }

  // 获取调度统计信息
  getSchedulingStats() {
    const completedProcesses = this.processes.filter(p => p.state === 'terminated')
    const totalWaitingTime = completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0)
    const totalTurnaroundTime = completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0)

    return {
      completedProcesses: completedProcesses.length,
      totalProcesses: this.processes.length,
      averageWaitingTime: completedProcesses.length > 0 ? totalWaitingTime / completedProcesses.length : 0,
      averageTurnaroundTime: completedProcesses.length > 0 ? totalTurnaroundTime / completedProcesses.length : 0
    }
  }

  getSystemState() {
    return {
      processes: this.processes,
      currentProcess: this.currentProcess,
      currentTime: this.currentTime,
      algorithm: this.schedulingAlgorithm,
      timeQuantum: this.timeQuantum,
      timeSliceCounter: this.timeSliceCounter,
      isCompleted: this.isAllProcessesCompleted(),
      stats: this.getSchedulingStats()
    }
  }
}