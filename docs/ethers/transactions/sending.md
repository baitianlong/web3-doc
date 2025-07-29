---
title: 发送交易
description: Ethers.js 中发送各种类型交易的详细指南
keywords: [ethers, 发送交易, sendTransaction, 以太坊, Web3, 交易发送]
---

# 发送交易

发送交易是区块链应用的核心功能。本章将详细介绍如何使用 Ethers.js 发送各种类型的交易，包括 ETH 转账、合约调用、批量交易等。

## 基础交易发送

### 1. 简单 ETH 转账

```typescript
import { ethers } from 'ethers';

class TransactionSender {
  private signer: ethers.Signer;
  private provider: ethers.Provider;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider!;
  }

  // 基础 ETH 转账
  async sendEther(
    to: string,
    amount: string,
    options?: {
      gasLimit?: bigint;
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
      nonce?: number;
    }
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    try {
      // 验证地址
      if (!ethers.isAddress(to)) {
        throw new Error('无效的接收地址');
      }

      // 检查余额
      const senderAddress = await this.signer.getAddress();
      const balance = await this.provider.getBalance(senderAddress);
      const transferAmount = ethers.parseEther(amount);

      if (balance < transferAmount) {
        throw new Error(`余额不足: ${ethers.formatEther(balance)} ETH`);
      }

      // 构建交易
      const tx: ethers.TransactionRequest = {
        to,
        value: transferAmount,
        ...options
      };

      console.log('发送交易:', {
        from: senderAddress,
        to,
        amount: amount + ' ETH',
        gasLimit: options?.gasLimit?.toString(),
        gasPrice: options?.gasPrice ? ethers.formatUnits(options.gasPrice, 'gwei') + ' Gwei' : undefined
      });

      // 发送交易
      const transaction = await this.signer.sendTransaction(tx);
      console.log('交易已发送:', transaction.hash);

      // 等待确认
      const receipt = await transaction.wait();
      if (!receipt) {
        throw new Error('交易确认失败');
      }

      if (receipt.status === 0) {
        throw new Error('交易执行失败');
      }

      console.log('交易已确认:', {
        hash: transaction.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') + ' Gwei' : 'N/A'
      });

      return { transaction, receipt };
    } catch (error: any) {
      console.error('发送交易失败:', error.message);
      throw error;
    }
  }

  // 带重试机制的转账
  async sendEtherWithRetry(
    to: string,
    amount: string,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    attempts: number;
  }> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试发送交易 (${attempt}/${maxRetries})`);
        
        const result = await this.sendEther(to, amount);
        return { ...result, attempts: attempt };
        
      } catch (error: any) {
        lastError = error;
        console.error(`第 ${attempt} 次尝试失败:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // 如果是 nonce 错误，获取最新 nonce
          if (error.message.includes('nonce')) {
            const nonce = await this.provider.getTransactionCount(
              await this.signer.getAddress(),
              'pending'
            );
            console.log(`更新 nonce 为: ${nonce}`);
          }
        }
      }
    }
    
    throw new Error(`发送交易失败，已重试 ${maxRetries} 次: ${lastError!.message}`);
  }

  // 估算交易费用
  async estimateTransactionCost(
    to: string,
    amount: string,
    gasPrice?: bigint
  ): Promise<{
    estimatedGas: bigint;
    gasPrice: bigint;
    totalCost: bigint;
    totalCostEth: string;
    transferAmount: bigint;
    transferAmountEth: string;
  }> {
    const transferAmount = ethers.parseEther(amount);
    
    // 估算 Gas
    const estimatedGas = await this.provider.estimateGas({
      to,
      value: transferAmount
    });

    // 获取 Gas 价格
    if (!gasPrice) {
      const feeData = await this.provider.getFeeData();
      gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    }

    const totalCost = estimatedGas * gasPrice;

    return {
      estimatedGas,
      gasPrice,
      totalCost,
      totalCostEth: ethers.formatEther(totalCost),
      transferAmount,
      transferAmountEth: amount
    };
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);
const sender = new TransactionSender(wallet);

// 简单转账
const result = await sender.sendEther(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1'
);

// 带重试的转账
const retryResult = await sender.sendEtherWithRetry(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1',
  3,
  5000
);

// 估算费用
const estimate = await sender.estimateTransactionCost(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1'
);
console.log('预估费用:', estimate.totalCostEth + ' ETH');
```

### 2. 高级交易配置

```typescript
class AdvancedTransactionSender extends TransactionSender {
  // EIP-1559 交易
  async sendEIP1559Transaction(
    to: string,
    amount: string,
    options?: {
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
      gasLimit?: bigint;
    }
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    // 获取当前网络费用数据
    const feeData = await this.provider.getFeeData();
    
    const tx: ethers.TransactionRequest = {
      to,
      value: ethers.parseEther(amount),
      type: 2, // EIP-1559
      maxFeePerGas: options?.maxFeePerGas || feeData.maxFeePerGas || ethers.parseUnits('30', 'gwei'),
      maxPriorityFeePerGas: options?.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei'),
      gasLimit: options?.gasLimit || 21000n
    };

    console.log('发送 EIP-1559 交易:', {
      to,
      amount: amount + ' ETH',
      maxFeePerGas: ethers.formatUnits(tx.maxFeePerGas!, 'gwei') + ' Gwei',
      maxPriorityFeePerGas: ethers.formatUnits(tx.maxPriorityFeePerGas!, 'gwei') + ' Gwei'
    });

    const transaction = await this.signer.sendTransaction(tx);
    const receipt = await transaction.wait();

    if (!receipt || receipt.status === 0) {
      throw new Error('EIP-1559 交易失败');
    }

    return { transaction, receipt };
  }

  // Legacy 交易
  async sendLegacyTransaction(
    to: string,
    amount: string,
    gasPrice?: bigint
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    if (!gasPrice) {
      const feeData = await this.provider.getFeeData();
      gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    }

    const tx: ethers.TransactionRequest = {
      to,
      value: ethers.parseEther(amount),
      type: 0, // Legacy
      gasPrice,
      gasLimit: 21000n
    };

    console.log('发送 Legacy 交易:', {
      to,
      amount: amount + ' ETH',
      gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' Gwei'
    });

    const transaction = await this.signer.sendTransaction(tx);
    const receipt = await transaction.wait();

    if (!receipt || receipt.status === 0) {
      throw new Error('Legacy 交易失败');
    }

    return { transaction, receipt };
  }

  // 自动选择最优交易类型
  async sendOptimalTransaction(
    to: string,
    amount: string,
    preference: 'speed' | 'cost' | 'auto' = 'auto'
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    type: 'eip1559' | 'legacy';
    estimatedSavings?: string;
  }> {
    const feeData = await this.provider.getFeeData();
    
    // 检查网络是否支持 EIP-1559
    const supportsEIP1559 = feeData.maxFeePerGas !== null && feeData.maxPriorityFeePerGas !== null;
    
    if (!supportsEIP1559) {
      const result = await this.sendLegacyTransaction(to, amount);
      return { ...result, type: 'legacy' };
    }

    // 比较两种交易类型的成本
    const legacyCost = (feeData.gasPrice || 0n) * 21000n;
    const eip1559Cost = (feeData.maxFeePerGas || 0n) * 21000n;
    
    let useEIP1559: boolean;
    
    switch (preference) {
      case 'speed':
        useEIP1559 = true; // EIP-1559 通常更快
        break;
      case 'cost':
        useEIP1559 = eip1559Cost <= legacyCost;
        break;
      case 'auto':
        // 如果 EIP-1559 成本相近或更低，优先使用
        useEIP1559 = eip1559Cost <= legacyCost * 110n / 100n; // 允许 10% 的溢价
        break;
    }

    const estimatedSavings = useEIP1559 
      ? ethers.formatEther(legacyCost - eip1559Cost)
      : ethers.formatEther(eip1559Cost - legacyCost);

    if (useEIP1559) {
      const result = await this.sendEIP1559Transaction(to, amount);
      return { ...result, type: 'eip1559', estimatedSavings };
    } else {
      const result = await this.sendLegacyTransaction(to, amount);
      return { ...result, type: 'legacy', estimatedSavings };
    }
  }

  // 带数据的交易
  async sendTransactionWithData(
    to: string,
    amount: string,
    data: string,
    options?: {
      gasLimit?: bigint;
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    // 估算 Gas（包含数据）
    const estimatedGas = await this.provider.estimateGas({
      to,
      value: ethers.parseEther(amount),
      data
    });

    // 添加 20% 缓冲
    const gasLimit = options?.gasLimit || (estimatedGas * 120n / 100n);

    const tx: ethers.TransactionRequest = {
      to,
      value: ethers.parseEther(amount),
      data,
      gasLimit,
      ...options
    };

    console.log('发送带数据的交易:', {
      to,
      amount: amount + ' ETH',
      dataLength: data.length,
      estimatedGas: estimatedGas.toString(),
      gasLimit: gasLimit.toString()
    });

    const transaction = await this.signer.sendTransaction(tx);
    const receipt = await transaction.wait();

    if (!receipt || receipt.status === 0) {
      throw new Error('带数据的交易失败');
    }

    return { transaction, receipt };
  }
}

// 使用示例
const advancedSender = new AdvancedTransactionSender(wallet);

// EIP-1559 交易
const eip1559Result = await advancedSender.sendEIP1559Transaction(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1'
);

// 自动选择最优交易
const optimalResult = await advancedSender.sendOptimalTransaction(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1',
  'auto'
);

console.log('使用的交易类型:', optimalResult.type);
console.log('预估节省:', optimalResult.estimatedSavings + ' ETH');
```

## 合约交互交易

### 1. 合约函数调用

```typescript
class ContractTransactionSender {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, abi: any[], signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, abi, signer);
    this.signer = signer;
  }

  // 调用合约写入函数
  async callContractFunction(
    functionName: string,
    args: any[],
    options?: {
      value?: bigint;
      gasLimit?: bigint;
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    events: ethers.Log[];
  }> {
    try {
      // 检查函数是否存在
      if (typeof this.contract[functionName] !== 'function') {
        throw new Error(`函数 ${functionName} 不存在`);
      }

      // 估算 Gas
      const estimatedGas = await this.contract[functionName].estimateGas(...args, {
        value: options?.value || 0
      });

      // 添加 20% 缓冲
      const gasLimit = options?.gasLimit || (estimatedGas * 120n / 100n);

      // 构建交易选项
      const txOptions: any = {
        gasLimit,
        value: options?.value || 0
      };

      if (options?.gasPrice) {
        txOptions.gasPrice = options.gasPrice;
      } else if (options?.maxFeePerGas && options?.maxPriorityFeePerGas) {
        txOptions.maxFeePerGas = options.maxFeePerGas;
        txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
        txOptions.type = 2;
      }

      console.log(`调用合约函数 ${functionName}:`, {
        args,
        estimatedGas: estimatedGas.toString(),
        gasLimit: gasLimit.toString(),
        value: options?.value ? ethers.formatEther(options.value) + ' ETH' : '0 ETH'
      });

      // 发送交易
      const transaction = await this.contract[functionName](...args, txOptions);
      console.log('合约交易已发送:', transaction.hash);

      // 等待确认
      const receipt = await transaction.wait();
      if (!receipt || receipt.status === 0) {
        throw new Error(`合约函数 ${functionName} 调用失败`);
      }

      console.log('合约交易已确认:', {
        hash: transaction.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.logs.length
      });

      return {
        transaction,
        receipt,
        events: receipt.logs
      };
    } catch (error: any) {
      console.error(`合约函数 ${functionName} 调用失败:`, error.message);
      throw error;
    }
  }

  // ERC-20 代币转账
  async transferToken(
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    transferEvent?: ethers.Log;
  }> {
    const transferAmount = ethers.parseUnits(amount, decimals);
    
    // 检查余额
    const senderAddress = await this.signer.getAddress();
    const balance = await this.contract.balanceOf(senderAddress);
    
    if (balance < transferAmount) {
      throw new Error(`代币余额不足: ${ethers.formatUnits(balance, decimals)}`);
    }

    const result = await this.callContractFunction('transfer', [to, transferAmount]);
    
    // 查找 Transfer 事件
    const transferEvent = result.events.find(log => {
      try {
        const parsed = this.contract.interface.parseLog(log);
        return parsed?.name === 'Transfer';
      } catch {
        return false;
      }
    });

    console.log('代币转账成功:', {
      to,
      amount,
      txHash: result.transaction.hash,
      hasTransferEvent: !!transferEvent
    });

    return {
      ...result,
      transferEvent
    };
  }

  // 批量代币转账
  async batchTransferToken(
    transfers: Array<{ to: string; amount: string }>,
    decimals: number = 18
  ): Promise<Array<{
    to: string;
    amount: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }>> {
    const results: Array<{
      to: string;
      amount: string;
      success: boolean;
      transaction?: ethers.TransactionResponse;
      receipt?: ethers.TransactionReceipt;
      error?: string;
    }> = [];

    for (const transfer of transfers) {
      try {
        const result = await this.transferToken(transfer.to, transfer.amount, decimals);
        
        results.push({
          to: transfer.to,
          amount: transfer.amount,
          success: true,
          transaction: result.transaction,
          receipt: result.receipt
        });

        // 添加延迟避免 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        results.push({
          to: transfer.to,
          amount: transfer.amount,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`批量转账完成: ${successCount}/${transfers.length} 成功`);

    return results;
  }

  // 代币授权
  async approveToken(
    spender: string,
    amount: string,
    decimals: number = 18
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    approvalEvent?: ethers.Log;
  }> {
    const approveAmount = amount === 'max' 
      ? ethers.MaxUint256 
      : ethers.parseUnits(amount, decimals);

    const result = await this.callContractFunction('approve', [spender, approveAmount]);
    
    // 查找 Approval 事件
    const approvalEvent = result.events.find(log => {
      try {
        const parsed = this.contract.interface.parseLog(log);
        return parsed?.name === 'Approval';
      } catch {
        return false;
      }
    });

    console.log('代币授权成功:', {
      spender,
      amount: amount === 'max' ? 'unlimited' : amount,
      txHash: result.transaction.hash,
      hasApprovalEvent: !!approvalEvent
    });

    return {
      ...result,
      approvalEvent
    };
  }

  // 智能授权（仅在需要时授权）
  async smartApprove(
    spender: string,
    requiredAmount: string,
    decimals: number = 18
  ): Promise<{
    needsApproval: boolean;
    currentAllowance: string;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
  }> {
    const owner = await this.signer.getAddress();
    const required = ethers.parseUnits(requiredAmount, decimals);
    
    // 检查当前授权额度
    const currentAllowance = await this.contract.allowance(owner, spender);
    const currentAllowanceFormatted = ethers.formatUnits(currentAllowance, decimals);
    
    if (currentAllowance >= required) {
      console.log(`无需授权: 当前额度 ${currentAllowanceFormatted} >= 需要 ${requiredAmount}`);
      return {
        needsApproval: false,
        currentAllowance: currentAllowanceFormatted
      };
    }

    console.log(`需要授权: 当前 ${currentAllowanceFormatted}, 需要 ${requiredAmount}`);
    
    const result = await this.approveToken(spender, 'max', decimals);
    
    return {
      needsApproval: true,
      currentAllowance: currentAllowanceFormatted,
      transaction: result.transaction,
      receipt: result.receipt
    };
  }

  // 多步骤交易（授权 + 操作）
  async executeWithApproval(
    spender: string,
    requiredAmount: string,
    operation: () => Promise<any>,
    decimals: number = 18
  ): Promise<{
    approvalResult?: {
      transaction: ethers.TransactionResponse;
      receipt: ethers.TransactionReceipt;
    };
    operationResult: any;
    totalGasUsed: bigint;
  }> {
    let totalGasUsed = 0n;
    let approvalResult: any;

    // 检查并执行授权
    const approvalCheck = await this.smartApprove(spender, requiredAmount, decimals);
    
    if (approvalCheck.needsApproval && approvalCheck.transaction && approvalCheck.receipt) {
      approvalResult = {
        transaction: approvalCheck.transaction,
        receipt: approvalCheck.receipt
      };
      totalGasUsed += approvalCheck.receipt.gasUsed;
      
      console.log('授权完成，等待 1 秒后执行操作...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 执行主要操作
    const operationResult = await operation();
    
    if (operationResult.receipt) {
      totalGasUsed += operationResult.receipt.gasUsed;
    }

    console.log('多步骤交易完成:', {
      needsApproval: approvalCheck.needsApproval,
      totalGasUsed: totalGasUsed.toString()
    });

    return {
      approvalResult,
      operationResult,
      totalGasUsed
    };
  }
}

// 使用示例
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const tokenSender = new ContractTransactionSender(
  '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8', // USDC
  ERC20_ABI,
  wallet
);

// 代币转账
const tokenTransfer = await tokenSender.transferToken(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '100'
);

// 批量代币转账
const batchTransfers = await tokenSender.batchTransferToken([
  { to: '0x...', amount: '100' },
  { to: '0x...', amount: '200' },
  { to: '0x...', amount: '300' }
]);

// 智能授权
const approvalResult = await tokenSender.smartApprove(
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router
  '1000'
);

// 多步骤交易示例
const multiStepResult = await tokenSender.executeWithApproval(
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  '1000',
  async () => {
    // 这里执行需要授权的操作，比如 Uniswap 交换
    return await tokenSender.callContractFunction('someFunction', []);
  }
);
```

## 批量交易处理

### 1. 并发交易管理

```typescript
class BatchTransactionSender {
  private signer: ethers.Signer;
  private provider: ethers.Provider;
  private maxConcurrent: number;
  private nonceManager: Map<string, number> = new Map();

  constructor(signer: ethers.Signer, maxConcurrent: number = 5) {
    this.signer = signer;
    this.provider = signer.provider!;
    this.maxConcurrent = maxConcurrent;
  }

  // 获取下一个可用的 nonce
  private async getNextNonce(address: string): Promise<number> {
    if (!this.nonceManager.has(address)) {
      const currentNonce = await this.provider.getTransactionCount(address, 'pending');
      this.nonceManager.set(address, currentNonce);
    }
    
    const nonce = this.nonceManager.get(address)!;
    this.nonceManager.set(address, nonce + 1);
    return nonce;
  }

  // 重置 nonce 管理器
  async resetNonceManager(): Promise<void> {
    const address = await this.signer.getAddress();
    const currentNonce = await this.provider.getTransactionCount(address, 'pending');
    this.nonceManager.set(address, currentNonce);
  }

  // 并发发送多个交易
  async sendBatchTransactions(
    transactions: Array<{
      to: string;
      value?: string;
      data?: string;
      gasLimit?: bigint;
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }>,
    options?: {
      waitForAll?: boolean;
      failFast?: boolean;
      retryFailed?: boolean;
      maxRetries?: number;
    }
  ): Promise<Array<{
    index: number;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
    nonce?: number;
  }>> {
    const config = {
      waitForAll: true,
      failFast: false,
      retryFailed: true,
      maxRetries: 3,
      ...options
    };

    const address = await this.signer.getAddress();
    await this.resetNonceManager();

    const results: Array<{
      index: number;
      success: boolean;
      transaction?: ethers.TransactionResponse;
      receipt?: ethers.TransactionReceipt;
      error?: string;
      nonce?: number;
    }> = [];

    // 分批处理交易
    for (let i = 0; i < transactions.length; i += this.maxConcurrent) {
      const batch = transactions.slice(i, i + this.maxConcurrent);
      const batchPromises = batch.map(async (tx, batchIndex) => {
        const globalIndex = i + batchIndex;
        let attempts = 0;
        
        while (attempts <= config.maxRetries) {
          try {
            const nonce = await this.getNextNonce(address);
            
            const txRequest: ethers.TransactionRequest = {
              to: tx.to,
              value: tx.value ? ethers.parseEther(tx.value) : 0,
              data: tx.data || '0x',
              nonce,
              gasLimit: tx.gasLimit || 21000n
            };

            if (tx.gasPrice) {
              txRequest.gasPrice = tx.gasPrice;
            } else if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
              txRequest.maxFeePerGas = tx.maxFeePerGas;
              txRequest.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
              txRequest.type = 2;
            }

            console.log(`发送批量交易 ${globalIndex + 1}/${transactions.length}, nonce: ${nonce}`);
            
            const transaction = await this.signer.sendTransaction(txRequest);
            
            let receipt: ethers.TransactionReceipt | undefined;
            if (config.waitForAll) {
              receipt = await transaction.wait();
              if (!receipt || receipt.status === 0) {
                throw new Error('交易执行失败');
              }
            }

            return {
              index: globalIndex,
              success: true,
              transaction,
              receipt,
              nonce
            };
            
          } catch (error: any) {
            attempts++;
            console.error(`批量交易 ${globalIndex + 1} 第 ${attempts} 次尝试失败:`, error.message);
            
            if (attempts > config.maxRetries || !config.retryFailed) {
              return {
                index: globalIndex,
                success: false,
                error: error.message
              };
            }
            
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
        
        return {
          index: globalIndex,
          success: false,
          error: '超过最大重试次数'
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 如果启用 failFast 且有失败的交易，停止处理
      if (config.failFast && batchResults.some(r => !r.success)) {
        console.log('检测到失败交易，停止批量处理');
        break;
      }

      // 批次间延迟
      if (i + this.maxConcurrent < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`批量交易完成: ${successCount}/${results.length} 成功`);

    return results;
  }

  // 批量 ETH 转账
  async batchEtherTransfer(
    transfers: Array<{ to: string; amount: string }>,
    options?: {
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): Promise<Array<{
    index: number;
    to: string;
    amount: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    error?: string;
  }>> {
    const transactions = transfers.map(transfer => ({
      to: transfer.to,
      value: transfer.amount,
      gasLimit: 21000n,
      ...options
    }));

    const results = await this.sendBatchTransactions(transactions);
    
    return results.map(result => ({
      ...result,
      to: transfers[result.index].to,
      amount: transfers[result.index].amount
    }));
  }

  // 批量合约调用
  async batchContractCalls(
    contractAddress: string,
    abi: any[],
    calls: Array<{
      functionName: string;
      args: any[];
      value?: string;
      gasLimit?: bigint;
    }>,
    options?: {
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): Promise<Array<{
    index: number;
    functionName: string;
    success: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
    events?: ethers.Log[];
    error?: string;
  }>> {
    const contract = new ethers.Contract(contractAddress, abi, this.signer);
    
    const transactions = await Promise.all(
      calls.map(async call => {
        // 估算 Gas
        const estimatedGas = await contract[call.functionName].estimateGas(
          ...call.args,
          { value: call.value ? ethers.parseEther(call.value) : 0 }
        );

        // 编码函数调用
        const data = contract.interface.encodeFunctionData(call.functionName, call.args);

        return {
          to: contractAddress,
          value: call.value,
          data,
          gasLimit: call.gasLimit || (estimatedGas * 120n / 100n),
          ...options
        };
      })
    );

    const results = await this.sendBatchTransactions(transactions);
    
    return results.map(result => ({
      ...result,
      functionName: calls[result.index].functionName,
      events: result.receipt?.logs || []
    }));
  }

  // 智能批量处理（根据网络状况调整）
  async smartBatchProcess<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<any>,
    options?: {
      initialBatchSize?: number;
      maxBatchSize?: number;
      minBatchSize?: number;
      adaptiveScaling?: boolean;
      successThreshold?: number;
    }
  ): Promise<Array<{
    index: number;
    item: T;
    success: boolean;
    result?: any;
    error?: string;
    processingTime?: number;
  }>> {
    const config = {
      initialBatchSize: 3,
      maxBatchSize: 10,
      minBatchSize: 1,
      adaptiveScaling: true,
      successThreshold: 0.8,
      ...options
    };

    let currentBatchSize = config.initialBatchSize;
    const results: Array<{
      index: number;
      item: T;
      success: boolean;
      result?: any;
      error?: string;
      processingTime?: number;
    }> = [];

    for (let i = 0; i < items.length; i += currentBatchSize) {
      const batch = items.slice(i, i + currentBatchSize);
      const batchStartTime = Date.now();
      
      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        const itemStartTime = Date.now();
        
        try {
          const result = await processor(item, globalIndex);
          const processingTime = Date.now() - itemStartTime;
          
          return {
            index: globalIndex,
            item,
            success: true,
            result,
            processingTime
          };
        } catch (error: any) {
          const processingTime = Date.now() - itemStartTime;
          
          return {
            index: globalIndex,
            item,
            success: false,
            error: error.message,
            processingTime
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 自适应调整批次大小
      if (config.adaptiveScaling) {
        const batchSuccessRate = batchResults.filter(r => r.success).length / batchResults.length;
        const batchProcessingTime = Date.now() - batchStartTime;
        
        if (batchSuccessRate >= config.successThreshold && batchProcessingTime < 10000) {
          // 成功率高且处理时间短，增加批次大小
          currentBatchSize = Math.min(currentBatchSize + 1, config.maxBatchSize);
        } else if (batchSuccessRate < config.successThreshold || batchProcessingTime > 30000) {
          // 成功率低或处理时间长，减少批次大小
          currentBatchSize = Math.max(currentBatchSize - 1, config.minBatchSize);
        }
        
        console.log(`批次 ${Math.floor(i / config.initialBatchSize) + 1} 完成: 成功率 ${(batchSuccessRate * 100).toFixed(1)}%, 下一批次大小: ${currentBatchSize}`);
      }

      // 批次间延迟
      if (i + currentBatchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const totalSuccessRate = results.filter(r => r.success).length / results.length;
    console.log(`智能批量处理完成: ${results.filter(r => r.success).length}/${results.length} 成功 (${(totalSuccessRate * 100).toFixed(1)}%)`);

    return results;
  }
}

// 使用示例
const batchSender = new BatchTransactionSender(wallet, 5);

// 批量 ETH 转账
const batchEthTransfers = await batchSender.batchEtherTransfer([
  { to: '0x...', amount: '0.1' },
  { to: '0x...', amount: '0.2' },
  { to: '0x...', amount: '0.3' }
]);

// 批量合约调用
const batchContractCalls = await batchSender.batchContractCalls(
  '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8',
  ERC20_ABI,
  [
    { functionName: 'transfer', args: ['0x...', ethers.parseUnits('100', 18)] },
    { functionName: 'transfer', args: ['0x...', ethers.parseUnits('200', 18)] },
    { functionName: 'approve', args: ['0x...', ethers.MaxUint256] }
  ]
);

// 智能批量处理
const smartBatchResults = await batchSender.smartBatchProcess(
  [
    { to: '0x...', amount: '0.1' },
    { to: '0x...', amount: '0.2' },
    // ... 更多交易
  ],
  async (transfer, index) => {
    return await batchSender.batchEtherTransfer([transfer]);
  },
  {
    initialBatchSize: 2,
    maxBatchSize: 8,
    adaptiveScaling: true
  }
);
```

## 交易监控和管理

### 1. 实时交易跟踪

```typescript
class TransactionTracker {
  private provider: ethers.Provider;
  private trackedTransactions: Map<string, {
    hash: string;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed' | 'timeout';
    confirmations: number;
    retryCount: number;
    callbacks: Array<(status: string, receipt?: ethers.TransactionReceipt) => void>;
  }> = new Map();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.startTracking();
  }

  // 添加交易跟踪
  addTransaction(
    hash: string,
    callback?: (status: string, receipt?: ethers.TransactionReceipt) => void,
    timeout: number = 300000 // 5分钟
  ): void {
    const transaction = {
      hash,
      timestamp: Date.now(),
      status: 'pending' as const,
      confirmations: 0,
      retryCount: 0,
      callbacks: callback ? [callback] : []
    };

    this.trackedTransactions.set(hash, transaction);
    
    console.log(`开始跟踪交易: ${hash}`);

    // 设置超时
    setTimeout(() => {
      const tx = this.trackedTransactions.get(hash);
      if (tx && tx.status === 'pending') {
        tx.status = 'timeout';
        this.notifyCallbacks(hash, 'timeout');
        console.log(`交易超时: ${hash}`);
      }
    }, timeout);
  }

  // 开始跟踪循环
  private startTracking(): void {
    setInterval(async () => {
      await this.checkPendingTransactions();
    }, 5000); // 每5秒检查一次
  }

  // 检查待确认交易
  private async checkPendingTransactions(): Promise<void> {
    const pendingHashes = Array.from(this.trackedTransactions.keys()).filter(
      hash => this.trackedTransactions.get(hash)?.status === 'pending'
    );

    for (const hash of pendingHashes) {
      try {
        const receipt = await this.provider.getTransactionReceipt(hash);
        
        if (receipt) {
          const tx = this.trackedTransactions.get(hash)!;
          tx.confirmations = receipt.confirmations;
          
          if (receipt.status === 0) {
            tx.status = 'failed';
            this.notifyCallbacks(hash, 'failed', receipt);
            console.log(`交易失败: ${hash}`);
          } else if (receipt.confirmations >= 1) {
            tx.status = 'confirmed';
            this.notifyCallbacks(hash, 'confirmed', receipt);
            console.log(`交易确认: ${hash}, 确认数: ${receipt.confirmations}`);
          }
        }
      } catch (error) {
        console.error(`检查交易状态失败: ${hash}`, error);
      }
    }
  }

  // 通知回调函数
  private notifyCallbacks(
    hash: string,
    status: string,
    receipt?: ethers.TransactionReceipt
  ): void {
    const tx = this.trackedTransactions.get(hash);
    if (tx) {
      tx.callbacks.forEach(callback => {
        try {
          callback(status, receipt);
        } catch (error) {
          console.error('回调函数执行失败:', error);
        }
      });
    }
  }

  // 获取交易状态
  getTransactionStatus(hash: string): {
    status: string;
    confirmations: number;
    timestamp: number;
    duration: number;
  } | null {
    const tx = this.trackedTransactions.get(hash);
    if (!tx) return null;

    return {
      status: tx.status,
      confirmations: tx.confirmations,
      timestamp: tx.timestamp,
      duration: Date.now() - tx.timestamp
    };
  }

  // 获取所有跟踪的交易
  getAllTransactions(): Array<{
    hash: string;
    status: string;
    confirmations: number;
    timestamp: number;
    duration: number;
  }> {
    return Array.from(this.trackedTransactions.entries()).map(([hash, tx]) => ({
      hash,
      status: tx.status,
      confirmations: tx.confirmations,
      timestamp: tx.timestamp,
      duration: Date.now() - tx.timestamp
    }));
  }

  // 等待交易确认
  async waitForConfirmation(
    hash: string,
    requiredConfirmations: number = 1,
    timeout: number = 300000
  ): Promise<ethers.TransactionReceipt> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`等待交易确认超时: ${hash}`));
      }, timeout);

      this.addTransaction(hash, (status, receipt) => {
        if (status === 'confirmed' && receipt && receipt.confirmations >= requiredConfirmations) {
          clearTimeout(timeoutId);
          resolve(receipt);
        } else if (status === 'failed') {
          clearTimeout(timeoutId);
          reject(new Error(`交易失败: ${hash}`));
        } else if (status === 'timeout') {
          clearTimeout(timeoutId);
          reject(new Error(`交易确认超时: ${hash}`));
        }
      });
    });
  }

  // 清理已完成的交易
  cleanup(maxAge: number = 3600000): void { // 1小时
    const now = Date.now();
    
    for (const [hash, tx] of this.trackedTransactions.entries()) {
      if (tx.status !== 'pending' && (now - tx.timestamp) > maxAge) {
        this.trackedTransactions.delete(hash);
      }
    }
  }
}

// 使用示例
const tracker = new TransactionTracker(provider);

// 发送交易并跟踪
const tx = await wallet.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('0.1')
});

tracker.addTransaction(tx.hash, (status, receipt) => {
  console.log(`交易 ${tx.hash} 状态更新: ${status}`);
  if (receipt) {
    console.log(`Gas 使用: ${receipt.gasUsed}`);
  }
});

// 等待确认
try {
  const receipt = await tracker.waitForConfirmation(tx.hash, 3, 300000);
  console.log('交易已确认:', receipt.hash);
} catch (error) {
  console.error('等待确认失败:', error);
}

// 查看所有交易状态
setTimeout(() => {
  const allTransactions = tracker.getAllTransactions();
  console.log('所有跟踪的交易:', allTransactions);
}, 30000);
```

## 错误处理和重试

### 1. 智能错误处理

```typescript
class SmartTransactionSender {
  private signer: ethers.Signer;
  private provider: ethers.Provider;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider!;
  }

  // 智能发送交易（带错误处理和重试）
  async smartSendTransaction(
    tx: ethers.TransactionRequest,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      gasMultiplier?: number;
      autoAdjustGas?: boolean;
      timeoutMs?: number;
    }
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    attempts: number;
    totalGasUsed: bigint;
    finalGasPrice: bigint;
  }> {
    const config = {
      maxRetries: 3,
      retryDelay: 5000,
      gasMultiplier: 1.2,
      autoAdjustGas: true,
      timeoutMs: 300000,
      ...options
    };

    let lastError: Error;
    let currentGasPrice = tx.gasPrice;
    let currentMaxFeePerGas = tx.maxFeePerGas;
    let currentMaxPriorityFeePerGas = tx.maxPriorityFeePerGas;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        console.log(`尝试发送交易 (${attempt}/${config.maxRetries + 1})`);

        // 准备交易
        const preparedTx = await this.prepareTransaction(tx, {
          gasPrice: currentGasPrice,
          maxFeePerGas: currentMaxFeePerGas,
          maxPriorityFeePerGas: currentMaxPriorityFeePerGas,
          autoAdjustGas: config.autoAdjustGas && attempt > 1
        });

        // 发送交易
        const transaction = await this.signer.sendTransaction(preparedTx);
        console.log(`交易已发送 (尝试 ${attempt}):`, transaction.hash);

        // 等待确认
        const receipt = await this.waitForTransactionWithTimeout(
          transaction.hash,
          config.timeoutMs
        );

        if (!receipt || receipt.status === 0) {
          throw new Error('交易执行失败');
        }

        console.log(`交易成功 (尝试 ${attempt}):`, {
          hash: transaction.hash,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') + ' Gwei' : 'N/A'
        });

        return {
          transaction,
          receipt,
          attempts: attempt,
          totalGasUsed: receipt.gasUsed,
          finalGasPrice: receipt.gasPrice || currentGasPrice || 0n
        };

      } catch (error: any) {
        lastError = error;
        console.error(`第 ${attempt} 次尝试失败:`, error.message);

        if (attempt <= config.maxRetries) {
          // 分析错误并调整参数
          const adjustment = this.analyzeErrorAndAdjust(error, {
            gasPrice: currentGasPrice,
            maxFeePerGas: currentMaxFeePerGas,
            maxPriorityFeePerGas: currentMaxPriorityFeePerGas
          });

          currentGasPrice = adjustment.gasPrice;
          currentMaxFeePerGas = adjustment.maxFeePerGas;
          currentMaxPriorityFeePerGas = adjustment.maxPriorityFeePerGas;

          console.log(`等待 ${config.retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
      }
    }

    throw new Error(`发送交易失败，已重试 ${config.maxRetries} 次: ${lastError!.message}`);
  }

  // 准备交易
  private async prepareTransaction(
    tx: ethers.TransactionRequest,
    options: {
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
      autoAdjustGas: boolean;
    }
  ): Promise<ethers.TransactionRequest> {
    const preparedTx = { ...tx };

    // 设置 nonce
    if (!preparedTx.nonce) {
      preparedTx.nonce = await this.provider.getTransactionCount(
        await this.signer.getAddress(),
        'pending'
      );
    }

    // 估算 Gas
    if (!preparedTx.gasLimit || options.autoAdjustGas) {
      try {
        const estimatedGas = await this.provider.estimateGas(preparedTx);
        preparedTx.gasLimit = estimatedGas * 120n / 100n; // 添加 20% 缓冲
      } catch (error) {
        console.warn('Gas 估算失败，使用默认值');
        preparedTx.gasLimit = preparedTx.gasLimit || 21000n;
      }
    }

    // 设置 Gas 价格
    if (options.gasPrice) {
      preparedTx.gasPrice = options.gasPrice;
      preparedTx.type = 0; // Legacy
    } else if (options.maxFeePerGas && options.maxPriorityFeePerGas) {
      preparedTx.maxFeePerGas = options.maxFeePerGas;
      preparedTx.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      preparedTx.type = 2; // EIP-1559
    } else {
      // 获取当前网络费用数据
      const feeData = await this.provider.getFeeData();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        preparedTx.maxFeePerGas = feeData.maxFeePerGas;
        preparedTx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        preparedTx.type = 2;
      } else {
        preparedTx.gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        preparedTx.type = 0;
      }
    }

    return preparedTx;
  }

  // 分析错误并调整参数
  private analyzeErrorAndAdjust(
    error: Error,
    currentGas: {
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): {
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  } {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('gas price too low') || 
        errorMessage.includes('replacement transaction underpriced')) {
      // Gas 价格太低，增加 50%
      return {
        gasPrice: currentGas.gasPrice ? currentGas.gasPrice * 150n / 100n : undefined,
        maxFeePerGas: currentGas.maxFeePerGas ? currentGas.maxFeePerGas * 150n / 100n : undefined,
        maxPriorityFeePerGas: currentGas.maxPriorityFeePerGas ? currentGas.maxPriorityFeePerGas * 150n / 100n : undefined
      };
    }

    if (errorMessage.includes('nonce too low')) {
      // Nonce 问题，不调整 Gas
      return currentGas;
    }

    if (errorMessage.includes('insufficient funds')) {
      // 余额不足，不调整 Gas
      throw new Error('余额不足，无法继续重试');
    }

    if (errorMessage.includes('gas limit')) {
      // Gas 限制问题，增加 Gas 限制（这里只调整价格）
      return {
        gasPrice: currentGas.gasPrice ? currentGas.gasPrice * 120n / 100n : undefined,
        maxFeePerGas: currentGas.maxFeePerGas ? currentGas.maxFeePerGas * 120n / 100n : undefined,
        maxPriorityFeePerGas: currentGas.maxPriorityFeePerGas ? currentGas.maxPriorityFeePerGas * 120n / 100n : undefined
      };
    }

    // 默认增加 20% Gas 价格
    return {
      gasPrice: currentGas.gasPrice ? currentGas.gasPrice * 120n / 100n : undefined,
      maxFeePerGas: currentGas.maxFeePerGas ? currentGas.maxFeePerGas * 120n / 100n : undefined,
      maxPriorityFeePerGas: currentGas.maxPriorityFeePerGas ? currentGas.maxPriorityFeePerGas * 120n / 100n : undefined
    };
  }

  // 带超时的交易等待
  private async waitForTransactionWithTimeout(
    hash: string,
    timeoutMs: number
  ): Promise<ethers.TransactionReceipt> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`交易确认超时: ${hash}`));
      }, timeoutMs);

      this.provider.waitForTransaction(hash, 1, timeoutMs)
        .then(receipt => {
          clearTimeout(timeoutId);
          if (receipt) {
            resolve(receipt);
          } else {
            reject(new Error(`交易确认失败: ${hash}`));
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // 智能批量发送
  async smartBatchSend(
    transactions: ethers.TransactionRequest[],
    options?: {
      maxConcurrent?: number;
      retryFailed?: boolean;
      failFast?: boolean;
    }
  ): Promise<Array<{
    index: number;
    success: boolean;
    result?: {
      transaction: ethers.TransactionResponse;
      receipt: ethers.TransactionReceipt;
      attempts: number;
    };
    error?: string;
  }>> {
    const config = {
      maxConcurrent: 3,
      retryFailed: true,
      failFast: false,
      ...options
    };

    const results: Array<{
      index: number;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    // 分批处理
    for (let i = 0; i < transactions.length; i += config.maxConcurrent) {
      const batch = transactions.slice(i, i + config.maxConcurrent);
      
      const batchPromises = batch.map(async (tx, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        try {
          const result = await this.smartSendTransaction(tx);
          return {
            index: globalIndex,
            success: true,
            result
          };
        } catch (error: any) {
          return {
            index: globalIndex,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 检查是否需要快速失败
      if (config.failFast && batchResults.some(r => !r.success)) {
        console.log('检测到失败交易，停止批量处理');
        break;
      }

      // 批次间延迟
      if (i + config.maxConcurrent < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`智能批量发送完成: ${successCount}/${results.length} 成功`);

    return results;
  }
}

// 使用示例
const smartSender = new SmartTransactionSender(wallet);

// 智能发送单个交易
const smartResult = await smartSender.smartSendTransaction({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('0.1')
}, {
  maxRetries: 5,
  autoAdjustGas: true,
  timeoutMs: 600000
});

console.log('智能发送结果:', {
  hash: smartResult.transaction.hash,
  attempts: smartResult.attempts,
  gasUsed: smartResult.totalGasUsed.toString(),
  finalGasPrice: ethers.formatUnits(smartResult.finalGasPrice, 'gwei') + ' Gwei'
});

// 智能批量发送
const batchTxs = [
  { to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', value: ethers.parseEther('0.1') },
  { to: '0x8ba1f109551bD432803012645Hac136c', value: ethers.parseEther('0.2') },
  { to: '0x1234567890123456789012345678901234567890', value: ethers.parseEther('0.3') }
];

const batchResults = await smartSender.smartBatchSend(batchTxs, {
  maxConcurrent: 2,
  retryFailed: true,
  failFast: false
});

console.log('批量发送结果:', batchResults);
```

## 性能优化

### 1. 交易池管理

```typescript
class TransactionPoolManager {
  private pendingTransactions = new Map<string, {
    nonce: number;
    gasPrice: bigint;
    timestamp: number;
    retryCount: number;
  }>();

  constructor(
    private signer: ethers.Signer,
    private provider: ethers.Provider
  ) {}

  // 获取最优 nonce
  async getOptimalNonce(): Promise<number> {
    const address = await this.signer.getAddress();
    
    // 获取链上确认的 nonce
    const confirmedNonce = await this.provider.getTransactionCount(address, 'latest');
    
    // 获取待处理的 nonce
    const pendingNonce = await this.provider.getTransactionCount(address, 'pending');
    
    // 检查本地跟踪的交易
    const localMaxNonce = Math.max(
      ...Array.from(this.pendingTransactions.values()).map(tx => tx.nonce),
      confirmedNonce - 1
    );

    return Math.max(pendingNonce, localMaxNonce + 1);
  }

  // 清理过期交易
  cleanupExpiredTransactions(maxAge: number = 600000): void { // 10分钟
    const now = Date.now();
    
    for (const [hash, tx] of this.pendingTransactions.entries()) {
      if (now - tx.timestamp > maxAge) {
        console.log(`清理过期交易: ${hash}`);
        this.pendingTransactions.delete(hash);
      }
    }
  }

  // 添加交易到池
  addTransaction(hash: string, nonce: number, gasPrice: bigint): void {
    this.pendingTransactions.set(hash, {
      nonce,
      gasPrice,
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  // 移除已确认的交易
  removeTransaction(hash: string): void {
    this.pendingTransactions.delete(hash);
  }
}
```

### 2. Gas 优化策略

```typescript
class GasOptimizer {
  constructor(private provider: ethers.Provider) {}

  // 智能 Gas 价格预测
  async predictOptimalGasPrice(priority: 'slow' | 'standard' | 'fast' = 'standard'): Promise<{
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    type: 0 | 2;
  }> {
    const feeData = await this.provider.getFeeData();
    
    // 检查是否支持 EIP-1559
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      const baseMultipliers = {
        slow: { base: 1.0, priority: 1.0 },
        standard: { base: 1.2, priority: 1.5 },
        fast: { base: 1.5, priority: 2.0 }
      };

      const multiplier = baseMultipliers[priority];
      
      return {
        maxFeePerGas: BigInt(Math.floor(Number(feeData.maxFeePerGas) * multiplier.base)),
        maxPriorityFeePerGas: BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * multiplier.priority)),
        type: 2
      };
    } else {
      // Legacy 交易
      const gasPriceMultipliers = {
        slow: 1.0,
        standard: 1.2,
        fast: 1.5
      };

      const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      return {
        gasPrice: BigInt(Math.floor(Number(baseGasPrice) * gasPriceMultipliers[priority])),
        type: 0
      };
    }
  }

  // 动态调整 Gas 限制
  async optimizeGasLimit(
    tx: ethers.TransactionRequest,
    bufferPercentage: number = 20
  ): Promise<bigint> {
    try {
      const estimatedGas = await this.provider.estimateGas(tx);
      return estimatedGas * BigInt(100 + bufferPercentage) / 100n;
    } catch (error) {
      console.warn('Gas 估算失败，使用默认值:', error);
      return tx.gasLimit || 21000n;
    }
  }
}
```

## 安全最佳实践

### 1. 交易验证

```typescript
class TransactionValidator {
  constructor(private provider: ethers.Provider) {}

  // 验证交易参数
  async validateTransaction(tx: ethers.TransactionRequest): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证地址
    if (tx.to && !ethers.isAddress(tx.to)) {
      errors.push('无效的接收地址');
    }

    // 验证金额
    if (tx.value && tx.value < 0) {
      errors.push('转账金额不能为负数');
    }

    // 验证 Gas 参数
    if (tx.gasLimit && tx.gasLimit < 21000n) {
      warnings.push('Gas 限制可能过低');
    }

    if (tx.gasPrice && tx.gasPrice < ethers.parseUnits('1', 'gwei')) {
      warnings.push('Gas 价格可能过低，交易可能长时间未确认');
    }

    // 验证余额
    if (tx.from) {
      try {
        const balance = await this.provider.getBalance(tx.from);
        const totalCost = (tx.value || 0n) + ((tx.gasLimit || 21000n) * (tx.gasPrice || 0n));
        
        if (balance < totalCost) {
          errors.push('余额不足以支付交易费用');
        }
      } catch (error) {
        warnings.push('无法验证余额');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 检查交易安全性
  async checkTransactionSecurity(tx: ethers.TransactionRequest): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    risks: string[];
    recommendations: string[];
  }> {
    const risks: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 检查大额转账
    if (tx.value && tx.value > ethers.parseEther('10')) {
      risks.push('大额转账');
      recommendations.push('建议分批转账或使用多重签名');
      riskLevel = 'medium';
    }

    // 检查合约交互
    if (tx.data && tx.data !== '0x') {
      const code = await this.provider.getCode(tx.to || '');
      if (code !== '0x') {
        risks.push('合约交互');
        recommendations.push('确认合约地址和函数调用的正确性');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    // 检查异常高的 Gas 价格
    if (tx.gasPrice && tx.gasPrice > ethers.parseUnits('100', 'gwei')) {
      risks.push('异常高的 Gas 价格');
      recommendations.push('检查当前网络状况，考虑降低 Gas 价格');
      riskLevel = 'high';
    }

    return { riskLevel, risks, recommendations };
  }
}
```

### 2. 交易签名安全

```typescript
class SecureTransactionSigner {
  constructor(private signer: ethers.Signer) {}

  // 安全签名交易
  async secureSignTransaction(
    tx: ethers.TransactionRequest,
    confirmationCallback?: (tx: ethers.TransactionRequest) => Promise<boolean>
  ): Promise<string> {
    // 验证交易
    const validator = new TransactionValidator(this.signer.provider!);
    const validation = await validator.validateTransaction(tx);
    
    if (!validation.valid) {
      throw new Error(`交易验证失败: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('交易警告:', validation.warnings);
    }

    // 安全检查
    const security = await validator.checkTransactionSecurity(tx);
    console.log(`交易风险级别: ${security.riskLevel}`);
    
    if (security.risks.length > 0) {
      console.log('发现风险:', security.risks);
      console.log('建议:', security.recommendations);
    }

    // 用户确认
    if (confirmationCallback) {
      const confirmed = await confirmationCallback(tx);
      if (!confirmed) {
        throw new Error('用户取消了交易');
      }
    }

    // 签名交易
    return await this.signer.signTransaction(tx);
  }

  // 批量安全签名
  async secureSignBatch(
    transactions: ethers.TransactionRequest[],
    batchConfirmationCallback?: (txs: ethers.TransactionRequest[]) => Promise<boolean>
  ): Promise<string[]> {
    // 批量验证
    const validator = new TransactionValidator(this.signer.provider!);
    const validations = await Promise.all(
      transactions.map(tx => validator.validateTransaction(tx))
    );

    const invalidTxs = validations
      .map((v, i) => ({ validation: v, index: i }))
      .filter(({ validation }) => !validation.valid);

    if (invalidTxs.length > 0) {
      throw new Error(`批量交易中有 ${invalidTxs.length} 个无效交易`);
    }

    // 批量确认
    if (batchConfirmationCallback) {
      const confirmed = await batchConfirmationCallback(transactions);
      if (!confirmed) {
        throw new Error('用户取消了批量交易');
      }
    }

    // 批量签名
    return await Promise.all(
      transactions.map(tx => this.signer.signTransaction(tx))
    );
  }
}
```

## 总结

本文档详细介绍了使用 Ethers.js 发送交易的各种方法和最佳实践：

1. **基础功能**: 简单的 ETH 转账和基本交易发送
2. **高级特性**: EIP-1559 支持、智能 Gas 管理、交易替换
3. **批量处理**: 并发交易管理、智能批量发送
4. **监控管理**: 实时交易跟踪、状态监控
5. **错误处理**: 智能重试机制、错误分析
6. **性能优化**: 交易池管理、Gas 优化
7. **安全实践**: 交易验证、安全签名

通过这些工具和技术，您可以构建健壮、高效且安全的区块链应用程序。记住始终在主网部署前在测试网络上充分测试您的交易逻辑。

## 相关资源

- [交易基础概念](/ethers/transactions/basics)
- [Gas 优化指南](/ethers/gas/optimization)
- [错误处理最佳实践](/ethers/error-handling)
- [安全开发指南](/ethers/security/best-practices)
