---
title: 实时数据
description: 使用 Ethers.js 监听和处理区块链实时数据的完整指南
keywords: [ethers, 实时数据, 事件监听, 区块监听, 价格监控, WebSocket, 流式数据]
---

# 实时数据

区块链是一个实时更新的分布式账本，通过 Ethers.js 我们可以监听和处理各种实时数据。本文档将详细介绍如何监听区块、交易、事件以及价格变化等实时数据。

## 实时数据基础概念

### 1. 实时数据源类型

```typescript
// 实时数据源分类
interface RealTimeDataSources {
  // 区块链数据
  blockchain: {
    blocks: '新区块生成';
    transactions: '交易确认';
    gasPrice: 'Gas 价格变化';
    networkStatus: '网络状态';
  };
  
  // 智能合约事件
  contractEvents: {
    tokenTransfers: '代币转账事件';
    contractCalls: '合约调用事件';
    stateChanges: '状态变化事件';
    customEvents: '自定义事件';
  };
  
  // DeFi 数据
  defi: {
    priceFeeds: '价格预言机';
    liquidityChanges: '流动性变化';
    yieldRates: '收益率变化';
    protocolEvents: '协议事件';
  };
  
  // 市场数据
  market: {
    orderBook: '订单簿变化';
    trades: '交易记录';
    volume: '交易量';
    marketDepth: '市场深度';
  };
}
```

### 2. 监听器类型

```typescript
import { ethers } from 'ethers';

// 监听器接口定义
interface EventListeners {
  // 区块监听器
  blockListener: (blockNumber: number) => void;
  
  // 交易监听器
  transactionListener: (tx: ethers.Transaction) => void;
  
  // 事件监听器
  eventListener: (event: ethers.Event) => void;
  
  // 价格监听器
  priceListener: (price: number, timestamp: number) => void;
  
  // 错误监听器
  errorListener: (error: Error) => void;
}
```

## 区块和交易监听

### 1. 监听新区块

```typescript
import { ethers } from 'ethers';

// 连接到以太坊网络
const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');

// 监听新区块
async function listenToNewBlocks() {
  console.log('开始监听新区块...');
  
  provider.on('block', async (blockNumber) => {
    try {
      console.log(`新区块: ${blockNumber}`);
      
      // 获取区块详情
      const block = await provider.getBlock(blockNumber);
      console.log('区块信息:', {
        hash: block?.hash,
        timestamp: block?.timestamp,
        transactions: block?.transactions.length,
        gasLimit: block?.gasLimit.toString(),
        gasUsed: block?.gasUsed.toString()
      });
      
      // 获取区块内的交易
      if (block) {
        const transactions = await Promise.all(
          block.transactions.map(async (txHash) => {
            const tx = await provider.getTransaction(txHash);
            return {
              hash: tx?.hash,
              from: tx?.from,
              to: tx?.to,
              value: ethers.formatEther(tx?.value || 0),
              gasPrice: tx?.gasPrice?.toString()
            };
          })
        );
        
        console.log(`区块 ${blockNumber} 包含 ${transactions.length} 笔交易`);
      }
      
    } catch (error) {
      console.error('处理区块时出错:', error);
    }
  });
  
  // 错误处理
  provider.on('error', (error) => {
    console.error('Provider 错误:', error);
  });
}

// 启动监听
listenToNewBlocks();
```

### 2. 监听待处理交易

```typescript
// 监听待处理交易池
async function listenToPendingTransactions() {
  console.log('开始监听待处理交易...');
  
  provider.on('pending', async (txHash) => {
    try {
      // 获取交易详情
      const tx = await provider.getTransaction(txHash);
      
      if (tx) {
        console.log('待处理交易:', {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          gasPrice: ethers.formatUnits(tx.gasPrice || 0, 'gwei'),
          nonce: tx.nonce
        });
        
        // 检查是否是特定地址的交易
        if (tx.from === '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6') {
          console.log('检测到目标地址的交易!');
        }
      }
      
    } catch (error) {
      console.error('处理待处理交易时出错:', error);
    }
  });
}

// 启动待处理交易监听
listenToPendingTransactions();
```

### 3. 监听 Gas 价格变化

```typescript
// 监听 Gas 价格变化
async function listenToGasPrice() {
  console.log('开始监听 Gas 价格变化...');
  
  let lastGasPrice = 0;
  
  // 定期检查 Gas 价格
  setInterval(async () => {
    try {
      const gasPrice = await provider.getFeeData();
      const currentGasPrice = Number(ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'));
      
      if (currentGasPrice !== lastGasPrice) {
        console.log(`Gas 价格变化: ${lastGasPrice} -> ${currentGasPrice} Gwei`);
        lastGasPrice = currentGasPrice;
        
        // 根据 Gas 价格调整策略
        if (currentGasPrice > 50) {
          console.log('Gas 价格较高，建议延迟交易');
        } else if (currentGasPrice < 10) {
          console.log('Gas 价格较低，适合发送交易');
        }
      }
      
    } catch (error) {
      console.error('获取 Gas 价格时出错:', error);
    }
  }, 30000); // 每30秒检查一次
}

// 启动 Gas 价格监听
listenToGasPrice();
```

## 智能合约事件监听

### 1. 监听 ERC-20 代币转账

```typescript
// ERC-20 代币转账事件监听
async function listenToTokenTransfers(tokenAddress: string) {
  console.log(`开始监听代币 ${tokenAddress} 的转账事件...`);
  
  // ERC-20 Transfer 事件签名
  const transferEventSignature = 'Transfer(address,address,uint256)';
  const transferEventTopic = ethers.id(transferEventSignature);
  
  // 创建过滤器
  const filter = {
    address: tokenAddress,
    topics: [transferEventTopic]
  };
  
  // 监听事件
  provider.on(filter, async (log) => {
    try {
      // 解析事件数据
      const iface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ]);
      
      const event = iface.parseLog(log);
      const { from, to, value } = event.args;
      
      console.log('代币转账事件:', {
        from: from,
        to: to,
        value: ethers.formatUnits(value, 18), // 假设18位小数
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber
      });
      
      // 检查大额转账
      const valueInEth = Number(ethers.formatUnits(value, 18));
      if (valueInEth > 1000) {
        console.log(`检测到大额转账: ${valueInEth} 代币`);
      }
      
    } catch (error) {
      console.error('解析转账事件时出错:', error);
    }
  });
}

// 监听 USDC 转账
const USDC_ADDRESS = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
listenToTokenTransfers(USDC_ADDRESS);
```

### 2. 监听自定义合约事件

```typescript
// 自定义合约事件监听
async function listenToCustomContractEvents(contractAddress: string) {
  console.log(`开始监听合约 ${contractAddress} 的事件...`);
  
  // 合约 ABI（包含事件定义）
  const contractABI = [
    'event OrderPlaced(address indexed user, uint256 orderId, uint256 amount, uint256 price)',
    'event OrderFilled(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 price)',
    'event OrderCancelled(uint256 indexed orderId, address indexed user)',
    'event PriceUpdated(uint256 newPrice, uint256 timestamp)'
  ];
  
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  
  // 监听订单下单事件
  contract.on('OrderPlaced', (user, orderId, amount, price, event) => {
    console.log('新订单:', {
      user: user,
      orderId: orderId.toString(),
      amount: ethers.formatEther(amount),
      price: ethers.formatEther(price),
      transactionHash: event.transactionHash
    });
  });
  
  // 监听订单成交事件
  contract.on('OrderFilled', (orderId, buyer, seller, amount, price, event) => {
    console.log('订单成交:', {
      orderId: orderId.toString(),
      buyer: buyer,
      seller: seller,
      amount: ethers.formatEther(amount),
      price: ethers.formatEther(price),
      transactionHash: event.transactionHash
    });
  });
  
  // 监听价格更新事件
  contract.on('PriceUpdated', (newPrice, timestamp, event) => {
    console.log('价格更新:', {
      newPrice: ethers.formatEther(newPrice),
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      transactionHash: event.transactionHash
    });
  });
  
  // 错误处理
  contract.on('error', (error) => {
    console.error('合约事件监听错误:', error);
  });
}

// 监听示例合约
const EXAMPLE_CONTRACT = '0x1234567890123456789012345678901234567890';
listenToCustomContractEvents(EXAMPLE_CONTRACT);
```

### 3. 监听多个合约事件

```typescript
// 批量监听多个合约事件
async function listenToMultipleContracts() {
  const contracts = [
    {
      name: 'Uniswap V3 Factory',
      address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      events: ['PoolCreated']
    },
    {
      name: 'Compound Comptroller',
      address: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
      events: ['MarketListed', 'MarketEntered', 'MarketExited']
    },
    {
      name: 'Aave Pool',
      address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      events: ['Supply', 'Borrow', 'Repay', 'LiquidationCall']
    }
  ];
  
  for (const contract of contracts) {
    console.log(`开始监听 ${contract.name} 的事件...`);
    
    // 为每个合约创建监听器
    const contractInstance = new ethers.Contract(
      contract.address,
      contract.events.map(event => `event ${event}(address,uint256,uint256)`),
      provider
    );
    
    // 监听所有事件
    contractInstance.on('*', (eventName, ...args) => {
      console.log(`${contract.name} 事件:`, {
        eventName,
        args: args.map(arg => arg.toString()),
        transactionHash: args[args.length - 1]?.transactionHash
      });
    });
  }
}

// 启动多合约监听
listenToMultipleContracts();
```

## DeFi 价格监控

### 1. 监听 Uniswap 价格变化

```typescript
// Uniswap V3 价格监控
async function monitorUniswapPrices() {
  console.log('开始监控 Uniswap 价格变化...');
  
  // Uniswap V3 Pool ABI
  const poolABI = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
  ];
  
  // 主要交易对地址
  const tradingPairs = [
    {
      name: 'ETH/USDC',
      address: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', // Uniswap V3 ETH/USDC 0.05%
      token0: 'WETH',
      token1: 'USDC',
      decimals0: 18,
      decimals1: 6
    },
    {
      name: 'ETH/USDT',
      address: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36', // Uniswap V3 ETH/USDT 0.05%
      token0: 'WETH',
      token1: 'USDT',
      decimals0: 18,
      decimals1: 6
    }
  ];
  
  for (const pair of tradingPairs) {
    const pool = new ethers.Contract(pair.address, poolABI, provider);
    
    // 监听 Swap 事件
    pool.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
      try {
        // 计算价格
        const price = calculatePriceFromSqrtPriceX96(sqrtPriceX96, pair.decimals0, pair.decimals1);
        
        console.log(`${pair.name} 价格变化:`, {
          price: price.toFixed(6),
          amount0: ethers.formatUnits(amount0, pair.decimals0),
          amount1: ethers.formatUnits(amount1, pair.decimals1),
          liquidity: liquidity.toString(),
          tick: tick.toString(),
          transactionHash: event.transactionHash
        });
        
        // 价格变化检测
        detectPriceChange(pair.name, price);
        
      } catch (error) {
        console.error(`处理 ${pair.name} 价格时出错:`, error);
      }
    });
  }
}

// 从 sqrtPriceX96 计算价格
function calculatePriceFromSqrtPriceX96(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
  const Q96 = 2n ** 96n;
  const price = (sqrtPriceX96 * sqrtPriceX96 * (10n ** BigInt(decimals1))) / (Q96 * Q96 * (10n ** BigInt(decimals0)));
  return Number(price) / (10 ** (decimals1 - decimals0));
}

// 价格变化检测
const priceHistory = new Map<string, number[]>();

function detectPriceChange(pairName: string, currentPrice: number) {
  if (!priceHistory.has(pairName)) {
    priceHistory.set(pairName, []);
  }
  
  const history = priceHistory.get(pairName)!;
  history.push(currentPrice);
  
  // 保持最近100个价格点
  if (history.length > 100) {
    history.shift();
  }
  
  // 计算价格变化百分比
  if (history.length > 1) {
    const previousPrice = history[history.length - 2];
    const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    if (Math.abs(changePercent) > 5) {
      console.log(`⚠️ ${pairName} 价格大幅变化: ${changePercent.toFixed(2)}%`);
    }
  }
}

// 启动价格监控
monitorUniswapPrices();
```

### 2. 监听 Chainlink 价格预言机

```typescript
// Chainlink 价格预言机监控
async function monitorChainlinkOracles() {
  console.log('开始监控 Chainlink 价格预言机...');
  
  // Chainlink 价格预言机地址
  const priceFeeds = [
    {
      name: 'ETH/USD',
      address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      decimals: 8
    },
    {
      name: 'BTC/USD',
      address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      decimals: 8
    },
    {
      name: 'LINK/USD',
      address: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
      decimals: 8
    }
  ];
  
  // Chainlink 价格预言机 ABI
  const oracleABI = [
    'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    'event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 timestamp)'
  ];
  
  for (const feed of priceFeeds) {
    const oracle = new ethers.Contract(feed.address, oracleABI, provider);
    
    // 监听价格更新事件
    oracle.on('AnswerUpdated', (current, roundId, timestamp, event) => {
      const price = Number(current) / (10 ** feed.decimals);
      
      console.log(`${feed.name} 价格更新:`, {
        price: price.toFixed(2),
        roundId: roundId.toString(),
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        transactionHash: event.transactionHash
      });
    });
    
    // 定期获取最新价格
    setInterval(async () => {
      try {
        const data = await oracle.latestRoundData();
        const price = Number(data.answer) / (10 ** feed.decimals);
        
        console.log(`${feed.name} 当前价格: $${price.toFixed(2)}`);
        
      } catch (error) {
        console.error(`获取 ${feed.name} 价格时出错:`, error);
      }
    }, 60000); // 每分钟检查一次
  }
}

// 启动预言机监控
monitorChainlinkOracles();
```

## WebSocket 连接优化

### 1. 使用 WebSocket Provider

```typescript
// WebSocket 连接配置
async function setupWebSocketConnection() {
  console.log('建立 WebSocket 连接...');
  
  // 使用 WebSocket Provider 获得更好的实时性能
  const wsProvider = new ethers.WebSocketProvider(
    'wss://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
  );
  
  // 连接状态监听
  wsProvider.on('connect', () => {
    console.log('WebSocket 连接已建立');
  });
  
  wsProvider.on('disconnect', () => {
    console.error('WebSocket 连接断开');
    // 尝试重连
    setTimeout(() => {
      console.log('尝试重新连接...');
      setupWebSocketConnection();
    }, 5000);
  });
  
  // 错误处理
  wsProvider.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
  
  return wsProvider;
}

// 使用 WebSocket 监听区块
async function listenWithWebSocket() {
  const wsProvider = await setupWebSocketConnection();
  
  wsProvider.on('block', (blockNumber) => {
    console.log(`WebSocket 新区块: ${blockNumber}`);
  });
  
  // 监听特定地址的交易
  const filter = {
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  };
  
  wsProvider.on(filter, (log) => {
    console.log('检测到目标地址的交易:', log);
  });
}
```

### 2. 连接池管理

```typescript
// 连接池管理
class ConnectionPool {
  private providers: ethers.Provider[] = [];
  private currentIndex = 0;
  
  constructor(urls: string[]) {
    urls.forEach(url => {
      this.providers.push(new ethers.JsonRpcProvider(url));
    });
  }
  
  getProvider(): ethers.Provider {
    const provider = this.providers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    return provider;
  }
  
  async healthCheck(): Promise<void> {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        await this.providers[i].getBlockNumber();
        console.log(`Provider ${i} 健康`);
      } catch (error) {
        console.error(`Provider ${i} 不健康:`, error);
      }
    }
  }
}

// 使用连接池
const pool = new ConnectionPool([
  'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY_1',
  'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY_2',
  'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY_3'
]);

// 定期健康检查
setInterval(() => {
  pool.healthCheck();
}, 300000); // 每5分钟检查一次
```

## 数据存储和分析

### 1. 实时数据存储

```typescript
// 实时数据存储类
class RealTimeDataStore {
  private data: Map<string, any[]> = new Map();
  private maxRecords = 1000;
  
  // 添加数据
  addData(type: string, data: any): void {
    if (!this.data.has(type)) {
      this.data.set(type, []);
    }
    
    const records = this.data.get(type)!;
    records.push({
      ...data,
      timestamp: Date.now()
    });
    
    // 限制记录数量
    if (records.length > this.maxRecords) {
      records.shift();
    }
  }
  
  // 获取数据
  getData(type: string, limit?: number): any[] {
    const records = this.data.get(type) || [];
    return limit ? records.slice(-limit) : records;
  }
  
  // 获取统计数据
  getStats(type: string): any {
    const records = this.getData(type);
    if (records.length === 0) return null;
    
    const values = records.map(r => r.value || r.price || 0);
    return {
      count: records.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: records[records.length - 1]
    };
  }
  
  // 导出数据
  exportData(type: string): string {
    return JSON.stringify(this.getData(type), null, 2);
  }
}

// 使用数据存储
const dataStore = new RealTimeDataStore();

// 在事件监听器中存储数据
provider.on('block', async (blockNumber) => {
  const block = await provider.getBlock(blockNumber);
  dataStore.addData('blocks', {
    number: blockNumber,
    hash: block?.hash,
    timestamp: block?.timestamp,
    gasUsed: block?.gasUsed.toString()
  });
});
```

### 2. 数据分析

```typescript
// 数据分析工具
class DataAnalyzer {
  // 计算移动平均线
  static calculateMA(data: number[], period: number): number[] {
    const ma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
    return ma;
  }
  
  // 检测异常值
  static detectOutliers(data: number[], threshold: number = 2): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length);
    
    return data.filter(value => Math.abs(value - mean) > threshold * std);
  }
  
  // 趋势分析
  static analyzeTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-10);
    const slope = this.calculateSlope(recent);
    
    if (slope > 0.01) return 'up';
    if (slope < -0.01) return 'down';
    return 'stable';
  }
  
  private static calculateSlope(data: number[]): number {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}

// 使用数据分析
setInterval(() => {
  const priceData = dataStore.getData('prices').map(d => d.price);
  if (priceData.length > 10) {
    const ma20 = DataAnalyzer.calculateMA(priceData, 20);
    const outliers = DataAnalyzer.detectOutliers(priceData);
    const trend = DataAnalyzer.analyzeTrend(priceData);
    
    console.log('价格分析:', {
      trend,
      outliers: outliers.length,
      ma20: ma20[ma20.length - 1]
    });
  }
}, 60000);
```

## 性能优化

### 1. 批量事件处理

```typescript
// 批量事件处理器
class BatchEventProcessor {
  private events: any[] = [];
  private batchSize: number;
  private processInterval: number;
  private timer: NodeJS.Timeout | null = null;
  
  constructor(batchSize: number = 100, processInterval: number = 5000) {
    this.batchSize = batchSize;
    this.processInterval = processInterval;
  }
  
  // 添加事件
  addEvent(event: any): void {
    this.events.push(event);
    
    // 检查是否达到批量大小
    if (this.events.length >= this.batchSize) {
      this.processBatch();
    }
    
    // 启动定时器
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.processBatch();
      }, this.processInterval);
    }
  }
  
  // 处理批量事件
  private processBatch(): void {
    if (this.events.length === 0) return;
    
    const batch = this.events.splice(0);
    console.log(`处理 ${batch.length} 个事件`);
    
    // 批量处理逻辑
    this.processEvents(batch);
    
    // 清除定时器
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  
  private processEvents(events: any[]): void {
    // 按类型分组
    const grouped = events.reduce((acc, event) => {
      const type = event.type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {});
    
    // 处理每种类型的事件
    Object.entries(grouped).forEach(([type, typeEvents]) => {
      console.log(`处理 ${type} 类型事件: ${typeEvents.length} 个`);
      // 这里可以添加具体的处理逻辑
    });
  }
}

// 使用批量处理器
const batchProcessor = new BatchEventProcessor(50, 3000);

// 在事件监听器中使用
provider.on('block', (blockNumber) => {
  batchProcessor.addEvent({
    type: 'block',
    blockNumber,
    timestamp: Date.now()
  });
});
```

### 2. 内存管理

```typescript
// 内存管理工具
class MemoryManager {
  private static instance: MemoryManager;
  private memoryUsage: number[] = [];
  private maxMemoryUsage = 100;
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }
  
  // 监控内存使用
  monitorMemory(): void {
    const usage = process.memoryUsage();
    this.memoryUsage.push(usage.heapUsed);
    
    if (this.memoryUsage.length > this.maxMemoryUsage) {
      this.memoryUsage.shift();
    }
    
    // 检查内存使用是否过高
    if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
      console.warn('内存使用过高，建议清理缓存');
      this.cleanup();
    }
  }
  
  // 清理内存
  cleanup(): void {
    // 清理事件监听器
    provider.removeAllListeners();
    
    // 清理数据存储
    dataStore.clear();
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    console.log('内存清理完成');
  }
  
  // 获取内存统计
  getMemoryStats(): any {
    const usage = process.memoryUsage();
    return {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`
    };
  }
}

// 定期监控内存
setInterval(() => {
  MemoryManager.getInstance().monitorMemory();
}, 30000); // 每30秒检查一次
```

## 错误处理和重连机制

### 1. 错误处理策略

```typescript
// 错误处理类
class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCount = 0;
  private maxErrors = 10;
  private errorWindow = 60000; // 1分钟
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  // 处理错误
  handleError(error: Error, context: string): void {
    this.errorCount++;
    
    console.error(`错误 (${context}):`, error.message);
    
    // 检查错误频率
    if (this.errorCount > this.maxErrors) {
      console.error('错误频率过高，暂停监听');
      this.pauseListening();
    }
    
    // 重置错误计数
    setTimeout(() => {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }, this.errorWindow);
  }
  
  // 暂停监听
  private pauseListening(): void {
    provider.removeAllListeners();
    
    // 5秒后重新开始监听
    setTimeout(() => {
      console.log('重新开始监听...');
      this.errorCount = 0;
      this.restartListening();
    }, 5000);
  }
  
  // 重新开始监听
  private restartListening(): void {
    // 重新设置所有监听器
    setupAllListeners();
  }
}

// 在事件监听器中使用错误处理
provider.on('error', (error) => {
  ErrorHandler.getInstance().handleError(error, 'provider');
});
```

### 2. 重连机制

```typescript
// 重连管理器
class ReconnectionManager {
  private maxRetries = 5;
  private retryDelay = 1000;
  private currentRetries = 0;
  private isConnected = false;
  
  // 尝试重连
  async reconnect(): Promise<void> {
    if (this.currentRetries >= this.maxRetries) {
      console.error('达到最大重连次数，停止重连');
      return;
    }
    
    this.currentRetries++;
    console.log(`尝试重连 (${this.currentRetries}/${this.maxRetries})...`);
    
    try {
      // 重新建立连接
      await this.establishConnection();
      this.isConnected = true;
      this.currentRetries = 0;
      console.log('重连成功');
      
    } catch (error) {
      console.error('重连失败:', error);
      
      // 指数退避
      const delay = this.retryDelay * Math.pow(2, this.currentRetries - 1);
      setTimeout(() => {
        this.reconnect();
      }, delay);
    }
  }
  
  private async establishConnection(): Promise<void> {
    // 重新创建 provider
    const newProvider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');
    
    // 测试连接
    await newProvider.getBlockNumber();
    
    // 替换全局 provider
    Object.assign(provider, newProvider);
    
    // 重新设置监听器
    setupAllListeners();
  }
  
  // 检查连接状态
  checkConnection(): boolean {
    return this.isConnected;
  }
}

// 使用重连管理器
const reconnectionManager = new ReconnectionManager();

// 在连接断开时触发重连
provider.on('disconnect', () => {
  reconnectionManager.isConnected = false;
  reconnectionManager.reconnect();
});
```

## 完整示例

### 1. 实时数据监控应用

```typescript
// 完整的实时数据监控应用
class RealTimeDataMonitor {
  private provider: ethers.Provider;
  private dataStore: RealTimeDataStore;
  private batchProcessor: BatchEventProcessor;
  private errorHandler: ErrorHandler;
  private reconnectionManager: ReconnectionManager;
  
  constructor(providerUrl: string) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.dataStore = new RealTimeDataStore();
    this.batchProcessor = new BatchEventProcessor();
    this.errorHandler = ErrorHandler.getInstance();
    this.reconnectionManager = new ReconnectionManager();
  }
  
  // 启动监控
  async start(): Promise<void> {
    console.log('启动实时数据监控...');
    
    try {
      // 设置所有监听器
      await this.setupListeners();
      
      // 启动健康检查
      this.startHealthCheck();
      
      // 启动内存监控
      this.startMemoryMonitoring();
      
      console.log('实时数据监控已启动');
      
    } catch (error) {
      this.errorHandler.handleError(error, 'startup');
    }
  }
  
  // 设置监听器
  private async setupListeners(): Promise<void> {
    // 区块监听
    this.provider.on('block', (blockNumber) => {
      this.batchProcessor.addEvent({
        type: 'block',
        blockNumber,
        timestamp: Date.now()
      });
    });
    
    // 待处理交易监听
    this.provider.on('pending', (txHash) => {
      this.batchProcessor.addEvent({
        type: 'pending',
        txHash,
        timestamp: Date.now()
      });
    });
    
    // 错误处理
    this.provider.on('error', (error) => {
      this.errorHandler.handleError(error, 'provider');
    });
    
    // 连接断开处理
    this.provider.on('disconnect', () => {
      console.log('连接断开，尝试重连...');
      this.reconnectionManager.reconnect();
    });
  }
  
  // 启动健康检查
  private startHealthCheck(): void {
    setInterval(async () => {
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log(`健康检查: 当前区块 ${blockNumber}`);
      } catch (error) {
        this.errorHandler.handleError(error, 'health_check');
      }
    }, 30000); // 每30秒检查一次
  }
  
  // 启动内存监控
  private startMemoryMonitoring(): void {
    setInterval(() => {
      MemoryManager.getInstance().monitorMemory();
    }, 60000); // 每1分钟检查一次
  }
  
  // 获取统计信息
  getStats(): any {
    return {
      memory: MemoryManager.getInstance().getMemoryStats(),
      connection: this.reconnectionManager.checkConnection(),
      dataStats: {
        blocks: this.dataStore.getStats('blocks'),
        transactions: this.dataStore.getStats('transactions'),
        events: this.dataStore.getStats('events')
      }
    };
  }
  
  // 停止监控
  stop(): void {
    console.log('停止实时数据监控...');
    this.provider.removeAllListeners();
  }
}

// 使用示例
async function main() {
  const monitor = new RealTimeDataMonitor('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');
  
  // 启动监控
  await monitor.start();
  
  // 定期输出统计信息
  setInterval(() => {
    const stats = monitor.getStats();
    console.log('监控统计:', stats);
  }, 60000);
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('收到关闭信号，正在停止监控...');
    monitor.stop();
    process.exit(0);
  });
}

// 启动应用
main().catch(console.error);
```

这个实时数据文档涵盖了使用 Ethers.js 监听和处理区块链实时数据的各个方面，包括区块监听、事件监听、价格监控、WebSocket 连接优化、数据存储分析、性能优化以及错误处理等。文档提供了完整的代码示例和最佳实践，可以帮助开发者构建稳定可靠的实时数据监控应用。 