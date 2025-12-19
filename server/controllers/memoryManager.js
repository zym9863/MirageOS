// 内存管理控制器
export class MemoryManager {
  constructor(totalSize = 1024, logEmitter = null) {
    this.totalSize = totalSize
    this.memoryBlocks = [{ start: 0, size: totalSize, allocated: false, processId: null }]
    this.allocationAlgorithm = 'FirstFit'
    this.logEmitter = logEmitter // 日志发射器，用于广播日志
  }

  // 生成并发送日志
  log(action, details) {
    if (this.logEmitter) {
      this.logEmitter({
        timestamp: new Date().toISOString(),
        module: '内存',
        action,
        details
      })
    }
    // 同时保留控制台输出
    console.log(`[内存] ${action}:`, details)
  }

  setAllocationAlgorithm(algorithm) {
    this.allocationAlgorithm = algorithm
    this.log('分配算法变更', `切换至: ${algorithm}`)
  }

  // 首次适应算法
  firstFit(size) {
    for (let i = 0; i < this.memoryBlocks.length; i++) {
      const block = this.memoryBlocks[i]
      if (!block.allocated && block.size >= size) {
        return i
      }
    }
    return -1
  }

  // 最佳适应算法
  bestFit(size) {
    let bestIndex = -1
    let minWaste = Infinity

    for (let i = 0; i < this.memoryBlocks.length; i++) {
      const block = this.memoryBlocks[i]
      if (!block.allocated && block.size >= size) {
        const waste = block.size - size
        if (waste < minWaste) {
          minWaste = waste
          bestIndex = i
        }
      }
    }
    return bestIndex
  }

  // 最坏适应算法
  worstFit(size) {
    let worstIndex = -1
    let maxWaste = -1

    for (let i = 0; i < this.memoryBlocks.length; i++) {
      const block = this.memoryBlocks[i]
      if (!block.allocated && block.size >= size) {
        const waste = block.size - size
        if (waste > maxWaste) {
          maxWaste = waste
          worstIndex = i
        }
      }
    }
    return worstIndex
  }

  allocateMemory(processId, size) {
    let blockIndex = -1

    switch (this.allocationAlgorithm) {
      case 'FirstFit':
        blockIndex = this.firstFit(size)
        break
      case 'BestFit':
        blockIndex = this.bestFit(size)
        break
      case 'WorstFit':
        blockIndex = this.worstFit(size)
        break
      default:
        blockIndex = this.firstFit(size)
    }

    if (blockIndex === -1) {
      this.log('分配失败', `进程 ${processId} 请求 ${size}KB 内存，内存不足`)
      return { success: false, message: '内存不足' }
    }

    const block = this.memoryBlocks[blockIndex]

    // 分割内存块
    if (block.size > size) {
      this.memoryBlocks.splice(blockIndex + 1, 0, {
        start: block.start + size,
        size: block.size - size,
        allocated: false,
        processId: null
      })
    }

    block.size = size
    block.allocated = true
    block.processId = processId

    this.log('内存分配', `进程 ${processId} 分配 ${size}KB 内存，起始地址: ${block.start}`)

    return {
      success: true,
      allocation: {
        start: block.start,
        size: size,
        processId: processId
      }
    }
  }

  deallocateMemory(processId) {
    const blockIndex = this.memoryBlocks.findIndex(
      block => block.allocated && block.processId === processId
    )

    if (blockIndex === -1) {
      this.log('释放失败', `未找到进程 ${processId} 的内存分配`)
      return { success: false, message: '未找到进程的内存分配' }
    }

    this.memoryBlocks[blockIndex].allocated = false
    this.memoryBlocks[blockIndex].processId = null

    this.log('内存回收', `进程 ${processId} 的内存已回收`)

    // 合并相邻的空闲块
    this.mergeAdjacentBlocks()

    return { success: true }
  }

  mergeAdjacentBlocks() {
    let mergedCount = 0
    for (let i = 0; i < this.memoryBlocks.length - 1; i++) {
      const current = this.memoryBlocks[i]
      const next = this.memoryBlocks[i + 1]

      if (!current.allocated && !next.allocated &&
          current.start + current.size === next.start) {
        current.size += next.size
        this.memoryBlocks.splice(i + 1, 1)
        mergedCount++
        i-- // 重新检查当前位置
      }
    }
    if (mergedCount > 0) {
      this.log('内存压缩', `合并了 ${mergedCount} 个相邻空闲块`)
    }
  }

  getMemoryState() {
    const totalAllocated = this.memoryBlocks
      .filter(block => block.allocated)
      .reduce((sum, block) => sum + block.size, 0)

    const totalFree = this.totalSize - totalAllocated

    const fragmentationCount = this.memoryBlocks
      .filter(block => !block.allocated).length

    return {
      totalSize: this.totalSize,
      totalAllocated,
      totalFree,
      fragmentationCount,
      blocks: this.memoryBlocks.map(block => ({
        start: block.start,
        size: block.size,
        allocated: block.allocated,
        processId: block.processId
      }))
    }
  }
}