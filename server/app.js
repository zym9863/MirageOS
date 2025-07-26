import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import cors from 'koa-cors'
import serve from 'koa-static'
import { WebSocketServer } from 'ws'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { ProcessScheduler } from './controllers/processScheduler.js'
import { MemoryManager } from './controllers/memoryManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 初始化系统组件
const processScheduler = new ProcessScheduler()
const memoryManager = new MemoryManager(1024)

const app = new Koa()
const router = new Router()

// 中间件
app.use(cors())
app.use(bodyParser())

// 静态文件服务
app.use(serve(path.join(__dirname, '../dist')))

// API路由
router.get('/api/health', (ctx) => {
  ctx.body = { status: 'ok', message: 'MirageOS服务器运行中' }
})

// 进程管理API
router.get('/api/processes', (ctx) => {
  ctx.body = processScheduler.getSystemState()
})

router.post('/api/processes', (ctx) => {
  const { name, burstTime, priority } = ctx.request.body
  const process = processScheduler.addProcess({
    id: Date.now() + Math.random(),
    name,
    burstTime: parseInt(burstTime),
    priority: parseInt(priority)
  })
  
  ctx.body = { success: true, process }
})

router.delete('/api/processes/:id', (ctx) => {
  const processId = parseInt(ctx.params.id)
  processScheduler.removeProcess(processId)
  ctx.body = { success: true }
})

router.post('/api/processes/step', (ctx) => {
  const state = processScheduler.executeStep()
  ctx.body = state
})

router.post('/api/processes/algorithm', (ctx) => {
  const { algorithm } = ctx.request.body
  processScheduler.setSchedulingAlgorithm(algorithm)
  ctx.body = { success: true, algorithm }
})

// 内存管理API
router.get('/api/memory', (ctx) => {
  ctx.body = memoryManager.getMemoryState()
})

router.post('/api/memory/allocate', (ctx) => {
  const { processId, size } = ctx.request.body
  const result = memoryManager.allocateMemory(processId, parseInt(size))
  ctx.body = result
})

router.post('/api/memory/deallocate', (ctx) => {
  const { processId } = ctx.request.body
  const result = memoryManager.deallocateMemory(processId)
  ctx.body = result
})

router.post('/api/memory/algorithm', (ctx) => {
  const { algorithm } = ctx.request.body
  memoryManager.setAllocationAlgorithm(algorithm)
  ctx.body = { success: true, algorithm }
})

app.use(router.routes())
app.use(router.allowedMethods())

// 服务器启动
const PORT = process.env.PORT || 3000
const server = http.createServer(app.callback())

// WebSocket服务器
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  console.log('WebSocket客户端已连接')
  
  // 发送初始状态
  ws.send(JSON.stringify({
    type: 'init',
    processState: processScheduler.getSystemState(),
    memoryState: memoryManager.getMemoryState()
  }))
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      console.log('收到消息:', data)
      
      let response = { type: 'response', success: true }
      
      switch (data.type) {
        case 'process_step':
          response.processState = processScheduler.executeStep()
          break
        case 'process_add':
          const process = processScheduler.addProcess({
            id: Date.now() + Math.random(),
            name: data.name,
            burstTime: data.burstTime,
            priority: data.priority
          })
          response.process = process
          response.processState = processScheduler.getSystemState()
          break
        case 'memory_allocate':
          response.memoryResult = memoryManager.allocateMemory(data.processId, data.size)
          response.memoryState = memoryManager.getMemoryState()
          break
        case 'memory_deallocate':
          response.memoryResult = memoryManager.deallocateMemory(data.processId)
          response.memoryState = memoryManager.getMemoryState()
          break
      }
      
      // 广播给所有客户端
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(response))
        }
      })
    } catch (error) {
      console.error('WebSocket消息解析错误:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息处理失败'
      }))
    }
  })
  
  ws.on('close', () => {
    console.log('WebSocket客户端已断开')
  })
})

server.listen(PORT, () => {
  console.log(`MirageOS服务器运行在 http://localhost:${PORT}`)
})