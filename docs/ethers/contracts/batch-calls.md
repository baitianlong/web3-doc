---
title: 批量调用
description: Ethers.js 中智能合约批量调用的完整指南
keywords: [ethers, 批量调用, 智能合约, 性能优化, multicall, Web3]
---

# 批量调用

批量调用是提高 Web3 应用性能的重要技术。通过将多个合约调用合并为单个请求，可以显著减少网络延迟和提高用户体验。

## 批量调用基础

### 1. 为什么需要批量调用

```typescript
// 传统的串行调用（性能差）
async function getTokenInfoSerial(contract: ethers.Contract) {
  const name = await contract.name();        // 请求 1
  const symbol = await contract.symbol();    // 请求 2
  const decimals = await contract.decimals(); // 请求 3
  const totalSupply = await contract.totalSupply(); // 请求 4
  
  return { name, symbol, decimals, totalSupply };
}

// 并行调用（性能好）
async function getTokenInfoParallel(contract: ethers.Contract) {
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
    contract.totalSupply()
  ]);
  
  return { name, symbol, decimals, totalSupply };
}

// 性能对比
console.time('串行调用');
await getTokenInfoSerial(contract);
console.timeEnd('串行调用'); // ~400ms

console.time('并行调用');
await getTokenInfoParallel(contract);
console.timeEnd('并行调用'); // ~100ms
```

### 2. 批量调用的类型

```typescript
// 批量调用类型定义
interface BatchCall {
  target: string;           // 合约地址
  callData: string;         // 调用数据
  allowFailure?: boolean;   // 是否允许失败
}

interface BatchResult {
  success: boolean;
  returnData: string;
  gasUsed?: bigint;
}

// 批量调用配置
interface BatchCallConfig {
  maxBatchSize: number;     // 最大批次大小
  concurrency: number;      // 并发数
  retryAttempts: number;    // 重试次数
  timeout: number;          // 超时时间
  allowPartialFailure: boolean; // 允许部分失败
}
```

## 基础批量调用

### 1. Promise.all 批量调用

```typescript
class BasicBatchCaller {
  private contract: ethers.Contract;
  private maxConcurrency: number;

  constructor(contract: ethers.Contract, maxConcurrency: number = 10) {
    this.contract = contract;
    this.maxConcurrency = maxConcurrency;
  }

  // 基础并行调用
  async batchCall<T>(
    calls: Array<{
      functionName: string;
      args: any[];
    }>
  ): Promise<T[]> {
    const promises = calls.map(call => 
      this.contract[call.functionName](...call.args)
    );
    
    return await Promise.all(promises);
  }

  // 限制并发数的批量调用
  async batchCallWithConcurrency<T>(
    calls: Array<{
      functionName: string;
      args: any[];
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    // 分批处理
    for (let i = 0; i < calls.length; i += this.maxConcurrency) {
      const batch = calls.slice(i, i + this.maxConcurrency);
      
      const batchPromises = batch.map(call =>
        this.contract[call.functionName](...call.args)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // 容错批量调用
  async batchCallWithErrorHandling<T>(
    calls: Array<{
      functionName: string;
      args: any[];
      fallback?: T;
    }>
  ): Promise<Array<{
    success: boolean;
    result?: T;
    error?: string;
  }>> {
    const promises = calls.map(async (call) => {
      try {
        const result = await this.contract[call.functionName](...call.args);
        return { success: true, result };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          result: call.fallback
        };
      }
    });
    
    return await Promise.all(promises);
  }

  // 批量获取用户余额
  async batchGetBalances(addresses: string[]): Promise<Array<{
    address: string;
    balance: string;
    formatted: string;
  }>> {
    const calls = addresses.map(address => ({
      functionName: 'balanceOf',
      args: [address]
    }));
    
    const [balances, decimals] = await Promise.all([
      this.batchCall<bigint>(calls),
      this.contract.decimals()
    ]);
    
    return addresses.map((address, index) => ({
      address,
      balance: balances[index].toString(),
      formatted: ethers.formatUnits(balances[index], decimals)
    }));
  }

  // 批量检查授权额度
  async batchGetAllowances(
    owners: string[],
    spender: string
  ): Promise<Array<{
    owner: string;
    allowance: string;
    formatted: string;
  }>> {
    const calls = owners.map(owner => ({
      functionName: 'allowance',
      args: [owner, spender]
    }));
    
    const [allowances, decimals] = await Promise.all([
      this.batchCall<bigint>(calls),
      this.contract.decimals()
    ]);
    
    return owners.map((owner, index) => ({
      owner,
      allowance: allowances[index].toString(),
      formatted: ethers.formatUnits(allowances[index], decimals)
    }));
  }
}

// 使用示例
const batchCaller = new BasicBatchCaller(contract, 5);

// 批量获取代币信息
const tokenInfo = await batchCaller.batchCall([
  { functionName: 'name', args: [] },
  { functionName: 'symbol', args: [] },
  { functionName: 'decimals', args: [] },
  { functionName: 'totalSupply', args: [] }
]);

console.log('代币信息:', {
  name: tokenInfo[0],
  symbol: tokenInfo[1],
  decimals: tokenInfo[2],
  totalSupply: ethers.formatUnits(tokenInfo[3], tokenInfo[2])
});

// 批量获取用户余额
const addresses = ['0x...', '0x...', '0x...'];
const balances = await batchCaller.batchGetBalances(addresses);
console.log('用户余额:', balances);
```

### 2. 高级批量调用器

```typescript
class AdvancedBatchCaller {
  private provider: ethers.Provider;
  private config: BatchCallConfig;

  constructor(provider: ethers.Provider, config: Partial<BatchCallConfig> = {}) {
    this.provider = provider;
    this.config = {
      maxBatchSize: 100,
      concurrency: 10,
      retryAttempts: 3,
      timeout: 30000,
      allowPartialFailure: true,
      ...config
    };
  }

  // 智能批量调用
  async smartBatchCall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
    }>
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // 按优先级分组
    const priorityGroups = this.groupByPriority(calls);
    
    // 按优先级顺序执行
    for (const [priority, group] of priorityGroups) {
      console.log(`执行 ${priority} 优先级调用 (${group.length} 个)`);
      
      const groupResults = await this.executeBatch(group);
      
      // 合并结果
      groupResults.forEach((value, key) => {
        results.set(key, value);
      });
    }
    
    return results;
  }

  // 按优先级分组
  private groupByPriority(calls: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    calls.forEach((call, index) => {
      const priority = call.priority || 'normal';
      const key = `${priority}_${index}`;
      
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      
      groups.get(priority)!.push({ ...call, key });
    });
    
    // 按优先级排序
    const sortedGroups = new Map<string, any[]>();
    ['high', 'normal', 'low'].forEach(priority => {
      if (groups.has(priority)) {
        sortedGroups.set(priority, groups.get(priority)!);
      }
    });
    
    return sortedGroups;
  }

  // 执行批次
  private async executeBatch(calls: any[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // 分批执行
    for (let i = 0; i < calls.length; i += this.config.maxBatchSize) {
      const batch = calls.slice(i, i + this.config.maxBatchSize);
      
      // 进一步按并发数分组
      for (let j = 0; j < batch.length; j += this.config.concurrency) {
        const concurrentBatch = batch.slice(j, j + this.config.concurrency);
        
        const batchPromises = concurrentBatch.map(async (call) => {
          const timeout = call.timeout || this.config.timeout;
          
          try {
            const result = await this.executeWithTimeout(
              () => call.contract[call.functionName](...call.args),
              timeout
            );
            
            return { key: call.key, result, success: true };
          } catch (error: any) {
            return { key: call.key, error: error.message, success: false };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { key, result: value, success, error } = result.value;
            results.set(key, success ? value : { error });
          }
        });
      }
    }
    
    return results;
  }

  // 带超时的执行
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('操作超时'));
      }, timeout);
      
      operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  // 重试机制
  async batchCallWithRetry<T>(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
    }>,
    retryCondition?: (error: any) => boolean
  ): Promise<Array<{
    success: boolean;
    result?: T;
    error?: string;
    attempts: number;
  }>> {
    const results = await Promise.all(
      calls.map(async (call) => {
        let lastError: any;
        
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
          try {
            const result = await call.contract[call.functionName](...call.args);
            return { success: true, result, attempts: attempt + 1 };
          } catch (error) {
            lastError = error;
            
            // 检查是否应该重试
            if (retryCondition && !retryCondition(error)) {
              break;
            }
            
            // 最后一次尝试
            if (attempt === this.config.retryAttempts) {
              break;
            }
            
            // 等待后重试
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
        
        return {
          success: false,
          error: lastError?.message || 'Unknown error',
          attempts: this.config.retryAttempts + 1
        };
      })
    );
    
    return results;
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 动态批量调用（根据网络状况调整）
  async dynamicBatchCall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
    }>
  ): Promise<any[]> {
    const startTime = Date.now();
    let currentBatchSize = this.config.maxBatchSize;
    let currentConcurrency = this.config.concurrency;
    
    const results: any[] = [];
    
    for (let i = 0; i < calls.length; i += currentBatchSize) {
      const batch = calls.slice(i, i + currentBatchSize);
      const batchStartTime = Date.now();
      
      // 执行当前批次
      const batchResults = await this.executeConcurrentBatch(batch, currentConcurrency);
      results.push(...batchResults);
      
      const batchDuration = Date.now() - batchStartTime;
      const avgTimePerCall = batchDuration / batch.length;
      
      // 根据性能调整参数
      if (avgTimePerCall > 1000) { // 如果每个调用超过1秒
        currentBatchSize = Math.max(10, Math.floor(currentBatchSize * 0.8));
        currentConcurrency = Math.max(2, Math.floor(currentConcurrency * 0.8));
        console.log(`性能较慢，调整批次大小为 ${currentBatchSize}，并发数为 ${currentConcurrency}`);
      } else if (avgTimePerCall < 200) { // 如果每个调用少于200ms
        currentBatchSize = Math.min(200, Math.floor(currentBatchSize * 1.2));
        currentConcurrency = Math.min(20, Math.floor(currentConcurrency * 1.2));
        console.log(`性能良好，调整批次大小为 ${currentBatchSize}，并发数为 ${currentConcurrency}`);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`批量调用完成，总耗时: ${totalDuration}ms，平均每个调用: ${totalDuration / calls.length}ms`);
    
    return results;
  }

  // 执行并发批次
  private async executeConcurrentBatch(calls: any[], concurrency: number): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < calls.length; i += concurrency) {
      const concurrentBatch = calls.slice(i, i + concurrency);
      
      const promises = concurrentBatch.map(call =>
        call.contract[call.functionName](...call.args)
      );
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// 使用示例
const advancedBatcher = new AdvancedBatchCaller(provider, {
  maxBatchSize: 50,
  concurrency: 8,
  retryAttempts: 2,
  timeout: 15000
});

// 智能批量调用
const smartResults = await advancedBatcher.smartBatchCall([
  {
    contract: usdcContract,
    functionName: 'name',
    args: [],
    priority: 'high'
  },
  {
    contract: usdcContract,
    functionName: 'balanceOf',
    args: [userAddress],
    priority: 'normal'
  },
  {
    contract: wethContract,
    functionName: 'balanceOf',
    args: [userAddress],
    priority: 'low'
  }
]);

// 动态批量调用
const dynamicResults = await advancedBatcher.dynamicBatchCall([
  { contract: usdcContract, functionName: 'name', args: [] },
  { contract: usdcContract, functionName: 'symbol', args: [] },
  // ... 更多调用
]);
```

## Multicall 合约

### 1. Multicall 基础

```typescript
// Multicall 合约 ABI
const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
  "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)",
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)"
];

// 常见网络的 Multicall 地址
const MULTICALL_ADDRESSES: { [chainId: number]: string } = {
  1: '0xcA11bde05977b3631167028862bE2a173976CA11',     // Ethereum
  5: '0xcA11bde05977b3631167028862bE2a173976CA11',     // Goerli
  137: '0xcA11bde05977b3631167028862bE2a173976CA11',   // Polygon
  42161: '0xcA11bde05977b3631167028862bE2a173976CA11', // Arbitrum
  10: '0xcA11bde05977b3631167028862bE2a173976CA11',    // Optimism
};

class MulticallBatcher {
  private provider: ethers.Provider;
  private multicallContract: ethers.Contract;
  private chainId: number;

  constructor(provider: ethers.Provider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
    
    const multicallAddress = MULTICALL_ADDRESSES[chainId];
    if (!multicallAddress) {
      throw new Error(`Multicall not supported on chain ${chainId}`);
    }
    
    this.multicallContract = new ethers.Contract(
      multicallAddress,
      MULTICALL_ABI,
      provider
    );
  }

  // 编码函数调用
  private encodeFunctionCall(
    contract: ethers.Contract,
    functionName: string,
    args: any[]
  ): string {
    return contract.interface.encodeFunctionData(functionName, args);
  }

  // 解码函数结果
  private decodeFunctionResult(
    contract: ethers.Contract,
    functionName: string,
    data: string
  ): any {
    return contract.interface.decodeFunctionResult(functionName, data);
  }

  // 基础 Multicall
  async multicall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
    }>
  ): Promise<any[]> {
    // 编码调用数据
    const encodedCalls = calls.map(call => ({
      target: call.contract.target,
      callData: this.encodeFunctionCall(call.contract, call.functionName, call.args)
    }));

    // 执行 multicall
    const [blockNumber, returnData] = await this.multicallContract.aggregate(encodedCalls);

    // 解码结果
    const results = returnData.map((data: string, index: number) => {
      const call = calls[index];
      return this.decodeFunctionResult(call.contract, call.functionName, data)[0];
    });

    return results;
  }

  // 容错 Multicall
  async tryMulticall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
      allowFailure?: boolean;
    }>
  ): Promise<Array<{
    success: boolean;
    result?: any;
    error?: string;
  }>> {
    // 编码调用数据
    const encodedCalls = calls.map(call => ({
      target: call.contract.target,
      allowFailure: call.allowFailure ?? true,
      callData: this.encodeFunctionCall(call.contract, call.functionName, call.args)
    }));

    // 执行 multicall
    const returnData = await this.multicallContract.aggregate3(encodedCalls);

    // 解码结果
    const results = returnData.map((result: any, index: number) => {
      const call = calls[index];
      
      if (!result.success) {
        return {
          success: false,
          error: 'Call failed'
        };
      }

      try {
        const decoded = this.decodeFunctionResult(
          call.contract,
          call.functionName,
          result.returnData
        );
        
        return {
          success: true,
          result: decoded[0]
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    return results;
  }

  // 批量获取 ERC20 代币信息
  async batchGetTokenInfo(
    tokenAddresses: string[]
  ): Promise<Array<{
    address: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
    success: boolean;
  }>> {
    const ERC20_ABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)"
    ];

    const calls: any[] = [];
    
    // 为每个代币创建调用
    tokenAddresses.forEach(address => {
      const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
      
      calls.push(
        { contract, functionName: 'name', args: [], allowFailure: true },
        { contract, functionName: 'symbol', args: [], allowFailure: true },
        { contract, functionName: 'decimals', args: [], allowFailure: true },
        { contract, functionName: 'totalSupply', args: [], allowFailure: true }
      );
    });

    const results = await this.tryMulticall(calls);
    
    // 组织结果
    const tokenInfos = tokenAddresses.map((address, index) => {
      const baseIndex = index * 4;
      const nameResult = results[baseIndex];
      const symbolResult = results[baseIndex + 1];
      const decimalsResult = results[baseIndex + 2];
      const totalSupplyResult = results[baseIndex + 3];
      
      const success = nameResult.success && symbolResult.success && 
                     decimalsResult.success && totalSupplyResult.success;
      
      return {
        address,
        name: nameResult.result,
        symbol: symbolResult.result,
        decimals: decimalsResult.result,
        totalSupply: totalSupplyResult.success ? 
          ethers.formatUnits(totalSupplyResult.result, decimalsResult.result || 18) : 
          undefined,
        success
      };
    });

    return tokenInfos;
  }

  // 批量获取用户代币余额
  async batchGetUserBalances(
    userAddress: string,
    tokenAddresses: string[]
  ): Promise<Array<{
    tokenAddress: string;
    balance: string;
    formatted: string;
    decimals: number;
    success: boolean;
  }>> {
    const ERC20_ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];

    const calls: any[] = [];
    
    // 为每个代币创建调用
    tokenAddresses.forEach(address => {
      const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
      
      calls.push(
        { contract, functionName: 'balanceOf', args: [userAddress], allowFailure: true },
        { contract, functionName: 'decimals', args: [], allowFailure: true }
      );
    });

    const results = await this.tryMulticall(calls);
    
    // 组织结果
    const balances = tokenAddresses.map((tokenAddress, index) => {
      const baseIndex = index * 2;
      const balanceResult = results[baseIndex];
      const decimalsResult = results[baseIndex + 1];
      
      const success = balanceResult.success && decimalsResult.success;
      const decimals = decimalsResult.success ? decimalsResult.result : 18;
      const balance = balanceResult.success ? balanceResult.result.toString() : '0';
      
      return {
        tokenAddress,
        balance,
        formatted: success ? ethers.formatUnits(balance, decimals) : '0',
        decimals,
        success
      };
    });

    return balances;
  }

  // 批量检查授权额度
  async batchGetAllowances(
    ownerAddress: string,
    spenderAddress: string,
    tokenAddresses: string[]
  ): Promise<Array<{
    tokenAddress: string;
    allowance: string;
    formatted: string;
    isApproved: boolean;
    success: boolean;
  }>> {
    const ERC20_ABI = [
      "function allowance(address,address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];

    const calls: any[] = [];
    
    tokenAddresses.forEach(address => {
      const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
      
      calls.push(
        { contract, functionName: 'allowance', args: [ownerAddress, spenderAddress], allowFailure: true },
        { contract, functionName: 'decimals', args: [], allowFailure: true }
      );
    });

    const results = await this.tryMulticall(calls);
    
    const allowances = tokenAddresses.map((tokenAddress, index) => {
      const baseIndex = index * 2;
      const allowanceResult = results[baseIndex];
      const decimalsResult = results[baseIndex + 1];
      
      const success = allowanceResult.success && decimalsResult.success;
      const decimals = decimalsResult.success ? decimalsResult.result : 18;
      const allowance = allowanceResult.success ? allowanceResult.result.toString() : '0';
      
      return {
        tokenAddress,
        allowance,
        formatted: success ? ethers.formatUnits(allowance, decimals) : '0',
        isApproved: success && allowanceResult.result > 0n,
        success
      };
    });

    return allowances;
  }
}

// 使用示例
const multicaller = new MulticallBatcher(provider, 1); // Ethereum mainnet

// 批量获取代币信息
const tokenAddresses = [
  '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8', // USDC
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
];

const tokenInfos = await multicaller.batchGetTokenInfo(tokenAddresses);
console.log('代币信息:', tokenInfos);

// 批量获取用户余额
const userBalances = await multicaller.batchGetUserBalances(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddresses
);
console.log('用户余额:', userBalances);

// 批量检查授权
const allowances = await multicaller.batchGetAllowances(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router
  tokenAddresses
);
console.log('授权额度:', allowances);
```

## 性能优化策略

### 1. 缓存和去重

```typescript
class OptimizedBatchCaller {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private pendingCalls: Map<string, Promise<any>> = new Map();
  private callStats: Map<string, { count: number; totalTime: number; errors: number }> = new Map();

  constructor(private provider: ethers.Provider) {}

  // 生成缓存键
  private generateCacheKey(
    contractAddress: string,
    functionName: string,
    args: any[]
  ): string {
    return `${contractAddress}:${functionName}:${JSON.stringify(args)}`;
  }

  // 检查缓存
  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // 设置缓存
  private setCachedResult(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // 去重批量调用
  async deduplicatedBatchCall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
      cacheTtl?: number;
    }>
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const uniqueCalls = new Map<string, any>();
    const keyMapping = new Map<number, string>();
    
    // 去重和缓存检查
    calls.forEach((call, index) => {
      const key = this.generateCacheKey(
        call.contract.target as string,
        call.functionName,
        call.args
      );
      
      keyMapping.set(index, key);
      
      // 检查缓存
      const cached = this.getCachedResult(key);
      if (cached !== null) {
        results.set(key, cached);
        return;
      }
      
      // 检查是否已有相同的待处理调用
      if (this.pendingCalls.has(key)) {
        return;
      }
      
      uniqueCalls.set(key, call);
    });
    
    // 执行唯一的调用
    if (uniqueCalls.size > 0) {
      const uniqueCallsArray = Array.from(uniqueCalls.values());
      const promises = uniqueCallsArray.map(async (call) => {
        const key = this.generateCacheKey(
          call.contract.target as string,
          call.functionName,
          call.args
        );
        
        const startTime = Date.now();
        
        try {
          // 避免重复调用
          if (this.pendingCalls.has(key)) {
            return await this.pendingCalls.get(key);
          }
          
          const promise = call.contract[call.functionName](...call.args);
          this.pendingCalls.set(key, promise);
          
          const result = await promise;
          
          // 更新统计
          this.updateStats(key, Date.now() - startTime, false);
          
          // 设置缓存
          this.setCachedResult(key, result, call.cacheTtl);
          
          return { key, result, success: true };
        } catch (error: any) {
          this.updateStats(key, Date.now() - startTime, true);
          return { key, error: error.message, success: false };
        } finally {
          this.pendingCalls.delete(key);
        }
      });
      
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ key, result, error, success }) => {
        results.set(key, success ? result : { error });
      });
    }
    
    // 等待所有待处理的调用
    const pendingPromises = Array.from(this.pendingCalls.entries()).map(
      async ([key, promise]) => {
        try {
          const result = await promise;
          results.set(key, result);
        } catch (error: any) {
          results.set(key, { error: error.message });
        }
      }
    );
    
    await Promise.all(pendingPromises);
    
    return results;
  }

  // 更新统计信息
  private updateStats(key: string, duration: number, isError: boolean): void {
    let stats = this.callStats.get(key);
    if (!stats) {
      stats = { count: 0, totalTime: 0, errors: 0 };
      this.callStats.set(key, stats);
    }
    
    stats.count++;
    stats.totalTime += duration;
    if (isError) stats.errors++;
  }

  // 智能批量调用（基于历史性能）
  async smartBatchCall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
    }>
  ): Promise<any[]> {
    // 根据历史性能对调用进行排序
    const sortedCalls = calls.map((call, index) => {
      const key = this.generateCacheKey(
        call.contract.target as string,
        call.functionName,
        call.args
      );
      
      const stats = this.callStats.get(key);
      const avgTime = stats ? stats.totalTime / stats.count : 1000;
      const errorRate = stats ? stats.errors / stats.count : 0;
      
      return {
        ...call,
        originalIndex: index,
        avgTime,
        errorRate,
        priority: this.calculatePriority(avgTime, errorRate)
      };
    }).sort((a, b) => b.priority - a.priority);
    
    // 执行去重批量调用
    const results = await this.deduplicatedBatchCall(sortedCalls);
    
    // 按原始顺序返回结果
    const orderedResults = new Array(calls.length);
    sortedCalls.forEach((call) => {
      const key = this.generateCacheKey(
        call.contract.target as string,
        call.functionName,
        call.args
      );
      orderedResults[call.originalIndex] = results.get(key);
    });
    
    return orderedResults;
  }

  // 计算调用优先级
  private calculatePriority(avgTime: number, errorRate: number): number {
    // 时间越短、错误率越低，优先级越高
    const timeScore = Math.max(0, 1000 - avgTime) / 1000;
    const errorScore = Math.max(0, 1 - errorRate);
    return (timeScore + errorScore) / 2;
  }

  // 获取性能统计
  getPerformanceStats(): Array<{
    call: string;
    count: number;
    avgTime: number;
    errorRate: number;
    totalTime: number;
  }> {
    return Array.from(this.callStats.entries()).map(([key, stats]) => ({
      call: key,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      errorRate: stats.errors / stats.count,
      totalTime: stats.totalTime
    }));
  }

  // 清理缓存
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // 预热缓存
  async warmupCache(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
      cacheTtl?: number;
    }>
  ): Promise<void> {
    console.log(`预热缓存，共 ${calls.length} 个调用`);
    await this.deduplicatedBatchCall(calls);
    console.log('缓存预热完成');
  }
}

// 使用示例
const optimizedBatcher = new OptimizedBatchCaller(provider);

// 预热常用数据的缓存
await optimizedBatcher.warmupCache([
  { contract: usdcContract, functionName: 'name', args: [], cacheTtl: 300000 },
  { contract: usdcContract, functionName: 'symbol', args: [], cacheTtl: 300000 },
  { contract: usdcContract, functionName: 'decimals', args: [], cacheTtl: 300000 }
]);

// 智能批量调用
const smartResults = await optimizedBatcher.smartBatchCall([
  { contract: usdcContract, functionName: 'name', args: [] },
  { contract: usdcContract, functionName: 'balanceOf', args: [userAddress] },
  { contract: wethContract, functionName: 'balanceOf', args: [userAddress] }
]);

// 查看性能统计
const stats = optimizedBatcher.getPerformanceStats();
console.log('性能统计:', stats);
```

### 2. 自适应批量大小

```typescript
class AdaptiveBatchCaller {
  private provider: ethers.Provider;
  private performanceHistory: Array<{
    batchSize: number;
    concurrency: number;
    duration: number;
    successRate: number;
    timestamp: number;
  }> = [];
  
  private currentBatchSize: number = 50;
  private currentConcurrency: number = 10;
  private minBatchSize: number = 10;
  private maxBatchSize: number = 200;
  private minConcurrency: number = 2;
  private maxConcurrency: number = 20;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 自适应批量调用
  async adaptiveBatchCall(
    calls: Array<{
      contract: ethers.Contract;
      functionName: string;
      args: any[];
    }>
  ): Promise<any[]> {
    const results: any[] = [];
    let processedCalls = 0;
    
    while (processedCalls < calls.length) {
      const batch = calls.slice(processedCalls, processedCalls + this.currentBatchSize);
      const startTime = Date.now();
      
      try {
        const batchResults = await this.executeBatchWithConcurrency(batch, this.currentConcurrency);
        results.push(...batchResults);
        
        const duration = Date.now() - startTime;
        const successCount = batchResults.filter(r => r.success !== false).length;
        const successRate = successCount / batch.length;
        
        // 记录性能数据
        this.recordPerformance({
          batchSize: batch.length,
          concurrency: this.currentConcurrency,
          duration,
          successRate,
          timestamp: Date.now()
        });
        
        // 调整参数
        this.adjustParameters(duration, successRate, batch.length);
        
        processedCalls += batch.length;
        
        console.log(`批次完成: ${batch.length} 个调用，耗时 ${duration}ms，成功率 ${(successRate * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.error('批次执行失败:', error);
        
        // 降低批次大小和并发数
        this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.5));
        this.currentConcurrency = Math.max(this.minConcurrency, Math.floor(this.currentConcurrency * 0.5));
        
        // 重试当前批次
        continue;
      }
    }
    
    return results;
  }

  // 执行带并发控制的批次
  private async executeBatchWithConcurrency(calls: any[], concurrency: number): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < calls.length; i += concurrency) {
      const concurrentBatch = calls.slice(i, i + concurrency);
      
      const promises = concurrentBatch.map(async (call) => {
        try {
          const result = await call.contract[call.functionName](...call.args);
          return { success: true, result };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // 记录性能数据
  private recordPerformance(data: {
    batchSize: number;
    concurrency: number;
    duration: number;
    successRate: number;
    timestamp: number;
  }): void {
    this.performanceHistory.push(data);
    
    // 只保留最近的100条记录
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  // 调整参数
  private adjustParameters(duration: number, successRate: number, batchSize: number): void {
    const avgTimePerCall = duration / batchSize;
    
    // 基于性能调整批次大小
    if (avgTimePerCall < 100 && successRate > 0.95) {
      // 性能很好，增加批次大小
      this.currentBatchSize = Math.min(this.maxBatchSize, Math.floor(this.currentBatchSize * 1.2));
    } else if (avgTimePerCall > 500 || successRate < 0.8) {
      // 性能较差，减少批次大小
      this.currentBatchSize = Math.max(this.minBatchSize, Math.floor(this.currentBatchSize * 0.8));
    }
    
    // 基于成功率调整并发数
    if (successRate > 0.95 && avgTimePerCall < 200) {
      // 成功率高且速度快，增加并发数
      this.currentConcurrency = Math.min(this.maxConcurrency, Math.floor(this.currentConcurrency * 1.1));
    } else if (successRate < 0.9) {
      // 成功率低，减少并发数
      this.currentConcurrency = Math.max(this.minConcurrency, Math.floor(this.currentConcurrency * 0.9));
    }
    
    console.log(`参数调整: 批次大小=${this.currentBatchSize}, 并发数=${this.currentConcurrency}`);
  }

  // 获取最优参数建议
  getOptimalParameters(): {
    batchSize: number;
    concurrency: number;
    confidence: number;
  } {
    if (this.performanceHistory.length < 10) {
      return {
        batchSize: this.currentBatchSize,
        concurrency: this.currentConcurrency,
        confidence: 0.1
      };
    }
    
    // 分析历史数据找到最优参数
    const recentHistory = this.performanceHistory.slice(-20);
    
    // 计算每种参数组合的平均性能
    const parameterGroups = new Map<string, {
      count: number;
      totalDuration: number;
      totalSuccessRate: number;
      avgTimePerCall: number;
    }>();
    
    recentHistory.forEach(record => {
      const key = `${record.batchSize}-${record.concurrency}`;
      const existing = parameterGroups.get(key) || {
        count: 0,
        totalDuration: 0,
        totalSuccessRate: 0,
        avgTimePerCall: 0
      };
      
      existing.count++;
      existing.totalDuration += record.duration;
      existing.totalSuccessRate += record.successRate;
      existing.avgTimePerCall += record.duration / record.batchSize;
      
      parameterGroups.set(key, existing);
    });
    
    // 找到最优组合
    let bestScore = 0;
    let bestBatchSize = this.currentBatchSize;
    let bestConcurrency = this.currentConcurrency;
    
    parameterGroups.forEach((stats, key) => {
      const [batchSize, concurrency] = key.split('-').map(Number);
      const avgSuccessRate = stats.totalSuccessRate / stats.count;
      const avgTimePerCall = stats.avgTimePerCall / stats.count;
      
      // 计算综合得分（成功率权重更高）
      const score = (avgSuccessRate * 0.7) + ((1000 - Math.min(1000, avgTimePerCall)) / 1000 * 0.3);
      
      if (score > bestScore && stats.count >= 3) {
        bestScore = score;
        bestBatchSize = batchSize;
        bestConcurrency = concurrency;
      }
    });
    
    const confidence = Math.min(1, recentHistory.length / 20);
    
    return {
      batchSize: bestBatchSize,
      concurrency: bestConcurrency,
      confidence
    };
  }

  // 获取性能报告
  getPerformanceReport(): {
    totalCalls: number;
    avgDuration: number;
    avgSuccessRate: number;
    currentParameters: { batchSize: number; concurrency: number };
    optimalParameters: { batchSize: number; concurrency: number; confidence: number };
    trend: 'improving' | 'stable' | 'degrading';
  } {
    if (this.performanceHistory.length === 0) {
      return {
        totalCalls: 0,
        avgDuration: 0,
        avgSuccessRate: 0,
        currentParameters: { batchSize: this.currentBatchSize, concurrency: this.currentConcurrency },
        optimalParameters: this.getOptimalParameters(),
        trend: 'stable'
      };
    }
    
    const totalCalls = this.performanceHistory.reduce((sum, record) => sum + record.batchSize, 0);
    const avgDuration = this.performanceHistory.reduce((sum, record) => sum + record.duration, 0) / this.performanceHistory.length;
    const avgSuccessRate = this.performanceHistory.reduce((sum, record) => sum + record.successRate, 0) / this.performanceHistory.length;
    
    // 分析趋势
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (this.performanceHistory.length >= 10) {
      const recent = this.performanceHistory.slice(-5);
      const earlier = this.performanceHistory.slice(-10, -5);
      
      const recentAvgTime = recent.reduce((sum, r) => sum + r.duration / r.batchSize, 0) / recent.length;
      const earlierAvgTime = earlier.reduce((sum, r) => sum + r.duration / r.batchSize, 0) / earlier.length;
      
      if (recentAvgTime < earlierAvgTime * 0.9) {
        trend = 'improving';
      } else if (recentAvgTime > earlierAvgTime * 1.1) {
        trend = 'degrading';
      }
    }
    
    return {
      totalCalls,
      avgDuration,
      avgSuccessRate,
      currentParameters: { batchSize: this.currentBatchSize, concurrency: this.currentConcurrency },
      optimalParameters: this.getOptimalParameters(),
      trend
    };
  }
}

// 使用示例
const adaptiveBatcher = new AdaptiveBatchCaller(provider);

// 执行自适应批量调用
const calls = Array.from({ length: 500 }, (_, i) => ({
  contract: usdcContract,
  functionName: 'balanceOf',
  args: [`0x${i.toString(16).padStart(40, '0')}`]
}));

const results = await adaptiveBatcher.adaptiveBatchCall(calls);

// 获取性能报告
const report = adaptiveBatcher.getPerformanceReport();
console.log('性能报告:', report);

// 获取最优参数建议
const optimal = adaptiveBatcher.getOptimalParameters();
console.log('最优参数:', optimal);
```

## 实际应用场景

### 1. DeFi 数据聚合

```typescript
class DeFiDataAggregator {
  private multicaller: MulticallBatcher;
  private optimizedBatcher: OptimizedBatchCaller;

  constructor(provider: ethers.Provider, chainId: number) {
    this.multicaller = new MulticallBatcher(provider, chainId);
    this.optimizedBatcher = new OptimizedBatchCaller(provider);
  }

  // 获取用户的 DeFi 投资组合
  async getUserPortfolio(userAddress: string): Promise<{
    tokens: Array<{
      address: string;
      name: string;
      symbol: string;
      balance: string;
      value: number;
    }>;
    totalValue: number;
    protocols: Array<{
      name: string;
      positions: any[];
      totalValue: number;
    }>;
  }> {
    // 常见 DeFi 代币地址
    const tokenAddresses = [
      '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8', // USDC
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    ];

    // 批量获取代币信息和余额
    const [tokenInfos, balances] = await Promise.all([
      this.multicaller.batchGetTokenInfo(tokenAddresses),
      this.multicaller.batchGetUserBalances(userAddress, tokenAddresses)
    ]);

    // 组合数据
    const tokens = tokenAddresses.map((address, index) => {
      const info = tokenInfos[index];
      const balance = balances[index];
      
      return {
        address,
        name: info.name || 'Unknown',
        symbol: info.symbol || 'UNK',
        balance: balance.formatted,
        value: 0 // 这里需要集成价格 API
      };
    }).filter(token => parseFloat(token.balance) > 0);

    // 获取协议数据（示例：Uniswap V3 positions）
    const protocols = await this.getProtocolPositions(userAddress);

    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0) +
                      protocols.reduce((sum, protocol) => sum + protocol.totalValue, 0);

    return {
      tokens,
      totalValue,
      protocols
    };
  }

  // 获取协议持仓
  private async getProtocolPositions(userAddress: string): Promise<any[]> {
    // 这里可以添加各种 DeFi 协议的数据获取逻辑
    return [];
  }

  // 批量获取流动性池信息
  async getLiquidityPoolsInfo(poolAddresses: string[]): Promise<Array<{
    address: string;
    token0: { address: string; symbol: string };
    token1: { address: string; symbol: string };
    fee: number;
    liquidity: string;
    sqrtPriceX96: string;
    tick: number;
  }>> {
    const UNISWAP_V3_POOL_ABI = [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function fee() view returns (uint24)",
      "function liquidity() view returns (uint128)",
      "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
    ];

    const calls: any[] = [];
    
    poolAddresses.forEach(address => {
      const contract = new ethers.Contract(address, UNISWAP_V3_POOL_ABI, this.multicaller['provider']);
      
      calls.push(
        { contract, functionName: 'token0', args: [] },
        { contract, functionName: 'token1', args: [] },
        { contract, functionName: 'fee', args: [] },
        { contract, functionName: 'liquidity', args: [] },
        { contract, functionName: 'slot0', args: [] }
      );
    });

    const results = await this.multicaller.tryMulticall(calls);
    
    // 获取代币符号
    const tokenAddresses = new Set<string>();
    poolAddresses.forEach((_, index) => {
      const baseIndex = index * 5;
      if (results[baseIndex].success) tokenAddresses.add(results[baseIndex].result);
      if (results[baseIndex + 1].success) tokenAddresses.add(results[baseIndex + 1].result);
    });

    const tokenInfos = await this.multicaller.batchGetTokenInfo(Array.from(tokenAddresses));
    const tokenInfoMap = new Map(tokenInfos.map(info => [info.address, info]));

    // 组织结果
    const poolInfos = poolAddresses.map((address, index) => {
      const baseIndex = index * 5;
      const token0Address = results[baseIndex].result;
      const token1Address = results[baseIndex + 1].result;
      const fee = results[baseIndex + 2].result;
      const liquidity = results[baseIndex + 3].result;
      const slot0 = results[baseIndex + 4].result;

      const token0Info = tokenInfoMap.get(token0Address);
      const token1Info = tokenInfoMap.get(token1Address);

      return {
        address,
        token0: {
          address: token0Address,
          symbol: token0Info?.symbol || 'UNK'
        },
        token1: {
          address: token1Address,
          symbol: token1Info?.symbol || 'UNK'
        },
        fee: fee || 0,
        liquidity: liquidity?.toString() || '0',
        sqrtPriceX96: slot0?.[0]?.toString() || '0',
        tick: slot0?.[1] || 0
      };
    });

    return poolInfos;
  }
}

// 使用示例
const defiAggregator = new DeFiDataAggregator(provider, 1);

// 获取用户投资组合
const portfolio = await defiAggregator.getUserPortfolio('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
console.log('用户投资组合:', portfolio);

// 获取流动性池信息
const poolAddresses = [
  '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', // USDC/ETH 0.3%
  '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', // USDC/ETH 0.05%
];

const poolInfos = await defiAggregator.getLiquidityPoolsInfo(poolAddresses);
console.log('流动性池信息:', poolInfos);
```

## 常见问题

### Q: 批量调用和单个调用的性能差异有多大？
A: 批量调用可以将网络延迟从 N×RTT 减少到 1×RTT，在高延迟网络中性能提升可达 5-10 倍。

### Q: 什么时候应该使用 Multicall 合约？
A: 当需要确保所有调用在同一区块执行，或者调用数量很大时，Multicall 合约更有优势。

### Q: 如何处理批量调用中的部分失败？
A: 使用容错机制，为每个调用设置 `allowFailure` 标志，并在结果中标记成功/失败状态。

### Q: 批量调用的最佳批次大小是多少？
A: 取决于网络条件和调用复杂度，建议从 50-100 开始，根据实际性能动态调整。

## 下一步

- [交易处理](/ethers/transactions/basics) - 学习交易管理
- [事件监听](/ethers/contracts/events) - 掌握事件处理
- [工具函数](/ethers/utils/encoding) - 了解编码解码工具
- [实战应用](/ethers/examples/defi) - 应用到实际项目中