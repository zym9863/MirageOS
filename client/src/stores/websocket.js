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
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('收到WebSocket消息:', data)
          // 处理收到的消息
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