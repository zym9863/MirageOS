<script>
  import { onMount } from 'svelte'
  import { processes, currentProcess, schedulingAlgorithm, isRunning, currentTime, processStore } from '../stores/processStore.js'
  import { wsStore } from '../stores/websocket.js'
  
  let processName = ''
  let burstTime = 5
  let priority = 1
  let timeQuantum = 2
  let simulationSpeed = 1000
  let simulationInterval = null

  $: ganttChart = generateGanttChart($processes, $currentTime)

  onMount(() => {
    // 初始化一些示例进程
    processStore.addProcess({ name: 'P1', burstTime: 8, priority: 3 })
    processStore.addProcess({ name: 'P2', burstTime: 4, priority: 1 })
    processStore.addProcess({ name: 'P3', burstTime: 9, priority: 2 })
  })

  function addProcess() {
    if (processName.trim() && burstTime > 0) {
      processStore.addProcess({
        name: processName.trim(),
        burstTime: parseInt(burstTime),
        priority: parseInt(priority)
      })
      
      // 清空表单
      processName = ''
      burstTime = 5
      priority = 1
    }
  }

  function removeProcess(processId) {
    processStore.removeProcess(processId)
  }

  function startSimulation() {
    if ($isRunning) return
    
    isRunning.set(true)
    simulationInterval = setInterval(() => {
      executeSchedulingStep()
    }, simulationSpeed)
  }

  function pauseSimulation() {
    isRunning.set(false)
    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }
  }

  function resetSimulation() {
    pauseSimulation()
    currentTime.set(0)
    currentProcess.set(null)
    
    // 重置所有进程状态
    processes.update(list => 
      list.map(p => ({
        ...p,
        state: 'ready',
        remainingTime: p.burstTime,
        waitingTime: 0,
        turnaroundTime: 0
      }))
    )
  }

  function executeSchedulingStep() {
    const readyProcesses = $processes.filter(p => p.state === 'ready')
    
    if (readyProcesses.length === 0 && !$currentProcess) {
      pauseSimulation()
      return
    }

    // 选择下一个进程
    if (!$currentProcess) {
      const nextProcess = selectNextProcess(readyProcesses)
      if (nextProcess) {
        currentProcess.set(nextProcess)
        processStore.updateProcess(nextProcess.id, { state: 'running' })
      }
    }

    // 执行当前进程
    if ($currentProcess) {
      const remaining = $currentProcess.remainingTime - 1
      processStore.updateProcess($currentProcess.id, { remainingTime: remaining })
      
      if (remaining <= 0) {
        processStore.updateProcess($currentProcess.id, { 
          state: 'terminated',
          turnaroundTime: $currentTime + 1
        })
        currentProcess.set(null)
      } else if ($schedulingAlgorithm === 'RR' && ($currentTime + 1) % timeQuantum === 0) {
        processStore.updateProcess($currentProcess.id, { state: 'ready' })
        currentProcess.set(null)
      }
    }

    // 更新等待时间
    $processes.forEach(p => {
      if (p.state === 'ready') {
        processStore.updateProcess(p.id, { 
          waitingTime: p.waitingTime + 1 
        })
      }
    })

    currentTime.update(t => t + 1)
  }

  function selectNextProcess(readyProcesses) {
    if (readyProcesses.length === 0) return null

    switch ($schedulingAlgorithm) {
      case 'FCFS':
        return readyProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)[0]
      case 'SJF':
        return readyProcesses.sort((a, b) => a.remainingTime - b.remainingTime)[0]
      case 'Priority':
        return readyProcesses.sort((a, b) => b.priority - a.priority)[0]
      case 'RR':
        return readyProcesses[0]
      default:
        return readyProcesses[0]
    }
  }

  function generateGanttChart(processes, currentTime) {
    // 简化的甘特图数据生成
    return processes.map(p => ({
      name: p.name,
      progress: p.burstTime > 0 ? ((p.burstTime - p.remainingTime) / p.burstTime) * 100 : 0,
      state: p.state
    }))
  }

  function getStateColor(state) {
    switch (state) {
      case 'ready': return '#ffd54f'
      case 'running': return '#4caf50'
      case 'waiting': return '#ff9800'
      case 'terminated': return '#9e9e9e'
      default: return '#e0e0e0'
    }
  }

  function getStateName(state) {
    switch (state) {
      case 'ready': return '就绪'
      case 'running': return '运行'
      case 'waiting': return '等待'
      case 'terminated': return '终止'
      default: return '未知'
    }
  }
</script>

<div class="scheduler-container">
  <div class="controls-section">
    <h2>📋 进程调度控制面板</h2>
    
    <!-- 调度算法选择 -->
    <div class="control-group">
      <label>调度算法:</label>
      <select bind:value={$schedulingAlgorithm}>
        <option value="FCFS">先来先服务 (FCFS)</option>
        <option value="SJF">最短作业优先 (SJF)</option>
        <option value="Priority">优先级调度</option>
        <option value="RR">时间片轮转 (RR)</option>
      </select>
    </div>

    {#if $schedulingAlgorithm === 'RR'}
      <div class="control-group">
        <label>时间片:</label>
        <input type="number" bind:value={timeQuantum} min="1" max="10">
      </div>
    {/if}

    <!-- 添加进程 -->
    <div class="add-process-section">
      <h3>添加新进程</h3>
      <div class="input-group">
        <input 
          type="text" 
          bind:value={processName} 
          placeholder="进程名称"
          maxlength="10"
        >
        <input 
          type="number" 
          bind:value={burstTime} 
          placeholder="CPU时间"
          min="1" 
          max="20"
        >
        <input 
          type="number" 
          bind:value={priority} 
          placeholder="优先级"
          min="1" 
          max="5"
        >
        <button on:click={addProcess} class="add-btn">添加进程</button>
      </div>
    </div>

    <!-- 模拟控制 -->
    <div class="simulation-controls">
      <button 
        on:click={startSimulation} 
        disabled={$isRunning}
        class="control-btn start-btn"
      >
        ▶️ 开始
      </button>
      <button 
        on:click={pauseSimulation} 
        disabled={!$isRunning}
        class="control-btn pause-btn"
      >
        ⏸️ 暂停
      </button>
      <button 
        on:click={resetSimulation}
        class="control-btn reset-btn"
      >
        🔄 重置
      </button>
    </div>

    <div class="status-info">
      <p><strong>当前时间:</strong> {$currentTime}</p>
      <p><strong>运行状态:</strong> {$isRunning ? '运行中' : '已暂停'}</p>
      {#if $currentProcess}
        <p><strong>当前进程:</strong> {$currentProcess.name}</p>
      {/if}
    </div>
  </div>

  <div class="visualization-section">
    <h2>📊 进程状态可视化</h2>
    
    <!-- 进程列表 -->
    <div class="process-list">
      <h3>进程队列</h3>
      <div class="process-table">
        <div class="table-header">
          <span>进程名</span>
          <span>CPU时间</span>
          <span>剩余时间</span>
          <span>优先级</span>
          <span>状态</span>
          <span>等待时间</span>
          <span>操作</span>
        </div>
        {#each $processes as process}
          <div class="table-row" class:current={$currentProcess?.id === process.id}>
            <span class="process-name">{process.name}</span>
            <span>{process.burstTime}</span>
            <span>{process.remainingTime}</span>
            <span>{process.priority}</span>
            <span class="status" style="background-color: {getStateColor(process.state)}">
              {getStateName(process.state)}
            </span>
            <span>{process.waitingTime}</span>
            <button 
              on:click={() => removeProcess(process.id)}
              class="remove-btn"
              disabled={process.state === 'running'}
            >
              🗑️
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- 甘特图 -->
    <div class="gantt-chart">
      <h3>进程执行进度</h3>
      <div class="chart-container">
        {#each ganttChart as item}
          <div class="gantt-item">
            <div class="process-label">{item.name}</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                style="width: {item.progress}%; background-color: {getStateColor(item.state)}"
              ></div>
            </div>
            <div class="progress-text">{Math.round(item.progress)}%</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .scheduler-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .controls-section, .visualization-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  h2 {
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  h3 {
    color: #555;
    margin: 1.5rem 0 1rem 0;
    font-size: 1.2rem;
  }

  .control-group {
    margin-bottom: 1rem;
  }

  .control-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  select, input {
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .input-group {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }

  .add-btn {
    padding: 0.75rem 1rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s ease;
  }

  .add-btn:hover {
    background: #45a049;
  }

  .simulation-controls {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }

  .control-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .start-btn {
    background: #4caf50;
    color: white;
  }

  .pause-btn {
    background: #ff9800;
    color: white;
  }

  .reset-btn {
    background: #f44336;
    color: white;
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .control-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .status-info {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .status-info p {
    margin: 0.5rem 0;
    color: #666;
  }

  .process-table {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr 1fr auto;
    gap: 1rem;
    padding: 1rem;
    align-items: center;
  }

  .table-header {
    background: #f8f9fa;
    font-weight: bold;
    color: #333;
  }

  .table-row {
    border-top: 1px solid #eee;
    transition: background 0.3s ease;
  }

  .table-row:hover {
    background: #f8f9fa;
  }

  .table-row.current {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
  }

  .process-name {
    font-weight: bold;
    color: #333;
  }

  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    text-align: center;
    font-size: 0.85rem;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  .remove-btn {
    background: #f44336;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .remove-btn:hover:not(:disabled) {
    background: #d32f2f;
  }

  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chart-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gantt-item {
    display: grid;
    grid-template-columns: 100px 1fr 60px;
    gap: 1rem;
    align-items: center;
  }

  .process-label {
    font-weight: bold;
    color: #333;
  }

  .progress-bar {
    height: 30px;
    background: #e0e0e0;
    border-radius: 15px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.5s ease;
    border-radius: 15px;
  }

  .progress-text {
    text-align: center;
    font-weight: bold;
    color: #666;
  }

  @media (max-width: 1024px) {
    .scheduler-container {
      grid-template-columns: 1fr;
    }
    
    .input-group {
      grid-template-columns: 1fr;
    }
    
    .table-header, .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .gantt-item {
      grid-template-columns: 1fr;
    }
  }
</style>