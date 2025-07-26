// 进程调度控制器
export class ProcessScheduler {
  constructor() {
    this.processes = []
    this.currentProcess = null
    this.schedulingAlgorithm = 'FCFS'
    this.timeQuantum = 2
    this.currentTime = 0
  }

  addProcess(process) {
    process.arrivalTime = this.currentTime
    process.remainingTime = process.burstTime
    process.state = 'ready'
    this.processes.push(process)
    return process
  }

  removeProcess(processId) {
    this.processes = this.processes.filter(p => p.id !== processId)
  }

  setSchedulingAlgorithm(algorithm) {
    this.schedulingAlgorithm = algorithm
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
    if (!this.currentProcess || this.currentProcess.state !== 'running') {
      this.currentProcess = this.getNextProcess()
      if (this.currentProcess) {
        this.currentProcess.state = 'running'
      }
    }

    if (this.currentProcess) {
      this.currentProcess.remainingTime--
      
      if (this.currentProcess.remainingTime <= 0) {
        this.currentProcess.state = 'terminated'
        this.currentProcess = null
      } else if (this.schedulingAlgorithm === 'RR' && 
                 this.currentTime % this.timeQuantum === 0) {
        this.currentProcess.state = 'ready'
        this.currentProcess = null
      }
    }

    this.currentTime++
    return this.getSystemState()
  }

  getSystemState() {
    return {
      processes: this.processes,
      currentProcess: this.currentProcess,
      currentTime: this.currentTime,
      algorithm: this.schedulingAlgorithm
    }
  }
}