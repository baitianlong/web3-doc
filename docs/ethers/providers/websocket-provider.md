---
title: WebSocketProvider
description: 深入了解 Ethers.js 中的 WebSocketProvider，实现实时事件监听和高效数据传输
keywords: [ethers.js, WebSocketProvider, WebSocket, 实时监听, 事件订阅, Web3]
---

# WebSocketProvider

`WebSocketProvider` 是 Ethers.js 中基于 WebSocket 协议的 Provider，它提供了持久连接和实时事件监听能力。相比 HTTP 连接，WebSocket 连接更适合需要实时数据更新的应用场景。

## 基本用法

```typescript
import { ethers } from 'ethers';

// 创建 WebSocket Provider
const wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');

// 监听新区块
wsProvider.on('block', (blockNumber) => {
  console.log('新区块:', blockNumber);
});

// 监听待处理交易
wsProvider.on('pending', (txHash) => {
  console.log('待处理交易:', txHash);
});
```

## 构造函数

### 基本构造

```typescript
// 基本 WebSocket 连接
const wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');

// 带网络配置
const wsProviderWithNetwork = new ethers.WebSocketProvider(
  'wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID',
  'mainnet'
);

// 自定义网络配置
const customNetwork = {
  name: 'custom-network',
  chainId: 1337,
  ensAddress: null
};

const customWsProvider = new ethers.WebSocketProvider(
  'ws://localhost:8546',
  customNetwork
);
```

### 连接选项

```typescript
// 带连接选项的构造
const wsProvider = new ethers.WebSocketProvider(
  'wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID',
  'mainnet',
  {
    // WebSocket 选项
    headers: {
      'User-Agent': 'MyApp/1.0'
    },
    // 重连配置
    reconnect: {
      auto: true,
      delay: 5000,
      maxAttempts: 5,
      onTimeout: false
    }
  }
);
```

## 事件监听

### 1. 区块事件

```typescript
// 监听新区块
wsProvider.on('block', (blockNumber) => {
  console.log('新区块号:', blockNumber);
});

// 监听区块详情
wsProvider.on('block', async (blockNumber) => {
  const block = await wsProvider.getBlock(blockNumber);
  console.log('新区块:', {
    number: block.number,
    hash: block.hash,
    timestamp: block.timestamp,
    transactions: block.transactions.length
  });
});
```

### 2. 待处理交易

```typescript
// 监听所有待处理交易
wsProvider.on('pending', (txHash) => {
  console.log('待处理交易:', txHash);
});

// 过滤特定地址的交易
wsProvider.on('pending', async (txHash) => {
  try {
    const tx = await wsProvider.getTransaction(txHash);
    if (tx && (tx.to === '0x...' || tx.from === '0x...')) {
      console.log('相关交易:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value)
      });
    }
  } catch (error) {
    // 交易可能已被确认或丢弃
  }
});
```

### 3. 合约事件

```typescript
// 监听合约事件
const contractAddress = '0x...';
const abi = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const contract = new ethers.Contract(contractAddress, abi, wsProvider);

// 监听 Transfer 事件
contract.on('Transfer', (from, to, value, event) => {
  console.log('Transfer 事件:', {
    from,
    to,
    value: ethers.formatEther(value),
    txHash: event.transactionHash,
    blockNumber: event.blockNumber
  });
});

// 监听特定地址的转账
const filter = contract.filters.Transfer('0x...', null);
contract.on(filter, (from, to, value, event) => {
  console.log('来自特定地址的转账:', {
    from,
    to,
    value: ethers.formatEther(value)
  });
});
```

## 连接管理

### 1. 连接状态监控

```typescript
class WebSocketManager {
  private wsProvider: ethers.WebSocketProvider;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  constructor(url: string) {
    this.wsProvider = new ethers.WebSocketProvider(url);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 监听连接事件
    this.wsProvider.websocket.on('open', () => {
      console.log('WebSocket 连接已建立');
      this.reconnectAttempts = 0;
    });

    // 监听关闭事件
    this.wsProvider.websocket.on('close', (code, reason) => {
      console.log('WebSocket 连接已关闭:', { code, reason });
      this.handleReconnect();
    });

    // 监听错误事件
    this.wsProvider.websocket.on('error', (error) => {
      console.error('WebSocket 错误:', error);
    });
  }

  private async handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.wsProvider = new ethers.WebSocketProvider(this.wsProvider.websocket.url);
        this.setupEventListeners();
      }, this.reconnectDelay);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }

  getProvider() {
    return this.wsProvider;
  }

  destroy() {
    this.wsProvider.destroy();
  }
}
```

### 2. 优雅关闭

```typescript
// 清理资源
function cleanup() {
  // 移除所有监听器
  wsProvider.removeAllListeners();
  
  // 关闭 WebSocket 连接
  wsProvider.destroy();
  
  console.log('WebSocket 连接已清理');
}

// 监听进程退出
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
window?.addEventListener('beforeunload', cleanup);
```

## 实时数据应用

### 1. 实时价格监控

```typescript
class TokenPriceMonitor {
  private wsProvider: ethers.WebSocketProvider;
  private uniswapV2Pair: ethers.Contract;

  constructor() {
    this.wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');
    
    // Uniswap V2 USDC/ETH 交易对
    const pairAddress = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc';
    const pairABI = [
      'event Sync(uint112 reserve0, uint112 reserve1)',
      'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
    ];
    
    this.uniswapV2Pair = new ethers.Contract(pairAddress, pairABI, this.wsProvider);
  }

  startMonitoring() {
    // 监听价格变化
    this.uniswapV2Pair.on('Sync', async (reserve0, reserve1, event) => {
      const price = this.calculatePrice(reserve0, reserve1);
      
      console.log('ETH 价格更新:', {
        price: price.toFixed(2),
        reserve0: ethers.formatUnits(reserve0, 6), // USDC
        reserve1: ethers.formatEther(reserve1),    // ETH
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      });
    });
  }

  private calculatePrice(reserve0: bigint, reserve1: bigint): number {
    // USDC/ETH 价格计算
    const usdc = Number(ethers.formatUnits(reserve0, 6));
    const eth = Number(ethers.formatEther(reserve1));
    return usdc / eth;
  }

  stop() {
    this.uniswapV2Pair.removeAllListeners();
    this.wsProvider.destroy();
  }
}

// 使用示例
const priceMonitor = new TokenPriceMonitor();
priceMonitor.startMonitoring();
```

### 2. 交易池监控

```typescript
class MempoolMonitor {
  private wsProvider: ethers.WebSocketProvider;
  private targetAddresses: Set<string>;

  constructor(addresses: string[]) {
    this.wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');
    this.targetAddresses = new Set(addresses.map(addr => addr.toLowerCase()));
  }

  startMonitoring() {
    console.log('开始监控内存池...');
    
    this.wsProvider.on('pending', async (txHash) => {
      try {
        const tx = await this.wsProvider.getTransaction(txHash);
        
        if (tx && this.isTargetTransaction(tx)) {
          await this.analyzeTransaction(tx);
        }
      } catch (error) {
        // 交易可能已被确认或丢弃
      }
    });
  }

  private isTargetTransaction(tx: ethers.TransactionResponse): boolean {
    return this.targetAddresses.has(tx.to?.toLowerCase() || '') ||
           this.targetAddresses.has(tx.from.toLowerCase());
  }

  private async analyzeTransaction(tx: ethers.TransactionResponse) {
    console.log('发现目标交易:', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasPrice: ethers.formatUnits(tx.gasPrice || 0n, 'gwei'),
      gasLimit: tx.gasLimit?.toString(),
      data: tx.data.slice(0, 10) + '...'
    });

    // 可以在这里添加更多分析逻辑
    // 例如：解析合约调用、计算 MEV 机会等
  }

  stop() {
    this.wsProvider.removeAllListeners();
    this.wsProvider.destroy();
  }
}
```

## 性能优化

### 1. 事件过滤

```typescript
// 使用过滤器减少不必要的事件
const filter = {
  address: '0x...', // 只监听特定合约
  topics: [
    ethers.id('Transfer(address,address,uint256)') // 只监听 Transfer 事件
  ]
};

wsProvider.on(filter, (log) => {
  console.log('过滤后的事件:', log);
});
```

### 2. 批量处理

```typescript
class BatchEventProcessor {
  private eventQueue: any[] = [];
  private batchSize = 10;
  private batchTimeout = 1000;
  private timeoutId: NodeJS.Timeout | null = null;

  addEvent(event: any) {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.processBatch(), this.batchTimeout);
    }
  }

  private processBatch() {
    if (this.eventQueue.length === 0) return;
    
    const batch = this.eventQueue.splice(0, this.batchSize);
    console.log('处理事件批次:', batch.length);
    
    // 批量处理事件
    this.handleEvents(batch);
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleEvents(events: any[]) {
    // 实际的事件处理逻辑
    events.forEach(event => {
      // 处理单个事件
    });
  }
}
```

## 错误处理

### 1. 连接错误处理

```typescript
class RobustWebSocketProvider {
  private wsProvider: ethers.WebSocketProvider | null = null;
  private url: string;
  private network: string;
  private isConnecting = false;

  constructor(url: string, network: string = 'mainnet') {
    this.url = url;
    this.network = network;
    this.connect();
  }

  private async connect() {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      this.wsProvider = new ethers.WebSocketProvider(this.url, this.network);
      
      // 测试连接
      await this.wsProvider.getBlockNumber();
      
      console.log('WebSocket 连接成功');
      this.isConnecting = false;
      
      // 设置错误处理
      this.wsProvider.websocket.on('error', (error) => {
        console.error('WebSocket 错误:', error);
        this.handleConnectionError();
      });
      
      this.wsProvider.websocket.on('close', () => {
        console.log('WebSocket 连接关闭');
        this.handleConnectionError();
      });
      
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.isConnecting = false;
      
      // 延迟重连
      setTimeout(() => this.connect(), 5000);
    }
  }

  private handleConnectionError() {
    if (this.wsProvider) {
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
    
    // 重新连接
    setTimeout(() => this.connect(), 5000);
  }

  getProvider(): ethers.WebSocketProvider | null {
    return this.wsProvider;
  }

  destroy() {
    if (this.wsProvider) {
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
  }
}
```

### 2. 事件处理错误

```typescript
// 安全的事件监听器
function safeEventListener(eventName: string, handler: (...args: any[]) => void) {
  return wsProvider.on(eventName, async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(`事件 ${eventName} 处理错误:`, error);
      
      // 可以添加错误报告逻辑
      // reportError(error, { eventName, args });
    }
  });
}

// 使用示例
safeEventListener('block', async (blockNumber) => {
  const block = await wsProvider.getBlock(blockNumber);
  // 处理区块数据
});
```

## 最佳实践

### 1. 资源管理

```typescript
class WebSocketResourceManager {
  private providers: Map<string, ethers.WebSocketProvider> = new Map();
  private listeners: Map<string, any[]> = new Map();

  createProvider(name: string, url: string): ethers.WebSocketProvider {
    if (this.providers.has(name)) {
      throw new Error(`Provider ${name} 已存在`);
    }

    const provider = new ethers.WebSocketProvider(url);
    this.providers.set(name, provider);
    this.listeners.set(name, []);

    return provider;
  }

  addListener(providerName: string, event: string, listener: any) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} 不存在`);
    }

    provider.on(event, listener);
    this.listeners.get(providerName)?.push({ event, listener });
  }

  removeProvider(name: string) {
    const provider = this.providers.get(name);
    if (provider) {
      // 移除所有监听器
      const listeners = this.listeners.get(name) || [];
      listeners.forEach(({ event, listener }) => {
        provider.off(event, listener);
      });

      // 关闭连接
      provider.destroy();

      // 清理映射
      this.providers.delete(name);
      this.listeners.delete(name);
    }
  }

  cleanup() {
    for (const name of this.providers.keys()) {
      this.removeProvider(name);
    }
  }
}
```

### 2. 监控和日志

```typescript
class WebSocketMonitor {
  private wsProvider: ethers.WebSocketProvider;
  private stats = {
    messagesReceived: 0,
    errorsCount: 0,
    reconnectCount: 0,
    lastMessageTime: 0
  };

  constructor(url: string) {
    this.wsProvider = new ethers.WebSocketProvider(url);
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // 监控消息
    this.wsProvider.websocket.on('message', () => {
      this.stats.messagesReceived++;
      this.stats.lastMessageTime = Date.now();
    });

    // 监控错误
    this.wsProvider.websocket.on('error', () => {
      this.stats.errorsCount++;
    });

    // 定期输出统计信息
    setInterval(() => {
      console.log('WebSocket 统计:', {
        ...this.stats,
        timeSinceLastMessage: Date.now() - this.stats.lastMessageTime
      });
    }, 30000);
  }

  getStats() {
    return { ...this.stats };
  }
}
```

## 常见问题

### Q: WebSocket 连接频繁断开怎么办？
A: 实现自动重连机制，检查网络稳定性，考虑使用多个 WebSocket 提供商进行故障转移。

### Q: 如何处理大量实时事件？
A: 使用事件过滤、批量处理、队列机制，避免阻塞主线程。

### Q: WebSocket vs HTTP Provider 如何选择？
A: 需要实时数据时使用 WebSocket，一般查询使用 HTTP。可以组合使用。

### Q: 如何优化 WebSocket 性能？
A: 合理设置过滤器、批量处理事件、及时清理监听器、监控连接状态。

## 下一步

- [FallbackProvider](/ethers/providers/fallback-provider) - 学习故障转移配置
- [事件监听](/ethers/contracts/events) - 深入了解合约事件
- [实时数据应用](/ethers/examples/real-time-data) - 构建实时 DApp