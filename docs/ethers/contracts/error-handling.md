---
title: 错误处理
description: Ethers.js 中智能合约错误处理的完整指南
keywords: [ethers, 错误处理, 智能合约, 异常处理, 调试, Web3]
---

# 错误处理

错误处理是智能合约开发中的关键环节。Ethers.js 提供了完善的错误处理机制，帮助开发者识别、分类和处理各种类型的错误。

## 错误类型分类

### 1. 常见错误类型

```typescript
// Ethers.js 中的主要错误类型
enum ErrorCode {
  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // 参数相关错误
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  MISSING_ARGUMENT = 'MISSING_ARGUMENT',
  UNEXPECTED_ARGUMENT = 'UNEXPECTED_ARGUMENT',
  
  // 交易相关错误
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NONCE_EXPIRED = 'NONCE_EXPIRED',
  REPLACEMENT_UNDERPRICED = 'REPLACEMENT_UNDERPRICED',
  UNPREDICTABLE_GAS_LIMIT = 'UNPREDICTABLE_GAS_LIMIT',
  
  // 合约相关错误
  CALL_EXCEPTION = 'CALL_EXCEPTION',
  CONTRACT_NOT_DEPLOYED = 'CONTRACT_NOT_DEPLOYED',
  
  // 用户相关错误
  ACTION_REJECTED = 'ACTION_REJECTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // 其他错误
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重程度
enum ErrorSeverity {
  LOW = 'low',        // 可忽略的错误
  MEDIUM = 'medium',  // 需要处理的错误
  HIGH = 'high',      // 严重错误
  CRITICAL = 'critical' // 致命错误
}

// 错误信息接口
interface ErrorInfo {
  code: string;
  message: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestions: string[];
  context?: any;
}
```

### 2. 错误分类器

```typescript
class ContractErrorClassifier {
  // 分类错误
  static classifyError(error: any): ErrorInfo {
    // 网络错误
    if (error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接错误',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '检查网络连接',
          '切换到其他 RPC 节点',
          '稍后重试'
        ],
        context: { originalError: error }
      };
    }

    // 余额不足
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: '账户余额不足',
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        suggestions: [
          '检查账户余额',
          '减少交易金额',
          '等待资金到账'
        ],
        context: { 
          required: error.info?.value,
          available: error.info?.balance
        }
      };
    }

    // Gas 估算失败
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return {
        code: 'UNPREDICTABLE_GAS_LIMIT',
        message: '无法预测 Gas 限制',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '手动设置 Gas 限制',
          '检查函数参数是否正确',
          '使用 staticCall 预检查交易',
          '确认合约状态满足执行条件'
        ]
      };
    }

    // 合约调用异常
    if (error.code === 'CALL_EXCEPTION') {
      return {
        code: 'CALL_EXCEPTION',
        message: '合约调用失败',
        severity: ErrorSeverity.HIGH,
        recoverable: false,
        suggestions: [
          '检查函数参数',
          '确认合约状态',
          '查看合约文档',
          '检查函数权限'
        ],
        context: {
          reason: error.reason,
          data: error.data,
          transaction: error.transaction
        }
      };
    }

    // 用户拒绝
    if (error.code === 'ACTION_REJECTED') {
      return {
        code: 'ACTION_REJECTED',
        message: '用户拒绝了操作',
        severity: ErrorSeverity.LOW,
        recoverable: true,
        suggestions: [
          '提示用户确认操作',
          '检查钱包连接状态',
          '简化操作流程'
        ]
      };
    }

    // Nonce 相关错误
    if (error.message?.includes('nonce') || error.code === 'NONCE_EXPIRED') {
      return {
        code: 'NONCE_ERROR',
        message: 'Nonce 错误',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '等待前一个交易确认',
          '手动设置正确的 nonce',
          '重置钱包状态'
        ]
      };
    }

    // 替换交易价格过低
    if (error.code === 'REPLACEMENT_UNDERPRICED') {
      return {
        code: 'REPLACEMENT_UNDERPRICED',
        message: '替换交易的 Gas 价格过低',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '提高 Gas 价格',
          '等待原交易确认',
          '取消原交易'
        ]
      };
    }

    // 服务器错误
    if (error.code === 'SERVER_ERROR') {
      return {
        code: 'SERVER_ERROR',
        message: 'RPC 服务器错误',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '切换 RPC 节点',
          '稍后重试',
          '检查节点状态'
        ],
        context: { statusCode: error.status }
      };
    }

    // 超时错误
    if (error.code === 'TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message: '请求超时',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestions: [
          '增加超时时间',
          '检查网络连接',
          '重试请求'
        ]
      };
    }

    // 参数错误
    if (error.code === 'INVALID_ARGUMENT') {
      return {
        code: 'INVALID_ARGUMENT',
        message: '无效参数',
        severity: ErrorSeverity.HIGH,
        recoverable: false,
        suggestions: [
          '检查参数类型',
          '验证参数值',
          '查看函数文档'
        ],
        context: { argument: error.argument, value: error.value }
      };
    }

    // 默认未知错误
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || '未知错误',
      severity: ErrorSeverity.MEDIUM,
      recoverable: false,
      suggestions: [
        '查看详细错误信息',
        '检查代码逻辑',
        '联系技术支持'
      ],
      context: { originalError: error }
    };
  }

  // 获取错误的用户友好消息
  static getUserFriendlyMessage(error: any): string {
    const errorInfo = this.classifyError(error);
    
    const friendlyMessages: { [key: string]: string } = {
      'NETWORK_ERROR': '网络连接出现问题，请检查网络后重试',
      'INSUFFICIENT_FUNDS': '账户余额不足，请充值后重试',
      'UNPREDICTABLE_GAS_LIMIT': '交易可能失败，请检查参数后重试',
      'CALL_EXCEPTION': '合约执行失败，请检查操作条件',
      'ACTION_REJECTED': '操作已取消',
      'NONCE_ERROR': '交易顺序错误，请稍后重试',
      'REPLACEMENT_UNDERPRICED': 'Gas 价格过低，请提高后重试',
      'SERVER_ERROR': '服务暂时不可用，请稍后重试',
      'TIMEOUT': '请求超时，请重试',
      'INVALID_ARGUMENT': '参数错误，请检查输入',
      'UNKNOWN_ERROR': '操作失败，请重试'
    };

    return friendlyMessages[errorInfo.code] || errorInfo.message;
  }

  // 检查错误是否可恢复
  static isRecoverable(error: any): boolean {
    const errorInfo = this.classifyError(error);
    return errorInfo.recoverable;
  }

  // 获取错误建议
  static getSuggestions(error: any): string[] {
    const errorInfo = this.classifyError(error);
    return errorInfo.suggestions;
  }
}

// 使用示例
try {
  const result = await contract.transfer(to, amount);
} catch (error) {
  const errorInfo = ContractErrorClassifier.classifyError(error);
  console.log('错误分类:', errorInfo);
  
  const friendlyMessage = ContractErrorClassifier.getUserFriendlyMessage(error);
  console.log('用户友好消息:', friendlyMessage);
  
  if (ContractErrorClassifier.isRecoverable(error)) {
    console.log('建议:', ContractErrorClassifier.getSuggestions(error));
  }
}
```

## 错误处理策略

### 1. 重试机制

```typescript
class RetryHandler {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(maxRetries: number = 3, baseDelay: number = 1000, maxDelay: number = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  // 指数退避重试
  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    retryCondition?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (retryCondition && !retryCondition(error)) {
          throw error;
        }
        
        // 最后一次尝试失败
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // 计算延迟时间
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );
        
        console.log(`操作失败，${delay}ms 后重试 (${attempt + 1}/${this.maxRetries})`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  // 线性重试
  async retryWithLinearBackoff<T>(
    operation: () => Promise<T>,
    retryCondition?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (retryCondition && !retryCondition(error)) {
          throw error;
        }
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        const delay = this.baseDelay * (attempt + 1);
        console.log(`操作失败，${delay}ms 后重试 (${attempt + 1}/${this.maxRetries})`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  // 智能重试（根据错误类型选择策略）
  async smartRetry<T>(
    operation: () => Promise<T>,
    customRetryCondition?: (error: any) => boolean
  ): Promise<T> {
    const retryCondition = (error: any) => {
      // 自定义条件优先
      if (customRetryCondition) {
        return customRetryCondition(error);
      }
      
      const errorInfo = ContractErrorClassifier.classifyError(error);
      
      // 只重试可恢复的错误
      if (!errorInfo.recoverable) {
        return false;
      }
      
      // 特定错误类型的重试策略
      const retryableErrors = [
        'NETWORK_ERROR',
        'SERVER_ERROR',
        'TIMEOUT',
        'NONCE_ERROR',
        'REPLACEMENT_UNDERPRICED'
      ];
      
      return retryableErrors.includes(errorInfo.code);
    };

    return this.retryWithExponentialBackoff(operation, retryCondition);
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 批量重试
  async retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: {
      concurrency?: number;
      failFast?: boolean;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: any }>> {
    const { concurrency = 3, failFast = false, retryCondition } = options;
    const results: Array<{ success: boolean; result?: T; error?: any }> = [];
    
    // 分批处理
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (operation, index) => {
        try {
          const result = await this.smartRetry(operation, retryCondition);
          return { success: true, result };
        } catch (error) {
          if (failFast) {
            throw error;
          }
          return { success: false, error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// 使用示例
const retryHandler = new RetryHandler(3, 1000, 10000);

// 智能重试合约调用
const transferWithRetry = async () => {
  return retryHandler.smartRetry(async () => {
    return await contract.transfer(to, amount);
  });
};

// 自定义重试条件
const customRetry = async () => {
  return retryHandler.smartRetry(
    async () => await contract.someFunction(),
    (error) => {
      // 只重试网络错误和 Gas 相关错误
      return ['NETWORK_ERROR', 'UNPREDICTABLE_GAS_LIMIT'].includes(
        ContractErrorClassifier.classifyError(error).code
      );
    }
  );
};
```

### 2. 错误恢复机制

```typescript
class ErrorRecoveryManager {
  private fallbackStrategies: Map<string, Function[]> = new Map();
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();

  constructor() {
    this.setupDefaultStrategies();
  }

  // 设置默认恢复策略
  private setupDefaultStrategies(): void {
    // 网络错误恢复策略
    this.addFallbackStrategy('NETWORK_ERROR', [
      this.switchToBackupProvider.bind(this),
      this.useLocalCache.bind(this),
      this.showOfflineMode.bind(this)
    ]);

    // Gas 估算失败恢复策略
    this.addFallbackStrategy('UNPREDICTABLE_GAS_LIMIT', [
      this.useStaticCall.bind(this),
      this.setManualGasLimit.bind(this),
      this.suggestParameterCheck.bind(this)
    ]);

    // 余额不足恢复策略
    this.addFallbackStrategy('INSUFFICIENT_FUNDS', [
      this.checkAlternativeTokens.bind(this),
      this.suggestTopUp.bind(this),
      this.enablePartialExecution.bind(this)
    ]);

    // Nonce 错误恢复策略
    this.addFallbackStrategy('NONCE_ERROR', [
      this.resetNonce.bind(this),
      this.waitForPendingTransactions.bind(this),
      this.useManualNonce.bind(this)
    ]);
  }

  // 添加回退策略
  addFallbackStrategy(errorCode: string, strategies: Function[]): void {
    this.fallbackStrategies.set(errorCode, strategies);
  }

  // 执行错误恢复
  async recoverFromError(error: any, context: any): Promise<{
    recovered: boolean;
    result?: any;
    strategy?: string;
    message: string;
  }> {
    const errorInfo = ContractErrorClassifier.classifyError(error);
    
    // 检查熔断器状态
    if (this.isCircuitOpen(errorInfo.code)) {
      return {
        recovered: false,
        message: '服务暂时不可用，请稍后重试'
      };
    }

    const strategies = this.fallbackStrategies.get(errorInfo.code);
    if (!strategies || strategies.length === 0) {
      return {
        recovered: false,
        message: '无可用的恢复策略'
      };
    }

    // 尝试每个恢复策略
    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`尝试恢复策略 ${i + 1}/${strategies.length}`);
        const result = await strategies[i](error, context);
        
        if (result.success) {
          this.recordSuccess(errorInfo.code);
          return {
            recovered: true,
            result: result.data,
            strategy: result.strategy,
            message: result.message || '恢复成功'
          };
        }
      } catch (strategyError) {
        console.error(`恢复策略 ${i + 1} 失败:`, strategyError);
        this.recordFailure(errorInfo.code);
      }
    }

    return {
      recovered: false,
      message: '所有恢复策略都失败了'
    };
  }

  // 网络错误恢复策略
  private async switchToBackupProvider(error: any, context: any): Promise<any> {
    // 实现切换到备用 Provider 的逻辑
    console.log('切换到备用 Provider');
    return {
      success: true,
      strategy: 'switchToBackupProvider',
      message: '已切换到备用网络节点'
    };
  }

  private async useLocalCache(error: any, context: any): Promise<any> {
    // 实现使用本地缓存的逻辑
    console.log('使用本地缓存数据');
    return {
      success: false, // 示例：缓存未命中
      strategy: 'useLocalCache'
    };
  }

  private async showOfflineMode(error: any, context: any): Promise<any> {
    // 实现离线模式的逻辑
    console.log('启用离线模式');
    return {
      success: true,
      strategy: 'showOfflineMode',
      message: '已启用离线模式，部分功能受限'
    };
  }

  // Gas 估算失败恢复策略
  private async useStaticCall(error: any, context: any): Promise<any> {
    try {
      // 使用 staticCall 预检查
      await context.contract[context.functionName].staticCall(...context.args);
      return {
        success: true,
        strategy: 'useStaticCall',
        message: 'staticCall 检查通过，可以手动设置 Gas'
      };
    } catch (staticError) {
      return {
        success: false,
        strategy: 'useStaticCall'
      };
    }
  }

  private async setManualGasLimit(error: any, context: any): Promise<any> {
    // 设置手动 Gas 限制
    const estimatedGas = 200000; // 保守估计
    return {
      success: true,
      strategy: 'setManualGasLimit',
      data: { gasLimit: estimatedGas },
      message: `建议手动设置 Gas 限制为 ${estimatedGas}`
    };
  }

  private async suggestParameterCheck(error: any, context: any): Promise<any> {
    return {
      success: true,
      strategy: 'suggestParameterCheck',
      message: '请检查函数参数是否正确'
    };
  }

  // 余额不足恢复策略
  private async checkAlternativeTokens(error: any, context: any): Promise<any> {
    // 检查是否有其他代币可用
    return {
      success: false,
      strategy: 'checkAlternativeTokens'
    };
  }

  private async suggestTopUp(error: any, context: any): Promise<any> {
    return {
      success: true,
      strategy: 'suggestTopUp',
      message: '请为账户充值后重试'
    };
  }

  private async enablePartialExecution(error: any, context: any): Promise<any> {
    // 启用部分执行
    return {
      success: false,
      strategy: 'enablePartialExecution'
    };
  }

  // Nonce 错误恢复策略
  private async resetNonce(error: any, context: any): Promise<any> {
    try {
      const currentNonce = await context.signer.getNonce();
      return {
        success: true,
        strategy: 'resetNonce',
        data: { nonce: currentNonce },
        message: `已重置 nonce 为 ${currentNonce}`
      };
    } catch {
      return {
        success: false,
        strategy: 'resetNonce'
      };
    }
  }

  private async waitForPendingTransactions(error: any, context: any): Promise<any> {
    // 等待待处理交易
    return {
      success: true,
      strategy: 'waitForPendingTransactions',
      message: '请等待待处理交易确认后重试'
    };
  }

  private async useManualNonce(error: any, context: any): Promise<any> {
    return {
      success: true,
      strategy: 'useManualNonce',
      message: '建议手动设置 nonce'
    };
  }

  // 熔断器相关方法
  private isCircuitOpen(errorCode: string): boolean {
    const state = this.circuitBreaker.get(errorCode);
    if (!state) return false;
    
    const now = Date.now();
    if (state.state === 'OPEN' && now - state.lastFailureTime > state.timeout) {
      state.state = 'HALF_OPEN';
      return false;
    }
    
    return state.state === 'OPEN';
  }

  private recordSuccess(errorCode: string): void {
    const state = this.circuitBreaker.get(errorCode);
    if (state) {
      state.state = 'CLOSED';
      state.failureCount = 0;
    }
  }

  private recordFailure(errorCode: string): void {
    let state = this.circuitBreaker.get(errorCode);
    if (!state) {
      state = {
        state: 'CLOSED',
        failureCount: 0,
        threshold: 5,
        timeout: 60000,
        lastFailureTime: 0
      };
      this.circuitBreaker.set(errorCode, state);
    }
    
    state.failureCount++;
    state.lastFailureTime = Date.now();
    
    if (state.failureCount >= state.threshold) {
      state.state = 'OPEN';
    }
  }
}

// 熔断器状态接口
interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  threshold: number;
  timeout: number;
  lastFailureTime: number;
}

// 使用示例
const recoveryManager = new ErrorRecoveryManager();

const executeWithRecovery = async (contract: ethers.Contract, functionName: string, args: any[]) => {
  try {
    return await contract[functionName](...args);
  } catch (error) {
    console.log('操作失败，尝试恢复...');
    
    const recovery = await recoveryManager.recoverFromError(error, {
      contract,
      functionName,
      args,
      signer: contract.runner
    });
    
    if (recovery.recovered) {
      console.log('恢复成功:', recovery.message);
      return recovery.result;
    } else {
      console.error('恢复失败:', recovery.message);
      throw error;
    }
  }
};
```

## 错误监控和日志

### 1. 错误监控系统

```typescript
class ErrorMonitor {
  private errorStats: Map<string, ErrorStats> = new Map();
  private errorHistory: ErrorRecord[] = [];
  private maxHistorySize: number = 1000;
  private listeners: ErrorListener[] = [];

  // 记录错误
  recordError(error: any, context?: any): void {
    const errorInfo = ContractErrorClassifier.classifyError(error);
    const timestamp = Date.now();
    
    // 更新统计
    this.updateStats(errorInfo.code, errorInfo.severity);
    
    // 添加到历史记录
    const record: ErrorRecord = {
      id: this.generateId(),
      timestamp,
      errorCode: errorInfo.code,
      message: errorInfo.message,
      severity: errorInfo.severity,
      recoverable: errorInfo.recoverable,
      context,
      stackTrace: error.stack
    };
    
    this.errorHistory.unshift(record);
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
    
    // 通知监听器
    this.notifyListeners(record);
    
    // 检查是否需要告警
    this.checkAlerts(errorInfo.code);
  }

  // 更新统计信息
  private updateStats(errorCode: string, severity: ErrorSeverity): void {
    let stats = this.errorStats.get(errorCode);
    if (!stats) {
      stats = {
        code: errorCode,
        count: 0,
        lastOccurrence: 0,
        severityDistribution: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        }
      };
      this.errorStats.set(errorCode, stats);
    }
    
    stats.count++;
    stats.lastOccurrence = Date.now();
    stats.severityDistribution[severity]++;
  }

  // 获取错误统计
  getErrorStats(timeRange?: { start: number; end: number }): {
    totalErrors: number;
    errorsByCode: Map<string, ErrorStats>;
    errorsByTime: Array<{ time: number; count: number }>;
    topErrors: Array<{ code: string; count: number }>;
  } {
    let filteredHistory = this.errorHistory;
    
    if (timeRange) {
      filteredHistory = this.errorHistory.filter(
        record => record.timestamp >= timeRange.start && record.timestamp <= timeRange.end
      );
    }
    
    // 按时间分组统计
    const timeGroups = new Map<number, number>();
    const hourMs = 60 * 60 * 1000;
    
    filteredHistory.forEach(record => {
      const hour = Math.floor(record.timestamp / hourMs) * hourMs;
      timeGroups.set(hour, (timeGroups.get(hour) || 0) + 1);
    });
    
    const errorsByTime = Array.from(timeGroups.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time - b.time);
    
    // 获取最频繁的错误
    const topErrors = Array.from(this.errorStats.entries())
      .map(([code, stats]) => ({ code, count: stats.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalErrors: filteredHistory.length,
      errorsByCode: this.errorStats,
      errorsByTime,
      topErrors
    };
  }

  // 获取错误趋势
  getErrorTrend(errorCode: string, timeRange: number = 24 * 60 * 60 * 1000): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    recommendation: string;
  } {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      record => record.errorCode === errorCode && 
                record.timestamp > now - timeRange
    );
    
    if (recentErrors.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        recommendation: '数据不足，继续监控'
      };
    }
    
    // 计算趋势
    const halfTime = timeRange / 2;
    const firstHalf = recentErrors.filter(r => r.timestamp <= now - halfTime).length;
    const secondHalf = recentErrors.filter(r => r.timestamp > now - halfTime).length;
    
    const changeRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    let recommendation: string;
    
    if (changeRate > 0.2) {
      trend = 'increasing';
      recommendation = '错误频率上升，需要关注';
    } else if (changeRate < -0.2) {
      trend = 'decreasing';
      recommendation = '错误频率下降，情况改善';
    } else {
      trend = 'stable';
      recommendation = '错误频率稳定';
    }
    
    return { trend, changeRate, recommendation };
  }

  // 添加错误监听器
  addListener(listener: ErrorListener): void {
    this.listeners.push(listener);
  }

  // 移除错误监听器
  removeListener(listener: ErrorListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知监听器
  private notifyListeners(record: ErrorRecord): void {
    this.listeners.forEach(listener => {
      try {
        listener(record);
      } catch (error) {
        console.error('错误监听器执行失败:', error);
      }
    });
  }

  // 检查告警条件
  private checkAlerts(errorCode: string): void {
    const stats = this.errorStats.get(errorCode);
    if (!stats) return;
    
    // 检查错误频率告警
    const recentErrors = this.errorHistory.filter(
      record => record.errorCode === errorCode && 
                Date.now() - record.timestamp < 5 * 60 * 1000 // 5分钟内
    );
    
    if (recentErrors.length >= 10) {
      this.triggerAlert({
        type: 'HIGH_FREQUENCY',
        errorCode,
        message: `错误 ${errorCode} 在5分钟内发生了 ${recentErrors.length} 次`,
        severity: 'high'
      });
    }
    
    // 检查严重错误告警
    const criticalErrors = recentErrors.filter(r => r.severity === ErrorSeverity.CRITICAL);
    if (criticalErrors.length > 0) {
      this.triggerAlert({
        type: 'CRITICAL_ERROR',
        errorCode,
        message: `发现 ${criticalErrors.length} 个严重错误`,
        severity: 'critical'
      });
    }
  }

  // 触发告警
  private triggerAlert(alert: {
    type: string;
    errorCode: string;
    message: string;
    severity: string;
  }): void {
    console.warn('🚨 错误告警:', alert);
    
    // 这里可以集成外部告警系统
    // 例如：发送邮件、Slack 通知、短信等
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 导出错误报告
  exportReport(format: 'json' | 'csv' = 'json'): string {
    const stats = this.getErrorStats();
    
    if (format === 'json') {
      return JSON.stringify({
        generatedAt: new Date().toISOString(),
        summary: {
          totalErrors: stats.totalErrors,
          uniqueErrorTypes: stats.errorsByCode.size,
          topErrors: stats.topErrors
        },
        details: {
          errorStats: Array.from(stats.errorsByCode.entries()),
          recentErrors: this.errorHistory.slice(0, 100)
        }
      }, null, 2);
    } else {
      // CSV 格式
      const headers = ['时间', '错误代码', '消息', '严重程度', '可恢复'];
      const rows = this.errorHistory.slice(0, 100).map(record => [
        new Date(record.timestamp).toISOString(),
        record.errorCode,
        record.message,
        record.severity,
        record.recoverable.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

// 相关接口定义
interface ErrorStats {
  code: string;
  count: number;
  lastOccurrence: number;
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

interface ErrorRecord {
  id: string;
  timestamp: number;
  errorCode: string;
  message: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  context?: any;
  stackTrace?: string;
}

type ErrorListener = (record: ErrorRecord) => void;

// 使用示例
const errorMonitor = new ErrorMonitor();

// 添加错误监听器
errorMonitor.addListener((record) => {
  if (record.severity === ErrorSeverity.CRITICAL) {
    console.error('🚨 严重错误:', record);
  }
});

// 在错误处理中记录错误
const monitoredContractCall = async () => {
  try {
    return await contract.transfer(to, amount);
  } catch (error) {
    errorMonitor.recordError(error, {
      function: 'transfer',
      to,
      amount: amount.toString()
    });
    throw error;
  }
};

// 获取错误统计
const stats = errorMonitor.getErrorStats();
console.log('错误统计:', stats);

// 导出错误报告
const report = errorMonitor.exportReport('json');
console.log('错误报告:', report);
```

### 2. 调试工具

```typescript
class ContractDebugger {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private debugMode: boolean = false;

  constructor(contract: ethers.Contract, debugMode: boolean = false) {
    this.contract = contract;
    this.provider = contract.runner?.provider!;
    this.debugMode = debugMode;
  }

  // 启用调试模式
  enableDebug(): void {
    this.debugMode = true;
  }

  // 禁用调试模式
  disableDebug(): void {
    this.debugMode = false;
  }

  // 调试函数调用
  async debugFunctionCall(
    functionName: string,
    args: any[] = [],
    overrides: any = {}
  ): Promise<{
    success: boolean;
    result?: any;
    error?: any;
    gasEstimate?: bigint;
    staticCallResult?: any;
    debugInfo: any;
  }> {
    const debugInfo: any = {
      function: functionName,
      arguments: args,
      overrides,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. 检查合约是否部署
      const code = await this.provider.getCode(await this.contract.getAddress());
      if (code === '0x') {
        throw new Error('合约未部署');
      }
      debugInfo.contractDeployed = true;

      // 2. 获取函数信息
      const func = this.contract.interface.getFunction(functionName);
      if (!func) {
        throw new Error(`函数 ${functionName} 不存在`);
      }
      debugInfo.functionSignature = func.format();
      debugInfo.functionSelector = func.selector;

      // 3. 验证参数
      if (args.length !== func.inputs.length) {
        throw new Error(`参数数量不匹配: 期望 ${func.inputs.length}, 实际 ${args.length}`);
      }
      debugInfo.parameterValidation = 'passed';

      // 4. 尝试 staticCall（如果是 view/pure 函数或者需要预检查）
      let staticCallResult;
      try {
        staticCallResult = await this.contract[functionName].staticCall(...args, overrides);
        debugInfo.staticCall = {
          success: true,
          result: staticCallResult
        };
      } catch (staticError) {
        debugInfo.staticCall = {
          success: false,
          error: staticError.message
        };
        
        // 如果是 view/pure 函数，staticCall 失败意味着调用会失败
        if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
          throw staticError;
        }
      }

      // 5. 估算 Gas（如果不是 view/pure 函数）
      let gasEstimate;
      if (func.stateMutability !== 'view' && func.stateMutability !== 'pure') {
        try {
          gasEstimate = await this.contract[functionName].estimateGas(...args, overrides);
          debugInfo.gasEstimate = gasEstimate.toString();
        } catch (gasError) {
          debugInfo.gasEstimate = {
            error: gasError.message
          };
        }
      }

      // 6. 执行实际调用
      const result = await this.contract[functionName](...args, overrides);
      debugInfo.execution = {
        success: true,
        result: result
      };

      if (this.debugMode) {
        console.log('🔍 函数调用调试信息:', debugInfo);
      }

      return {
        success: true,
        result,
        gasEstimate,
        staticCallResult,
        debugInfo
      };

    } catch (error) {
      debugInfo.execution = {
        success: false,
        error: error.message
      };

      if (this.debugMode) {
        console.error('🔍 函数调用失败调试信息:', debugInfo);
      }

      return {
        success: false,
        error,
        debugInfo
      };
    }
  }

  // 分析交易失败原因
  async analyzeTransactionFailure(txHash: string): Promise<{
    transaction: any;
    receipt: any;
    revertReason?: string;
    gasUsed: bigint;
    gasLimit: bigint;
    analysis: string[];
  }> {
    const analysis: string[] = [];

    try {
      // 获取交易信息
      const transaction = await this.provider.getTransaction(txHash);
      if (!transaction) {
        throw new Error('交易不存在');
      }

      // 获取交易回执
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        analysis.push('交易尚未确认');
        return { transaction, receipt, gasUsed: 0n, gasLimit: 0n, analysis };
      }

      // 分析 Gas 使用情况
      const gasUsed = receipt.gasUsed;
      const gasLimit = transaction.gasLimit;
      const gasUtilization = Number(gasUsed * 100n / gasLimit);

      analysis.push(`Gas 使用率: ${gasUtilization.toFixed(2)}%`);

      if (gasUtilization > 95) {
        analysis.push('⚠️ Gas 使用率过高，可能因 Gas 不足而失败');
      }

      // 检查交易状态
      if (receipt.status === 0) {
        analysis.push('❌ 交易执行失败');

        // 尝试获取 revert 原因
        try {
          const result = await this.provider.call(transaction, transaction.blockNumber);
          analysis.push('✅ 重放交易成功，原因可能是状态变化');
        } catch (replayError: any) {
          analysis.push('❌ 重放交易也失败');
          
          // 尝试解析 revert 原因
          if (replayError.data) {
            try {
              const decodedError = this.contract.interface.parseError(replayError.data);
              if (decodedError) {
                analysis.push(`🔍 自定义错误: ${decodedError.name}(${decodedError.args.join(', ')})`);
                return {
                  transaction,
                  receipt,
                  revertReason: `${decodedError.name}(${decodedError.args.join(', ')})`,
                  gasUsed,
                  gasLimit,
                  analysis
                };
              }
            } catch {
              // 尝试解析标准 revert 消息
              if (replayError.data.startsWith('0x08c379a0')) {
                try {
                  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
                  const decoded = abiCoder.decode(['string'], '0x' + replayError.data.slice(10));
                  const revertReason = decoded[0];
                  analysis.push(`🔍 Revert 原因: ${revertReason}`);
                  return {
                    transaction,
                    receipt,
                    revertReason,
                    gasUsed,
                    gasLimit,
                    analysis
                  };
                } catch {
                  analysis.push('🔍 无法解析 revert 原因');
                }
              }
            }
          }
        }
      } else {
        analysis.push('✅ 交易执行成功');
      }

      // 分析事件日志
      if (receipt.logs.length > 0) {
        analysis.push(`📋 产生了 ${receipt.logs.length} 个事件日志`);
        
        receipt.logs.forEach((log, index) => {
          try {
            const parsed = this.contract.interface.parseLog(log);
            if (parsed) {
              analysis.push(`  ${index + 1}. ${parsed.name}(${parsed.args.join(', ')})`);
            }
          } catch {
            analysis.push(`  ${index + 1}. 未知事件: ${log.topics[0]}`);
          }
        });
      } else {
        analysis.push('📋 没有产生事件日志');
      }

      return {
        transaction,
        receipt,
        gasUsed,
        gasLimit,
        analysis
      };

    } catch (error) {
      analysis.push(`❌ 分析失败: ${error}`);
      return {
        transaction: null,
        receipt: null,
        gasUsed: 0n,
        gasLimit: 0n,
        analysis
      };
    }
  }

  // 模拟交易执行
  async simulateTransaction(
    functionName: string,
    args: any[] = [],
    overrides: any = {}
  ): Promise<{
    success: boolean;
    result?: any;
    gasEstimate?: bigint;
    events?: any[];
    stateChanges?: any[];
    error?: any;
  }> {
    try {
      // 获取当前状态
      const currentBlock = await this.provider.getBlockNumber();
      
      // 使用 staticCall 模拟执行
      const result = await this.contract[functionName].staticCall(...args, overrides);
      
      // 估算 Gas
      const gasEstimate = await this.contract[functionName].estimateGas(...args, overrides);
      
      // 模拟事件（这里简化处理，实际需要更复杂的逻辑）
      const events: any[] = [];
      
      return {
        success: true,
        result,
        gasEstimate,
        events
      };
      
    } catch (error) {
      return {
        success: false,
        error
      };
    }
  }

  // 生成调试报告
  generateDebugReport(debugResults: any[]): string {
    const report = {
      generatedAt: new Date().toISOString(),
      contract: this.contract.target,
      totalCalls: debugResults.length,
      successfulCalls: debugResults.filter(r => r.success).length,
      failedCalls: debugResults.filter(r => !r.success).length,
      details: debugResults
    };

    return JSON.stringify(report, null, 2);
  }
}

// 使用示例
const debugger = new ContractDebugger(contract, true);

// 调试函数调用
const debugResult = await debugger.debugFunctionCall('transfer', [
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  ethers.parseEther('100')
]);

console.log('调试结果:', debugResult);

// 分析失败的交易
const analysis = await debugger.analyzeTransactionFailure('0x...');
console.log('交易分析:', analysis);

// 模拟交易执行
const simulation = await debugger.simulateTransaction('transfer', [
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  ethers.parseEther('100')
]);
console.log('模拟结果:', simulation);
```

## 最佳实践

### 1. 错误处理检查清单

```typescript
class ErrorHandlingBestPractices {
  // 错误处理检查清单
  static getErrorHandlingChecklist(): {
    [category: string]: Array<{
      item: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      implemented?: boolean;
    }>;
  } {
    return {
      '错误分类': [
        {
          item: '实现错误分类器',
          description: '根据错误类型进行分类处理',
          priority: 'high'
        },
        {
          item: '定义错误严重程度',
          description: '区分错误的严重程度',
          priority: 'high'
        },
        {
          item: '识别可恢复错误',
          description: '区分可恢复和不可恢复的错误',
          priority: 'medium'
        }
      ],
      '用户体验': [
        {
          item: '提供友好的错误消息',
          description: '将技术错误转换为用户友好的消息',
          priority: 'high'
        },
        {
          item: '提供操作建议',
          description: '告诉用户如何解决问题',
          priority: 'high'
        },
        {
          item: '实现加载状态',
          description: '在操作过程中显示加载状态',
          priority: 'medium'
        }
      ],
      '重试机制': [
        {
          item: '实现智能重试',
          description: '根据错误类型决定是否重试',
          priority: 'high'
        },
        {
          item: '使用指数退避',
          description: '避免频繁重试造成的问题',
          priority: 'medium'
        },
        {
          item: '设置重试限制',
          description: '避免无限重试',
          priority: 'high'
        }
      ],
      '监控和日志': [
        {
          item: '记录错误日志',
          description: '详细记录错误信息用于调试',
          priority: 'high'
        },
        {
          item: '实现错误监控',
          description: '监控错误频率和趋势',
          priority: 'medium'
        },
        {
          item: '设置告警机制',
          description: '在错误频率过高时发出告警',
          priority: 'medium'
        }
      ],
      '恢复策略': [
        {
          item: '实现回退机制',
          description: '在主要功能失败时提供备选方案',
          priority: 'medium'
        },
        {
          item: '使用熔断器',
          description: '在服务不可用时快速失败',
          priority: 'low'
        },
        {
          item: '提供离线模式',
          description: '在网络问题时提供基本功能',
          priority: 'low'
        }
      ]
    };
  }

  // 验证错误处理实现
  static validateErrorHandling(implementation: {
    hasErrorClassifier: boolean;
    hasRetryMechanism: boolean;
    hasUserFriendlyMessages: boolean;
    hasErrorMonitoring: boolean;
    hasRecoveryStrategies: boolean;
  }): {
    score: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 0;

    if (implementation.hasErrorClassifier) {
      score += 25;
    } else {
      recommendations.push('实现错误分类器以更好地处理不同类型的错误');
    }

    if (implementation.hasRetryMechanism) {
      score += 20;
    } else {
      recommendations.push('添加智能重试机制以提高操作成功率');
    }

    if (implementation.hasUserFriendlyMessages) {
      score += 20;
    } else {
      recommendations.push('提供用户友好的错误消息以改善用户体验');
    }

    if (implementation.hasErrorMonitoring) {
      score += 20;
    } else {
      recommendations.push('实现错误监控以及时发现和解决问题');
    }

    if (implementation.hasRecoveryStrategies) {
      score += 15;
    } else {
      recommendations.push('添加错误恢复策略以提高系统可用性');
    }

    return { score, recommendations };
  }

  // 生成错误处理代码模板
  static generateErrorHandlerTemplate(functionName: string): string {
    return `
async function ${functionName}WithErrorHandling(...args: any[]) {
  const retryHandler = new RetryHandler();
  const errorMonitor = new ErrorMonitor();
  
  try {
    return await retryHandler.smartRetry(async () => {
      return await contract.${functionName}(...args);
    });
  } catch (error) {
    // 记录错误
    errorMonitor.recordError(error, {
      function: '${functionName}',
      arguments: args
    });
    
    // 分类错误
    const errorInfo = ContractErrorClassifier.classifyError(error);
    
    // 尝试恢复
    if (errorInfo.recoverable) {
      const recovery = await recoveryManager.recoverFromError(error, {
        contract,
        functionName: '${functionName}',
        args
      });
      
      if (recovery.recovered) {
        return recovery.result;
      }
    }
    
    // 抛出用户友好的错误
    const friendlyMessage = ContractErrorClassifier.getUserFriendlyMessage(error);
    throw new Error(friendlyMessage);
  }
}`;
  }
}

// 使用示例
const checklist = ErrorHandlingBestPractices.getErrorHandlingChecklist();
console.log('错误处理检查清单:', checklist);

const validation = ErrorHandlingBestPractices.validateErrorHandling({
  hasErrorClassifier: true,
  hasRetryMechanism: true,
  hasUserFriendlyMessages: false,
  hasErrorMonitoring: false,
  hasRecoveryStrategies: false
});
console.log('错误处理评估:', validation);

const template = ErrorHandlingBestPractices.generateErrorHandlerTemplate('transfer');
console.log('错误处理模板:', template);
```

## 常见问题

### Q: 如何区分不同类型的合约错误？
A: 使用错误分类器分析错误代码、消息和上下文，将错误分为网络错误、参数错误、合约逻辑错误等类型。

### Q: 什么时候应该重试失败的操作？
A: 只重试可恢复的错误，如网络错误、临时的 Gas 问题等。不要重试参数错误或合约逻辑错误。

### Q: 如何向用户展示技术错误？
A: 将技术错误转换为用户友好的消息，提供具体的解决建议，避免显示原始的错误代码。

### Q: 如何监控和预防错误？
A: 实现错误监控系统，跟踪错误频率和趋势，设置告警机制，定期分析错误模式。

## 下一步

- [批量调用](/ethers/contracts/batch-calls) - 学习批量操作技巧
- [交易处理](/ethers/transactions/basics) - 了解交易管理
- [工具函数](/ethers/utils/encoding) - 掌握编码解码工具
- [实战应用](/ethers/examples/defi) - 应用到实际项目中