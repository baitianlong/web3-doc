---
title: 交易等待和确认
description: Ethers.js 中等待交易确认的完整指南
keywords: [ethers.js, 交易等待, 交易确认, 区块确认, 交易状态, 前端开发, Web3]
---

# 交易等待和确认

在区块链应用中，等待交易确认是一个关键环节。本文档详细介绍如何使用 Ethers.js 等待和监控交易确认状态。

## 基础等待方法

### 1. 简单等待确认

```typescript
import { ethers } from 'ethers';

// 基础等待示例
async function waitForTransaction() {
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/your-api-key');
  const wallet = new ethers.Wallet('your-private-key', provider);

  // 发送交易
  const tx = await wallet.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    value: ethers.parseEther('0.1')
  });

  console.log('交易已发送:', tx.hash);

  // 等待 1 个确认
  const receipt = await tx.wait();
  console.log('交易已确认:', receipt);

  return receipt;
}

// 使用示例
waitForTransaction()
  .then(receipt => {
    console.log('交易成功:', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });
  })
  .catch(error => {
    console.error('交易失败:', error);
  });
```

### 2. 指定确认数

```typescript
async function waitWithConfirmations() {
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/your-api-key');
  const wallet = new ethers.Wallet('your-private-key', provider);

  const tx = await wallet.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    value: ethers.parseEther('0.1')
  });

  console.log('交易已发送:', tx.hash);

  // 等待 3 个确认
  const receipt = await tx.wait(3);
  console.log('交易已获得 3 个确认:', receipt);

  return receipt;
}
```

### 3. 带超时的等待

```typescript
async function waitWithTimeout() {
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/your-api-key');
  const wallet = new ethers.Wallet('your-private-key', provider);

  const tx = await wallet.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    value: ethers.parseEther('0.1')
  });

  console.log('交易已发送:', tx.hash);

  try {
    // 设置 5 分钟超时
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('交易确认超时')), 300000)
      )
    ]);

    console.log('交易已确认:', receipt);
    return receipt;
  } catch (error) {
    if (error.message === '交易确认超时') {
      console.log('交易确认超时，但可能仍在处理中');
      // 可以选择继续等待或采取其他行动
    }
    throw error;
  }
}
```

## 高级等待策略

### 1. 智能等待管理器

```typescript
class TransactionWaiter {
  private provider: ethers.Provider;
  private pendingTransactions = new Map<string, {
    transaction: ethers.TransactionResponse;
    startTime: number;
    confirmations: number;
    callbacks: Array<(receipt: ethers.TransactionReceipt | null) => void>;
  }>();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.startMonitoring();
  }

  // 添加交易到等待队列
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 300000, // 5分钟
    onProgress?: (confirmations: number) => void
  ): Promise<ethers.TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      try {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) {
          reject(new Error('交易不存在'));
          return;
        }

        // 检查是否已经确认
        if (tx.blockNumber) {
          const currentBlock = await this.provider.getBlockNumber();
          const currentConfirmations = currentBlock - tx.blockNumber + 1;
          
          if (currentConfirmations >= confirmations) {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            resolve(receipt!);
            return;
          }
        }

        // 添加到监控队列
        const callback = (receipt: ethers.TransactionReceipt | null) => {
          if (receipt) {
            resolve(receipt);
          }
        };

        if (!this.pendingTransactions.has(txHash)) {
          this.pendingTransactions.set(txHash, {
            transaction: tx,
            startTime: Date.now(),
            confirmations,
            callbacks: [callback]
          });
        } else {
          this.pendingTransactions.get(txHash)!.callbacks.push(callback);
        }

        // 设置超时
        setTimeout(() => {
          if (this.pendingTransactions.has(txHash)) {
            this.pendingTransactions.delete(txHash);
            reject(new Error('交易确认超时'));
          }
        }, timeout);

        // 进度回调
        if (onProgress) {
          const checkProgress = async () => {
            const tx = await this.provider.getTransaction(txHash);
            if (tx && tx.blockNumber) {
              const currentBlock = await this.provider.getBlockNumber();
              const currentConfirmations = currentBlock - tx.blockNumber + 1;
              onProgress(Math.min(currentConfirmations, confirmations));
              
              if (currentConfirmations < confirmations) {
                setTimeout(checkProgress, 5000);
              }
            } else {
              setTimeout(checkProgress, 5000);
            }
          };
          checkProgress();
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  // 监控循环
  private startMonitoring(): void {
    setInterval(async () => {
      await this.checkPendingTransactions();
    }, 10000); // 每10秒检查一次
  }

  // 检查待确认交易
  private async checkPendingTransactions(): void {
    const currentBlock = await this.provider.getBlockNumber();

    for (const [hash, data] of this.pendingTransactions.entries()) {
      try {
        const tx = await this.provider.getTransaction(hash);
        
        if (tx && tx.blockNumber) {
          const confirmations = currentBlock - tx.blockNumber + 1;
          
          if (confirmations >= data.confirmations) {
            const receipt = await this.provider.getTransactionReceipt(hash);
            
            // 通知所有回调
            data.callbacks.forEach(callback => callback(receipt));
            
            // 移除已确认的交易
            this.pendingTransactions.delete(hash);
            
            console.log(`交易 ${hash} 已获得 ${confirmations} 个确认`);
          }
        }
      } catch (error) {
        console.error(`检查交易 ${hash} 时出错:`, error);
      }
    }
  }

  // 获取等待状态
  getWaitingStatus(): Array<{
    hash: string;
    waitingTime: number;
    requiredConfirmations: number;
  }> {
    const now = Date.now();
    return Array.from(this.pendingTransactions.entries()).map(([hash, data]) => ({
      hash,
      waitingTime: now - data.startTime,
      requiredConfirmations: data.confirmations
    }));
  }
}
```

### 2. 批量交易等待

```typescript
class BatchTransactionWaiter {
  private waiter: TransactionWaiter;

  constructor(provider: ethers.Provider) {
    this.waiter = new TransactionWaiter(provider);
  }

  // 批量等待交易
  async waitForBatch(
    transactions: Array<{
      hash: string;
      confirmations?: number;
      timeout?: number;
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ethers.TransactionReceipt[]> {
    const results: ethers.TransactionReceipt[] = [];
    let completed = 0;

    const promises = transactions.map(async (tx, index) => {
      try {
        const receipt = await this.waiter.waitForTransaction(
          tx.hash,
          tx.confirmations || 1,
          tx.timeout || 300000
        );
        
        results[index] = receipt;
        completed++;
        
        if (onProgress) {
          onProgress(completed, transactions.length);
        }
        
        return receipt;
      } catch (error) {
        console.error(`交易 ${tx.hash} 等待失败:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
    return results;
  }

  // 批量等待（允许部分失败）
  async waitForBatchAllowFailures(
    transactions: Array<{
      hash: string;
      confirmations?: number;
      timeout?: number;
    }>,
    onProgress?: (completed: number, total: number, failed: number) => void
  ): Promise<Array<{
    hash: string;
    receipt?: ethers.TransactionReceipt;
    error?: Error;
    status: 'success' | 'failed';
  }>> {
    const results: Array<{
      hash: string;
      receipt?: ethers.TransactionReceipt;
      error?: Error;
      status: 'success' | 'failed';
    }> = [];

    let completed = 0;
    let failed = 0;

    const promises = transactions.map(async (tx, index) => {
      try {
        const receipt = await this.waiter.waitForTransaction(
          tx.hash,
          tx.confirmations || 1,
          tx.timeout || 300000
        );
        
        results[index] = {
          hash: tx.hash,
          receipt,
          status: 'success'
        };
        
        completed++;
      } catch (error) {
        results[index] = {
          hash: tx.hash,
          error: error as Error,
          status: 'failed'
        };
        
        failed++;
      }

      if (onProgress) {
        onProgress(completed, transactions.length, failed);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}
```

## 实时状态监控

### 1. 交易状态追踪器

```typescript
interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'timeout';
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  timestamp: number;
  error?: string;
}

class TransactionStatusTracker {
  private provider: ethers.Provider;
  private trackedTransactions = new Map<string, TransactionStatus>();
  private listeners = new Map<string, Array<(status: TransactionStatus) => void>>();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.startTracking();
  }

  // 开始追踪交易
  trackTransaction(
    hash: string,
    requiredConfirmations: number = 1,
    onStatusChange?: (status: TransactionStatus) => void
  ): void {
    const status: TransactionStatus = {
      hash,
      status: 'pending',
      confirmations: 0,
      requiredConfirmations,
      timestamp: Date.now()
    };

    this.trackedTransactions.set(hash, status);

    if (onStatusChange) {
      if (!this.listeners.has(hash)) {
        this.listeners.set(hash, []);
      }
      this.listeners.get(hash)!.push(onStatusChange);
    }

    console.log(`开始追踪交易: ${hash}`);
  }

  // 停止追踪交易
  stopTracking(hash: string): void {
    this.trackedTransactions.delete(hash);
    this.listeners.delete(hash);
    console.log(`停止追踪交易: ${hash}`);
  }

  // 获取交易状态
  getStatus(hash: string): TransactionStatus | undefined {
    return this.trackedTransactions.get(hash);
  }

  // 获取所有追踪的交易
  getAllStatuses(): TransactionStatus[] {
    return Array.from(this.trackedTransactions.values());
  }

  // 开始追踪循环
  private startTracking(): void {
    setInterval(async () => {
      await this.updateAllStatuses();
    }, 5000); // 每5秒更新一次
  }

  // 更新所有交易状态
  private async updateAllStatuses(): void {
    const currentBlock = await this.provider.getBlockNumber();

    for (const [hash, status] of this.trackedTransactions.entries()) {
      try {
        await this.updateTransactionStatus(hash, status, currentBlock);
      } catch (error) {
        console.error(`更新交易状态失败 ${hash}:`, error);
        
        // 更新错误状态
        status.status = 'failed';
        status.error = (error as Error).message;
        this.notifyListeners(hash, status);
      }
    }
  }

  // 更新单个交易状态
  private async updateTransactionStatus(
    hash: string,
    status: TransactionStatus,
    currentBlock: number
  ): Promise<void> {
    const tx = await this.provider.getTransaction(hash);
    
    if (!tx) {
      // 交易不存在，可能还未广播
      return;
    }

    if (tx.blockNumber) {
      // 交易已上链
      const confirmations = currentBlock - tx.blockNumber + 1;
      status.confirmations = confirmations;
      status.blockNumber = tx.blockNumber;

      if (confirmations >= status.requiredConfirmations) {
        // 获取交易收据
        const receipt = await this.provider.getTransactionReceipt(hash);
        
        if (receipt) {
          status.status = receipt.status === 1 ? 'confirmed' : 'failed';
          status.gasUsed = receipt.gasUsed;
          status.effectiveGasPrice = receipt.effectiveGasPrice;
          
          if (status.status === 'confirmed') {
            console.log(`交易确认: ${hash}, 区块: ${tx.blockNumber}, Gas: ${receipt.gasUsed}`);
          } else {
            console.log(`交易失败: ${hash}, 区块: ${tx.blockNumber}`);
          }
        }
      }

      this.notifyListeners(hash, status);
    }

    // 检查超时（10分钟）
    if (Date.now() - status.timestamp > 600000 && status.status === 'pending') {
      status.status = 'timeout';
      status.error = '交易确认超时';
      this.notifyListeners(hash, status);
    }
  }

  // 通知监听器
  private notifyListeners(hash: string, status: TransactionStatus): void {
    const listeners = this.listeners.get(hash);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('状态监听器执行失败:', error);
        }
      });
    }
  }
}
```

### 2. 可视化状态显示

```typescript
class TransactionStatusDisplay {
  private tracker: TransactionStatusTracker;
  private container: HTMLElement;

  constructor(tracker: TransactionStatusTracker, containerId: string) {
    this.tracker = tracker;
    this.container = document.getElementById(containerId)!;
    this.startDisplay();
  }

  // 开始显示
  private startDisplay(): void {
    setInterval(() => {
      this.updateDisplay();
    }, 1000); // 每秒更新显示
  }

  // 更新显示
  private updateDisplay(): void {
    const statuses = this.tracker.getAllStatuses();
    
    this.container.innerHTML = `
      <div class="transaction-status-container">
        <h3>交易状态监控</h3>
        ${statuses.map(status => this.renderTransactionStatus(status)).join('')}
      </div>
    `;
  }

  // 渲染单个交易状态
  private renderTransactionStatus(status: TransactionStatus): string {
    const statusIcon = this.getStatusIcon(status.status);
    const statusColor = this.getStatusColor(status.status);
    const elapsedTime = Math.floor((Date.now() - status.timestamp) / 1000);
    
    return `
      <div class="transaction-item" style="border-left: 4px solid ${statusColor};">
        <div class="transaction-header">
          <span class="status-icon">${statusIcon}</span>
          <span class="transaction-hash">${status.hash.slice(0, 10)}...${status.hash.slice(-8)}</span>
          <span class="elapsed-time">${elapsedTime}s</span>
        </div>
        
        <div class="transaction-details">
          <div class="detail-row">
            <span>状态:</span>
            <span style="color: ${statusColor};">${this.getStatusText(status.status)}</span>
          </div>
          
          <div class="detail-row">
            <span>确认数:</span>
            <span>${status.confirmations}/${status.requiredConfirmations}</span>
          </div>
          
          ${status.blockNumber ? `
            <div class="detail-row">
              <span>区块号:</span>
              <span>${status.blockNumber}</span>
            </div>
          ` : ''}
          
          ${status.gasUsed ? `
            <div class="detail-row">
              <span>Gas 使用:</span>
              <span>${status.gasUsed.toString()}</span>
            </div>
          ` : ''}
          
          ${status.error ? `
            <div class="detail-row error">
              <span>错误:</span>
              <span>${status.error}</span>
            </div>
          ` : ''}
        </div>
        
        ${status.status === 'pending' && status.confirmations > 0 ? `
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(status.confirmations / status.requiredConfirmations) * 100}%;"></div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'failed': return '❌';
      case 'timeout': return '⏰';
      default: return '❓';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'confirmed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'timeout': return '#6c757d';
      default: return '#6c757d';
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'pending': return '等待确认';
      case 'confirmed': return '已确认';
      case 'failed': return '失败';
      case 'timeout': return '超时';
      default: return '未知';
    }
  }
}
```

## 错误处理和重试

### 1. 智能重试机制

```typescript
class SmartTransactionWaiter {
  private provider: ethers.Provider;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    provider: ethers.Provider,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ) {
    this.provider = provider;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  // 智能等待交易
  async waitForTransactionSmart(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 300000
  ): Promise<ethers.TransactionReceipt> {
    let retryCount = 0;
    
    while (retryCount <= this.maxRetries) {
      try {
        return await this.waitWithTimeout(txHash, confirmations, timeout);
      } catch (error) {
        retryCount++;
        
        if (retryCount > this.maxRetries) {
          throw new Error(`交易等待失败，已重试 ${this.maxRetries} 次: ${error}`);
        }

        console.log(`交易等待失败，第 ${retryCount} 次重试...`);
        await this.delay(this.retryDelay * retryCount); // 递增延迟
      }
    }

    throw new Error('交易等待失败');
  }

  // 带超时的等待
  private async waitWithTimeout(
    txHash: string,
    confirmations: number,
    timeout: number
  ): Promise<ethers.TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('交易确认超时'));
      }, timeout);

      try {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) {
          throw new Error('交易不存在');
        }

        const receipt = await tx.wait(confirmations);
        clearTimeout(timeoutId);
        resolve(receipt!);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查交易状态
  async checkTransactionStatus(txHash: string): Promise<{
    exists: boolean;
    mined: boolean;
    confirmations: number;
    receipt?: ethers.TransactionReceipt;
  }> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      
      if (!tx) {
        return { exists: false, mined: false, confirmations: 0 };
      }

      if (!tx.blockNumber) {
        return { exists: true, mined: false, confirmations: 0 };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - tx.blockNumber + 1;
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        exists: true,
        mined: true,
        confirmations,
        receipt: receipt || undefined
      };
    } catch (error) {
      console.error('检查交易状态失败:', error);
      return { exists: false, mined: false, confirmations: 0 };
    }
  }
}
```

### 2. 网络状况适应

```typescript
class NetworkAwareWaiter {
  private provider: ethers.Provider;
  private networkStatus: {
    avgBlockTime: number;
    congestionLevel: 'low' | 'medium' | 'high';
    lastUpdate: number;
  };

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.networkStatus = {
      avgBlockTime: 12000, // 默认12秒
      congestionLevel: 'medium',
      lastUpdate: 0
    };
    
    this.updateNetworkStatus();
  }

  // 根据网络状况调整等待策略
  async waitForTransactionAdaptive(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    await this.updateNetworkStatus();
    
    // 根据网络拥堵程度调整超时时间
    const baseTimeout = confirmations * this.networkStatus.avgBlockTime * 2;
    const congestionMultiplier = {
      low: 1,
      medium: 1.5,
      high: 2.5
    };
    
    const timeout = baseTimeout * congestionMultiplier[this.networkStatus.congestionLevel];
    
    console.log(`网络状况: ${this.networkStatus.congestionLevel}, 预计等待时间: ${timeout / 1000}秒`);

    const smartWaiter = new SmartTransactionWaiter(this.provider);
    return await smartWaiter.waitForTransactionSmart(txHash, confirmations, timeout);
  }

  // 更新网络状况
  private async updateNetworkStatus(): Promise<void> {
    const now = Date.now();
    
    // 每分钟更新一次
    if (now - this.networkStatus.lastUpdate < 60000) {
      return;
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const block = await this.provider.getBlock(currentBlock);
      const prevBlock = await this.provider.getBlock(currentBlock - 1);
      
      if (block && prevBlock) {
        // 计算平均出块时间
        this.networkStatus.avgBlockTime = (block.timestamp - prevBlock.timestamp) * 1000;
        
        // 评估网络拥堵程度（基于 Gas 使用率）
        const gasUsageRatio = Number(block.gasUsed) / Number(block.gasLimit);
        
        if (gasUsageRatio < 0.5) {
          this.networkStatus.congestionLevel = 'low';
        } else if (gasUsageRatio < 0.8) {
          this.networkStatus.congestionLevel = 'medium';
        } else {
          this.networkStatus.congestionLevel = 'high';
        }
        
        this.networkStatus.lastUpdate = now;
        
        console.log(`网络状况更新: 出块时间 ${this.networkStatus.avgBlockTime}ms, 拥堵程度 ${this.networkStatus.congestionLevel}`);
      }
    } catch (error) {
      console.error('更新网络状况失败:', error);
    }
  }
}
```

## 实际应用示例

### 1. 完整的交易等待流程

```typescript
// 完整示例：发送交易并等待确认
async function completeTransactionFlow() {
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/your-api-key');
  const wallet = new ethers.Wallet('your-private-key', provider);
  
  // 创建状态追踪器
  const tracker = new TransactionStatusTracker(provider);
  
  // 创建网络感知等待器
  const waiter = new NetworkAwareWaiter(provider);

  try {
    // 发送交易
    const tx = await wallet.sendTransaction({
      to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      value: ethers.parseEther('0.1'),
      gasLimit: 21000
    });

    console.log('交易已发送:', tx.hash);

    // 开始追踪
    tracker.trackTransaction(tx.hash, 3, (status) => {
      console.log('状态更新:', status);
    });

    // 等待确认
    const receipt = await waiter.waitForTransactionAdaptive(tx.hash, 3);
    
    console.log('交易确认成功:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? '成功' : '失败'
    });

    return receipt;

  } catch (error) {
    console.error('交易流程失败:', error);
    throw error;
  } finally {
    // 清理追踪
    tracker.stopTracking(tx.hash);
  }
}

// 使用示例
completeTransactionFlow()
  .then(receipt => {
    console.log('交易完成:', receipt.hash);
  })
  .catch(error => {
    console.error('交易失败:', error.message);
  });
```

### 2. 批量交易处理

```typescript
// 批量交易等待示例
async function batchTransactionExample() {
  const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/your-api-key');
  const wallet = new ethers.Wallet('your-private-key', provider);
  
  const batchWaiter = new BatchTransactionWaiter(provider);
  const transactions: string[] = [];

  try {
    // 发送多个交易
    for (let i = 0; i < 3; i++) {
      const tx = await wallet.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: ethers.parseEther('0.01'),
        nonce: await provider.getTransactionCount(wallet.address) + i
      });
      
      transactions.push(tx.hash);
      console.log(`交易 ${i + 1} 已发送:`, tx.hash);
    }

    // 批量等待
    const receipts = await batchWaiter.waitForBatch(
      transactions.map(hash => ({ hash, confirmations: 2 })),
      (completed, total) => {
        console.log(`进度: ${completed}/${total}`);
      }
    );

    console.log('所有交易已确认:', receipts.map(r => r.hash));
    return receipts;

  } catch (error) {
    console.error('批量交易失败:', error);
    throw error;
  }
}
```

## 最佳实践

### 1. 确认数选择指南

```typescript
// 根据交易价值选择确认数
function getRecommendedConfirmations(valueInEth: number): number {
  if (valueInEth < 0.1) return 1;      // 小额交易
  if (valueInEth < 1) return 3;        // 中等交易
  if (valueInEth < 10) return 6;       // 大额交易
  return 12;                           // 超大额交易
}

// 根据网络状况调整确认数
function adjustConfirmationsForNetwork(
  baseConfirmations: number,
  networkCongestion: 'low' | 'medium' | 'high'
): number {
  const multipliers = { low: 1, medium: 1.2, high: 1.5 };
  return Math.ceil(baseConfirmations * multipliers[networkCongestion]);
}
```

### 2. 用户体验优化

```typescript
// 用户友好的等待界面
class UserFriendlyWaiter {
  private onProgress?: (stage: string, progress: number) => void;

  constructor(onProgress?: (stage: string, progress: number) => void) {
    this.onProgress = onProgress;
  }

  async waitWithUserFeedback(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    const provider = new ethers.JsonRpcProvider('your-rpc-url');
    
    this.updateProgress('发送中', 0);
    
    // 等待交易上链
    let tx = await provider.getTransaction(txHash);
    while (!tx || !tx.blockNumber) {
      this.updateProgress('等待上链', 10);
      await this.delay(2000);
      tx = await provider.getTransaction(txHash);
    }

    this.updateProgress('已上链', 30);

    // 等待确认
    const currentBlock = await provider.getBlockNumber();
    let currentConfirmations = currentBlock - tx.blockNumber + 1;

    while (currentConfirmations < confirmations) {
      const progress = 30 + (currentConfirmations / confirmations) * 60;
      this.updateProgress(`确认中 (${currentConfirmations}/${confirmations})`, progress);
      
      await this.delay(5000);
      const newBlock = await provider.getBlockNumber();
      currentConfirmations = newBlock - tx.blockNumber + 1;
    }

    this.updateProgress('获取收据', 95);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    this.updateProgress('完成', 100);
    return receipt!;
  }

  private updateProgress(stage: string, progress: number): void {
    if (this.onProgress) {
      this.onProgress(stage, progress);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 总结

交易等待和确认是区块链应用中的关键环节。本文档介绍了：

1. **基础等待方法**: 简单等待、指定确认数、超时处理
2. **高级策略**: 智能等待管理、批量处理、状态追踪
3. **实时监控**: 状态追踪器、可视化显示
4. **错误处理**: 智能重试、网络适应
5. **最佳实践**: 确认数选择、用户体验优化

通过合理使用这些技术，可以为用户提供可靠且友好的交易确认体验。

## 相关资源

- [交易基础概念](/ethers/transactions/basics)
- [发送交易](/ethers/transactions/sending)
- [Gas 管理](/ethers/transactions/gas)
- [错误处理最佳实践](/ethers/error-handling)