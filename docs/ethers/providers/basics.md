---
title: Provider 基础
description: 深入了解 Ethers.js Provider 的基础概念和使用方法
keywords: [ethers.js, Provider, 区块链连接, 以太坊, Web3]
---

# Provider 基础

Provider 是 Ethers.js 中连接区块链网络的核心组件，它提供了读取区块链状态和发送交易的能力。本章将详细介绍 Provider 的基础概念和使用方法。

## Provider 基础概念

Provider 是一个抽象接口，用于与以太坊网络通信。它提供了只读访问区块链的功能，包括：

- 查询账户余额
- 获取交易信息
- 读取区块数据
- 调用合约的只读函数
- 监听事件

```typescript
import { ethers } from 'ethers';

// Provider 的基本使用
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 获取最新区块号
const blockNumber = await provider.getBlockNumber();
console.log('最新区块号:', blockNumber);

// 获取账户余额
const balance = await provider.getBalance('0x...');
console.log('余额:', ethers.formatEther(balance), 'ETH');
```

## Provider 类型

### 1. JsonRpcProvider

最常用的 Provider，通过 JSON-RPC 连接到以太坊节点。

```typescript
// 基本用法
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 带配置的用法
const providerWithConfig = new ethers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
  {
    name: 'mainnet',
    chainId: 1
  }
);

// 自定义网络配置
const customNetwork = {
  name: 'custom-network',
  chainId: 1337,
  ensAddress: null
};

const customProvider = new ethers.JsonRpcProvider(
  'http://localhost:8545',
  customNetwork
);
```

### 2. BrowserProvider

用于浏览器环境，连接到注入的 Web3 Provider（如 MetaMask）。

```typescript
// 检查是否有注入的 Provider
if (typeof window.ethereum !== 'undefined') {
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 请求连接钱包
  await provider.send('eth_requestAccounts', []);
  
  // 获取 Signer
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  console.log('连接的地址:', address);
} else {
  console.log('请安装 MetaMask');
}
```

### 3. WebSocketProvider

通过 WebSocket 连接，支持实时事件监听。

```typescript
const wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');

// 监听新区块
wsProvider.on('block', (blockNumber) => {
  console.log('新区块:', blockNumber);
});

// 监听待处理交易
wsProvider.on('pending', (txHash) => {
  console.log('待处理交易:', txHash);
});

// 记得关闭连接
// wsProvider.destroy();
```

### 4. AlchemyProvider

专门用于连接 Alchemy 服务的 Provider。

```typescript
const alchemyProvider = new ethers.AlchemyProvider('mainnet', 'YOUR-ALCHEMY-API-KEY');

// Alchemy 特有功能
const tokenBalances = await alchemyProvider.send('alchemy_getTokenBalances', [
  '0x...',
  'DEFAULT_TOKENS'
]);
```

### 5. InfuraProvider

专门用于连接 Infura 服务的 Provider。

```typescript
const infuraProvider = new ethers.InfuraProvider('mainnet', 'YOUR-INFURA-PROJECT-ID');

// 或者使用项目密钥
const infuraProviderWithSecret = new ethers.InfuraProvider(
  'mainnet',
  'YOUR-INFURA-PROJECT-ID',
  'YOUR-INFURA-PROJECT-SECRET'
);
```

### 6. FallbackProvider

提供故障转移功能，当一个 Provider 失败时自动切换到备用 Provider。

```typescript
const providers = [
  new ethers.InfuraProvider('mainnet', 'INFURA-PROJECT-ID'),
  new ethers.AlchemyProvider('mainnet', 'ALCHEMY-API-KEY'),
  new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io')
];

const fallbackProvider = new ethers.FallbackProvider(providers);

// 自动故障转移
const balance = await fallbackProvider.getBalance('0x...');
```

## Provider 方法详解

### 1. 账户和余额查询

```typescript
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 获取 ETH 余额
async function getEthBalance(address: string) {
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// 获取指定区块的余额
async function getBalanceAtBlock(address: string, blockNumber: number) {
  const balance = await provider.getBalance(address, blockNumber);
  return ethers.formatEther(balance);
}

// 获取交易数量（nonce）
async function getTransactionCount(address: string) {
  return await provider.getTransactionCount(address);
}

// 获取代码（检查是否为合约地址）
async function getCode(address: string) {
  const code = await provider.getCode(address);
  return code !== '0x'; // 如果不是 '0x'，则是合约地址
}

// 使用示例
const address = '0x...';
console.log('ETH 余额:', await getEthBalance(address));
console.log('交易数量:', await getTransactionCount(address));
console.log('是否为合约:', await getCode(address));
```

### 2. 区块信息查询

```typescript
// 获取最新区块号
async function getLatestBlockNumber() {
  return await provider.getBlockNumber();
}

// 获取区块信息
async function getBlockInfo(blockNumber: number) {
  const block = await provider.getBlock(blockNumber);
  return {
    number: block?.number,
    hash: block?.hash,
    timestamp: block?.timestamp,
    gasLimit: block?.gasLimit.toString(),
    gasUsed: block?.gasUsed.toString(),
    transactions: block?.transactions.length
  };
}

// 获取区块（包含完整交易信息）
async function getBlockWithTransactions(blockNumber: number) {
  const block = await provider.getBlock(blockNumber, true);
  return block;
}

// 使用示例
const latestBlock = await getLatestBlockNumber();
console.log('最新区块:', latestBlock);

const blockInfo = await getBlockInfo(latestBlock);
console.log('区块信息:', blockInfo);
```

### 3. 交易信息查询

```typescript
// 获取交易信息
async function getTransactionInfo(txHash: string) {
  const tx = await provider.getTransaction(txHash);
  return {
    hash: tx?.hash,
    from: tx?.from,
    to: tx?.to,
    value: tx?.value ? ethers.formatEther(tx.value) : '0',
    gasLimit: tx?.gasLimit.toString(),
    gasPrice: tx?.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
    nonce: tx?.nonce,
    data: tx?.data
  };
}

// 获取交易收据
async function getTransactionReceipt(txHash: string) {
  const receipt = await provider.getTransactionReceipt(txHash);
  return {
    status: receipt?.status, // 1 = 成功, 0 = 失败
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed.toString(),
    effectiveGasPrice: receipt?.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') : '0',
    logs: receipt?.logs.length
  };
}

// 等待交易确认
async function waitForTransaction(txHash: string, confirmations: number = 1) {
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  return receipt;
}

// 使用示例
const txHash = '0x...';
const txInfo = await getTransactionInfo(txHash);
console.log('交易信息:', txInfo);

const receipt = await getTransactionReceipt(txHash);
console.log('交易收据:', receipt);
```

### 4. Gas 和费用查询

```typescript
// 获取当前 Gas 价格
async function getCurrentGasPrice() {
  const gasPrice = await provider.getGasPrice();
  return ethers.formatUnits(gasPrice, 'gwei');
}

// 获取 EIP-1559 费用数据
async function getFeeData() {
  const feeData = await provider.getFeeData();
  return {
    gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
    maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null
  };
}

// 估算 Gas 使用量
async function estimateGas(transaction: any) {
  const gasEstimate = await provider.estimateGas(transaction);
  return gasEstimate.toString();
}

// 使用示例
console.log('当前 Gas 价格:', await getCurrentGasPrice(), 'Gwei');
console.log('费用数据:', await getFeeData());

const tx = {
  to: '0x...',
  value: ethers.parseEther('1.0')
};
console.log('预估 Gas:', await estimateGas(tx));
```

### 5. 网络信息查询

```typescript
// 获取网络信息
async function getNetworkInfo() {
  const network = await provider.getNetwork();
  return {
    name: network.name,
    chainId: Number(network.chainId),
    ensAddress: network.ensAddress
  };
}

// 检查网络连接
async function checkConnection() {
  try {
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    console.error('网络连接失败:', error);
    return false;
  }
}

// 使用示例
const networkInfo = await getNetworkInfo();
console.log('网络信息:', networkInfo);

const isConnected = await checkConnection();
console.log('网络连接状态:', isConnected);
```

## 事件监听

### 1. 基本事件监听

```typescript
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 监听新区块
provider.on('block', (blockNumber) => {
  console.log('新区块:', blockNumber);
});

// 监听待处理交易
provider.on('pending', (txHash) => {
  console.log('待处理交易:', txHash);
});

// 监听网络变化
provider.on('network', (newNetwork, oldNetwork) => {
  if (oldNetwork) {
    console.log('网络从', oldNetwork.name, '切换到', newNetwork.name);
  }
});

// 监听错误
provider.on('error', (error) => {
  console.error('Provider 错误:', error);
});

// 移除监听器
provider.removeAllListeners('block');
```

### 2. 过滤器和日志监听

```typescript
// 创建过滤器
const filter = {
  address: '0x...', // 合约地址
  topics: [
    ethers.id('Transfer(address,address,uint256)') // 事件签名
  ]
};

// 监听过滤器事件
provider.on(filter, (log) => {
  console.log('Transfer 事件:', log);
});

// 查询历史日志
async function getHistoricalLogs() {
  const logs = await provider.getLogs({
    ...filter,
    fromBlock: -10000, // 最近10000个区块
    toBlock: 'latest'
  });
  
  console.log(`找到 ${logs.length} 条日志`);
}
```

## 高级用法

### 1. 批量请求

```typescript
// 批量获取多个地址的余额
async function getBatchBalances(addresses: string[]) {
  const promises = addresses.map(address => provider.getBalance(address));
  const balances = await Promise.all(promises);
  
  return addresses.map((address, index) => ({
    address,
    balance: ethers.formatEther(balances[index])
  }));
}

// 批量获取交易信息
async function getBatchTransactions(txHashes: string[]) {
  const promises = txHashes.map(hash => provider.getTransaction(hash));
  const transactions = await Promise.all(promises);
  
  return transactions.filter(tx => tx !== null);
}

// 使用示例
const addresses = ['0x...', '0x...', '0x...'];
const balances = await getBatchBalances(addresses);
console.log('批量余额查询:', balances);
```

### 2. 缓存机制

```typescript
class CachedProvider {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 30000; // 30秒缓存

  constructor(private provider: ethers.JsonRpcProvider) {}

  async getBalance(address: string, useCache = true) {
    const cacheKey = `balance_${address}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const balance = await this.provider.getBalance(address);
    
    this.cache.set(cacheKey, {
      data: balance,
      timestamp: Date.now()
    });

    return balance;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 使用示例
const cachedProvider = new CachedProvider(provider);
const balance1 = await cachedProvider.getBalance('0x...'); // 从网络获取
const balance2 = await cachedProvider.getBalance('0x...'); // 从缓存获取
```

### 3. 重试机制

```typescript
class RetryableProvider {
  constructor(
    private provider: ethers.JsonRpcProvider,
    private maxRetries = 3,
    private retryDelay = 1000
  ) {}

  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          console.warn(`尝试 ${attempt + 1} 失败，${this.retryDelay}ms 后重试:`, error);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw lastError!;
  }

  async getBalance(address: string) {
    return this.withRetry(() => this.provider.getBalance(address));
  }

  async getTransaction(hash: string) {
    return this.withRetry(() => this.provider.getTransaction(hash));
  }
}

// 使用示例
const retryableProvider = new RetryableProvider(provider);
const balance = await retryableProvider.getBalance('0x...');
```

## 错误处理

### 1. 常见错误类型

```typescript
async function handleProviderErrors() {
  try {
    const balance = await provider.getBalance('invalid-address');
  } catch (error: any) {
    if (error.code === 'INVALID_ARGUMENT') {
      console.error('无效参数:', error.message);
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('网络错误:', error.message);
    } else if (error.code === 'SERVER_ERROR') {
      console.error('服务器错误:', error.message);
    } else if (error.code === 'TIMEOUT') {
      console.error('请求超时:', error.message);
    } else {
      console.error('未知错误:', error);
    }
  }
}
```

### 2. 网络切换处理

```typescript
class NetworkAwareProvider {
  private currentNetwork: ethers.Network | null = null;

  constructor(private provider: ethers.BrowserProvider) {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    this.provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        console.log(`网络从 ${oldNetwork.name} 切换到 ${newNetwork.name}`);
        this.handleNetworkChange(newNetwork, oldNetwork);
      }
      this.currentNetwork = newNetwork;
    });
  }

  private handleNetworkChange(newNetwork: ethers.Network, oldNetwork: ethers.Network) {
    // 清除缓存
    // 重新初始化合约
    // 通知应用层网络变化
    console.log('处理网络切换逻辑...');
  }

  async getCurrentNetwork() {
    if (!this.currentNetwork) {
      this.currentNetwork = await this.provider.getNetwork();
    }
    return this.currentNetwork;
  }

  async ensureNetwork(expectedChainId: number) {
    const network = await this.getCurrentNetwork();
    if (Number(network.chainId) !== expectedChainId) {
      throw new Error(`期望网络 ${expectedChainId}，当前网络 ${network.chainId}`);
    }
  }
}
```

## 性能优化

### 1. 连接池

```typescript
class ProviderPool {
  private providers: ethers.JsonRpcProvider[] = [];
  private currentIndex = 0;

  constructor(urls: string[]) {
    this.providers = urls.map(url => new ethers.JsonRpcProvider(url));
  }

  getProvider(): ethers.JsonRpcProvider {
    const provider = this.providers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    return provider;
  }

  async request<T>(method: string, params: any[]): Promise<T> {
    const provider = this.getProvider();
    return provider.send(method, params);
  }

  async getBalance(address: string) {
    return this.request<string>('eth_getBalance', [address, 'latest']);
  }
}
```

### 2. 请求去重

```typescript
class DeduplicatedProvider {
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(private provider: ethers.JsonRpcProvider) {}

  async request(method: string, params: any[]) {
    const key = `${method}:${JSON.stringify(params)}`;
    
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = this.provider.send(method, params);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  async getBalance(address: string) {
    return this.request('eth_getBalance', [address, 'latest']);
  }
}
```

## 最佳实践

### 1. Provider 选择指南

```typescript
// 开发环境
const devProvider = new ethers.JsonRpcProvider('http://localhost:8545');

// 测试环境
const testProvider = new ethers.InfuraProvider('sepolia', 'PROJECT-ID');

// 生产环境 - 使用故障转移
const prodProvider = new ethers.FallbackProvider([
  new ethers.AlchemyProvider('mainnet', 'ALCHEMY-KEY'),
  new ethers.InfuraProvider('mainnet', 'INFURA-KEY'),
  new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io')
]);
```

### 2. 环境配置

```typescript
interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrls: string[];
  blockExplorer?: string;
}

const networks: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrls: [
      'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      'https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY'
    ],
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrls: [
      'https://sepolia.infura.io/v3/YOUR-PROJECT-ID'
    ],
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};

function createProvider(networkName: string): ethers.JsonRpcProvider {
  const config = networks[networkName];
  if (!config) {
    throw new Error(`不支持的网络: ${networkName}`);
  }

  if (config.rpcUrls.length === 1) {
    return new ethers.JsonRpcProvider(config.rpcUrls[0]);
  } else {
    const providers = config.rpcUrls.map(url => new ethers.JsonRpcProvider(url));
    return new ethers.FallbackProvider(providers);
  }
}
```

### 3. 监控和日志

```typescript
class MonitoredProvider {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;

  constructor(private provider: ethers.JsonRpcProvider) {}

  async send(method: string, params: any[]) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const result = await this.provider.send(method, params);
      const responseTime = Date.now() - startTime;
      this.responseTimeSum += responseTime;
      
      console.log(`✅ ${method} - ${responseTime}ms`);
      return result;
    } catch (error) {
      this.errorCount++;
      const responseTime = Date.now() - startTime;
      
      console.error(`❌ ${method} - ${responseTime}ms - ${error}`);
      throw error;
    }
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      successRate: ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%',
      averageResponseTime: this.requestCount > 0 
        ? (this.responseTimeSum / this.requestCount).toFixed(2) + 'ms'
        : '0ms'
    };
  }
}
```

## 常见问题

### Q: 如何选择合适的 Provider？
A: 根据使用场景选择：
- **开发测试**: JsonRpcProvider + 本地节点
- **生产环境**: FallbackProvider + 多个服务商
- **浏览器应用**: BrowserProvider + 钱包集成
- **实时监听**: WebSocketProvider

### Q: 如何处理网络切换？
A: 监听网络变化事件，重新初始化相关组件：
```typescript
provider.on('network', (newNetwork, oldNetwork) => {
  // 处理网络切换逻辑
});
```

### Q: 如何优化 Provider 性能？
A: 使用以下策略：
- 批量请求
- 结果缓存
- 连接池
- 请求去重
- 故障转移

## 下一步

- [JsonRpcProvider 详解](/ethers/providers/json-rpc-provider) - 深入了解最常用的 Provider
- [BrowserProvider 详解](/ethers/providers/browser-provider) - 学习浏览器钱包集成
- [WebSocketProvider 详解](/ethers/providers/websocket-provider) - 掌握实时事件监听
- [FallbackProvider 详解](/ethers/providers/fallback-provider) - 实现高可用性连接
