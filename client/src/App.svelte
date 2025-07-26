<script>
  import ProcessScheduler from './components/ProcessScheduler.svelte'
  import MemoryManager from './components/MemoryManager.svelte'
  import { onMount } from 'svelte'
  import { websocket } from './stores/websocket.js'

  let activeTab = 'process'

  onMount(() => {
    websocket.connect()
  })

  function switchTab(tab) {
    activeTab = tab
  }
</script>

<main>
  <header>
    <h1>🖥️ MirageOS - 操作系统内核模拟器</h1>
    <nav>
      <button 
        class="tab-button" 
        class:active={activeTab === 'process'}
        on:click={() => switchTab('process')}
      >
        进程调度
      </button>
      <button 
        class="tab-button" 
        class:active={activeTab === 'memory'}
        on:click={() => switchTab('memory')}
      >
        内存管理
      </button>
    </nav>
  </header>

  <div class="content">
    {#if activeTab === 'process'}
      <ProcessScheduler />
    {:else if activeTab === 'memory'}
      <MemoryManager />
    {/if}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  h1 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 2rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  .tab-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
  }

  .tab-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .tab-button.active {
    background: rgba(255, 255, 255, 0.9);
    color: #667eea;
    font-weight: bold;
  }

  .content {
    flex: 1;
    padding: 2rem;
  }
</style>