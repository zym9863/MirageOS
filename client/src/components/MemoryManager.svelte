<script>
  import { onMount } from 'svelte'
  import { memoryBlocks, totalMemory, allocationAlgorithm, memoryStats, memoryStore } from '../stores/memoryStore.js'
  import { wsStore } from '../stores/websocket.js'
  
  let processName = ''
  let memorySize = 64
  let memoryVisualization = []
  let allocationHistory = []

  $: memoryUsagePercent = $memoryStats.totalAllocated / $memoryStats.totalSize * 100
  $: fragmentationPercent = $memoryStats.fragmentationCount > 1 ? 
    (($memoryStats.fragmentationCount - 1) / $memoryStats.fragmentationCount * 100) : 0

  onMount(() => {
    memoryStore.initializeMemory(1024)
    updateVisualization()
  })

  function allocateMemory() {
    if (processName.trim() && memorySize > 0) {
      const result = simulateAllocation(processName.trim(), parseInt(memorySize))
      
      if (result.success) {
        allocationHistory = [
          {
            time: new Date().toLocaleTimeString(),
            action: '分配',
            process: processName.trim(),
            size: memorySize,
            algorithm: $allocationAlgorithm
          },
          ...allocationHistory.slice(0, 9) // 保留最近10条记录
        ]
        
        processName = ''
        memorySize = 64
        updateVisualization()
      } else {
        alert(result.message)
      }
    }
  }

  function deallocateMemory(processId) {
    memoryStore.deallocateMemory(processId)
    
    const processBlock = $memoryBlocks.find(block => block.processId === processId)
    if (processBlock) {
      allocationHistory = [
        {
          time: new Date().toLocaleTimeString(),
          action: '释放',
          process: processBlock.processId,
          size: processBlock.size,
          algorithm: $allocationAlgorithm
        },
        ...allocationHistory.slice(0, 9)
      ]
    }
    
    updateVisualization()
    updateMemoryStats()
  }

  function resetMemory() {
    memoryStore.initializeMemory($totalMemory)
    allocationHistory = []
    updateVisualization()
  }

  function compactMemory() {
    // 内存压缩：将所有已分配的块移到开始位置
    const allocatedBlocks = $memoryBlocks.filter(block => block.allocated)
    const totalAllocated = allocatedBlocks.reduce((sum, block) => sum + block.size, 0)
    const freeSpace = $totalMemory - totalAllocated
    
    let currentStart = 0
    const newBlocks = []
    
    // 重新排列已分配的块
    allocatedBlocks.forEach(block => {
      newBlocks.push({
        ...block,
        start: currentStart
      })
      currentStart += block.size
    })
    
    // 添加一个大的空闲块
    if (freeSpace > 0) {
      newBlocks.push({
        start: currentStart,
        size: freeSpace,
        allocated: false,
        processId: null,
        color: '#e0e0e0'
      })
    }
    
    memoryBlocks.set(newBlocks)
    updateVisualization()
    updateMemoryStats()
    
    allocationHistory = [
      {
        time: new Date().toLocaleTimeString(),
        action: '压缩',
        process: '系统',
        size: freeSpace,
        algorithm: '内存压缩'
      },
      ...allocationHistory.slice(0, 9)
    ]
  }

  function simulateAllocation(processId, size) {
    const blocks = $memoryBlocks
    let bestIndex = -1
    
    // 根据算法选择合适的块
    switch ($allocationAlgorithm) {
      case 'FirstFit':
        bestIndex = firstFit(blocks, size)
        break
      case 'BestFit':
        bestIndex = bestFit(blocks, size)
        break
      case 'WorstFit':
        bestIndex = worstFit(blocks, size)
        break
    }
    
    if (bestIndex === -1) {
      return { success: false, message: '内存不足，无法分配' }
    }
    
    const block = blocks[bestIndex]
    const newBlocks = [...blocks]
    
    // 分割内存块
    if (block.size > size) {
      newBlocks.splice(bestIndex + 1, 0, {
        start: block.start + size,
        size: block.size - size,
        allocated: false,
        processId: null,
        color: '#e0e0e0'
      })
    }
    
    newBlocks[bestIndex] = {
      start: block.start,
      size: size,
      allocated: true,
      processId: processId,
      color: generateRandomColor()
    }
    
    memoryBlocks.set(newBlocks)
    updateMemoryStats()
    
    return { success: true }
  }

  function firstFit(blocks, size) {
    for (let i = 0; i < blocks.length; i++) {
      if (!blocks[i].allocated && blocks[i].size >= size) {
        return i
      }
    }
    return -1
  }

  function bestFit(blocks, size) {
    let bestIndex = -1
    let minWaste = Infinity
    
    for (let i = 0; i < blocks.length; i++) {
      if (!blocks[i].allocated && blocks[i].size >= size) {
        const waste = blocks[i].size - size
        if (waste < minWaste) {
          minWaste = waste
          bestIndex = i
        }
      }
    }
    return bestIndex
  }

  function worstFit(blocks, size) {
    let worstIndex = -1
    let maxWaste = -1
    
    for (let i = 0; i < blocks.length; i++) {
      if (!blocks[i].allocated && blocks[i].size >= size) {
        const waste = blocks[i].size - size
        if (waste > maxWaste) {
          maxWaste = waste
          worstIndex = i
        }
      }
    }
    return worstIndex
  }

  function updateVisualization() {
    memoryVisualization = $memoryBlocks.map(block => ({
      ...block,
      width: (block.size / $totalMemory) * 100
    }))
  }

  function updateMemoryStats() {
    const allocated = $memoryBlocks
      .filter(block => block.allocated)
      .reduce((sum, block) => sum + block.size, 0)
    
    const free = $totalMemory - allocated
    const fragmentCount = $memoryBlocks.filter(block => !block.allocated).length
    
    memoryStats.set({
      totalSize: $totalMemory,
      totalAllocated: allocated,
      totalFree: free,
      fragmentationCount: fragmentCount
    })
  }

  function generateRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
      '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  function getAlgorithmDescription(algorithm) {
    switch (algorithm) {
      case 'FirstFit':
        return '首次适应：选择第一个足够大的空闲块'
      case 'BestFit':
        return '最佳适应：选择最小的足够大的空闲块'
      case 'WorstFit':
        return '最坏适应：选择最大的空闲块'
      default:
        return ''
    }
  }
</script>

<div class="memory-container">
  <div class="controls-section">
    <h2>💾 内存管理控制面板</h2>
    
    <!-- 分配算法选择 -->
    <div class="control-group">
      <label>分配算法:</label>
      <select bind:value={$allocationAlgorithm}>
        <option value="FirstFit">首次适应 (First Fit)</option>
        <option value="BestFit">最佳适应 (Best Fit)</option>
        <option value="WorstFit">最坏适应 (Worst Fit)</option>
      </select>
      <p class="algorithm-description">
        {getAlgorithmDescription($allocationAlgorithm)}
      </p>
    </div>

    <!-- 内存分配 -->
    <div class="allocation-section">
      <h3>分配内存</h3>
      <div class="input-group">
        <input 
          type="text" 
          bind:value={processName} 
          placeholder="进程名称"
          maxlength="10"
        >
        <input 
          type="number" 
          bind:value={memorySize} 
          placeholder="内存大小(KB)"
          min="16" 
          max="512"
        >
        <button on:click={allocateMemory} class="allocate-btn">分配内存</button>
      </div>
    </div>

    <!-- 内存操作 -->
    <div class="memory-operations">
      <button on:click={compactMemory} class="control-btn compact-btn">
        🔧 内存压缩
      </button>
      <button on:click={resetMemory} class="control-btn reset-btn">
        🔄 重置内存
      </button>
    </div>

    <!-- 内存统计 -->
    <div class="memory-stats">
      <h3>内存统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总内存:</span>
          <span class="stat-value">{$memoryStats.totalSize} KB</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已分配:</span>
          <span class="stat-value allocated">{$memoryStats.totalAllocated} KB</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">空闲:</span>
          <span class="stat-value free">{$memoryStats.totalFree} KB</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">碎片数:</span>
          <span class="stat-value fragments">{$memoryStats.fragmentationCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">使用率:</span>
          <span class="stat-value">{memoryUsagePercent.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">碎片化:</span>
          <span class="stat-value">{fragmentationPercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>

    <!-- 操作历史 -->
    <div class="operation-history">
      <h3>操作历史</h3>
      <div class="history-list">
        {#each allocationHistory as record}
          <div class="history-item" class:allocation={record.action === '分配'} class:deallocation={record.action === '释放'}>
            <span class="history-time">{record.time}</span>
            <span class="history-action">{record.action}</span>
            <span class="history-process">{record.process}</span>
            <span class="history-size">{record.size}KB</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="visualization-section">
    <h2>📊 内存可视化</h2>
    
    <!-- 内存条可视化 -->
    <div class="memory-visualization">
      <h3>内存布局</h3>
      <div class="memory-bar">
        {#each memoryVisualization as block}
          <div 
            class="memory-block"
            class:allocated={block.allocated}
            style="width: {block.width}%; background-color: {block.color};"
            title="{block.allocated ? `进程: ${block.processId}, 大小: ${block.size}KB` : `空闲: ${block.size}KB`}"
          >
            <div class="block-info">
              {#if block.allocated}
                <span class="process-id">{block.processId}</span>
                <span class="block-size">{block.size}KB</span>
              {:else}
                <span class="free-space">空闲</span>
                <span class="block-size">{block.size}KB</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- 内存地址标尺 -->
      <div class="memory-ruler">
        <span>0</span>
        <span>{Math.floor($totalMemory * 0.25)}</span>
        <span>{Math.floor($totalMemory * 0.5)}</span>
        <span>{Math.floor($totalMemory * 0.75)}</span>
        <span>{$totalMemory}</span>
      </div>
    </div>

    <!-- 已分配进程列表 -->
    <div class="allocated-processes">
      <h3>已分配进程</h3>
      <div class="process-list">
        {#each $memoryBlocks.filter(block => block.allocated) as block}
          <div class="process-item">
            <div class="process-info">
              <div class="process-color" style="background-color: {block.color}"></div>
              <div class="process-details">
                <span class="process-name">{block.processId}</span>
                <span class="process-address">地址: {block.start} - {block.start + block.size - 1}</span>
                <span class="process-size">大小: {block.size}KB</span>
              </div>
            </div>
            <button 
              on:click={() => deallocateMemory(block.processId)}
              class="deallocate-btn"
            >
              释放
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- 内存使用图表 -->
    <div class="memory-chart">
      <h3>内存使用分析</h3>
      <div class="chart-container">
        <div class="pie-chart">
          <svg viewBox="0 0 100 100" class="pie">
            <circle 
              cx="50" 
              cy="50" 
              r="40"
              fill="transparent"
              stroke="#4caf50"
              stroke-width="20"
              stroke-dasharray="{memoryUsagePercent} {100 - memoryUsagePercent}"
              stroke-dashoffset="25"
            />
            <circle 
              cx="50" 
              cy="50" 
              r="40"
              fill="transparent"
              stroke="#e0e0e0"
              stroke-width="20"
              stroke-dasharray="{100 - memoryUsagePercent} {memoryUsagePercent}"
              stroke-dashoffset="{25 - memoryUsagePercent}"
            />
          </svg>
          <div class="chart-center">
            <span class="usage-percent">{memoryUsagePercent.toFixed(1)}%</span>
            <span class="usage-label">已使用</span>
          </div>
        </div>
        
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color allocated"></div>
            <span>已分配 ({$memoryStats.totalAllocated}KB)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color free"></div>
            <span>空闲 ({$memoryStats.totalFree}KB)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .memory-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .controls-section, .visualization-section {
    background: var(--bg-primary);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: var(--shadow-xl);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }

  .controls-section:hover, .visualization-section:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
  }

  h2, h3 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h3 {
    font-size: 1.2rem;
    margin: 1.5rem 0 1rem 0;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .control-group {
    margin-bottom: 2rem;
  }

  .control-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  select, input {
    padding: 0.875rem 1rem;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: all 0.3s ease;
  }

  select:focus, input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: var(--bg-tertiary);
  }

  select:hover, input:hover {
    border-color: var(--text-muted);
  }

  .algorithm-description {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
    background: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 8px;
    border-left: 3px solid var(--accent-color);
  }

  .input-group {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }

  .allocate-btn {
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
  }

  .allocate-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
  }

  .memory-operations {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }

  .control-btn {
    padding: 0.875rem 1.75rem;
    border: none;
    border-radius: 16px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-md);
  }

  .compact-btn {
    background: linear-gradient(135deg, var(--warning-color), #d97706);
    color: white;
  }

  .reset-btn {
    background: linear-gradient(135deg, var(--error-color), #dc2626);
    color: white;
  }

  .control-btn:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-xl);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }

  .stat-item:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stat-label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .stat-value.allocated {
    color: var(--error-color);
  }

  .stat-value.free {
    color: var(--success-color);
  }

  .stat-value.fragments {
    color: var(--warning-color);
  }

  .history-list {
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
  }

  .history-list::-webkit-scrollbar {
    width: 6px;
  }

  .history-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  .history-item {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 0.75rem;
    padding: 0.875rem;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.875rem;
    transition: all 0.3s ease;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .history-item:hover {
    background: var(--bg-secondary);
    transform: translateX(4px);
  }

  .history-item.allocation {
    background: rgba(16, 185, 129, 0.1);
    border-left: 3px solid var(--success-color);
  }

  .history-item.deallocation {
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid var(--error-color);
  }

  .history-time {
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  .history-action {
    font-weight: 600;
    color: var(--text-primary);
  }

  .memory-bar {
    display: flex;
    height: 100px;
    border: 2px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    background: var(--bg-secondary);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .memory-block {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-width: 24px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .memory-block:hover {
    transform: scaleY(1.05);
    z-index: 10;
    filter: brightness(1.1);
  }

  .memory-block.allocated {
    border-right: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
  }

  .memory-block.allocated::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    pointer-events: none;
  }

  .block-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  }

  .memory-ruler {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.75rem;
    padding: 0 0.5rem;
  }

  .process-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .process-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: var(--bg-secondary);
    border-radius: 16px;
    border-left: 4px solid var(--primary-color);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }

  .process-item:hover {
    background: var(--bg-tertiary);
    transform: translateX(4px);
    box-shadow: var(--shadow-md);
  }

  .process-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .process-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .process-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .process-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .process-address, .process-size {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .deallocate-btn {
    background: linear-gradient(135deg, var(--error-color), #dc2626);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.625rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .deallocate-btn:hover {
    background: linear-gradient(135deg, #dc2626, var(--error-color));
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .chart-container {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .pie-chart {
    position: relative;
    width: 180px;
    height: 180px;
  }

  .pie {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .chart-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .usage-percent {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .usage-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chart-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .legend-color {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    box-shadow: var(--shadow-sm);
  }

  .legend-color.allocated {
    background: linear-gradient(135deg, var(--success-color), #059669);
  }

  .legend-color.free {
    background: var(--bg-tertiary);
    border: 2px solid var(--border-color);
  }

  @media (max-width: 1024px) {
    .memory-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .controls-section, .visualization-section {
      padding: 1.5rem;
      margin: 0 1rem;
    }
    
    .input-group {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .memory-operations {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .control-btn {
      flex: 1;
      min-width: 140px;
    }
    
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }
    
    .pie-chart {
      width: 150px;
      height: 150px;
    }
  }

  @media (max-width: 768px) {
    .memory-container {
      margin: 0 0.5rem;
    }
    
    .controls-section, .visualization-section {
      padding: 1rem;
    }
    
    .memory-bar {
      height: 80px;
    }
    
    .block-info {
      font-size: 0.7rem;
    }
    
    .process-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .process-info {
      width: 100%;
    }
    
    .deallocate-btn {
      align-self: flex-end;
    }
    
    .history-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: left;
    }
    
    h2 {
      font-size: 1.25rem;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
  }
</style>