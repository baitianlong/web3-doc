---
title: 交易基础
description: Ethers.js 中交易处理的基础概念和核心方法
keywords: [ethers, 交易, transaction, 以太坊, Web3, 区块链]
---

# 交易基础

交易是区块链上状态变更的基本单位。在 Ethers.js 中，交易处理涉及创建、签名、发送和监控交易的完整流程。

## 交易基础概念

### 1. 交易的组成

```typescript
interface TransactionRequest {
  to?: string;              // 接收地址
  value?: bigint;           // 转账金额（wei）
  data?: string;            // 交易数据
  gasLimit?: bigint;        // Gas 限制
  gasPrice?: bigint;        // Gas 价格（Legacy）
  maxFeePerGas?: bigint;    // 最大费用（EIP-1559）
  maxPriorityFeePerGas?: bigint; // 最大优先费用（EIP-1559）
  nonce?: number;           // 交易序号
  type?: number;            // 交易类型
  chainId?: number;         // 链 ID
}

interface TransactionResponse {
  hash: string;             // 交易哈希
  to?: string;              // 接收地址
  from: string;             // 发送地址
  value: bigint;            // 转账金额
  gasLimit: bigint;         // Gas 限制
  gasPrice?: bigint;        // Gas 价格
  maxFeePerGas?: bigint;    // 最大费用
  maxPriorityFeePerGas?: bigint; // 最大优先费用
  nonce: number;            // 交易序号
  data: string;             // 交易数据
  chainId: number;          // 链 ID
  blockNumber?: number;     // 区块号
  blockHash?: string;       // 区块哈希
  index?: number;           // 交易在区块中的索引
  
  // 方法
  wait(confirmations?: number): Promise<TransactionReceipt>;
  replaceableTransaction(gasPrice: bigint): Promise<TransactionResponse>;
}

interface TransactionReceipt {
  hash: string;             // 交易哈希
  to?: string;              // 接收地址
  from: string;             // 发送地址
  contractAddress?: string; // 合约地址（部署交易）
  index: number;            // 交易索引
  gasUsed: bigint;          // 实际使用的 Gas
  logsBloom: string;        // 日志布隆过滤器
  blockHash: string;        // 区块哈希
  blockNumber: number;      // 区块号
  logs: Array<Log>;         // 事件日志
  status?: number;          // 交易状态（1=成功，0=失败）
  confirmations: number;    // 确认数
}
```

### 2. 交易类型

```typescript
// 交易类型枚举
enum TransactionType {
  Legacy = 0,      // 传统交易
  EIP2930 = 1,     // 访问列表交易
  EIP1559 = 2      // 费用市场交易
}

// Legacy 交易（Type 0）
const legacyTx = {
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('20', 'gwei'),
  nonce: 42
};

// EIP-1559 交易（Type 2）
const eip1559Tx = {
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  maxFeePerGas: ethers.parseUnits('30', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
  nonce: 42,
  type: 2
};

// EIP-2930 访问列表交易（Type 1）
const eip2930Tx = {
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('20', 'gwei'),
  accessList: [
    {
      address: '0x...',
      storageKeys: ['0x...']
    }
  ],
  type: 1
};
```

## 基础交易操作

### 1. 简单 ETH 转账

```typescript
import { ethers } from 'ethers';

class BasicTransactionManager {
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
    }
  ): Promise<ethers.TransactionResponse> {
    // 构建交易对象
    const tx: ethers.TransactionRequest = {
      to,
      value: ethers.parseEther(amount)
    };

    // 设置 Gas 参数
    if (options?.gasLimit) {
      tx.gasLimit = options.gasLimit;
    }

    if (options?.gasPrice) {
      tx.gasPrice = options.gasPrice;
    } else if (options?.maxFeePerGas && options?.maxPriorityFeePerGas) {
      tx.maxFeePerGas = options.maxFeePerGas;
      tx.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      tx.type = 2; // EIP-1559
    }

    // 发送交易
    const txResponse = await this.signer.sendTransaction(tx);
    console.log('交易已发送:', txResponse.hash);

    return txResponse;
  }

  // 等待交易确认
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000
  ): Promise<ethers.TransactionReceipt> {
    console.log(`等待交易确认: ${txHash}`);
    
    const receipt = await this.provider.waitForTransaction(
      txHash,
      confirmations,
      timeout
    );

    if (!receipt) {
      throw new Error('交易确认超时');
    }

    if (receipt.status === 0) {
      throw new Error('交易执行失败');
    }

    console.log(`交易已确认: 区块 ${receipt.blockNumber}, Gas 使用: ${receipt.gasUsed}`);
    return receipt;
  }

  // 完整的转账流程
  async transferEther(
    to: string,
    amount: string,
    confirmations: number = 1
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    try {
      // 检查余额
      const balance = await this.provider.getBalance(await this.signer.getAddress());
      const transferAmount = ethers.parseEther(amount);
      
      if (balance < transferAmount) {
        throw new Error(`余额不足: ${ethers.formatEther(balance)} ETH`);
      }

      // 发送交易
      const transaction = await this.sendEther(to, amount);
      
      // 等待确认
      const receipt = await this.waitForTransaction(transaction.hash, confirmations);
      
      return { transaction, receipt };
    } catch (error: any) {
      console.error('转账失败:', error.message);
      throw error;
    }
  }

  // 批量转账
  async batchTransfer(
    transfers: Array<{ to: string; amount: string }>,
    options?: {
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    }
  ): Promise<Array<{
    to: string;
    amount: string;
    transaction: ethers.TransactionResponse;
    success: boolean;
    error?: string;
  }>> {
    const results: Array<{
      to: string;
      amount: string;
      transaction?: ethers.TransactionResponse;
      success: boolean;
      error?: string;
    }> = [];

    for (const transfer of transfers) {
      try {
        const transaction = await this.sendEther(transfer.to, transfer.amount, options);
        
        results.push({
          to: transfer.to,
          amount: transfer.amount,
          transaction,
          success: true
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

    return results;
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);
const txManager = new BasicTransactionManager(wallet);

// 简单转账
const { transaction, receipt } = await txManager.transferEther(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '0.1'
);

console.log('交易哈希:', transaction.hash);
console.log('Gas 使用:', receipt.gasUsed.toString());

// 批量转账
const batchResults = await txManager.batchTransfer([
  { to: '0x...', amount: '0.1' },
  { to: '0x...', amount: '0.2' },
  { to: '0x...', amount: '0.3' }
]);

console.log('批量转账结果:', batchResults);
```

### 2. 合约交互交易

```typescript
class ContractTransactionManager {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contract: ethers.Contract, signer: ethers.Signer) {
    this.contract = contract.connect(signer);
    this.signer = signer;
  }

  // 调用合约函数
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
  ): Promise<ethers.TransactionResponse> {
    try {
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
      }

      // 发送交易
      const tx = await this.contract[functionName](...args, txOptions);
      console.log(`合约函数 ${functionName} 调用已发送:`, tx.hash);

      return tx;
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
  }> {
    const transferAmount = ethers.parseUnits(amount, decimals);
    
    // 检查余额
    const senderAddress = await this.signer.getAddress();
    const balance = await this.contract.balanceOf(senderAddress);
    
    if (balance < transferAmount) {
      throw new Error(`代币余额不足: ${ethers.formatUnits(balance, decimals)}`);
    }

    // 发送转账交易
    const transaction = await this.callContractFunction('transfer', [to, transferAmount]);
    
    // 等待确认
    const receipt = await transaction.wait();
    
    console.log('代币转账成功:', {
      to,
      amount,
      txHash: transaction.hash,
      gasUsed: receipt.gasUsed.toString()
    });

    return { transaction, receipt };
  }

  // 授权代币
  async approveToken(
    spender: string,
    amount: string,
    decimals: number = 18
  ): Promise<{
    transaction: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
  }> {
    const approveAmount = amount === 'max' 
      ? ethers.MaxUint256 
      : ethers.parseUnits(amount, decimals);

    const transaction = await this.callContractFunction('approve', [spender, approveAmount]);
    const receipt = await transaction.wait();

    console.log('代币授权成功:', {
      spender,
      amount: amount === 'max' ? 'unlimited' : amount,
      txHash: transaction.hash
    });

    return { transaction, receipt };
  }

  // 检查授权额度
  async checkAllowance(
    owner: string,
    spender: string,
    decimals: number = 18
  ): Promise<{
    allowance: string;
    formatted: string;
    isApproved: boolean;
  }> {
    const allowance = await this.contract.allowance(owner, spender);
    const formatted = ethers.formatUnits(allowance, decimals);
    
    return {
      allowance: allowance.toString(),
      formatted,
      isApproved: allowance > 0n
    };
  }

  // 智能授权（仅在需要时授权）
  async smartApprove(
    spender: string,
    requiredAmount: string,
    decimals: number = 18
  ): Promise<{
    needsApproval: boolean;
    transaction?: ethers.TransactionResponse;
    receipt?: ethers.TransactionReceipt;
  }> {
    const owner = await this.signer.getAddress();
    const required = ethers.parseUnits(requiredAmount, decimals);
    
    // 检查当前授权额度
    const currentAllowance = await this.contract.allowance(owner, spender);
    
    if (currentAllowance >= required) {
      return { needsApproval: false };
    }

    // 需要授权
    console.log(`需要授权: 当前 ${ethers.formatUnits(currentAllowance, decimals)}, 需要 ${requiredAmount}`);
    
    const { transaction, receipt } = await this.approveToken(spender, 'max', decimals);
    
    return {
      needsApproval: true,
      transaction,
      receipt
    };
  }
}

// 使用示例
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const tokenContract = new ethers.Contract(
  '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8', // USDC
  ERC20_ABI,
  provider
);

const contractTxManager = new ContractTransactionManager(tokenContract, wallet);

// 代币转账
const tokenTransfer = await contractTxManager.transferToken(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '100'
);

// 智能授权
const approvalResult = await contractTxManager.smartApprove(
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router
  '1000'
);
```

## 交易状态监控

### 1. 交易状态跟踪

```typescript
class TransactionMonitor {
  private provider: ethers.Provider;
  private pendingTransactions: Map<string, {
    hash: string;
    timestamp: number;
    confirmations: number;
    status: 'pending' | 'confirmed' | 'failed' | 'timeout';
    callbacks: Array<(status: string, receipt?: ethers.TransactionReceipt) => void>;
  }> = new Map();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.startMonitoring();
  }

  // 添加交易监控
  addTransaction(
    hash: string,
    requiredConfirmations: number = 1,
    timeout: number = 300000, // 5分钟
    callback?: (status: string, receipt?: ethers.TransactionReceipt) => void
  ): void {
    const transaction = {
      hash,
      timestamp: Date.now(),
      confirmations: 0,
      status: 'pending' as const,
      callbacks: callback ? [callback] : []
    };

    this.pendingTransactions.set(hash, transaction);
    
    console.log(`开始监控交易: ${hash}`);

    // 设置超时
    setTimeout(() => {
      const tx = this.pendingTransactions.get(hash);
      if (tx && tx.status === 'pending') {
        tx.status = 'timeout';
        this.notifyCallbacks(hash, 'timeout');
        console.log(`交易超时: ${hash}`);
      }
    }, timeout);
  }

  // 开始监控循环
  private startMonitoring(): void {
    setInterval(async () => {
      await this.checkPendingTransactions();
    }, 5000); // 每5秒检查一次
  }

  // 检查待确认交易
  private async checkPendingTransactions(): Promise<void> {
    const pendingHashes = Array.from(this.pendingTransactions.keys()).filter(
      hash => this.pendingTransactions.get(hash)?.status === 'pending'
    );

    for (const hash of pendingHashes) {
      try {
        const receipt = await this.provider.getTransactionReceipt(hash);
        
        if (receipt) {
          const tx = this.pendingTransactions.get(hash)!;
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
    const tx = this.pendingTransactions.get(hash);
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
  } | null {
    const tx = this.pendingTransactions.get(hash);
    if (!tx) return null;

    return {
      status: tx.status,
      confirmations: tx.confirmations,
      timestamp: tx.timestamp
    };
  }

  // 获取所有监控的交易
  getAllTransactions(): Array<{
    hash: string;
    status: string;
    confirmations: number;
    timestamp: number;
    duration: number;
  }> {
    return Array.from(this.pendingTransactions.entries()).map(([hash, tx]) => ({
      hash,
      status: tx.status,
      confirmations: tx.confirmations,
      timestamp: tx.timestamp,
      duration: Date.now() - tx.timestamp
    }));
  }

  // 清理已完成的交易
  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [hash, tx] of this.pendingTransactions.entries()) {
      if (tx.status !== 'pending' && (now - tx.timestamp) > oneHour) {
        this.pendingTransactions.delete(hash);
      }
    }
  }
}

// 使用示例
const monitor = new TransactionMonitor(provider);

// 发送交易并监控
const tx = await wallet.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('0.1')
});

monitor.addTransaction(tx.hash, 3, 300000, (status, receipt) => {
  console.log(`交易 ${tx.hash} 状态更新: ${status}`);
  if (receipt) {
    console.log(`Gas 使用: ${receipt.gasUsed}`);
  }
});

// 查看交易状态
setTimeout(() => {
  const status = monitor.getTransactionStatus(tx.hash);
  console.log('当前状态:', status);
}, 10000);
```

### 2. 交易替换和加速

```typescript
class TransactionReplacer {
  private signer: ethers.Signer;
  private provider: ethers.Provider;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider!;
  }

  // 加速交易（提高 Gas 价格）
  async speedUpTransaction(
    originalTxHash: string,
    gasMultiplier: number = 1.2
  ): Promise<ethers.TransactionResponse> {
    // 获取原始交易
    const originalTx = await this.provider.getTransaction(originalTxHash);
    if (!originalTx) {
      throw new Error('原始交易未找到');
    }

    // 检查交易是否已确认
    const receipt = await this.provider.getTransactionReceipt(originalTxHash);
    if (receipt) {
      throw new Error('交易已确认，无法加速');
    }

    // 计算新的 Gas 价格
    let newTx: ethers.TransactionRequest;

    if (originalTx.type === 2) {
      // EIP-1559 交易
      const newMaxFeePerGas = originalTx.maxFeePerGas! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;
      const newMaxPriorityFeePerGas = originalTx.maxPriorityFeePerGas! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;

      newTx = {
        to: originalTx.to,
        value: originalTx.value,
        data: originalTx.data,
        gasLimit: originalTx.gasLimit,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
        nonce: originalTx.nonce,
        type: 2
      };
    } else {
      // Legacy 交易
      const newGasPrice = originalTx.gasPrice! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;

      newTx = {
        to: originalTx.to,
        value: originalTx.value,
        data: originalTx.data,
        gasLimit: originalTx.gasLimit,
        gasPrice: newGasPrice,
        nonce: originalTx.nonce
      };
    }

    console.log(`加速交易 ${originalTxHash}, Gas 倍数: ${gasMultiplier}`);
    
    const speedUpTx = await this.signer.sendTransaction(newTx);
    console.log(`加速交易已发送: ${speedUpTx.hash}`);

    return speedUpTx;
  }

  // 取消交易（发送 0 ETH 到自己）
  async cancelTransaction(
    originalTxHash: string,
    gasMultiplier: number = 1.2
  ): Promise<ethers.TransactionResponse> {
    const originalTx = await this.provider.getTransaction(originalTxHash);
    if (!originalTx) {
      throw new Error('原始交易未找到');
    }

    const receipt = await this.provider.getTransactionReceipt(originalTxHash);
    if (receipt) {
      throw new Error('交易已确认，无法取消');
    }

    const senderAddress = await this.signer.getAddress();

    // 创建取消交易（发送 0 ETH 到自己，使用相同 nonce）
    let cancelTx: ethers.TransactionRequest;

    if (originalTx.type === 2) {
      const newMaxFeePerGas = originalTx.maxFeePerGas! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;
      const newMaxPriorityFeePerGas = originalTx.maxPriorityFeePerGas! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;

      cancelTx = {
        to: senderAddress,
        value: 0,
        gasLimit: 21000,
        maxFeePerGas: newMaxFeePerGas,
        maxPriorityFeePerGas: newMaxPriorityFeePerGas,
        nonce: originalTx.nonce,
        type: 2
      };
    } else {
      const newGasPrice = originalTx.gasPrice! * BigInt(Math.floor(gasMultiplier * 100)) / 100n;

      cancelTx = {
        to: senderAddress,
        value: 0,
        gasLimit: 21000,
        gasPrice: newGasPrice,
        nonce: originalTx.nonce
      };
    }

    console.log(`取消交易 ${originalTxHash}`);
    
    const cancelTxResponse = await this.signer.sendTransaction(cancelTx);
    console.log(`取消交易已发送: ${cancelTxResponse.hash}`);

    return cancelTxResponse;
  }

  // 智能交易替换
  async smartReplaceTransaction(
    originalTxHash: string,
    action: 'speedup' | 'cancel',
    options?: {
      maxGasMultiplier?: number;
      minGasMultiplier?: number;
      checkInterval?: number;
      maxWaitTime?: number;
    }
  ): Promise<ethers.TransactionResponse> {
    const config = {
      maxGasMultiplier: 2.0,
      minGasMultiplier: 1.1,
      checkInterval: 30000, // 30秒
      maxWaitTime: 300000,  // 5分钟
      ...options
    };

    let gasMultiplier = config.minGasMultiplier;
    const startTime = Date.now();

    while (Date.now() - startTime < config.maxWaitTime) {
      try {
        // 检查原始交易是否已确认
        const receipt = await this.provider.getTransactionReceipt(originalTxHash);
        if (receipt) {
          throw new Error('原始交易已确认');
        }

        // 尝试替换交易
        if (action === 'speedup') {
          return await this.speedUpTransaction(originalTxHash, gasMultiplier);
        } else {
          return await this.cancelTransaction(originalTxHash, gasMultiplier);
        }
      } catch (error: any) {
        if (error.message.includes('已确认')) {
          throw error;
        }

        console.log(`替换失败，增加 Gas 价格: ${gasMultiplier} -> ${gasMultiplier * 1.1}`);
        gasMultiplier = Math.min(gasMultiplier * 1.1, config.maxGasMultiplier);

        if (gasMultiplier >= config.maxGasMultiplier) {
          throw new Error('已达到最大 Gas 倍数，替换失败');
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, config.checkInterval));
      }
    }

    throw new Error('替换交易超时');
  }
}

// 使用示例
const replacer = new TransactionReplacer(wallet);

// 发送一个可能会卡住的交易
const slowTx = await wallet.sendTransaction({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('0.1'),
  gasPrice: ethers.parseUnits('1', 'gwei') // 故意设置很低的 Gas 价格
});

console.log('慢交易已发送:', slowTx.hash);

// 等待一段时间后加速
setTimeout(async () => {
  try {
    const speedUpTx = await replacer.smartReplaceTransaction(slowTx.hash, 'speedup');
    console.log('交易已加速:', speedUpTx.hash);
  } catch (error) {
    console.error('加速失败:', error);
  }
}, 60000); // 1分钟后加速
```

## 交易分析工具

### 1. 交易成本分析

```typescript
class TransactionAnalyzer {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 分析交易成本
  async analyzeTransactionCost(txHash: string): Promise<{
    gasUsed: bigint;
    gasPrice: bigint;
    totalCost: bigint;
    totalCostEth: string;
    totalCostUsd?: number;
    efficiency: number; // Gas 使用效率
  }> {
    const [tx, receipt] = await Promise.all([
      this.provider.getTransaction(txHash),
      this.provider.getTransactionReceipt(txHash)
    ]);

    if (!tx || !receipt) {
      throw new Error('交易未找到');
    }

    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || tx.maxFeePerGas || 0n;
    const totalCost = gasUsed * gasPrice;
    const totalCostEth = ethers.formatEther(totalCost);
    
    // 计算 Gas 使用效率（实际使用 / 限制）
    const efficiency = Number(gasUsed * 100n / tx.gasLimit) / 100;

    return {
      gasUsed,
      gasPrice,
      totalCost,
      totalCostEth,
      efficiency
    };
  }

  // 估算交易成本
  async estimateTransactionCost(
    tx: ethers.TransactionRequest,
    ethPrice?: number
  ): Promise<{
    estimatedGas: bigint;
    gasPrice: bigint;
    estimatedCost: bigint;
    estimatedCostEth: string;
    estimatedCostUsd?: number;
  }> {
    // 估算 Gas
    const estimatedGas = await this.provider.estimateGas(tx);
    
    // 获取当前 Gas 价格
    let gasPrice: bigint;
    if (tx.gasPrice) {
      gasPrice = tx.gasPrice;
    } else if (tx.maxFeePerGas) {
      gasPrice = tx.maxFeePerGas;
    } else {
      const feeData = await this.provider.getFeeData();
      gasPrice = feeData.gasPrice || 0n;
    }

    const estimatedCost = estimatedGas * gasPrice;
    const estimatedCostEth = ethers.formatEther(estimatedCost);
    const estimatedCostUsd = ethPrice ? parseFloat(estimatedCostEth) * ethPrice : undefined;

    return {
      estimatedGas,
      gasPrice,
      estimatedCost,
      estimatedCostEth,
      estimatedCostUsd
    };
  }

  // 比较不同 Gas 价格的成本
  async compareGasPrices(
    tx: ethers.TransactionRequest,
    gasPrices: bigint[]
  ): Promise<Array<{
    gasPrice: string;
    estimatedCost: string;
    estimatedTime: string; // 预估确认时间
  }>> {
    const estimatedGas = await this.provider.estimateGas(tx);
    
    return gasPrices.map(gasPrice => {
      const cost = estimatedGas * gasPrice;
      const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');
      
      // 简单的时间估算（实际应该基于网络状况）
      let estimatedTime: string;
      const gasPriceNum = parseFloat(gasPriceGwei);
      if (gasPriceNum < 10) {
        estimatedTime = '10+ 分钟';
      } else if (gasPriceNum < 20) {
        estimatedTime = '5-10 分钟';
      } else if (gasPriceNum < 50) {
        estimatedTime = '1-5 分钟';
      } else {
        estimatedTime = '< 1 分钟';
      }

      return {
        gasPrice: `${gasPriceGwei} Gwei`,
        estimatedCost: ethers.formatEther(cost),
        estimatedTime
      };
    });
  }

  // 获取网络 Gas 价格建议
  async getGasPriceSuggestions(): Promise<{
    slow: bigint;
    standard: bigint;
    fast: bigint;
    instant: bigint;
  }> {
    const feeData = await this.provider.getFeeData();
    const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

    return {
      slow: baseGasPrice * 80n / 100n,      // 80% of current
      standard: baseGasPrice,               // Current price
      fast: baseGasPrice * 120n / 100n,     // 120% of current
      instant: baseGasPrice * 150n / 100n   // 150% of current
    };
  }

  // 分析交易历史
  async analyzeTransactionHistory(
    address: string,
    blockRange: number = 1000
  ): Promise<{
    totalTransactions: number;
    totalGasUsed: bigint;
    totalCost: bigint;
    averageGasPrice: bigint;
    averageGasUsed: bigint;
    mostExpensiveTx: string;
    mostEfficientTx: string;
  }> {
    const currentBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blockRange);
    
    // 这里需要使用支持日志查询的 provider
    // 实际实现可能需要使用 Etherscan API 或其他索引服务
    
    // 示例返回结构
    return {
      totalTransactions: 0,
      totalGasUsed: 0n,
      totalCost: 0n,
      averageGasPrice: 0n,
      averageGasUsed: 0n,
      mostExpensiveTx: '',
      mostEfficientTx: ''
    };
  }
}

// 使用示例
const analyzer = new TransactionAnalyzer(provider);

// 分析已完成的交易
const analysis = await analyzer.analyzeTransactionCost('0x...');
console.log('交易分析:', {
  gasUsed: analysis.gasUsed.toString(),
  totalCost: analysis.totalCostEth + ' ETH',
  efficiency: (analysis.efficiency * 100).toFixed(2) + '%'
});

// 估算新交易成本
const estimation = await analyzer.estimateTransactionCost({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('1.0')
});

console.log('成本估算:', {
  estimatedGas: estimation.estimatedGas.toString(),
  estimatedCost: estimation.estimatedCostEth + ' ETH'
});

// 比较不同 Gas 价格
const gasPrices = [
  ethers.parseUnits('10', 'gwei'),
  ethers.parseUnits('20', 'gwei'),
  ethers.parseUnits('50', 'gwei'),
  ethers.parseUnits('100', 'gwei')
];

const comparison = await analyzer.compareGasPrices({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  value: ethers.parseEther('1.0')
}, gasPrices);

console.log('Gas 价格比较:', comparison);
```

## 常见问题

### Q: 交易卡住了怎么办？
A: 可以通过提高 Gas 价格来加速交易，或者发送一个相同 nonce 的取消交易。

### Q: 如何选择合适的 Gas 价格？
A: 根据交易紧急程度选择：不急用低价格，紧急用高价格。可以参考网络当前的 Gas 价格建议。

### Q: EIP-1559 和传统交易有什么区别？
A: EIP-1559 使用 `maxFeePerGas` 和 `maxPriorityFeePerGas`，提供更好的费用预测和用户体验。

### Q: 如何处理交易失败？
A: 检查失败原因（余额不足、Gas 不够、合约错误等），修正后重新发送。

## 下一步

- [发送交易](/ethers/transactions/sending) - 深入学习交易发送
- [Gas 管理](/ethers/transactions/gas) - 掌握 Gas 优化技巧
- [交易等待](/ethers/transactions/waiting) - 学习交易确认处理
- [批量交易](/ethers/transactions/batch) - 了解批量交易处理