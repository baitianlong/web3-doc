---
title: 批量交易处理
description: Ethers.js 中批量交易处理的完整指南
keywords: [ethers.js, 批量交易, 并发处理, 交易优化, nonce管理, Web3开发]
---

# 批量交易处理

批量交易处理是提高区块链应用性能和用户体验的重要技术。本文档详细介绍如何使用 Ethers.js 高效地处理批量交易。

## 批量交易基础

### 1. 为什么需要批量交易

```typescript
// 传统的串行交易处理（效率低）
async function serialTransactions() {
  const provider = new ethers.JsonRpcProvider('your-rpc-url');
  const wallet = new ethers.Wallet('your-private-key', provider);

  // 串行发送，每个交易都要等待前一个完成
  const tx1 = await wallet.sendTransaction({ to: '0x...', value: ethers.parseEther('0.1') });
  await tx1.wait();

  const tx2 = await wallet.sendTransaction({ to: '0x...', value: ethers.parseEther('0.2') });
  await tx2.wait();

  const tx3 = await wallet.sendTransaction({ to: '0x...', value: ethers.parseEther('0.3') });
  await tx3.wait();

  console.log('所有交易完成，总耗时很长');
}

// 批量并发处理（效率高）
async function batchTransactions() {
  const provider = new ethers.JsonRpcProvider('your-rpc-url');
  const wallet = new ethers.Wallet('your-private-key', provider);

  const baseNonce = await provider.getTransactionCount(wallet.address);

  // 并发发送多个交易
  const transactions = await Promise.all([
    wallet.sendTransaction({ 
      to: '0x...', 
      value: ethers.parseEther('0.1'),
      nonce: baseNonce 
    }),
    wallet.sendTransaction({ 
      to: '0x...', 
      value: ethers.parseEther('0.2'),
      nonce: baseNonce + 1 
    }),
    wallet.sendTransaction({ 
      to: '0x...', 
      value: ethers.parseEther('0.3'),
      nonce: baseNonce + 2 
    })
  ]);

  // 等待所有交易确认
  const receipts = await Promise.all(transactions.map(tx => tx.wait()));
  console.log('所有交易完成，总耗时大幅减少');
}
```

### 2. 基础批量交易管理器

```typescript
interface BatchTransactionConfig {
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  gasBuffer: number;
}

class BasicBatchTransactionManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private config: BatchTransactionConfig;

  constructor(
    signer: ethers.Signer,
    config: Partial<BatchTransactionConfig> = {}
  ) {
    this.signer = signer;
    this.provider = signer.provider!;
    this.config = {
      maxConcurrent: 5,
      retryAttempts: 3,
      retryDelay: 2000,
      gasBuffer: 20,
      ...config
    };
  }

  // 批量发送 ETH 转账
  async batchEthTransfer(
    transfers: Array<{ to: string; amount: string }>
  ): Promise<Array<{
    index: number;
    to: string;
    amount: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }>> {
    const results: Array<any> = [];
    const baseNonce = await this.provider.getTransactionCount(await this.signer.getAddress());

    // 分批处理
    for (let i = 0; i < transfers.length; i += this.config.maxConcurrent) {
      const batch = transfers.slice(i, i + this.config.maxConcurrent);
      
      const batchPromises = batch.map(async (transfer, batchIndex) => {
        const globalIndex = i + batchIndex;
        const nonce = baseNonce + globalIndex;

        try {
          const transaction = await this.signer.sendTransaction({
            to: transfer.to,
            value: ethers.parseEther(transfer.amount),
            nonce,
            gasLimit: 21000
          });

          console.log(`交易 ${globalIndex + 1} 已发送: ${transaction.hash}`);

          const receipt = await transaction.wait();

          return {
            index: globalIndex,
            to: transfer.to,
            amount: transfer.amount,
            success: true,
            transaction,
            receipt
          };

        } catch (error: any) {
          console.error(`交易 ${globalIndex + 1} 失败:`, error.message);
          
          return {
            index: globalIndex,
            to: transfer.to,
            amount: transfer.amount,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            index: i + index,
            to: batch[index].to,
            amount: batch[index].amount,
            success: false,
            error: result.reason?.message || '未知错误'
          });
        }
      });

      // 批次间延迟
      if (i + this.config.maxConcurrent < transfers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`批量转账完成: ${successCount}/${transfers.length} 成功`);

    return results;
  }

  // 批量代币转账
  async batchTokenTransfer(
    tokenAddress: string,
    transfers: Array<{ to: string; amount: string }>,
    decimals: number = 18
  ): Promise<Array<{
    index: number;
    to: string;
    amount: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }>> {
    const ERC20_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ];

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const results: Array<any> = [];
    const baseNonce = await this.provider.getTransactionCount(await this.signer.getAddress());

    for (let i = 0; i < transfers.length; i += this.config.maxConcurrent) {
      const batch = transfers.slice(i, i + this.config.maxConcurrent);
      
      const batchPromises = batch.map(async (transfer, batchIndex) => {
        const globalIndex = i + batchIndex;
        const nonce = baseNonce + globalIndex;

        try {
          const amount = ethers.parseUnits(transfer.amount, decimals);
          
          const transaction = await tokenContract.transfer(transfer.to, amount, {
            nonce,
            gasLimit: 65000 // 代币转账通常需要更多 gas
          });

          console.log(`代币转账 ${globalIndex + 1} 已发送: ${transaction.hash}`);

          const receipt = await transaction.wait();

          return {
            index: globalIndex,
            to: transfer.to,
            amount: transfer.amount,
            success: true,
            transaction,
            receipt
          };

        } catch (error: any) {
          console.error(`代币转账 ${globalIndex + 1} 失败:`, error.message);
          
          return {
            index: globalIndex,
            to: transfer.to,
            amount: transfer.amount,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            index: i + index,
            to: batch[index].to,
            amount: batch[index].amount,
            success: false,
            error: result.reason?.message || '未知错误'
          });
        }
      });

      // 批次间延迟
      if (i + this.config.maxConcurrent < transfers.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`批量代币转账完成: ${successCount}/${transfers.length} 成功`);

    return results;
  }
}
```

## 高级批量交易处理

### 1. 智能批量交易管理器

```typescript
interface SmartBatchConfig {
  maxConcurrent: number;
  adaptiveScaling: boolean;
  failureThreshold: number;
  gasOptimization: boolean;
  nonceManagement: 'auto' | 'manual';
  retryStrategy: 'exponential' | 'linear' | 'none';
}

class SmartBatchTransactionManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private config: SmartBatchConfig;
  private nonceTracker: Map<string, number> = new Map();
  private performanceMetrics = {
    successRate: 0,
    avgProcessingTime: 0,
    totalProcessed: 0
  };

  constructor(
    signer: ethers.Signer,
    config: Partial<SmartBatchConfig> = {}
  ) {
    this.signer = signer;
    this.provider = signer.provider!;
    this.config = {
      maxConcurrent: 5,
      adaptiveScaling: true,
      failureThreshold: 0.2,
      gasOptimization: true,
      nonceManagement: 'auto',
      retryStrategy: 'exponential',
      ...config
    };
  }

  // 智能批量处理
  async smartBatchProcess<T>(
    items: T[],
    processor: (item: T, index: number, nonce: number) => Promise<ethers.TransactionResponse>,
    options?: {
      onProgress?: (completed: number, total: number, failed: number) => void;
      onBatchComplete?: (batchResults: any[]) => void;
    }
  ): Promise<Array<{
    index: number;
    item: T;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
    processingTime: number;
    gasUsed?: bigint;
  }>> {
    const startTime = Date.now();
    const results: Array<any> = [];
    let currentBatchSize = this.config.maxConcurrent;
    let completed = 0;
    let failed = 0;

    const baseNonce = await this.getNextNonce();

    for (let i = 0; i < items.length; i += currentBatchSize) {
      const batchStartTime = Date.now();
      const batch = items.slice(i, i + currentBatchSize);
      
      console.log(`处理批次 ${Math.floor(i / currentBatchSize) + 1}, 大小: ${batch.length}`);

      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        const nonce = baseNonce + globalIndex;
        const itemStartTime = Date.now();

        try {
          const transaction = await processor(item, globalIndex, nonce);
          const receipt = await transaction.wait();
          
          const processingTime = Date.now() - itemStartTime;
          completed++;

          if (options?.onProgress) {
            options.onProgress(completed, items.length, failed);
          }

          return {
            index: globalIndex,
            item,
            success: true,
            transaction,
            receipt,
            processingTime,
            gasUsed: receipt?.gasUsed
          };

        } catch (error: any) {
          const processingTime = Date.now() - itemStartTime;
          failed++;

          if (options?.onProgress) {
            options.onProgress(completed, items.length, failed);
          }

          return {
            index: globalIndex,
            item,
            success: false,
            error: error.message,
            processingTime
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const processedResults = batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      );

      results.push(...processedResults);

      if (options?.onBatchComplete) {
        options.onBatchComplete(processedResults);
      }

      // 自适应调整批次大小
      if (this.config.adaptiveScaling) {
        const batchSuccessRate = processedResults.filter(r => r.success).length / processedResults.length;
        const batchProcessingTime = Date.now() - batchStartTime;
        
        currentBatchSize = this.adjustBatchSize(
          currentBatchSize,
          batchSuccessRate,
          batchProcessingTime
        );
      }

      // 批次间延迟
      if (i + currentBatchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // 更新性能指标
    this.updatePerformanceMetrics(results, Date.now() - startTime);

    const successCount = results.filter(r => r.success).length;
    console.log(`智能批量处理完成: ${successCount}/${items.length} 成功`);
    console.log(`性能指标:`, this.performanceMetrics);

    return results;
  }

  // 调整批次大小
  private adjustBatchSize(
    currentSize: number,
    successRate: number,
    processingTime: number
  ): number {
    if (successRate < this.config.failureThreshold) {
      // 失败率过高，减少批次大小
      return Math.max(1, Math.floor(currentSize * 0.7));
    } else if (successRate > 0.9 && processingTime < 10000) {
      // 成功率高且处理快，增加批次大小
      return Math.min(this.config.maxConcurrent * 2, currentSize + 1);
    }
    
    return currentSize;
  }

  // 获取下一个可用的 nonce
  private async getNextNonce(): Promise<number> {
    const address = await this.signer.getAddress();
    
    if (this.config.nonceManagement === 'auto') {
      const pendingNonce = await this.provider.getTransactionCount(address, 'pending');
      const latestNonce = await this.provider.getTransactionCount(address, 'latest');
      
      // 使用较大的 nonce 值
      return Math.max(pendingNonce, latestNonce);
    } else {
      // 手动管理 nonce
      const currentNonce = this.nonceTracker.get(address) || 
                          await this.provider.getTransactionCount(address, 'latest');
      return currentNonce;
    }
  }

  // 更新性能指标
  private updatePerformanceMetrics(results: any[], totalTime: number): void {
    const successCount = results.filter(r => r.success).length;
    const newSuccessRate = successCount / results.length;
    const newAvgTime = totalTime / results.length;

    this.performanceMetrics = {
      successRate: (this.performanceMetrics.successRate * this.performanceMetrics.totalProcessed + 
                   newSuccessRate * results.length) / 
                   (this.performanceMetrics.totalProcessed + results.length),
      avgProcessingTime: (this.performanceMetrics.avgProcessingTime * this.performanceMetrics.totalProcessed + 
                         newAvgTime * results.length) / 
                         (this.performanceMetrics.totalProcessed + results.length),
      totalProcessed: this.performanceMetrics.totalProcessed + results.length
    };
  }
}
```

### 2. 批量合约调用

```typescript
class BatchContractManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider!;
  }

  // 批量合约函数调用
  async batchContractCalls(
    contractAddress: string,
    abi: any[],
    calls: Array<{
      functionName: string;
      args: any[];
      value?: bigint;
      gasLimit?: bigint;
    }>,
    options?: {
      maxConcurrent?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<Array<{
    index: number;
    functionName: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    result?: any;
    error?: string;
  }>> {
    const contract = new ethers.Contract(contractAddress, abi, this.signer);
    const maxConcurrent = options?.maxConcurrent || 3;
    const results: Array<any> = [];
    const baseNonce = await this.provider.getTransactionCount(await this.signer.getAddress());

    for (let i = 0; i < calls.length; i += maxConcurrent) {
      const batch = calls.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (call, batchIndex) => {
        const globalIndex = i + batchIndex;
        const nonce = baseNonce + globalIndex;

        try {
          // 估算 Gas
          let gasLimit = call.gasLimit;
          if (!gasLimit) {
            try {
              gasLimit = await contract[call.functionName].estimateGas(
                ...call.args,
                { value: call.value || 0n }
              );
              gasLimit = gasLimit * 120n / 100n; // 20% 缓冲
            } catch {
              gasLimit = 200000n; // 默认值
            }
          }

          const transaction = await contract[call.functionName](
            ...call.args,
            {
              nonce,
              gasLimit,
              value: call.value || 0n
            }
          );

          console.log(`合约调用 ${globalIndex + 1} (${call.functionName}) 已发送: ${transaction.hash}`);

          const receipt = await transaction.wait();

          if (options?.onProgress) {
            options.onProgress(globalIndex + 1, calls.length);
          }

          return {
            index: globalIndex,
            functionName: call.functionName,
            success: true,
            transaction,
            receipt,
            result: receipt.logs // 可以进一步解析事件
          };

        } catch (error: any) {
          console.error(`合约调用 ${globalIndex + 1} (${call.functionName}) 失败:`, error.message);
          
          return {
            index: globalIndex,
            functionName: call.functionName,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            index: i + index,
            functionName: batch[index].functionName,
            success: false,
            error: result.reason?.message || '未知错误'
          });
        }
      });

      // 批次间延迟
      if (i + maxConcurrent < calls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`批量合约调用完成: ${successCount}/${calls.length} 成功`);

    return results;
  }

  // 批量 ERC-20 操作
  async batchERC20Operations(
    tokenAddress: string,
    operations: Array<{
      type: 'transfer' | 'approve' | 'transferFrom';
      to?: string;
      from?: string;
      spender?: string;
      amount: string;
    }>,
    decimals: number = 18
  ): Promise<Array<{
    index: number;
    operation: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }>> {
    const ERC20_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) returns (bool)"
    ];

    const calls = operations.map(op => {
      const amount = ethers.parseUnits(op.amount, decimals);
      
      switch (op.type) {
        case 'transfer':
          return {
            functionName: 'transfer',
            args: [op.to!, amount],
            gasLimit: 65000n
          };
        case 'approve':
          return {
            functionName: 'approve',
            args: [op.spender!, amount],
            gasLimit: 50000n
          };
        case 'transferFrom':
          return {
            functionName: 'transferFrom',
            args: [op.from!, op.to!, amount],
            gasLimit: 70000n
          };
        default:
          throw new Error(`不支持的操作类型: ${op.type}`);
      }
    });

    const results = await this.batchContractCalls(tokenAddress, ERC20_ABI, calls);
    
    return results.map((result, index) => ({
      ...result,
      operation: `${operations[index].type}(${operations[index].amount})`
    }));
  }
}
```

## 批量交易监控

### 1. 实时状态监控

```typescript
interface BatchTransactionStatus {
  batchId: string;
  totalTransactions: number;
  completed: number;
  successful: number;
  failed: number;
  pending: number;
  startTime: number;
  estimatedCompletion?: number;
  transactions: Map<string, {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    gasUsed?: bigint;
    error?: string;
  }>;
}

class BatchTransactionMonitor {
  private provider: ethers.Provider;
  private batches = new Map<string, BatchTransactionStatus>();
  private listeners = new Map<string, Array<(status: BatchTransactionStatus) => void>>();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.startMonitoring();
  }

  // 创建新的批次监控
  createBatch(
    batchId: string,
    transactionHashes: string[],
    onStatusChange?: (status: BatchTransactionStatus) => void
  ): void {
    const batch: BatchTransactionStatus = {
      batchId,
      totalTransactions: transactionHashes.length,
      completed: 0,
      successful: 0,
      failed: 0,
      pending: transactionHashes.length,
      startTime: Date.now(),
      transactions: new Map()
    };

    // 初始化交易状态
    transactionHashes.forEach(hash => {
      batch.transactions.set(hash, {
        hash,
        status: 'pending',
        confirmations: 0
      });
    });

    this.batches.set(batchId, batch);

    if (onStatusChange) {
      if (!this.listeners.has(batchId)) {
        this.listeners.set(batchId, []);
      }
      this.listeners.get(batchId)!.push(onStatusChange);
    }

    console.log(`开始监控批次: ${batchId}, 交易数量: ${transactionHashes.length}`);
  }

  // 获取批次状态
  getBatchStatus(batchId: string): BatchTransactionStatus | undefined {
    return this.batches.get(batchId);
  }

  // 获取所有批次状态
  getAllBatchStatuses(): BatchTransactionStatus[] {
    return Array.from(this.batches.values());
  }

  // 停止监控批次
  stopMonitoring(batchId: string): void {
    this.batches.delete(batchId);
    this.listeners.delete(batchId);
    console.log(`停止监控批次: ${batchId}`);
  }

  // 开始监控循环
  private startMonitoring(): void {
    setInterval(async () => {
      await this.updateAllBatches();
    }, 10000); // 每10秒检查一次
  }

  // 更新所有批次状态
  private async updateAllBatches(): Promise<void> {
    const currentBlock = await this.provider.getBlockNumber();

    for (const [batchId, batch] of this.batches.entries()) {
      try {
        await this.updateBatchStatus(batch, currentBlock);
        this.notifyListeners(batchId, batch);
      } catch (error) {
        console.error(`更新批次状态失败 ${batchId}:`, error);
      }
    }
  }

  // 更新单个批次状态
  private async updateBatchStatus(
    batch: BatchTransactionStatus,
    currentBlock: number
  ): Promise<void> {
    let completed = 0;
    let successful = 0;
    let failed = 0;
    let pending = 0;

    for (const [hash, txStatus] of batch.transactions.entries()) {
      if (txStatus.status !== 'pending') {
        continue;
      }

      try {
        const tx = await this.provider.getTransaction(hash);
        
        if (tx && tx.blockNumber) {
          const confirmations = currentBlock - tx.blockNumber + 1;
          txStatus.confirmations = confirmations;

          if (confirmations >= 1) {
            const receipt = await this.provider.getTransactionReceipt(hash);
            
            if (receipt) {
              txStatus.status = receipt.status === 1 ? 'confirmed' : 'failed';
              txStatus.gasUsed = receipt.gasUsed;
              
              if (txStatus.status === 'confirmed') {
                successful++;
              } else {
                failed++;
                txStatus.error = '交易执行失败';
              }
              completed++;
            }
          }
        }
      } catch (error) {
        txStatus.status = 'failed';
        txStatus.error = (error as Error).message;
        failed++;
        completed++;
      }
    }

    // 计算当前状态
    batch.transactions.forEach(tx => {
      if (tx.status === 'confirmed') successful++;
      else if (tx.status === 'failed') failed++;
      else pending++;
    });

    batch.completed = completed;
    batch.successful = successful;
    batch.failed = failed;
    batch.pending = pending;

    // 估算完成时间
    if (completed > 0 && pending > 0) {
      const elapsedTime = Date.now() - batch.startTime;
      const avgTimePerTx = elapsedTime / completed;
      batch.estimatedCompletion = Date.now() + (avgTimePerTx * pending);
    }
  }

  // 通知监听器
  private notifyListeners(batchId: string, batch: BatchTransactionStatus): void {
    const listeners = this.listeners.get(batchId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(batch);
        } catch (error) {
          console.error('批次状态监听器执行失败:', error);
        }
      });
    }
  }
}
```

### 2. 批量交易可视化

```typescript
class BatchTransactionDashboard {
  private monitor: BatchTransactionMonitor;
  private container: HTMLElement;

  constructor(monitor: BatchTransactionMonitor, containerId: string) {
    this.monitor = monitor;
    this.container = document.getElementById(containerId)!;
    this.startDisplay();
  }

  // 开始显示
  private startDisplay(): void {
    setInterval(() => {
      this.updateDisplay();
    }, 2000); // 每2秒更新显示
  }

  // 更新显示
  private updateDisplay(): void {
    const batches = this.monitor.getAllBatchStatuses();
    
    this.container.innerHTML = `
      <div class="batch-dashboard">
        <h2>批量交易监控面板</h2>
        ${batches.map(batch => this.renderBatchStatus(batch)).join('')}
      </div>
    `;
  }

  // 渲染批次状态
  private renderBatchStatus(batch: BatchTransactionStatus): string {
    const progressPercentage = (batch.completed / batch.totalTransactions) * 100;
    const successRate = batch.completed > 0 ? (batch.successful / batch.completed) * 100 : 0;
    const elapsedTime = Math.floor((Date.now() - batch.startTime) / 1000);
    
    const estimatedTimeLeft = batch.estimatedCompletion ? 
      Math.floor((batch.estimatedCompletion - Date.now()) / 1000) : null;

    return `
      <div class="batch-item">
        <div class="batch-header">
          <h3>批次: ${batch.batchId}</h3>
          <div class="batch-stats">
            <span class="stat">总数: ${batch.totalTransactions}</span>
            <span class="stat success">成功: ${batch.successful}</span>
            <span class="stat failed">失败: ${batch.failed}</span>
            <span class="stat pending">待处理: ${batch.pending}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%;">
              <span class="progress-text">${progressPercentage.toFixed(1)}%</span>
            </div>
          </div>
          
          <div class="progress-details">
            <span>成功率: ${successRate.toFixed(1)}%</span>
            <span>已用时: ${elapsedTime}s</span>
            ${estimatedTimeLeft ? `<span>预计剩余: ${estimatedTimeLeft}s</span>` : ''}
          </div>
        </div>

        <div class="transaction-list">
          ${this.renderTransactionList(batch)}
        </div>
      </div>
    `;
  }

  // 渲染交易列表
  private renderTransactionList(batch: BatchTransactionStatus): string {
    const transactions = Array.from(batch.transactions.values());
    const recentTransactions = transactions.slice(0, 5); // 只显示前5个

    return `
      <div class="transaction-grid">
        ${recentTransactions.map(tx => `
          <div class="transaction-item ${tx.status}">
            <div class="tx-hash">${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}</div>
            <div class="tx-status">
              ${this.getStatusIcon(tx.status)} ${this.getStatusText(tx.status)}
            </div>
            ${tx.confirmations > 0 ? `<div class="tx-confirmations">${tx.confirmations} 确认</div>` : ''}
            ${tx.gasUsed ? `<div class="tx-gas">Gas: ${tx.gasUsed.toString()}</div>` : ''}
            ${tx.error ? `<div class="tx-error">${tx.error}</div>` : ''}
          </div>
        `).join('')}
        
        ${transactions.length > 5 ? `
          <div class="more-transactions">
            还有 ${transactions.length - 5} 个交易...
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
      default: return '❓';
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'pending': return '待确认';
      case 'confirmed': return '已确认';
      case 'failed': return '失败';
      default: return '未知';
    }
  }
}
```

## 实际应用示例

### 1. 批量空投

```typescript
// 批量空投示例
async function batchAirdrop() {
  const provider = new ethers.JsonRpcProvider('your-rpc-url');
  const wallet = new ethers.Wallet('your-private-key', provider);
  
  // 空投接收者列表
  const recipients = [
    { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', amount: '100' },
    { address: '0x8ba1f109551bD432803012645Hac136c', amount: '150' },
    { address: '0x1234567890123456789012345678901234567890', amount: '200' },
    // ... 更多接收者
  ];

  const batchManager = new SmartBatchTransactionManager(wallet);
  const monitor = new BatchTransactionMonitor(provider);

  try {
    console.log(`开始批量空投，共 ${recipients.length} 个接收者`);

    const results = await batchManager.smartBatchProcess(
      recipients,
      async (recipient, index, nonce) => {
        return await wallet.sendTransaction({
          to: recipient.address,
          value: ethers.parseEther(recipient.amount),
          nonce,
          gasLimit: 21000
        });
      },
      {
        onProgress: (completed, total, failed) => {
          console.log(`空投进度: ${completed}/${total}, 失败: ${failed}`);
        },
        onBatchComplete: (batchResults) => {
          const batchSuccess = batchResults.filter(r => r.success).length;
          console.log(`批次完成: ${batchSuccess}/${batchResults.length} 成功`);
        }
      }
    );

    const successCount = results.filter(r => r.success).length;
    const totalAmount = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + parseFloat(recipients[r.index].amount), 0);

    console.log(`空投完成统计:`);
    console.log(`- 成功: ${successCount}/${recipients.length}`);
    console.log(`- 总金额: ${totalAmount} ETH`);
    console.log(`- 失败交易:`, results.filter(r => !r.success).map(r => r.error));

    return results;

  } catch (error) {
    console.error('批量空投失败:', error);
    throw error;
  }
}
```

### 2. 批量 DeFi 操作

```typescript
// 批量 DeFi 操作示例
async function batchDeFiOperations() {
  const provider = new ethers.JsonRpcProvider('your-rpc-url');
  const wallet = new ethers.Wallet('your-private-key', provider);
  
  const batchContract = new BatchContractManager(wallet);

  // Uniswap V2 Router 地址
  const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
  const UNISWAP_ABI = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
  ];

  // WETH 和 USDC 地址
  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const USDC = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';

  const deadline = Math.floor(Date.now() / 1000) + 1800; // 30分钟后过期

  // 批量交换操作
  const swapOperations = [
    {
      functionName: 'swapExactETHForTokens',
      args: [
        0, // amountOutMin (设为0，实际应用中需要计算)
        [WETH, USDC], // path
        await wallet.getAddress(), // to
        deadline
      ],
      value: ethers.parseEther('0.1'), // 0.1 ETH
      gasLimit: 200000n
    },
    {
      functionName: 'swapExactETHForTokens',
      args: [
        0,
        [WETH, USDC],
        await wallet.getAddress(),
        deadline
      ],
      value: ethers.parseEther('0.2'), // 0.2 ETH
      gasLimit: 200000n
    }
    // 可以添加更多交换操作
  ];

  try {
    console.log('开始批量 DeFi 操作...');

    const results = await batchContract.batchContractCalls(
      UNISWAP_ROUTER,
      UNISWAP_ABI,
      swapOperations,
      {
        maxConcurrent: 2,
        onProgress: (completed, total) => {
          console.log(`DeFi 操作进度: ${completed}/${total}`);
        }
      }
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`批量 DeFi 操作完成: ${successCount}/${swapOperations.length} 成功`);

    // 分析结果
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`交换 ${index + 1} 成功:`, {
          hash: result.transaction?.hash,
          gasUsed: result.receipt?.gasUsed?.toString()
        });
      } else {
        console.log(`交换 ${index + 1} 失败:`, result.error);
      }
    });

    return results;

  } catch (error) {
    console.error('批量 DeFi 操作失败:', error);
    throw error;
  }
}
```

## 最佳实践

### 1. 性能优化建议

```typescript
// 性能优化配置
const OPTIMAL_BATCH_CONFIG = {
  // 网络拥堵时减少并发数
  maxConcurrent: {
    low: 8,      // 网络空闲时
    medium: 5,   // 网络正常时
    high: 2      // 网络拥堵时
  },
  
  // 根据交易类型调整 Gas 限制
  gasLimits: {
    ethTransfer: 21000n,
    erc20Transfer: 65000n,
    uniswapSwap: 200000n,
    complexContract: 500000n
  },
  
  // 批次间延迟
  batchDelay: {
    low: 500,    // 网络空闲时
    medium: 1500, // 网络正常时
    high: 3000   // 网络拥堵时
  }
};

// 动态调整配置
function getOptimalConfig(networkCongestion: 'low' | 'medium' | 'high') {
  return {
    maxConcurrent: OPTIMAL_BATCH_CONFIG.maxConcurrent[networkCongestion],
    batchDelay: OPTIMAL_BATCH_CONFIG.batchDelay[networkCongestion]
  };
}
```

### 2. 错误处理策略

```typescript
// 错误分类和处理
class BatchErrorHandler {
  static categorizeError(error: any): {
    category: 'network' | 'gas' | 'nonce' | 'balance' | 'contract' | 'unknown';
    retryable: boolean;
    suggestion: string;
  } {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('timeout')) {
      return {
        category: 'network',
        retryable: true,
        suggestion: '网络问题，建议重试'
      };
    }
    
    if (message.includes('gas') || message.includes('out of gas')) {
      return {
        category: 'gas',
        retryable: true,
        suggestion: '增加 Gas 限制或 Gas 价格'
      };
    }
    
    if (message.includes('nonce')) {
      return {
        category: 'nonce',
        retryable: true,
        suggestion: '重新获取 nonce 值'
      };
    }
    
    if (message.includes('insufficient funds')) {
      return {
        category: 'balance',
        retryable: false,
        suggestion: '余额不足，请充值'
      };
    }
    
    if (message.includes('revert') || message.includes('execution reverted')) {
      return {
        category: 'contract',
        retryable: false,
        suggestion: '合约执行失败，检查参数和条件'
      };
    }
    
    return {
      category: 'unknown',
      retryable: true,
      suggestion: '未知错误，可尝试重试'
    };
  }
}
```

## 总结

批量交易处理是提高区块链应用性能的关键技术。本文档介绍了：

1. **基础批量处理**: 简单的并发交易发送
2. **智能批量管理**: 自适应调整、性能优化
3. **合约批量调用**: 批量合约函数调用、ERC-20 操作
4. **实时监控**: 状态追踪、可视化显示
5. **实际应用**: 空投、DeFi 操作等场景
6. **最佳实践**: 性能优化、错误处理

通过合理使用这些技术，可以显著提高应用的处理效率和用户体验。

## 相关资源

- [发送交易](/ethers/transactions/sending)
- [交易等待](/ethers/transactions/waiting)
- [Gas 管理](/ethers/transactions/gas)
- [合约交互](/ethers/contracts/basics)