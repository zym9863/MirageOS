<style>
  .log-panel {
    background-color: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    height: 200px;
    overflow-y: auto;
    padding: 10px;
    border-radius: 8px;
  }

  .log-entry {
    margin-bottom: 5px;
    padding: 4px 8px;
    border-radius: 3px;
  }

  .log-entry.process {
    border-left: 4px solid #4ec9b0; /* 进程模块使用青绿色 */
  }

  .log-entry.memory {
    border-left: 4px solid #9cdcfe; /* 内存模块使用蓝色 */
  }

  .log-timestamp {
    color: #6a9955; /* 时间戳使用绿色 */
    margin-right: 8px;
  }

  .log-module {
    font-weight: bold;
    margin-right: 8px;
  }

  .log-module.process {
    color: #4ec9b0;
  }

  .log-module.memory {
    color: #9cdcfe;
  }

  .log-action {
    color: #dcdcaa; /* 操作类型使用黄色 */
    margin-right: 6px;
  }

  .log-details {
    color: #d4d4d4;
  }

  .log-clear {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    font-size: 11px;
    background-color: #333;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .log-clear:hover {
    background-color: #555;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .log-title {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
  }
</style>

<div class="log-panel">
  <div class="log-header">
    <div class="log-title">系统运行日志</div>
    <button class="log-clear" on:click={clearLogs}>清空日志</button>
  </div>

  {#each logs as log (log.timestamp)}
    <div class="log-entry {log.module === '进程' ? 'process' : 'memory'}">
      <span class="log-timestamp">{formatTime(log.timestamp)}</span>
      <span class="log-module {log.module === '进程' ? 'process' : 'memory'}">[{log.module}]</span>
      <span class="log-action">{log.action}</span>
      <span class="log-details">{log.details}</span>
    </div>
  {/each}
</div>

<script>
  import { logStore } from '../stores/logStore.js'

  let logs = []

  // 订阅日志存储
  logStore.subscribe(value => {
    logs = value
    // 自动滚动到底部
    setTimeout(() => {
      const panel = document.querySelector('.log-panel')
      if (panel) {
        panel.scrollTop = panel.scrollHeight
      }
    }, 10)
  })

  // 格式化时间
  function formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  // 清空日志
  function clearLogs() {
    logStore.clearLogs()
  }
</script>
