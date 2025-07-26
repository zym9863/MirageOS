# MirageOS - 网页版操作系统内核模拟器

[English](./README_EN.md) | 中文

## 项目简介

MirageOS 是一个基于Web技术的操作系统内核模拟器，旨在帮助学习者直观地理解操作系统的核心概念。通过交互式的可视化界面，用户可以观察和体验进程调度、内存管理等关键系统功能。

## 功能特性

### 🔄 进程调度模拟
- **多种调度算法**：支持先来先服务(FCFS)、最短作业优先(SJF)、优先级调度、时间片轮转(RR)
- **进程状态可视化**：实时显示进程的就绪、运行、等待、终止状态
- **甘特图展示**：以图表形式展示进程执行进度
- **交互式控制**：可以动态添加进程、切换算法、控制执行速度

### 💾 内存管理模拟
- **内存分配算法**：支持首次适应、最佳适应、最坏适应算法
- **内存可视化**：直观显示内存条的分配情况和碎片化程度
- **动态管理**：实时分配和释放内存，观察碎片的产生和消除
- **统计分析**：提供内存使用率、碎片化程度等统计数据

## 技术栈

- **后端**：Koa.js + WebSocket + Node.js
- **前端**：Svelte + Vite
- **包管理**：pnpm
- **架构**：前后端分离，实时通信

## 安装与运行

1. **克隆项目**
   ```bash
   git clone https://github.com/zym9863/MirageOS.git
   cd MirageOS
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:5173`

## 项目结构

```
MirageOS/
├── package.json          # 项目配置
├── vite.config.js        # 前端构建配置
├── server/               # 后端代码
│   ├── app.js            # 服务器入口
│   └── controllers/      # 业务逻辑控制器
│       ├── processScheduler.js  # 进程调度器
│       └── memoryManager.js     # 内存管理器
├── client/               # 前端代码
│   ├── index.html        # 入口页面
│   ├── src/
│   │   ├── App.svelte    # 主应用组件
│   │   ├── main.js       # 应用入口
│   │   ├── components/   # 功能组件
│   │   │   ├── ProcessScheduler.svelte  # 进程调度组件
│   │   │   └── MemoryManager.svelte     # 内存管理组件
│   │   └── stores/       # 状态管理
│   │       ├── websocket.js      # WebSocket连接
│   │       ├── processStore.js   # 进程状态
│   │       └── memoryStore.js    # 内存状态
│   └── public/           # 静态资源
```

## 使用指南

### 进程调度模拟
1. 选择调度算法（FCFS、SJF、Priority、RR）
2. 添加进程（设置名称、CPU时间、优先级）
3. 点击"开始"按钮启动调度模拟
4. 观察进程状态变化和执行进度

### 内存管理模拟
1. 选择内存分配算法（首次适应、最佳适应、最坏适应）
2. 为进程分配内存（输入进程名和内存大小）
3. 观察内存条的可视化变化
4. 使用内存压缩功能整理碎片

## 开发说明

- 后端提供RESTful API和WebSocket接口
- 前端使用Svelte的响应式特性实现实时更新
- WebSocket确保多客户端状态同步
- 组件化设计便于功能扩展

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进项目！