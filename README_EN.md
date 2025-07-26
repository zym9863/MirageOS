# MirageOS - Web-based Operating System Kernel Simulator

English | [中文](./README.md)

## Project Overview

MirageOS is a web-based operating system kernel simulator designed to help learners intuitively understand core operating system concepts. Through an interactive visual interface, users can observe and experience key system functions such as process scheduling and memory management.

## Features

### 🔄 Process Scheduling Simulation
- **Multiple Scheduling Algorithms**: Supports First Come First Serve (FCFS), Shortest Job First (SJF), Priority Scheduling, and Round Robin (RR)
- **Process State Visualization**: Real-time display of process states including ready, running, waiting, and terminated
- **Gantt Chart Display**: Visual representation of process execution progress
- **Interactive Control**: Dynamically add processes, switch algorithms, and control execution speed

### 💾 Memory Management Simulation
- **Memory Allocation Algorithms**: Supports First Fit, Best Fit, and Worst Fit algorithms
- **Memory Visualization**: Intuitive display of memory bar allocation status and fragmentation levels
- **Dynamic Management**: Real-time memory allocation and deallocation, observe fragment generation and elimination
- **Statistical Analysis**: Provides statistics on memory utilization and fragmentation levels

## Technology Stack

- **Backend**: Koa.js + WebSocket + Node.js
- **Frontend**: Svelte + Vite
- **Package Manager**: pnpm
- **Architecture**: Frontend-backend separation with real-time communication

## Installation and Setup

1. **Clone the Project**
   ```bash
   git clone https://github.com/zym9863/MirageOS.git
   cd MirageOS
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

4. **Access the Application**
   Open your browser and visit `http://localhost:5173`

## Project Structure

```
MirageOS/
├── package.json          # Project configuration
├── vite.config.js        # Frontend build configuration
├── server/               # Backend code
│   ├── app.js            # Server entry point
│   └── controllers/      # Business logic controllers
│       ├── processScheduler.js  # Process scheduler
│       └── memoryManager.js     # Memory manager
├── client/               # Frontend code
│   ├── index.html        # Entry page
│   ├── src/
│   │   ├── App.svelte    # Main application component
│   │   ├── main.js       # Application entry
│   │   ├── components/   # Feature components
│   │   │   ├── ProcessScheduler.svelte  # Process scheduling component
│   │   │   └── MemoryManager.svelte     # Memory management component
│   │   └── stores/       # State management
│   │       ├── websocket.js      # WebSocket connection
│   │       ├── processStore.js   # Process state
│   │       └── memoryStore.js    # Memory state
│   └── public/           # Static assets
```

## Usage Guide

### Process Scheduling Simulation
1. Select scheduling algorithm (FCFS, SJF, Priority, RR)
2. Add processes (set name, CPU time, priority)
3. Click "Start" button to begin scheduling simulation
4. Observe process state changes and execution progress

### Memory Management Simulation
1. Select memory allocation algorithm (First Fit, Best Fit, Worst Fit)
2. Allocate memory for processes (input process name and memory size)
3. Observe visual changes in memory bar
4. Use memory compression feature to organize fragments

## Development Notes

- Backend provides RESTful API and WebSocket interfaces
- Frontend uses Svelte's reactive features for real-time updates
- WebSocket ensures multi-client state synchronization
- Component-based design facilitates feature expansion

## License

MIT License

## Contributing

Welcome to submit Issues and Pull Requests to improve the project!