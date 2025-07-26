// 内存管理控制器
export class MemoryManager {
  constructor(totalSize = 1024) {
    this.totalSize = totalSize
    this.memoryBlocks = [{ start: 0, size: totalSize, allocated: false, processId: null }]
    this.allocationAlgorithm = 'FirstFit'
  }

  setAllocationAlgorithm(algorithm) {
    this.allocationAlgorithm = algorithm
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
      return { success: false, message: '未找到进程的内存分配' }
    }

    this.memoryBlocks[blockIndex].allocated = false
    this.memoryBlocks[blockIndex].processId = null

    // 合并相邻的空闲块
    this.mergeAdjacentBlocks()

    return { success: true }
  }

  mergeAdjacentBlocks() {
    for (let i = 0; i < this.memoryBlocks.length - 1; i++) {
      const current = this.memoryBlocks[i]
      const next = this.memoryBlocks[i + 1]

      if (!current.allocated && !next.allocated && 
          current.start + current.size === next.start) {
        current.size += next.size
        this.memoryBlocks.splice(i + 1, 1)
        i-- // 重新检查当前位置
      }
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