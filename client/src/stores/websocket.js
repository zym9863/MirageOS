import { writable } from 'svelte/store'

export const websocket = writable(null)

const createWebSocketStore = () => {
  let ws = null
  const { subscribe, set, update } = writable(null)

  return {
    subscribe,
    connect: () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.hostname}:3000`
      
      ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket已连接')
        set(ws)
      }
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('收到WebSocket消息:', data)
          
          // 处理初始化消息，同步进程状态
          if (data.type === 'init' && data.processState) {
            // 将接收到的系统状态同步到processStore
            const { processStore } = await import('./processStore.js')
            processStore.updateSystemState(data.processState)
          }
          
          // 处理其他消息类型
          if (data.type === 'response' && data.processState) {
            const { processStore } = await import('./processStore.js')
            processStore.updateSystemState(data.processState)
          }
        } catch (error) {
          console.error('WebSocket消息解析错误:', error)
        }
      }
      
      ws.onclose = () => {
        console.log('WebSocket已断开')
        set(null)
        // 尝试重连
        setTimeout(() => {
          if (!ws || ws.readyState === WebSocket.CLOSED) {
            console.log('尝试重连WebSocket...')
            this.connect()
          }
        }, 3000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
      }
    },
    send: (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    },
    close: () => {
      if (ws) {
        ws.close()
      }
    }
  }
}

export const wsStore = createWebSocketStore()