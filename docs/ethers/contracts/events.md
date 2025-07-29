---
title: 事件监听
description: Ethers.js 中智能合约事件监听的完整指南
keywords: [ethers, 事件监听, 智能合约, 日志, 过滤器, Web3]
---

# 事件监听

事件监听是 Web3 应用中获取实时数据的重要方式。Ethers.js 提供了强大的事件监听功能，支持实时监听、历史查询、过滤器等多种方式。

## 事件基础

### 1. 事件类型和结构

```typescript
// 事件定义示例
interface ContractEvents {
  // ERC-20 Transfer 事件
  Transfer: {
    from: string;
    to: string;
    value: bigint;
  };
  
  // ERC-20 Approval 事件
  Approval: {
    owner: string;
    spender: string;
    value: bigint;
  };
  
  // 自定义事件
  CustomEvent: {
    user: string;
    amount: bigint;
    timestamp: bigint;
    data: string;
  };
}

// 事件日志结构
interface EventLog {
  address: string;           // 合约地址
  topics: string[];         // 事件主题
  data: string;             // 事件数据
  blockNumber: number;      // 区块号
  blockHash: string;        // 区块哈希
  transactionHash: string;  // 交易哈希
  transactionIndex: number; // 交易索引
  logIndex: number;         // 日志索引
  removed: boolean;         // 是否被移除
}
```

### 2. 基本事件监听

```typescript
import { ethers } from 'ethers';

// 创建合约实例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const contractAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
const contractABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 基本事件监听
contract.on('Transfer', (from, to, value, event) => {
  console.log('Transfer 事件:', {
    from,
    to,
    value: ethers.formatEther(value),
    blockNumber: event.log.blockNumber,
    transactionHash: event.log.transactionHash
  });
});

// 监听所有事件
contract.on('*', (event) => {
  console.log('事件触发:', event.eventName, event.args);
});

// 移除监听器
contract.off('Transfer', listener);
contract.removeAllListeners('Transfer');
```

## 实时事件监听

### 1. 高级事件监听器

```typescript
class EventListener {
  private contract: ethers.Contract;
  private listeners: Map<string, Function[]> = new Map();
  private isListening: boolean = false;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 添加事件监听器
  addEventListener(
    eventName: string,
    callback: Function,
    options: {
      once?: boolean;
      filter?: any;
      fromBlock?: number;
    } = {}
  ): void {
    const wrappedCallback = (...args: any[]) => {
      try {
        // 应用过滤器
        if (options.filter && !this.applyFilter(args, options.filter)) {
          return;
        }

        callback(...args);

        // 如果是一次性监听器，移除它
        if (options.once) {
          this.removeEventListener(eventName, callback);
        }
      } catch (error) {
        console.error(`事件处理错误 (${eventName}):`, error);
      }
    };

    // 存储监听器
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(wrappedCallback);

    // 添加到合约
    this.contract.on(eventName, wrappedCallback);
  }

  // 移除事件监听器
  removeEventListener(eventName: string, callback?: Function): void {
    if (callback) {
      this.contract.off(eventName, callback);
      
      const listeners = this.listeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.contract.removeAllListeners(eventName);
      this.listeners.delete(eventName);
    }
  }

  // 应用过滤器
  private applyFilter(args: any[], filter: any): boolean {
    // 简单的过滤器实现
    for (const [key, value] of Object.entries(filter)) {
      const argIndex = parseInt(key);
      if (args[argIndex] !== value) {
        return false;
      }
    }
    return true;
  }

  // 开始监听
  startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('开始监听事件...');
  }

  // 停止监听
  stopListening(): void {
    if (!this.isListening) return;
    
    this.contract.removeAllListeners();
    this.listeners.clear();
    this.isListening = false;
    console.log('停止监听事件');
  }

  // 获取监听器状态
  getListenerStatus(): {
    isListening: boolean;
    eventCount: number;
    events: string[];
  } {
    return {
      isListening: this.isListening,
      eventCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
      events: Array.from(this.listeners.keys())
    };
  }
}

// 使用示例
const eventListener = new EventListener(contract);

// 监听 Transfer 事件
eventListener.addEventListener('Transfer', (from, to, value, event) => {
  console.log(`转账: ${from} -> ${to}, 金额: ${ethers.formatEther(value)}`);
});

// 监听特定地址的转账
eventListener.addEventListener('Transfer', (from, to, value, event) => {
  console.log(`特定地址转账: ${ethers.formatEther(value)}`);
}, {
  filter: { 0: '0x...specificAddress' } // 过滤 from 地址
});

// 一次性监听
eventListener.addEventListener('Approval', (owner, spender, value) => {
  console.log('首次授权事件:', { owner, spender, value });
}, { once: true });

eventListener.startListening();
```

### 2. 事件缓冲和批处理

```typescript
class EventBuffer {
  private buffer: any[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private onFlush: (events: any[]) => void;

  constructor(
    batchSize: number = 10,
    flushInterval: number = 5000,
    onFlush: (events: any[]) => void
  ) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.onFlush = onFlush;
    this.startTimer();
  }

  // 添加事件到缓冲区
  addEvent(event: any): void {
    this.buffer.push({
      ...event,
      timestamp: Date.now()
    });

    // 如果达到批处理大小，立即刷新
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  // 刷新缓冲区
  private flush(): void {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];
    
    try {
      this.onFlush(events);
    } catch (error) {
      console.error('事件批处理失败:', error);
    }

    this.resetTimer();
  }

  // 重置定时器
  private resetTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.startTimer();
  }

  // 启动定时器
  private startTimer(): void {
    this.timer = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  // 停止缓冲
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flush(); // 刷新剩余事件
  }
}

// 使用示例
const eventBuffer = new EventBuffer(
  5,    // 批处理大小
  3000, // 3秒刷新间隔
  (events) => {
    console.log(`处理 ${events.length} 个事件:`, events);
    // 批量处理事件，如保存到数据库
  }
);

contract.on('Transfer', (from, to, value, event) => {
  eventBuffer.addEvent({
    type: 'Transfer',
    from,
    to,
    value: value.toString(),
    blockNumber: event.log.blockNumber,
    transactionHash: event.log.transactionHash
  });
});
```

### 3. 事件重连和错误恢复

```typescript
class RobustEventListener {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.provider = contract.runner?.provider!;
    this.setupErrorHandling();
  }

  // 设置错误处理
  private setupErrorHandling(): void {
    // 监听 provider 错误
    this.provider.on('error', (error) => {
      console.error('Provider 错误:', error);
      this.handleDisconnection();
    });

    // 监听网络变化
    this.provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        console.log('网络变化:', oldNetwork.chainId, '->', newNetwork.chainId);
        this.handleNetworkChange(newNetwork, oldNetwork);
      }
    });
  }

  // 处理断线
  private async handleDisconnection(): Promise<void> {
    this.isConnected = false;
    console.log('连接断开，尝试重连...');

    while (this.reconnectAttempts < this.maxReconnectAttempts) {
      try {
        await this.reconnect();
        break;
      } catch (error) {
        this.reconnectAttempts++;
        console.error(`重连失败 (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          await this.delay(this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
      }
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('重连失败，已达到最大尝试次数');
      this.onMaxReconnectAttemptsReached();
    }
  }

  // 重连
  private async reconnect(): Promise<void> {
    // 测试连接
    await this.provider.getBlockNumber();
    
    // 重新设置事件监听器
    this.reattachEventListeners();
    
    this.isConnected = true;
    this.reconnectAttempts = 0;
    console.log('重连成功');
  }

  // 重新附加事件监听器
  private reattachEventListeners(): void {
    for (const [eventName, handlers] of this.eventHandlers) {
      for (const handler of handlers) {
        this.contract.on(eventName, handler);
      }
    }
  }

  // 处理网络变化
  private handleNetworkChange(newNetwork: any, oldNetwork: any): void {
    console.log('检测到网络变化，重新初始化...');
    this.removeAllListeners();
    this.reattachEventListeners();
  }

  // 添加事件监听器
  addEventListener(eventName: string, handler: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
    this.contract.on(eventName, handler);
  }

  // 移除事件监听器
  removeEventListener(eventName: string, handler?: Function): void {
    if (handler) {
      this.contract.off(eventName, handler);
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.contract.removeAllListeners(eventName);
      this.eventHandlers.delete(eventName);
    }
  }

  // 移除所有监听器
  removeAllListeners(): void {
    this.contract.removeAllListeners();
    this.eventHandlers.clear();
  }

  // 达到最大重连次数时的处理
  private onMaxReconnectAttemptsReached(): void {
    // 可以发送通知、切换到备用节点等
    console.error('无法重连，请检查网络连接');
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取连接状态
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    eventListeners: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      eventListeners: Array.from(this.eventHandlers.values()).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// 使用示例
const robustListener = new RobustEventListener(contract);

robustListener.addEventListener('Transfer', (from, to, value, event) => {
  console.log('稳定的 Transfer 监听:', { from, to, value });
});
```

## 历史事件查询

### 1. 基本历史查询

```typescript
class HistoricalEventQuery {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.provider = contract.runner?.provider!;
  }

  // 查询历史事件
  async queryEvents(
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest',
    filters: any = {}
  ): Promise<any[]> {
    try {
      console.log(`查询 ${eventName} 事件: 区块 ${fromBlock} - ${toBlock}`);

      // 创建过滤器
      const filter = this.contract.filters[eventName](...Object.values(filters));
      
      // 查询事件
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      
      console.log(`找到 ${events.length} 个 ${eventName} 事件`);
      
      return events.map(event => ({
        ...event.args,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        address: event.address
      }));
    } catch (error) {
      console.error(`查询 ${eventName} 事件失败:`, error);
      throw error;
    }
  }

  // 分页查询历史事件
  async queryEventsPaginated(
    eventName: string,
    fromBlock: number,
    toBlock: number,
    pageSize: number = 1000,
    filters: any = {}
  ): Promise<{
    events: any[];
    totalBlocks: number;
    processedBlocks: number;
  }> {
    const allEvents: any[] = [];
    const totalBlocks = toBlock - fromBlock + 1;
    let processedBlocks = 0;

    for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
      const endBlock = Math.min(currentBlock + pageSize - 1, toBlock);
      
      try {
        const events = await this.queryEvents(eventName, currentBlock, endBlock, filters);
        allEvents.push(...events);
        
        processedBlocks += (endBlock - currentBlock + 1);
        
        console.log(`进度: ${processedBlocks}/${totalBlocks} 区块 (${Math.round(processedBlocks / totalBlocks * 100)}%)`);
        
        // 避免请求过于频繁
        await this.delay(100);
      } catch (error) {
        console.error(`查询区块 ${currentBlock}-${endBlock} 失败:`, error);
        // 继续处理下一批
      }
    }

    return {
      events: allEvents,
      totalBlocks,
      processedBlocks
    };
  }

  // 查询特定交易的事件
  async queryTransactionEvents(transactionHash: string): Promise<any[]> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      if (!receipt) {
        throw new Error('交易收据不存在');
      }

      const events = [];
      for (const log of receipt.logs) {
        try {
          // 尝试解析日志
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog) {
            events.push({
              ...parsedLog.args,
              eventName: parsedLog.name,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.logIndex
            });
          }
        } catch {
          // 忽略无法解析的日志
        }
      }

      return events;
    } catch (error) {
      console.error('查询交易事件失败:', error);
      throw error;
    }
  }

  // 查询用户相关的所有事件
  async queryUserEvents(
    userAddress: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest'
  ): Promise<{
    transfers: any[];
    approvals: any[];
    other: any[];
  }> {
    const results = {
      transfers: [] as any[],
      approvals: [] as any[],
      other: [] as any[]
    };

    try {
      // 查询作为发送方的转账
      const transfersFrom = await this.queryEvents('Transfer', fromBlock, toBlock, {
        from: userAddress
      });

      // 查询作为接收方的转账
      const transfersTo = await this.queryEvents('Transfer', fromBlock, toBlock, {
        to: userAddress
      });

      // 合并并去重转账事件
      const allTransfers = [...transfersFrom, ...transfersTo];
      const uniqueTransfers = allTransfers.filter((transfer, index, self) => 
        index === self.findIndex(t => t.transactionHash === transfer.transactionHash && t.logIndex === transfer.logIndex)
      );

      results.transfers = uniqueTransfers;

      // 查询授权事件
      results.approvals = await this.queryEvents('Approval', fromBlock, toBlock, {
        owner: userAddress
      });

      console.log(`用户 ${userAddress} 的事件统计:`, {
        transfers: results.transfers.length,
        approvals: results.approvals.length
      });

      return results;
    } catch (error) {
      console.error('查询用户事件失败:', error);
      throw error;
    }
  }

  // 统计事件数据
  async getEventStatistics(
    eventName: string,
    fromBlock: number,
    toBlock: number
  ): Promise<{
    totalEvents: number;
    uniqueAddresses: number;
    blockRange: { from: number; to: number };
    timeRange?: { from: Date; to: Date };
    topAddresses: Array<{ address: string; count: number }>;
  }> {
    const events = await this.queryEvents(eventName, fromBlock, toBlock);
    
    // 统计地址
    const addressCounts = new Map<string, number>();
    
    events.forEach(event => {
      // 假设事件有 from 和 to 字段
      if (event.from) {
        addressCounts.set(event.from, (addressCounts.get(event.from) || 0) + 1);
      }
      if (event.to && event.to !== event.from) {
        addressCounts.set(event.to, (addressCounts.get(event.to) || 0) + 1);
      }
    });

    // 获取时间范围
    let timeRange: { from: Date; to: Date } | undefined;
    if (events.length > 0) {
      try {
        const fromBlockInfo = await this.provider.getBlock(fromBlock);
        const toBlockInfo = await this.provider.getBlock(toBlock);
        
        if (fromBlockInfo && toBlockInfo) {
          timeRange = {
            from: new Date(fromBlockInfo.timestamp * 1000),
            to: new Date(toBlockInfo.timestamp * 1000)
          };
        }
      } catch (error) {
        console.warn('获取时间范围失败:', error);
      }
    }

    // 排序地址
    const topAddresses = Array.from(addressCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([address, count]) => ({ address, count }));

    return {
      totalEvents: events.length,
      uniqueAddresses: addressCounts.size,
      blockRange: { from: fromBlock, to: toBlock },
      timeRange,
      topAddresses
    };
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const historicalQuery = new HistoricalEventQuery(contract);

// 查询最近 1000 个区块的 Transfer 事件
const recentTransfers = await historicalQuery.queryEvents(
  'Transfer',
  18000000,
  18001000
);

// 分页查询大范围历史事件
const { events, totalBlocks, processedBlocks } = await historicalQuery.queryEventsPaginated(
  'Transfer',
  17000000,
  18000000,
  5000 // 每次查询 5000 个区块
);

// 查询特定用户的所有事件
const userEvents = await historicalQuery.queryUserEvents(
  '0x...userAddress',
  17000000,
  'latest'
);

// 获取事件统计
const stats = await historicalQuery.getEventStatistics(
  'Transfer',
  17000000,
  18000000
);
console.log('事件统计:', stats);
```

## 事件过滤器

### 1. 高级过滤器

```typescript
class EventFilter {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 创建复合过滤器
  createCompoundFilter(
    eventName: string,
    conditions: {
      addresses?: string[];
      valueRange?: { min?: bigint; max?: bigint };
      timeRange?: { from?: number; to?: number };
      customFilter?: (event: any) => boolean;
    }
  ): any {
    // 基础过滤器
    let filter = this.contract.filters[eventName]();

    // 地址过滤
    if (conditions.addresses && conditions.addresses.length > 0) {
      // 对于 Transfer 事件，可以过滤 from 或 to
      if (eventName === 'Transfer') {
        // 创建多个过滤器并合并
        const fromFilters = conditions.addresses.map(addr => 
          this.contract.filters.Transfer(addr, null)
        );
        const toFilters = conditions.addresses.map(addr => 
          this.contract.filters.Transfer(null, addr)
        );
        
        // 这里简化处理，实际应用中可能需要更复杂的逻辑
        filter = fromFilters[0]; // 示例
      }
    }

    return filter;
  }

  // 应用运行时过滤器
  applyRuntimeFilter(
    events: any[],
    conditions: {
      valueRange?: { min?: bigint; max?: bigint };
      timeRange?: { from?: number; to?: number };
      customFilter?: (event: any) => boolean;
    }
  ): any[] {
    return events.filter(event => {
      // 值范围过滤
      if (conditions.valueRange && event.value) {
        const value = BigInt(event.value);
        if (conditions.valueRange.min && value < conditions.valueRange.min) {
          return false;
        }
        if (conditions.valueRange.max && value > conditions.valueRange.max) {
          return false;
        }
      }

      // 时间范围过滤
      if (conditions.timeRange && event.blockNumber) {
        if (conditions.timeRange.from && event.blockNumber < conditions.timeRange.from) {
          return false;
        }
        if (conditions.timeRange.to && event.blockNumber > conditions.timeRange.to) {
          return false;
        }
      }

      // 自定义过滤器
      if (conditions.customFilter && !conditions.customFilter(event)) {
        return false;
      }

      return true;
    });
  }

  // 创建动态过滤器
  createDynamicFilter(
    eventName: string,
    filterFunction: (blockNumber: number) => any
  ): {
    filter: any;
    updateFilter: (blockNumber: number) => void;
  } {
    let currentFilter = filterFunction(0);

    return {
      filter: currentFilter,
      updateFilter: (blockNumber: number) => {
        currentFilter = filterFunction(blockNumber);
      }
    };
  }

  // 多事件过滤器
  async queryMultipleEvents(
    eventConfigs: Array<{
      eventName: string;
      filters?: any;
      processor?: (event: any) => any;
    }>,
    fromBlock: number,
    toBlock: number
  ): Promise<{
    [eventName: string]: any[];
  }> {
    const results: { [eventName: string]: any[] } = {};

    const promises = eventConfigs.map(async config => {
      try {
        const filter = config.filters || this.contract.filters[config.eventName]();
        const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
        
        let processedEvents = events.map(event => ({
          ...event.args,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex
        }));

        // 应用处理器
        if (config.processor) {
          processedEvents = processedEvents.map(config.processor);
        }

        return { eventName: config.eventName, events: processedEvents };
      } catch (error) {
        console.error(`查询 ${config.eventName} 失败:`, error);
        return { eventName: config.eventName, events: [] };
      }
    });

    const allResults = await Promise.all(promises);
    
    allResults.forEach(({ eventName, events }) => {
      results[eventName] = events;
    });

    return results;
  }
}

// 使用示例
const eventFilter = new EventFilter(contract);

// 创建复合过滤器
const compoundFilter = eventFilter.createCompoundFilter('Transfer', {
  addresses: ['0x...address1', '0x...address2'],
  valueRange: { min: ethers.parseEther('100') }
});

// 应用运行时过滤器
const filteredEvents = eventFilter.applyRuntimeFilter(events, {
  valueRange: { min: ethers.parseEther('1'), max: ethers.parseEther('1000') },
  customFilter: (event) => event.from !== event.to // 排除自转账
});

// 查询多个事件
const multiEvents = await eventFilter.queryMultipleEvents([
  {
    eventName: 'Transfer',
    processor: (event) => ({
      ...event,
      formattedValue: ethers.formatEther(event.value)
    })
  },
  {
    eventName: 'Approval',
    filters: { owner: '0x...specificOwner' }
  }
], 18000000, 18001000);
```

## 事件数据处理

### 1. 事件数据聚合

```typescript
class EventAggregator {
  // 聚合转账数据
  aggregateTransfers(transfers: any[]): {
    totalVolume: bigint;
    totalTransactions: number;
    uniqueAddresses: Set<string>;
    topSenders: Array<{ address: string; volume: bigint; count: number }>;
    topReceivers: Array<{ address: string; volume: bigint; count: number }>;
    hourlyVolume: Map<number, bigint>;
  } {
    let totalVolume = 0n;
    const uniqueAddresses = new Set<string>();
    const senderStats = new Map<string, { volume: bigint; count: number }>();
    const receiverStats = new Map<string, { volume: bigint; count: number }>();
    const hourlyVolume = new Map<number, bigint>();

    transfers.forEach(transfer => {
      const value = BigInt(transfer.value);
      totalVolume += value;

      // 记录地址
      uniqueAddresses.add(transfer.from);
      uniqueAddresses.add(transfer.to);

      // 发送方统计
      const senderStat = senderStats.get(transfer.from) || { volume: 0n, count: 0 };
      senderStat.volume += value;
      senderStat.count += 1;
      senderStats.set(transfer.from, senderStat);

      // 接收方统计
      const receiverStat = receiverStats.get(transfer.to) || { volume: 0n, count: 0 };
      receiverStat.volume += value;
      receiverStat.count += 1;
      receiverStats.set(transfer.to, receiverStat);

      // 按小时统计（需要区块时间戳）
      if (transfer.timestamp) {
        const hour = Math.floor(transfer.timestamp / 3600) * 3600;
        hourlyVolume.set(hour, (hourlyVolume.get(hour) || 0n) + value);
      }
    });

    // 排序统计
    const topSenders = Array.from(senderStats.entries())
      .sort((a, b) => b[1].volume > a[1].volume ? 1 : -1)
      .slice(0, 10)
      .map(([address, stats]) => ({ address, ...stats }));

    const topReceivers = Array.from(receiverStats.entries())
      .sort((a, b) => b[1].volume > a[1].volume ? 1 : -1)
      .slice(0, 10)
      .map(([address, stats]) => ({ address, ...stats }));

    return {
      totalVolume,
      totalTransactions: transfers.length,
      uniqueAddresses,
      topSenders,
      topReceivers,
      hourlyVolume
    };
  }

  // 计算流动性指标
  calculateLiquidityMetrics(events: any[]): {
    averageTransactionSize: string;
    medianTransactionSize: string;
    transactionSizeDistribution: { [range: string]: number };
    velocityScore: number;
  } {
    const values = events.map(e => BigInt(e.value)).sort((a, b) => a > b ? 1 : -1);
    
    if (values.length === 0) {
      return {
        averageTransactionSize: '0',
        medianTransactionSize: '0',
        transactionSizeDistribution: {},
        velocityScore: 0
      };
    }

    // 平均值
    const total = values.reduce((sum, val) => sum + val, 0n);
    const average = total / BigInt(values.length);

    // 中位数
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2n
      : values[Math.floor(values.length / 2)];

    // 分布统计
    const ranges = [
      { name: '< 1', min: 0n, max: ethers.parseEther('1') },
      { name: '1-10', min: ethers.parseEther('1'), max: ethers.parseEther('10') },
      { name: '10-100', min: ethers.parseEther('10'), max: ethers.parseEther('100') },
      { name: '100-1000', min: ethers.parseEther('100'), max: ethers.parseEther('1000') },
      { name: '> 1000', min: ethers.parseEther('1000'), max: BigInt('0xffffffffffffffffffffffffffffffff') }
    ];

    const distribution: { [range: string]: number } = {};
    ranges.forEach(range => {
      distribution[range.name] = values.filter(val => val >= range.min && val < range.max).length;
    });

    // 简单的流动性评分（基于交易频率和分布）
    const velocityScore = Math.min(100, (values.length / 100) * 10 + (Object.keys(distribution).length * 5));

    return {
      averageTransactionSize: ethers.formatEther(average),
      medianTransactionSize: ethers.formatEther(median),
      transactionSizeDistribution: distribution,
      velocityScore
    };
  }

  // 检测异常活动
  detectAnomalies(events: any[]): {
    largeTransactions: any[];
    suspiciousPatterns: any[];
    flashLoanDetection: any[];
  } {
    const largeTransactions = [];
    const suspiciousPatterns = [];
    const flashLoanDetection = [];

    // 计算阈值（基于平均值和标准差）
    const values = events.map(e => BigInt(e.value));
    const average = values.reduce((sum, val) => sum + val, 0n) / BigInt(values.length);
    const largeThreshold = average * 10n; // 10倍平均值

    // 检测大额交易
    events.forEach(event => {
      if (BigInt(event.value) > largeThreshold) {
        largeTransactions.push({
          ...event,
          severity: 'high',
          reason: 'Large transaction amount'
        });
      }
    });

    // 检测可疑模式（例如：短时间内大量相同金额的交易）
    const transactionGroups = new Map<string, any[]>();
    events.forEach(event => {
      const key = `${event.value}_${event.from}`;
      if (!transactionGroups.has(key)) {
        transactionGroups.set(key, []);
      }
      transactionGroups.get(key)!.push(event);
    });

    transactionGroups.forEach((group, key) => {
      if (group.length > 5) { // 相同发送方和金额的交易超过5次
        suspiciousPatterns.push({
          pattern: 'Repeated transactions',
          count: group.length,
          value: group[0].value,
          from: group[0].from,
          transactions: group
        });
      }
    });

    // 简单的闪电贷检测（同一区块内的大额借贷和还款）
    const blockGroups = new Map<number, any[]>();
    events.forEach(event => {
      if (!blockGroups.has(event.blockNumber)) {
        blockGroups.set(event.blockNumber, []);
      }
      blockGroups.get(event.blockNumber)!.push(event);
    });

    blockGroups.forEach((blockEvents, blockNumber) => {
      if (blockEvents.length > 2) {
        const totalIn = blockEvents
          .filter(e => e.to === blockEvents[0].from)
          .reduce((sum, e) => sum + BigInt(e.value), 0n);
        
        const totalOut = blockEvents
          .filter(e => e.from === blockEvents[0].from)
          .reduce((sum, e) => sum + BigInt(e.value), 0n);

        if (totalIn > 0n && totalOut > 0n && totalIn <= totalOut) {
          flashLoanDetection.push({
            blockNumber,
            address: blockEvents[0].from,
            amountIn: ethers.formatEther(totalIn),
            amountOut: ethers.formatEther(totalOut),
            transactions: blockEvents
          });
        }
      }
    });

    return {
      largeTransactions,
      suspiciousPatterns,
      flashLoanDetection
    };
  }
}

// 使用示例
const aggregator = new EventAggregator();

// 聚合转账数据
const transferStats = aggregator.aggregateTransfers(transferEvents);
console.log('转账统计:', {
  totalVolume: ethers.formatEther(transferStats.totalVolume),
  totalTransactions: transferStats.totalTransactions,
  uniqueAddresses: transferStats.uniqueAddresses.size
});

// 计算流动性指标
const liquidityMetrics = aggregator.calculateLiquidityMetrics(transferEvents);
console.log('流动性指标:', liquidityMetrics);

// 检测异常
const anomalies = aggregator.detectAnomalies(transferEvents);
console.log('异常检测:', {
  largeTransactions: anomalies.largeTransactions.length,
  suspiciousPatterns: anomalies.suspiciousPatterns.length,
  flashLoans: anomalies.flashLoanDetection.length
});
```

## 性能优化

### 1. 事件监听优化

```typescript
class OptimizedEventListener {
  private contract: ethers.Contract;
  private eventCache = new Map<string, { data: any; timestamp: number }>();
  private batchProcessor: EventBuffer;
  private rateLimiter: RateLimiter;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.batchProcessor = new EventBuffer(20, 2000, this.processBatch.bind(this));
    this.rateLimiter = new RateLimiter(10, 1000); // 每秒最多10个请求
  }

  // 优化的事件监听
  optimizedListen(eventName: string, callback: Function): void {
    const wrappedCallback = async (...args: any[]) => {
      // 速率限制
      await this.rateLimiter.acquire();

      // 缓存检查
      const cacheKey = this.generateCacheKey(eventName, args);
      const cached = this.eventCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 5000) { // 5秒缓存
        return;
      }

      // 添加到批处理器
      this.batchProcessor.addEvent({
        eventName,
        args,
        callback,
        timestamp: Date.now()
      });

      // 更新缓存
      this.eventCache.set(cacheKey, {
        data: args,
        timestamp: Date.now()
      });
    };

    this.contract.on(eventName, wrappedCallback);
  }

  // 批处理事件
  private processBatch(events: any[]): void {
    // 按事件类型分组
    const groupedEvents = new Map<string, any[]>();
    
    events.forEach(event => {
      if (!groupedEvents.has(event.eventName)) {
        groupedEvents.set(event.eventName, []);
      }
      groupedEvents.get(event.eventName)!.push(event);
    });

    // 批量处理每种事件类型
    groupedEvents.forEach((eventGroup, eventName) => {
      try {
        this.processBatchByType(eventName, eventGroup);
      } catch (error) {
        console.error(`批处理 ${eventName} 事件失败:`, error);
      }
    });
  }

  // 按类型批处理事件
  private processBatchByType(eventName: string, events: any[]): void {
    console.log(`批处理 ${events.length} 个 ${eventName} 事件`);
    
    // 这里可以实现具体的批处理逻辑
    // 例如：批量写入数据库、批量发送通知等
    events.forEach(event => {
      if (event.callback) {
        event.callback(...event.args);
      }
    });
  }

  // 生成缓存键
  private generateCacheKey(eventName: string, args: any[]): string {
    return `${eventName}:${JSON.stringify(args)}`;
  }

  // 清理缓存
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.eventCache.entries()) {
      if (now - value.timestamp > 60000) { // 清理1分钟前的缓存
        this.eventCache.delete(key);
      }
    }
  }
}

// 速率限制器
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillInterval: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = maxTokens / refillInterval;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // 等待令牌补充
    const waitTime = (1 - this.tokens) / this.refillRate;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// 使用示例
const optimizedListener = new OptimizedEventListener(contract);

optimizedListener.optimizedListen('Transfer', (from, to, value, event) => {
  console.log('优化的 Transfer 监听:', { from, to, value });
});

// 定期清理缓存
setInterval(() => {
  optimizedListener.cleanupCache();
}, 60000);
```

## 最佳实践

### 1. 事件监听最佳实践

```typescript
class EventListenerBestPractices {
  // 事件监听检查清单
  static getEventListenerChecklist(): {
    [category: string]: Array<{
      item: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  } {
    return {
      '连接管理': [
        {
          item: '实现重连机制',
          description: '处理网络断开和重连',
          priority: 'high'
        },
        {
          item: '监控连接状态',
          description: '实时监控 WebSocket 连接状态',
          priority: 'high'
        },
        {
          item: '使用备用节点',
          description: '配置多个 RPC 节点作为备用',
          priority: 'medium'
        }
      ],
      '性能优化': [
        {
          item: '批量处理事件',
          description: '避免逐个处理事件',
          priority: 'high'
        },
        {
          item: '实现事件缓存',
          description: '避免重复处理相同事件',
          priority: 'medium'
        },
        {
          item: '使用速率限制',
          description: '控制 API 调用频率',
          priority: 'medium'
        }
      ],
      '错误处理': [
        {
          item: '分类错误类型',
          description: '区分网络错误、合约错误等',
          priority: 'high'
        },
        {
          item: '实现错误恢复',
          description: '自动恢复可恢复的错误',
          priority: 'high'
        },
        {
          item: '记录错误日志',
          description: '详细记录错误信息用于调试',
          priority: 'medium'
        }
      ],
      '数据完整性': [
        {
          item: '验证事件数据',
          description: '检查事件数据的完整性和正确性',
          priority: 'high'
        },
        {
          item: '处理重复事件',
          description: '检测和处理重复的事件',
          priority: 'medium'
        },
        {
          item: '同步历史数据',
          description: '确保历史数据的完整性',
          priority: 'low'
        }
      ]
    };
  }

  // 事件监听器健康检查
  static async healthCheck(
    contract: ethers.Contract,
    eventListeners: string[]
  ): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
  }> {
    const checks = [];

    // 检查网络连接
    try {
      await contract.runner?.provider?.getBlockNumber();
      checks.push({
        name: '网络连接',
        status: 'pass' as const,
        message: '网络连接正常'
      });
    } catch (error) {
      checks.push({
        name: '网络连接',
        status: 'fail' as const,
        message: '网络连接失败'
      });
    }

    // 检查合约状态
    try {
      await contract.getAddress();
      checks.push({
        name: '合约状态',
        status: 'pass' as const,
        message: '合约可访问'
      });
    } catch (error) {
      checks.push({
        name: '合约状态',
        status: 'fail' as const,
        message: '合约不可访问'
      });
    }

    // 检查事件监听器
    const listenerCount = contract.listenerCount();
    if (listenerCount === 0) {
      checks.push({
        name: '事件监听器',
        status: 'warning' as const,
        message: '没有活动的事件监听器'
      });
    } else {
      checks.push({
        name: '事件监听器',
        status: 'pass' as const,
        message: `${listenerCount} 个活动监听器`
      });
    }

    // 计算整体状态
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overall: 'healthy' | 'warning' | 'critical';
    if (failCount > 0) {
      overall = 'critical';
    } else if (warningCount > 0) {
      overall = 'warning';
    } else {
      overall = 'healthy';
    }

    return { overall, checks };
  }
}

// 使用示例
const checklist = EventListenerBestPractices.getEventListenerChecklist();
console.log('事件监听最佳实践:', checklist);

const healthStatus = await EventListenerBestPractices.healthCheck(
  contract,
  ['Transfer', 'Approval']
);
console.log('健康检查结果:', healthStatus);
```

## 常见问题

### Q: 如何处理事件监听中的内存泄漏？
A: 及时移除不需要的监听器，使用 `removeAllListeners()` 清理，避免创建过多的匿名函数。

### Q: 为什么有时会丢失事件？
A: 可能原因包括网络断开、节点同步问题、过滤器设置错误等。建议实现重连机制和历史数据同步。

### Q: 如何优化大量事件的处理性能？
A: 使用批量处理、事件缓存、速率限制、异步处理等技术。

### Q: 如何确保事件数据的完整性？
A: 实现重复检测、数据验证、历史数据同步等机制。

## 下一步

- [ABI 处理](/ethers/contracts/abi) - 学习 ABI 编码解码
- [错误处理](/ethers/contracts/error-handling) - 深入了解错误处理
- [批量调用](/ethers/contracts/batch-calls) - 掌握批量操作
- [交易处理](/ethers/transactions/basics) - 学习交易管理
