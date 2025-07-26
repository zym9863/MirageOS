<script>
  import ProcessScheduler from './components/ProcessScheduler.svelte'
  import MemoryManager from './components/MemoryManager.svelte'
  import { onMount } from 'svelte'
  import { wsStore } from './stores/websocket.js'
  import { fade, slide } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'

  let activeTab = 'process'
  let isLoading = true
  let wsConnection = null

  // 监听WebSocket连接状态
  $: if (wsConnection) {
    isLoading = false
  }

  onMount(() => {
    // 订阅WebSocket连接状态
    const unsubscribe = wsStore.subscribe(value => {
      wsConnection = value
    })
    
    // 连接WebSocket
    wsStore.connect()
    
    // 设置超时，如果5秒内无法连接则显示错误
    const timeout = setTimeout(() => {
      if (!wsConnection) {
        console.warn('WebSocket连接超时，仍在尝试连接...')
        isLoading = false // 即使连接失败也显示界面
      }
    }, 5000)
    
    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  })

  function switchTab(tab) {
    if (tab !== activeTab) {
      activeTab = tab
    }
  }
</script>

<main>
  <header>
    <h1 in:fade={{ duration: 800, delay: 200 }}>🖥️ MirageOS - 操作系统内核模拟器</h1>
    <nav in:slide={{ duration: 600, delay: 400, easing: quintOut }}>
      <button 
        class="tab-button" 
        class:active={activeTab === 'process'}
        on:click={() => switchTab('process')}
        disabled={isLoading}
      >
        <span class="tab-icon">⚙️</span>
        进程调度
      </button>
      <button 
        class="tab-button" 
        class:active={activeTab === 'memory'}
        on:click={() => switchTab('memory')}
        disabled={isLoading}
      >
        <span class="tab-icon">💾</span>
        内存管理
      </button>
    </nav>
  </header>

  <div class="content">
    {#if isLoading}
      <div class="loading-container" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
        <div class="loading-spinner"></div>
        <p class="loading-text">正在初始化系统内核...</p>
      </div>
    {:else}
      {#if activeTab === 'process'}
        <div in:fade={{ duration: 400, delay: 100 }} out:fade={{ duration: 200 }}>
          <ProcessScheduler />
        </div>
      {:else if activeTab === 'memory'}
        <div in:fade={{ duration: 400, delay: 100 }} out:fade={{ duration: 200 }}>
          <MemoryManager />
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 100%);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  :global(body::before) {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 60%, rgba(119, 198, 255, 0.2) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  :global(:root) {
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --secondary-color: #8b5cf6;
    --accent-color: #06b6d4;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-primary: rgba(15, 23, 42, 0.95);
    --bg-secondary: rgba(30, 41, 59, 0.95);
    --bg-tertiary: rgba(51, 65, 85, 0.9);
    --border-color: rgba(148, 163, 184, 0.2);
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  header {
    background: var(--bg-primary);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-color);
    padding: 1.5rem 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  h1 {
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
  }

  nav {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-secondary);
    padding: 0.5rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  .tab-button {
    padding: 0.875rem 2rem;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab-icon {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }

  .tab-button:hover .tab-icon {
    transform: scale(1.1) rotate(5deg);
  }

  .tab-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 12px;
  }

  .tab-button:hover {
    color: var(--text-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .tab-button:hover::before {
    opacity: 0.1;
  }

  .tab-button.active {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    font-weight: 600;
    box-shadow: var(--shadow-xl);
    transform: translateY(-1px);
  }

  .tab-button.active::before {
    opacity: 0;
  }

  .content {
    flex: 1;
    padding: 2rem;
    animation: fadeInUp 0.6s ease-out;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 2rem;
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }

  .loading-text {
    color: var(--text-secondary);
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    header {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    nav {
      flex-direction: column;
      gap: 0.25rem;
    }

    .tab-button {
      padding: 0.75rem 1.5rem;
      text-align: center;
      justify-content: center;
    }

    .tab-icon {
      font-size: 1.1rem;
    }

    .content {
      padding: 1rem;
    }
  }
</style>