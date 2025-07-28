---
title: FallbackProvider
description: 深入了解 Ethers.js 中的 FallbackProvider，实现高可用性和故障转移
keywords: [ethers.js, FallbackProvider, 故障转移, 高可用性, 负载均衡, Provider]
---

# FallbackProvider

`FallbackProvider` 是 Ethers.js 中提供故障转移功能的 Provider，它可以管理多个 Provider 并在其中一个失败时自动切换到备用 Provider。这对于构建高可用性的 Web3 应用至关重要。

## 基本用法

```typescript
import { ethers } from 'ethers';

// 创建多个 Provider
const providers = [
  new ethers.InfuraProvider('mainnet', 'INFURA-PROJECT-ID'),
  new ethers.AlchemyProvider('mainnet', 'ALCHEMY-API-KEY'),
  new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io')
];

// 创建 FallbackProvider
const fallbackProvider = new ethers.FallbackProvider(providers);

// 使用方式与普通 Provider 相同
const balance = await fallbackProvider.getBalance('0x...');
console.log('余额:', ethers.formatEther(balance));
```

## 构造函数

### 1. 基本构造

```typescript
// 简单的 Provider 数组
const providers = [
  new ethers.InfuraProvider('mainnet', 'PROJECT-ID-1'),
  new ethers.AlchemyProvider('mainnet', 'API-KEY-2'),
  new ethers.JsonRpcProvider('https://rpc-url-3.com')
];

const fallbackProvider = new ethers.FallbackProvider(providers);
```

### 2. 带配置的构造

```typescript
// 带优先级和权重的配置
const providerConfigs = [
  {
    provider: new ethers.InfuraProvider('mainnet', 'INFURA-ID'),
    priority: 1,    // 优先级（数字越小优先级越高）
    weight: 2,      // 权重（用于负载均衡）
    stallTimeout: 2000  // 超时时间（毫秒）
  },
  {
    provider: new ethers.AlchemyProvider('mainnet', 'ALCHEMY-KEY'),
    priority: 1,
    weight: 2,
    stallTimeout: 2000
  },
  {
    provider: new ethers.JsonRpcProvider('https://public-rpc.com'),
    priority: 2,    // 较低优先级，作为备用
    weight: 1,
    stallTimeout: 3000
  }
];

const fallbackProvider = new ethers.FallbackProvider(providerConfigs);
```

### 3. 高级配置

```typescript
// 完整配置选项
const fallbackProvider = new ethers.FallbackProvider(
  providerConfigs,
  'mainnet',  // 网络
  {
    // 仲裁配置
    quorum: 2,          // 需要多少个 Provider 返回相同结果
    eventQuorum: 1,     // 事件监听的仲裁数量
    eventWorkers: 1,    // 事件工作者数量
    
    // 缓存配置
    cacheTimeout: 250,  // 缓存超时时间
    
    // 轮询配置
    pollingInterval: 4000  // 轮询间隔
  }
);
```

## 故障转移机制

### 1. 自动故障转移

```typescript
class HighAvailabilityProvider {
  private fallbackProvider: ethers.FallbackProvider;
  private healthStatus: Map<string, boolean> = new Map();

  constructor() {
    const providers = [
      {
        provider: new ethers.InfuraProvider('mainnet', process.env.INFURA_ID!),
        priority: 1,
        weight: 3,
        stallTimeout: 2000
      },
      {
        provider: new ethers.AlchemyProvider('mainnet', process.env.ALCHEMY_KEY!),
        priority: 1,
        weight: 3,
        stallTimeout: 2000
      },
      {
        provider: new ethers.JsonRpcProvider('https://rpc.ankr.com/eth'),
        priority: 2,
        weight: 2,
        stallTimeout: 3000
      },
      {
        provider: new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io'),
        priority: 3,
        weight: 1,
        stallTimeout: 4000
      }
    ];

    this.fallbackProvider = new ethers.FallbackProvider(providers, 'mainnet', {
      quorum: 2,
      eventQuorum: 1
    });

    this.setupHealthMonitoring();
  }

  private setupHealthMonitoring() {
    // 定期检查 Provider 健康状态
    setInterval(async () => {
      await this.checkProvidersHealth();
    }, 30000); // 每30秒检查一次
  }

  private async checkProvidersHealth() {
    const providers = this.getProviders();
    
    for (const [index, provider] of providers.entries()) {
      try {
        const start = Date.now();
        await provider.getBlockNumber();
        const responseTime = Date.now() - start;
        
        this.healthStatus.set(`provider-${index}`, true);
        console.log(`Provider ${index} 健康 (响应时间: ${responseTime}ms)`);
        
      } catch (error) {
        this.healthStatus.set(`provider-${index}`, false);
        console.warn(`Provider ${index} 不健康:`, error.message);
      }
    }
  }

  private getProviders(): ethers.AbstractProvider[] {
    // 获取 FallbackProvider 中的所有 Provider
    return (this.fallbackProvider as any)._providers.map((p: any) => p.provider);
  }

  getProvider(): ethers.FallbackProvider {
    return this.fallbackProvider;
  }

  getHealthStatus(): Map<string, boolean> {
    return new Map(this.healthStatus);
  }
}
```

### 2. 智能重试机制

```typescript
class SmartFallbackProvider extends ethers.FallbackProvider {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000;

  async perform(method: string, params: any): Promise<any> {
    const key = `${method}-${JSON.stringify(params)}`;
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await super.perform(method, params);
        
        // 成功后重置重试计数
        this.retryAttempts.delete(key);
        return result;
        
      } catch (error: any) {
        lastError = error;
        
        // 记录重试次数
        const currentAttempts = this.retryAttempts.get(key) || 0;
        this.retryAttempts.set(key, currentAttempts + 1);
        
        console.warn(`请求失败 (尝试 ${attempt + 1}/${this.maxRetries + 1}):`, {
          method,
          error: error.message,
          code: error.code
        });

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt)); // 指数退避
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取重试统计
  getRetryStats(): { [key: string]: number } {
    return Object.fromEntries(this.retryAttempts);
  }
}
```

## 负载均衡

### 1. 权重分配

```typescript
// 根据性能配置权重
const performanceBasedProviders = [
  {
    provider: new ethers.InfuraProvider('mainnet', 'INFURA-ID'),
    priority: 1,
    weight: 5,      // 最高权重 - 性能最好
    stallTimeout: 1500
  },
  {
    provider: new ethers.AlchemyProvider('mainnet', 'ALCHEMY-KEY'),
    priority: 1,
    weight: 4,      // 次高权重
    stallTimeout: 2000
  },
  {
    provider: new ethers.JsonRpcProvider('https://premium-rpc.com'),
    priority: 1,
    weight: 3,      // 中等权重
    stallTimeout: 2500
  },
  {
    provider: new ethers.JsonRpcProvider('https://free-rpc.com'),
    priority: 2,
    weight: 1,      // 最低权重 - 免费服务
    stallTimeout: 5000
  }
];

const loadBalancedProvider = new ethers.FallbackProvider(performanceBasedProviders);
```

### 2. 动态权重调整

```typescript
class AdaptiveFallbackProvider {
  private providers: any[];
  private performanceMetrics: Map<number, PerformanceMetric> = new Map();
  private fallbackProvider: ethers.FallbackProvider;

  constructor(initialProviders: any[]) {
    this.providers = initialProviders;
    this.initializeMetrics();
    this.fallbackProvider = new ethers.FallbackProvider(this.providers);
    this.startPerformanceMonitoring();
  }

  private initializeMetrics() {
    this.providers.forEach((_, index) => {
      this.performanceMetrics.set(index, {
        responseTime: 0,
        successRate: 100,
        requestCount: 0,
        errorCount: 0
      });
    });
  }

  private startPerformanceMonitoring() {
    // 每分钟调整权重
    setInterval(() => {
      this.adjustWeights();
    }, 60000);
  }

  private adjustWeights() {
    const metrics = Array.from(this.performanceMetrics.entries());
    
    // 根据性能指标计算新权重
    metrics.forEach(([index, metric]) => {
      const responseScore = Math.max(1, 10 - Math.floor(metric.responseTime / 100));
      const successScore = Math.floor(metric.successRate / 10);
      const newWeight = Math.max(1, responseScore + successScore);
      
      // 更新 Provider 权重
      if (this.providers[index]) {
        this.providers[index].weight = newWeight;
        console.log(`Provider ${index} 权重调整为: ${newWeight}`);
      }
    });

    // 重新创建 FallbackProvider
    this.fallbackProvider = new ethers.FallbackProvider(this.providers);
  }

  async performWithMetrics(method: string, params: any): Promise<any> {
    const start = Date.now();
    
    try {
      const result = await this.fallbackProvider.perform(method, params);
      const responseTime = Date.now() - start;
      
      // 更新成功指标
      this.updateMetrics(responseTime, true);
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - start;
      
      // 更新失败指标
      this.updateMetrics(responseTime, false);
      throw error;
    }
  }

  private updateMetrics(responseTime: number, success: boolean) {
    // 简化版本 - 实际应用中需要跟踪具体是哪个 Provider
    this.performanceMetrics.forEach((metric, index) => {
      metric.requestCount++;
      metric.responseTime = (metric.responseTime + responseTime) / 2; // 移动平均
      
      if (!success) {
        metric.errorCount++;
      }
      
      metric.successRate = ((metric.requestCount - metric.errorCount) / metric.requestCount) * 100;
    });
  }

  getProvider(): ethers.FallbackProvider {
    return this.fallbackProvider;
  }

  getMetrics(): Map<number, PerformanceMetric> {
    return new Map(this.performanceMetrics);
  }
}

interface PerformanceMetric {
  responseTime: number;
  successRate: number;
  requestCount: number;
  errorCount: number;
}
```

## 超时和重连机制

### 1. 超时配置

```typescript
// 不同类型请求的超时配置
const timeoutConfigs = {
  fast: {
    stallTimeout: 1000,    // 快速请求 1 秒超时
    priority: 1
  },
  normal: {
    stallTimeout: 3000,    // 普通请求 3 秒超时
    priority: 1
  },
  slow: {
    stallTimeout: 10000,   // 慢请求 10 秒超时
    priority: 2
  }
};

const providers = [
  {
    provider: new ethers.InfuraProvider('mainnet', 'INFURA-ID'),
    ...timeoutConfigs.fast,
    weight: 3
  },
  {
    provider: new ethers.AlchemyProvider('mainnet', 'ALCHEMY-KEY'),
    ...timeoutConfigs.normal,
    weight: 2
  },
  {
    provider: new ethers.JsonRpcProvider('https://slow-but-reliable-rpc.com'),
    ...timeoutConfigs.slow,
    weight: 1
  }
];

const timeoutAwareFallback = new ethers.FallbackProvider(providers);
```

### 2. 智能重连

```typescript
class ReconnectingFallbackProvider {
  private fallbackProvider: ethers.FallbackProvider;
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 2000;

  constructor(providers: any[]) {
    this.fallbackProvider = new ethers.FallbackProvider(providers);
    this.setupReconnectionHandling();
  }

  private setupReconnectionHandling() {
    // 监听网络错误
    this.fallbackProvider.on('error', (error) => {
      console.error('FallbackProvider 错误:', error);
      this.handleReconnection(error);
    });

    // 定期健康检查
    setInterval(async () => {
      await this.healthCheck();
    }, 30000);
  }

  private async handleReconnection(error: any) {
    const errorKey = `${error.code || 'unknown'}-${error.message}`;
    const attempts = this.reconnectAttempts.get(errorKey) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(errorKey, attempts + 1);
      
      const delay = this.baseReconnectDelay * Math.pow(2, attempts);
      console.log(`重连尝试 ${attempts + 1}/${this.maxReconnectAttempts}，${delay}ms 后重试`);
      
      setTimeout(async () => {
        try {
          await this.testConnection();
          console.log('重连成功');
          this.reconnectAttempts.delete(errorKey);
        } catch (reconnectError) {
          console.warn('重连失败:', reconnectError.message);
        }
      }, delay);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }

  private async testConnection(): Promise<void> {
    // 测试连接是否恢复
    await this.fallbackProvider.getBlockNumber();
  }

  private async healthCheck() {
    try {
      const blockNumber = await this.fallbackProvider.getBlockNumber();
      const network = await this.fallbackProvider.getNetwork();
      
      console.log('健康检查通过:', {
        blockNumber,
        chainId: network.chainId,
        timestamp: new Date().toISOString()
      });
      
      // 重置重连计数
      this.reconnectAttempts.clear();
      
    } catch (error: any) {
      console.warn('健康检查失败:', error.message);
      await this.handleReconnection(error);
    }
  }

  getProvider(): ethers.FallbackProvider {
    return this.fallbackProvider;
  }

  getReconnectStats(): { [key: string]: number } {
    return Object.fromEntries(this.reconnectAttempts);
  }
}
```

## 监控和日志

### 1. 详细监控

```typescript
class MonitoredFallbackProvider {
  private fallbackProvider: ethers.FallbackProvider;
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    providerUsage: new Map<string, number>(),
    errorTypes: new Map<string, number>()
  };

  constructor(providers: any[]) {
    this.fallbackProvider = new ethers.FallbackProvider(providers);
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // 包装所有方法以添加监控
    const originalPerform = this.fallbackProvider.perform.bind(this.fallbackProvider);
    
    this.fallbackProvider.perform = async (method: string, params: any) => {
      const start = Date.now();
      this.stats.totalRequests++;

      try {
        const result = await originalPerform(method, params);
        const responseTime = Date.now() - start;
        
        this.stats.successfulRequests++;
        this.updateAverageResponseTime(responseTime);
        
        console.log(`✅ ${method} 成功 (${responseTime}ms)`);
        return result;
        
      } catch (error: any) {
        const responseTime = Date.now() - start;
        
        this.stats.failedRequests++;
        this.updateErrorStats(error);
        
        console.error(`❌ ${method} 失败 (${responseTime}ms):`, error.message);
        throw error;
      }
    };

    // 定期输出统计信息
    setInterval(() => {
      this.logStats();
    }, 60000); // 每分钟输出一次
  }

  private updateAverageResponseTime(responseTime: number) {
    const total = this.stats.successfulRequests;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (total - 1) + responseTime) / total;
  }

  private updateErrorStats(error: any) {
    const errorType = error.code || error.name || 'Unknown';
    const count = this.stats.errorTypes.get(errorType) || 0;
    this.stats.errorTypes.set(errorType, count + 1);
  }

  private logStats() {
    const successRate = (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2);
    
    console.log('📊 FallbackProvider 统计:', {
      totalRequests: this.stats.totalRequests,
      successRate: `${successRate}%`,
      averageResponseTime: `${this.stats.averageResponseTime.toFixed(2)}ms`,
      errorTypes: Object.fromEntries(this.stats.errorTypes)
    });
  }

  getProvider(): ethers.FallbackProvider {
    return this.fallbackProvider;
  }

  getStats() {
    return {
      ...this.stats,
      errorTypes: Object.fromEntries(this.stats.errorTypes)
    };
  }
}
```

### 2. 告警系统

```typescript
class AlertingFallbackProvider extends MonitoredFallbackProvider {
  private alertThresholds = {
    errorRate: 10,        // 错误率超过 10%
    responseTime: 5000,   // 响应时间超过 5 秒
    consecutiveFailures: 3 // 连续失败 3 次
  };
  
  private consecutiveFailures = 0;
  private alertCallbacks: Array<(alert: Alert) => void> = [];

  onAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.push(callback);
  }

  private triggerAlert(type: AlertType, message: string, data?: any) {
    const alert: Alert = {
      type,
      message,
      timestamp: new Date(),
      data
    };

    console.warn('🚨 告警:', alert);
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('告警回调执行失败:', error);
      }
    });
  }

  protected updateErrorStats(error: any) {
    super.updateErrorStats(error);
    
    this.consecutiveFailures++;
    
    // 检查连续失败告警
    if (this.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      this.triggerAlert(
        'CONSECUTIVE_FAILURES',
        `连续失败 ${this.consecutiveFailures} 次`,
        { error: error.message }
      );
    }

    // 检查错误率告警
    const stats = this.getStats();
    const errorRate = (stats.failedRequests / stats.totalRequests) * 100;
    
    if (errorRate > this.alertThresholds.errorRate) {
      this.triggerAlert(
        'HIGH_ERROR_RATE',
        `错误率过高: ${errorRate.toFixed(2)}%`,
        { errorRate, threshold: this.alertThresholds.errorRate }
      );
    }
  }

  protected updateAverageResponseTime(responseTime: number) {
    super.updateAverageResponseTime(responseTime);
    
    // 重置连续失败计数
    this.consecutiveFailures = 0;
    
    // 检查响应时间告警
    if (responseTime > this.alertThresholds.responseTime) {
      this.triggerAlert(
        'SLOW_RESPONSE',
        `响应时间过慢: ${responseTime}ms`,
        { responseTime, threshold: this.alertThresholds.responseTime }
      );
    }
  }
}

interface Alert {
  type: AlertType;
  message: string;
  timestamp: Date;
  data?: any;
}

type AlertType = 'HIGH_ERROR_RATE' | 'SLOW_RESPONSE' | 'CONSECUTIVE_FAILURES' | 'PROVIDER_DOWN';
```

## 最佳实践

### 1. 生产环境配置

```typescript
// 生产环境推荐配置
function createProductionFallbackProvider() {
  const providers = [
    // 主要提供商 - 高优先级
    {
      provider: new ethers.InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID!),
      priority: 1,
      weight: 4,
      stallTimeout: 2000
    },
    {
      provider: new ethers.AlchemyProvider('mainnet', process.env.ALCHEMY_API_KEY!),
      priority: 1,
      weight: 4,
      stallTimeout: 2000
    },
    
    // 备用提供商 - 中等优先级
    {
      provider: new ethers.JsonRpcProvider('https://rpc.ankr.com/eth'),
      priority: 2,
      weight: 2,
      stallTimeout: 3000
    },
    {
      provider: new ethers.JsonRpcProvider('https://eth-mainnet.public.blastapi.io'),
      priority: 2,
      weight: 2,
      stallTimeout: 3000
    },
    
    // 最后备用 - 低优先级
    {
      provider: new ethers.JsonRpcProvider('https://cloudflare-eth.com'),
      priority: 3,
      weight: 1,
      stallTimeout: 5000
    }
  ];

  return new ethers.FallbackProvider(providers, 'mainnet', {
    quorum: 2,           // 需要 2 个 Provider 确认
    eventQuorum: 1,      // 事件只需要 1 个确认
    eventWorkers: 2,     // 使用 2 个工作者处理事件
    cacheTimeout: 250    // 250ms 缓存
  });
}
```

### 2. 环境特定配置

```typescript
class EnvironmentAwareFallbackProvider {
  static create(environment: 'development' | 'staging' | 'production') {
    switch (environment) {
      case 'development':
        return this.createDevelopmentProvider();
      case 'staging':
        return this.createStagingProvider();
      case 'production':
        return this.createProductionProvider();
      default:
        throw new Error(`未知环境: ${environment}`);
    }
  }

  private static createDevelopmentProvider() {
    // 开发环境 - 简单配置，快速失败
    const providers = [
      {
        provider: new ethers.JsonRpcProvider('http://localhost:8545'),
        priority: 1,
        weight: 3,
        stallTimeout: 1000
      },
      {
        provider: new ethers.InfuraProvider('sepolia', process.env.INFURA_PROJECT_ID!),
        priority: 2,
        weight: 1,
        stallTimeout: 3000
      }
    ];

    return new ethers.FallbackProvider(providers, undefined, {
      quorum: 1,
      eventQuorum: 1
    });
  }

  private static createStagingProvider() {
    // 测试环境 - 模拟生产环境但使用测试网
    const providers = [
      {
        provider: new ethers.InfuraProvider('sepolia', process.env.INFURA_PROJECT_ID!),
        priority: 1,
        weight: 3,
        stallTimeout: 2000
      },
      {
        provider: new ethers.AlchemyProvider('sepolia', process.env.ALCHEMY_API_KEY!),
        priority: 1,
        weight: 3,
        stallTimeout: 2000
      }
    ];

    return new ethers.FallbackProvider(providers, 'sepolia', {
      quorum: 2,
      eventQuorum: 1
    });
  }

  private static createProductionProvider() {
    // 生产环境 - 完整的故障转移配置
    return createProductionFallbackProvider();
  }
}
```

## 常见问题

### Q: 如何选择合适的仲裁数量（quorum）？
A: 
- **读取操作**: 通常设置为 2，确保数据一致性
- **事件监听**: 可以设置为 1，提高响应速度
- **关键操作**: 可以设置为 3 或更多，确保高可靠性

### Q: 如何处理 Provider 之间的数据不一致？
A: FallbackProvider 会自动处理：
- 使用仲裁机制确保多数一致
- 自动重试不一致的请求
- 记录并报告异常情况

### Q: 如何优化 FallbackProvider 的性能？
A: 
- 合理设置权重和优先级
- 调整超时时间
- 使用性能监控动态调整
- 定期清理失效的 Provider

### Q: 如何处理所有 Provider 都失败的情况？
A: 
- 实现降级策略
- 使用本地缓存
- 提供用户友好的错误信息
- 记录详细的错误日志

## 下一步

- [Provider 基础](/ethers/providers/basics) - 回顾 Provider 基础概念
- [WebSocketProvider](/ethers/providers/websocket-provider) - 学习实时事件监听
- [错误处理](/ethers/contracts/error-handling) - 深入了解错误处理策略
- [高可用性应用](/ethers/examples/high-availability) - 构建高可用性 DApp