import { writable } from 'svelte/store'

// 内存状态存储
export const memoryBlocks = writable([])
export const totalMemory = writable(1024)
export const allocationAlgorithm = writable('FirstFit')
export const memoryStats = writable({
  totalSize: 1024,
  totalAllocated: 0,
  totalFree: 1024,
  fragmentationCount: 1
})

// 内存管理函数
export const memoryStore = {
  initializeMemory: (size = 1024) => {
    totalMemory.set(size)
    memoryBlocks.set([{
      start: 0,
      size: size,
      allocated: false,
      processId: null,
      color: '#e0e0e0'
    }])
    memoryStats.set({
      totalSize: size,
      totalAllocated: 0,
      totalFree: size,
      fragmentationCount: 1
    })
  },
  
  allocateMemory: (processId, size, processName) => {
    // 这里会调用后端API来分配内存
    // 暂时使用模拟数据
    console.log(`为进程 ${processName} 分配 ${size}KB 内存`)
  },
  
  deallocateMemory: (processId) => {
    memoryBlocks.update(blocks => 
      blocks.map(block => 
        block.processId === processId 
          ? {...block, allocated: false, processId: null, color: '#e0e0e0'}
          : block
      )
    )
  },
  
  updateMemoryStats: () => {
    // 更新内存统计信息
  }
}