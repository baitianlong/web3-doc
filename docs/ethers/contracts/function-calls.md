---
title: 函数调用
description: Ethers.js 中智能合约函数调用的详细指南
keywords: [ethers, 函数调用, 智能合约, view函数, 写入函数, staticCall, Web3]
---

# 函数调用

智能合约函数调用是 Web3 开发的核心功能。Ethers.js 提供了多种方式来调用合约函数，包括只读函数、写入函数、静态调用等。

## 函数调用基础

### 1. 函数类型分类

```typescript
// 合约函数主要分为以下几类：
interface ContractFunctions {
  // 只读函数 (view/pure)
  readonly: {
    name(): Promise<string>;
    balanceOf(address: string): Promise<bigint>;
    totalSupply(): Promise<bigint>;
  };
  
  // 写入函数 (payable/nonpayable)
  writable: {
    transfer(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
    approve(spender: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  };
  
  // 支付函数 (payable)
  payable: {
    deposit(): Promise<ethers.ContractTransactionResponse>;
    buyTokens(amount: bigint): Promise<ethers.ContractTransactionResponse>;
  };
}
```

### 2. 基本调用语法

```typescript
import { ethers } from 'ethers';

// 创建合约实例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const contractAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
const contractABI = [
  "function name() view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 只读函数调用
const tokenName = await contract.name();
const balance = await contract.balanceOf('0x...');

// 写入函数调用（需要 Signer）
const wallet = new ethers.Wallet('0x...privateKey', provider);
const contractWithSigner = contract.connect(wallet);

const tx = await contractWithSigner.transfer('0x...', ethers.parseEther('100'));
await tx.wait();
```

## 只读函数调用

### 1. 基本只读调用

```typescript
class ReadOnlyContractCaller {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 获取代币基本信息
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      // 并行调用多个只读函数
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.decimals(),
        this.contract.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };
    } catch (error) {
      console.error('获取代币信息失败:', error);
      throw error;
    }
  }

  // 获取用户余额信息
  async getUserBalance(userAddress: string): Promise<{
    balance: string;
    balanceRaw: bigint;
    decimals: number;
  }> {
    try {
      const [balance, decimals] = await Promise.all([
        this.contract.balanceOf(userAddress),
        this.contract.decimals()
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        balanceRaw: balance,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('获取用户余额失败:', error);
      throw error;
    }
  }

  // 批量获取用户余额
  async getBatchBalances(addresses: string[]): Promise<Map<string, string>> {
    const balances = new Map<string, string>();
    
    try {
      const decimals = await this.contract.decimals();
      
      // 批量调用
      const balancePromises = addresses.map(address => 
        this.contract.balanceOf(address)
      );
      
      const rawBalances = await Promise.all(balancePromises);
      
      addresses.forEach((address, index) => {
        const formattedBalance = ethers.formatUnits(rawBalances[index], decimals);
        balances.set(address, formattedBalance);
      });

      return balances;
    } catch (error) {
      console.error('批量获取余额失败:', error);
      throw error;
    }
  }

  // 检查授权额度
  async getAllowance(owner: string, spender: string): Promise<{
    allowance: string;
    allowanceRaw: bigint;
    isUnlimited: boolean;
  }> {
    try {
      const [allowance, decimals] = await Promise.all([
        this.contract.allowance(owner, spender),
        this.contract.decimals()
      ]);

      const maxUint256 = 2n ** 256n - 1n;
      const isUnlimited = allowance >= maxUint256 / 2n; // 通常认为超过一半最大值就是无限授权

      return {
        allowance: ethers.formatUnits(allowance, decimals),
        allowanceRaw: allowance,
        isUnlimited
      };
    } catch (error) {
      console.error('获取授权额度失败:', error);
      throw error;
    }
  }
}

// 使用示例
const readOnlyCaller = new ReadOnlyContractCaller(contract);

const tokenInfo = await readOnlyCaller.getTokenInfo();
console.log('代币信息:', tokenInfo);

const userBalance = await readOnlyCaller.getUserBalance('0x...');
console.log('用户余额:', userBalance.balance);

const batchBalances = await readOnlyCaller.getBatchBalances([
  '0x...address1',
  '0x...address2',
  '0x...address3'
]);
```

### 2. 高级只读调用

```typescript
class AdvancedReadCaller {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.provider = contract.runner?.provider!;
  }

  // 在特定区块调用函数
  async callAtBlock(
    functionName: string,
    args: any[] = [],
    blockNumber?: number
  ): Promise<any> {
    try {
      const overrides = blockNumber ? { blockTag: blockNumber } : {};
      return await this.contract[functionName](...args, overrides);
    } catch (error) {
      console.error(`在区块 ${blockNumber} 调用 ${functionName} 失败:`, error);
      throw error;
    }
  }

  // 获取历史数据
  async getHistoricalData(
    functionName: string,
    args: any[] = [],
    fromBlock: number,
    toBlock: number,
    interval: number = 100
  ): Promise<Array<{ block: number; value: any; timestamp: number }>> {
    const results = [];
    
    for (let block = fromBlock; block <= toBlock; block += interval) {
      try {
        const value = await this.callAtBlock(functionName, args, block);
        const blockInfo = await this.provider.getBlock(block);
        
        results.push({
          block,
          value,
          timestamp: blockInfo?.timestamp || 0
        });
      } catch (error) {
        console.warn(`跳过区块 ${block}:`, error);
      }
    }

    return results;
  }

  // 模拟函数调用（不消耗 Gas）
  async simulateCall(
    functionName: string,
    args: any[] = [],
    overrides: any = {}
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    gasUsed?: bigint;
  }> {
    try {
      // 使用 staticCall 模拟调用
      const result = await this.contract[functionName].staticCall(...args, overrides);
      
      // 估算 Gas 使用量
      let gasUsed: bigint | undefined;
      try {
        gasUsed = await this.contract[functionName].estimateGas(...args, overrides);
      } catch {
        // 如果是 view 函数，无法估算 Gas
      }

      return {
        success: true,
        result,
        gasUsed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 条件调用（只有满足条件才调用）
  async conditionalCall(
    conditionFunction: string,
    conditionArgs: any[],
    targetFunction: string,
    targetArgs: any[]
  ): Promise<any> {
    // 先检查条件
    const condition = await this.contract[conditionFunction](...conditionArgs);
    
    if (!condition) {
      throw new Error('条件不满足，无法执行调用');
    }

    // 执行目标函数
    return await this.contract[targetFunction](...targetArgs);
  }
}

// 使用示例
const advancedCaller = new AdvancedReadCaller(contract);

// 获取特定区块的余额
const balanceAtBlock = await advancedCaller.callAtBlock(
  'balanceOf',
  ['0x...'],
  18000000
);

// 获取历史总供应量
const historicalSupply = await advancedCaller.getHistoricalData(
  'totalSupply',
  [],
  17000000,
  18000000,
  10000
);

// 模拟转账调用
const simulation = await advancedCaller.simulateCall(
  'transfer',
  ['0x...', ethers.parseEther('100')]
);
```

## 写入函数调用

### 1. 基本写入调用

```typescript
class WriteContractCaller {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contract: ethers.Contract, signer: ethers.Signer) {
    this.contract = contract.connect(signer);
    this.signer = signer;
  }

  // 转账代币
  async transfer(
    to: string,
    amount: string,
    options: {
      gasLimit?: bigint;
      gasPrice?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
    } = {}
  ): Promise<{
    transaction: ethers.ContractTransactionResponse;
    receipt: ethers.ContractTransactionReceipt | null;
  }> {
    try {
      console.log(`转账 ${amount} 代币到 ${to}`);

      // 获取代币精度
      const decimals = await this.contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // 检查余额
      const senderAddress = await this.signer.getAddress();
      const balance = await this.contract.balanceOf(senderAddress);
      
      if (balance < amountWei) {
        throw new Error(`余额不足: ${ethers.formatUnits(balance, decimals)} < ${amount}`);
      }

      // 估算 Gas
      const gasEstimate = await this.contract.transfer.estimateGas(to, amountWei);
      console.log('预估 Gas:', gasEstimate.toString());

      // 执行转账
      const tx = await this.contract.transfer(to, amountWei, {
        gasLimit: options.gasLimit || gasEstimate * 120n / 100n, // 增加 20% 缓冲
        ...options
      });

      console.log('交易已发送:', tx.hash);

      // 等待确认
      const receipt = await tx.wait();
      console.log('交易已确认:', receipt?.status === 1 ? '成功' : '失败');

      return { transaction: tx, receipt };
    } catch (error) {
      console.error('转账失败:', error);
      throw error;
    }
  }

  // 授权代币
  async approve(
    spender: string,
    amount: string,
    isUnlimited: boolean = false
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const decimals = await this.contract.decimals();
      const amountWei = isUnlimited 
        ? ethers.MaxUint256 
        : ethers.parseUnits(amount, decimals);

      console.log(`授权 ${spender} 使用 ${isUnlimited ? '无限' : amount} 代币`);

      // 检查当前授权
      const senderAddress = await this.signer.getAddress();
      const currentAllowance = await this.contract.allowance(senderAddress, spender);
      
      if (currentAllowance > 0n && !isUnlimited) {
        console.warn('当前已有授权，建议先重置为 0');
      }

      const tx = await this.contract.approve(spender, amountWei);
      console.log('授权交易已发送:', tx.hash);

      return tx;
    } catch (error) {
      console.error('授权失败:', error);
      throw error;
    }
  }

  // 安全授权（先重置再授权）
  async safeApprove(spender: string, amount: string): Promise<{
    resetTx?: ethers.ContractTransactionResponse;
    approveTx: ethers.ContractTransactionResponse;
  }> {
    const senderAddress = await this.signer.getAddress();
    const currentAllowance = await this.contract.allowance(senderAddress, spender);
    
    let resetTx: ethers.ContractTransactionResponse | undefined;

    // 如果当前有授权，先重置为 0
    if (currentAllowance > 0n) {
      console.log('重置当前授权...');
      resetTx = await this.contract.approve(spender, 0n);
      await resetTx.wait();
      console.log('授权已重置');
    }

    // 设置新的授权
    const approveTx = await this.approve(spender, amount);
    
    return { resetTx, approveTx };
  }

  // 批量转账
  async batchTransfer(
    recipients: Array<{ address: string; amount: string }>
  ): Promise<ethers.ContractTransactionResponse[]> {
    const transactions = [];
    
    for (const recipient of recipients) {
      try {
        const { transaction } = await this.transfer(recipient.address, recipient.amount);
        transactions.push(transaction);
        
        // 等待一段时间避免 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`转账到 ${recipient.address} 失败:`, error);
        throw error;
      }
    }

    return transactions;
  }
}

// 使用示例
const wallet = new ethers.Wallet('0x...privateKey', provider);
const writeCaller = new WriteContractCaller(contract, wallet);

// 转账代币
const { transaction, receipt } = await writeCaller.transfer(
  '0x...recipient',
  '100.5',
  { gasLimit: 100000n }
);

// 授权代币
const approveTx = await writeCaller.approve('0x...spender', '1000');
await approveTx.wait();

// 安全授权
const { resetTx, approveTx: safeApproveTx } = await writeCaller.safeApprove(
  '0x...spender',
  '500'
);
```

### 2. 高级写入调用

```typescript
class AdvancedWriteCaller {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contract: ethers.Contract, signer: ethers.Signer) {
    this.contract = contract.connect(signer);
    this.signer = signer;
  }

  // 带重试机制的函数调用
  async callWithRetry(
    functionName: string,
    args: any[] = [],
    options: any = {},
    maxRetries: number = 3
  ): Promise<ethers.ContractTransactionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试调用 ${functionName} (第 ${attempt} 次)`);

        // 获取最新的 nonce
        const nonce = await this.signer.getNonce();
        
        const tx = await this.contract[functionName](...args, {
          ...options,
          nonce
        });

        console.log(`调用成功，交易哈希: ${tx.hash}`);
        return tx;
      } catch (error: any) {
        lastError = error;
        console.error(`第 ${attempt} 次尝试失败:`, error.message);

        if (attempt < maxRetries) {
          // 指数退避
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`函数调用失败，已重试 ${maxRetries} 次。最后错误: ${lastError?.message}`);
  }

  // 条件执行（只有满足条件才执行）
  async conditionalExecute(
    conditionCheck: () => Promise<boolean>,
    functionName: string,
    args: any[] = [],
    options: any = {}
  ): Promise<ethers.ContractTransactionResponse | null> {
    const shouldExecute = await conditionCheck();
    
    if (!shouldExecute) {
      console.log('条件不满足，跳过执行');
      return null;
    }

    return await this.contract[functionName](...args, options);
  }

  // 批量执行（按顺序执行多个函数）
  async batchExecute(
    calls: Array<{
      functionName: string;
      args: any[];
      options?: any;
      waitForConfirmation?: boolean;
    }>
  ): Promise<Array<{
    functionName: string;
    transaction: ethers.ContractTransactionResponse;
    receipt?: ethers.ContractTransactionReceipt | null;
    success: boolean;
    error?: string;
  }>> {
    const results = [];

    for (const call of calls) {
      try {
        console.log(`执行 ${call.functionName}...`);
        
        const transaction = await this.contract[call.functionName](
          ...call.args,
          call.options || {}
        );

        let receipt: ethers.ContractTransactionReceipt | null = null;
        if (call.waitForConfirmation) {
          receipt = await transaction.wait();
        }

        results.push({
          functionName: call.functionName,
          transaction,
          receipt,
          success: true
        });

        console.log(`${call.functionName} 执行成功`);
      } catch (error: any) {
        console.error(`${call.functionName} 执行失败:`, error.message);
        
        results.push({
          functionName: call.functionName,
          transaction: null as any,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 智能 Gas 管理
  async smartGasCall(
    functionName: string,
    args: any[] = [],
    gasStrategy: 'fast' | 'standard' | 'safe' = 'standard'
  ): Promise<ethers.ContractTransactionResponse> {
    // 获取当前网络的 Gas 信息
    const feeData = await this.signer.provider?.getFeeData();
    if (!feeData) {
      throw new Error('无法获取 Gas 信息');
    }

    // 估算 Gas 限制
    const gasEstimate = await this.contract[functionName].estimateGas(...args);
    
    // 根据策略调整 Gas 参数
    let gasLimit: bigint;
    let gasPrice: bigint | undefined;
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;

    switch (gasStrategy) {
      case 'fast':
        gasLimit = gasEstimate * 150n / 100n; // 增加 50%
        if (feeData.maxFeePerGas) {
          maxFeePerGas = feeData.maxFeePerGas * 120n / 100n;
          maxPriorityFeePerGas = feeData.maxPriorityFeePerGas! * 120n / 100n;
        } else {
          gasPrice = feeData.gasPrice! * 120n / 100n;
        }
        break;
      
      case 'safe':
        gasLimit = gasEstimate * 200n / 100n; // 增加 100%
        if (feeData.maxFeePerGas) {
          maxFeePerGas = feeData.maxFeePerGas * 150n / 100n;
          maxPriorityFeePerGas = feeData.maxPriorityFeePerGas! * 150n / 100n;
        } else {
          gasPrice = feeData.gasPrice! * 150n / 100n;
        }
        break;
      
      default: // standard
        gasLimit = gasEstimate * 120n / 100n; // 增加 20%
        gasPrice = feeData.gasPrice || undefined;
        maxFeePerGas = feeData.maxFeePerGas || undefined;
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || undefined;
    }

    const txOptions: any = { gasLimit };
    if (maxFeePerGas) {
      txOptions.maxFeePerGas = maxFeePerGas;
      txOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;
    } else if (gasPrice) {
      txOptions.gasPrice = gasPrice;
    }

    console.log(`使用 ${gasStrategy} Gas 策略:`, txOptions);

    return await this.contract[functionName](...args, txOptions);
  }
}

// 使用示例
const advancedCaller = new AdvancedWriteCaller(contract, wallet);

// 带重试的转账
const retryTx = await advancedCaller.callWithRetry(
  'transfer',
  ['0x...', ethers.parseEther('100')],
  {},
  3
);

// 条件执行
const conditionalTx = await advancedCaller.conditionalExecute(
  async () => {
    const balance = await contract.balanceOf(await wallet.getAddress());
    return balance > ethers.parseEther('100');
  },
  'transfer',
  ['0x...', ethers.parseEther('50')]
);

// 批量执行
const batchResults = await advancedCaller.batchExecute([
  {
    functionName: 'approve',
    args: ['0x...spender', ethers.parseEther('1000')],
    waitForConfirmation: true
  },
  {
    functionName: 'transfer',
    args: ['0x...recipient', ethers.parseEther('100')],
    waitForConfirmation: true
  }
]);

// 智能 Gas 管理
const fastTx = await advancedCaller.smartGasCall(
  'transfer',
  ['0x...', ethers.parseEther('100')],
  'fast'
);
```

## 静态调用和模拟

### 1. 静态调用 (staticCall)

```typescript
class StaticCallManager {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 静态调用写入函数（不实际执行）
  async staticCall(
    functionName: string,
    args: any[] = [],
    overrides: any = {}
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    revertReason?: string;
  }> {
    try {
      const result = await this.contract[functionName].staticCall(...args, overrides);
      
      return {
        success: true,
        result
      };
    } catch (error: any) {
      // 尝试解析 revert 原因
      let revertReason: string | undefined;
      if (error.data) {
        try {
          const decodedError = this.contract.interface.parseError(error.data);
          revertReason = decodedError?.name || 'Unknown error';
        } catch {
          // 无法解析错误
        }
      }

      return {
        success: false,
        error: error.message,
        revertReason
      };
    }
  }

  // 批量静态调用
  async batchStaticCall(
    calls: Array<{
      functionName: string;
      args: any[];
      overrides?: any;
    }>
  ): Promise<Array<{
    functionName: string;
    success: boolean;
    result?: any;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      calls.map(call => 
        this.staticCall(call.functionName, call.args, call.overrides)
      )
    );

    return results.map((result, index) => ({
      functionName: calls[index].functionName,
      ...(result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason?.message || 'Unknown error'
      })
    }));
  }

  // 模拟交易执行
  async simulateTransaction(
    functionName: string,
    args: any[] = [],
    value: bigint = 0n
  ): Promise<{
    willSucceed: boolean;
    gasEstimate?: bigint;
    result?: any;
    error?: string;
    events?: any[];
  }> {
    try {
      // 1. 静态调用检查是否会成功
      const staticResult = await this.staticCall(functionName, args, { value });
      
      if (!staticResult.success) {
        return {
          willSucceed: false,
          error: staticResult.error,
        };
      }

      // 2. 估算 Gas
      let gasEstimate: bigint | undefined;
      try {
        gasEstimate = await this.contract[functionName].estimateGas(...args, { value });
      } catch (gasError) {
        return {
          willSucceed: false,
          error: 'Gas estimation failed'
        };
      }

      // 3. 模拟事件（如果可能）
      let events: any[] = [];
      // 注意：静态调用不会触发事件，这里只是示例
      
      return {
        willSucceed: true,
        gasEstimate,
        result: staticResult.result,
        events
      };
    } catch (error: any) {
      return {
        willSucceed: false,
        error: error.message
      };
    }
  }

  // 预检查转账
  async preCheckTransfer(
    from: string,
    to: string,
    amount: bigint
  ): Promise<{
    canTransfer: boolean;
    reason?: string;
    suggestions?: string[];
  }> {
    const suggestions: string[] = [];

    try {
      // 检查余额
      const balance = await this.contract.balanceOf(from);
      if (balance < amount) {
        return {
          canTransfer: false,
          reason: `余额不足: ${ethers.formatEther(balance)} < ${ethers.formatEther(amount)}`,
          suggestions: ['请检查账户余额', '减少转账金额']
        };
      }

      // 检查接收地址
      if (to === ethers.ZeroAddress) {
        return {
          canTransfer: false,
          reason: '不能转账到零地址',
          suggestions: ['请检查接收地址']
        };
      }

      // 静态调用转账函数
      const staticResult = await this.staticCall('transfer', [to, amount]);
      
      if (!staticResult.success) {
        if (staticResult.revertReason?.includes('Pausable')) {
          suggestions.push('合约可能已暂停，请稍后重试');
        }
        if (staticResult.revertReason?.includes('Blacklist')) {
          suggestions.push('地址可能在黑名单中');
        }

        return {
          canTransfer: false,
          reason: staticResult.error || '转账将失败',
          suggestions
        };
      }

      return {
        canTransfer: true
      };
    } catch (error: any) {
      return {
        canTransfer: false,
        reason: error.message,
        suggestions: ['请检查网络连接', '确认合约地址正确']
      };
    }
  }
}

// 使用示例
const staticManager = new StaticCallManager(contract);

// 静态调用转账
const transferCheck = await staticManager.staticCall(
  'transfer',
  ['0x...', ethers.parseEther('100')]
);

if (transferCheck.success) {
  console.log('转账将成功，返回值:', transferCheck.result);
} else {
  console.log('转账将失败:', transferCheck.error);
}

// 批量静态调用
const batchResults = await staticManager.batchStaticCall([
  { functionName: 'transfer', args: ['0x...', ethers.parseEther('100')] },
  { functionName: 'approve', args: ['0x...', ethers.parseEther('1000')] }
]);

// 模拟交易
const simulation = await staticManager.simulateTransaction(
  'transfer',
  ['0x...', ethers.parseEther('100')]
);

// 预检查转账
const preCheck = await staticManager.preCheckTransfer(
  await wallet.getAddress(),
  '0x...',
  ethers.parseEther('100')
);

if (!preCheck.canTransfer) {
  console.log('转账失败原因:', preCheck.reason);
  console.log('建议:', preCheck.suggestions);
}
```

## 函数调用优化

### 1. 调用缓存

```typescript
class FunctionCallCache {
  private cache = new Map<string, {
    value: any;
    timestamp: number;
    ttl: number;
  }>();

  // 生成缓存键
  private generateKey(
    contractAddress: string,
    functionName: string,
    args: any[]
  ): string {
    return `${contractAddress}:${functionName}:${JSON.stringify(args)}`;
  }

  // 缓存函数调用结果
  async cachedCall(
    contract: ethers.Contract,
    functionName: string,
    args: any[] = [],
    ttl: number = 60000 // 默认缓存 1 分钟
  ): Promise<any> {
    const contractAddress = await contract.getAddress();
    const key = this.generateKey(contractAddress, functionName, args);
    
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`缓存命中: ${functionName}`);
      return cached.value;
    }

    // 调用函数
    console.log(`调用函数: ${functionName}`);
    const result = await contract[functionName](...args);
    
    // 存储到缓存
    this.cache.set(key, {
      value: result,
      timestamp: Date.now(),
      ttl
    });

    return result;
  }

  // 清除缓存
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

  // 获取缓存统计
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 使用示例
const callCache = new FunctionCallCache();

// 缓存代币信息（缓存 5 分钟）
const tokenName = await callCache.cachedCall(contract, 'name', [], 300000);
const tokenSymbol = await callCache.cachedCall(contract, 'symbol', [], 300000);

// 缓存用户余额（缓存 30 秒）
const balance = await callCache.cachedCall(
  contract,
  'balanceOf',
  [userAddress],
  30000
);
```

### 2. 批量调用优化

```typescript
class BatchCallOptimizer {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 智能批量调用（自动分组）
  async smartBatchCall(
    calls: Array<{
      functionName: string;
      args: any[];
      priority?: 'high' | 'normal' | 'low';
    }>,
    maxConcurrency: number = 5
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // 按优先级分组
    const priorityGroups = {
      high: calls.filter(call => call.priority === 'high'),
      normal: calls.filter(call => call.priority === 'normal' || !call.priority),
      low: calls.filter(call => call.priority === 'low')
    };

    // 按优先级顺序执行
    for (const [priority, group] of Object.entries(priorityGroups)) {
      if (group.length === 0) continue;
      
      console.log(`执行 ${priority} 优先级调用 (${group.length} 个)`);
      
      // 分批执行
      for (let i = 0; i < group.length; i += maxConcurrency) {
        const batch = group.slice(i, i + maxConcurrency);
        
        const batchPromises = batch.map(async (call, index) => {
          const key = `${call.functionName}_${i + index}`;
          try {
            const result = await this.contract[call.functionName](...call.args);
            return { key, result, success: true };
          } catch (error: any) {
            return { key, error: error.message, success: false };
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

  // 依赖调用（后续调用依赖前面的结果）
  async dependentCalls(
    calls: Array<{
      functionName: string;
      args: any[] | ((previousResults: Map<string, any>) => any[]);
      dependsOn?: string[];
      key: string;
    }>
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const completed = new Set<string>();
    const remaining = [...calls];

    while (remaining.length > 0) {
      const readyCalls = remaining.filter(call => 
        !call.dependsOn || call.dependsOn.every(dep => completed.has(dep))
      );

      if (readyCalls.length === 0) {
        throw new Error('循环依赖或无法满足的依赖');
      }

      // 并行执行就绪的调用
      const promises = readyCalls.map(async (call) => {
        try {
          const args = typeof call.args === 'function' 
            ? call.args(results) 
            : call.args;
          
          const result = await this.contract[call.functionName](...args);
          return { key: call.key, result, success: true };
        } catch (error: any) {
          return { key: call.key, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ key, result, error, success }) => {
        results.set(key, success ? result : { error });
        completed.add(key);
      });

      // 移除已完成的调用
      readyCalls.forEach(call => {
        const index = remaining.indexOf(call);
        if (index > -1) {
          remaining.splice(index, 1);
        }
      });
    }

    return results;
  }
}

// 使用示例
const batchOptimizer = new BatchCallOptimizer(contract);

// 智能批量调用
const smartResults = await batchOptimizer.smartBatchCall([
  { functionName: 'name', args: [], priority: 'high' },
  { functionName: 'symbol', args: [], priority: 'high' },
  { functionName: 'decimals', args: [], priority: 'normal' },
  { functionName: 'totalSupply', args: [], priority: 'low' }
], 3);

// 依赖调用示例
const dependentResults = await batchOptimizer.dependentCalls([
  {
    key: 'decimals',
    functionName: 'decimals',
    args: []
  },
  {
    key: 'balance',
    functionName: 'balanceOf',
    args: ['0x...'],
    dependsOn: ['decimals']
  },
  {
    key: 'formattedBalance',
    functionName: 'balanceOf', // 这里实际上是处理函数
    args: (results) => {
      const balance = results.get('balance');
      const decimals = results.get('decimals');
      return [ethers.formatUnits(balance, decimals)];
    },
    dependsOn: ['balance', 'decimals']
  }
]);
```

## 错误处理和调试

### 1. 错误分类和处理

```typescript
class FunctionCallErrorHandler {
  // 错误分类
  static classifyError(error: any): {
    type: string;
    severity: 'low' | 'medium' | 'high';
    recoverable: boolean;
    message: string;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    
    if (error.code === 'CALL_EXCEPTION') {
      return {
        type: 'CALL_EXCEPTION',
        severity: 'high',
        recoverable: false,
        message: '合约调用异常',
        suggestions: ['检查函数参数', '确认合约状态', '查看合约文档']
      };
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        type: 'INSUFFICIENT_FUNDS',
        severity: 'medium',
        recoverable: true,
        message: '余额不足',
        suggestions: ['检查账户余额', '减少交易金额', '等待资金到账']
      };
    }

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return {
        type: 'UNPREDICTABLE_GAS_LIMIT',
        severity: 'medium',
        recoverable: true,
        message: '无法预测 Gas 限制',
        suggestions: ['手动设置 Gas 限制', '检查函数参数', '使用 staticCall 预检查']
      };
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        type: 'NETWORK_ERROR',
        severity: 'low',
        recoverable: true,
        message: '网络连接错误',
        suggestions: ['检查网络连接', '切换 RPC 节点', '稍后重试']
      };
    }

    if (error.message?.includes('nonce')) {
      return {
        type: 'NONCE_ERROR',
        severity: 'low',
        recoverable: true,
        message: 'Nonce 错误',
        suggestions: ['等待前一个交易确认', '手动设置 nonce', '重置钱包']
      };
    }

    return {
      type: 'UNKNOWN',
      severity: 'medium',
      recoverable: false,
      message: error.message || '未知错误',
      suggestions: ['查看详细错误信息', '联系技术支持']
    };
  }

  // 智能重试
  static async retryWithStrategy(
    fn: () => Promise<any>,
    maxRetries: number = 3,
    strategy: 'exponential' | 'linear' | 'immediate' = 'exponential'
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const errorInfo = this.classifyError(error);
        
        console.error(`尝试 ${attempt} 失败:`, errorInfo.message);

        if (!errorInfo.recoverable || attempt === maxRetries) {
          break;
        }

        // 计算延迟时间
        let delay = 0;
        switch (strategy) {
          case 'exponential':
            delay = Math.pow(2, attempt) * 1000;
            break;
          case 'linear':
            delay = attempt * 1000;
            break;
          case 'immediate':
            delay = 0;
            break;
        }

        if (delay > 0) {
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// 使用示例
try {
  const result = await FunctionCallErrorHandler.retryWithStrategy(
    () => contract.transfer('0x...', ethers.parseEther('100')),
    3,
    'exponential'
  );
  console.log('交易成功:', result.hash);
} catch (error) {
  const errorInfo = FunctionCallErrorHandler.classifyError(error);
  console.error('交易失败:', errorInfo.message);
  console.log('建议:', errorInfo.suggestions);
}
```

## 最佳实践

### 1. 函数调用检查清单

```typescript
class FunctionCallBestPractices {
  // 调用前检查
  static async preCallChecklist(
    contract: ethers.Contract,
    functionName: string,
    args: any[] = [],
    signer?: ethers.Signer
  ): Promise<{
    passed: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks = [];

    // 检查 1: 函数是否存在
    try {
      const fragment = contract.interface.getFunction(functionName);
      checks.push({
        name: '函数存在性检查',
        passed: !!fragment,
        message: fragment ? '函数存在' : '函数不存在'
      });
    } catch {
      checks.push({
        name: '函数存在性检查',
        passed: false,
        message: '函数不存在'
      });
    }

    // 检查 2: 参数数量
    try {
      const fragment = contract.interface.getFunction(functionName);
      const expectedParams = fragment.inputs.length;
      const actualParams = args.length;
      
      checks.push({
        name: '参数数量检查',
        passed: expectedParams === actualParams,
        message: expectedParams === actualParams 
          ? '参数数量正确' 
          : `参数数量不匹配: 期望 ${expectedParams}，实际 ${actualParams}`
      });
    } catch {
      checks.push({
        name: '参数数量检查',
        passed: false,
        message: '无法检查参数数量'
      });
    }

    // 检查 3: 网络连接
    try {
      await contract.runner?.provider?.getBlockNumber();
      checks.push({
        name: '网络连接检查',
        passed: true,
        message: '网络连接正常'
      });
    } catch {
      checks.push({
        name: '网络连接检查',
        passed: false,
        message: '网络连接失败'
      });
    }

    // 检查 4: Signer 检查（对于写入函数）
    if (signer) {
      try {
        const address = await signer.getAddress();
        const balance = await signer.provider?.getBalance(address);
        
        checks.push({
          name: 'Signer 检查',
          passed: !!address && (balance || 0n) > 0n,
          message: address 
            ? `Signer 正常: ${address}` 
            : 'Signer 无效'
        });
      } catch {
        checks.push({
          name: 'Signer 检查',
          passed: false,
          message: 'Signer 检查失败'
        });
      }
    }

    const allPassed = checks.every(check => check.passed);
    
    return { passed: allPassed, checks };
  }

  // 调用后验证
  static async postCallVerification(
    transaction: ethers.ContractTransactionResponse,
    expectedEvents?: string[]
  ): Promise<{
    verified: boolean;
    issues: string[];
    gasUsed?: bigint;
    events?: any[];
  }> {
    const issues: string[] = [];
    
    try {
      // 等待交易确认
      const receipt = await transaction.wait();
      
      if (!receipt) {
        issues.push('无法获取交易收据');
        return { verified: false, issues };
      }

      // 检查交易状态
      if (receipt.status !== 1) {
        issues.push('交易执行失败');
      }

      // 检查 Gas 使用
      const gasUsed = receipt.gasUsed;
      if (gasUsed > 1000000n) {
        issues.push(`Gas 使用量较高: ${gasUsed.toString()}`);
      }

      // 检查事件
      const events = receipt.logs;
      if (expectedEvents && expectedEvents.length > 0) {
        const eventNames = events.map(log => {
          try {
            return transaction.interface?.parseLog(log)?.name;
          } catch {
            return null;
          }
        }).filter(Boolean);

        for (const expectedEvent of expectedEvents) {
          if (!eventNames.includes(expectedEvent)) {
            issues.push(`缺少预期事件: ${expectedEvent}`);
          }
        }
      }

      return {
        verified: issues.length === 0,
        issues,
        gasUsed,
        events
      };
    } catch (error: any) {
      issues.push(`验证失败: ${error.message}`);
      return { verified: false, issues };
    }
  }
}

// 使用示例
const preCheck = await FunctionCallBestPractices.preCallChecklist(
  contract,
  'transfer',
  ['0x...', ethers.parseEther('100')],
  wallet
);

if (preCheck.passed) {
  const tx = await contract.transfer('0x...', ethers.parseEther('100'));
  
  const postCheck = await FunctionCallBestPractices.postCallVerification(
    tx,
    ['Transfer']
  );
  
  if (!postCheck.verified) {
    console.warn('交易验证失败:', postCheck.issues);
  }
} else {
  console.error('预检查失败:', preCheck.checks.filter(c => !c.passed));
}
```

## 常见问题

### Q: 如何处理函数调用超时？
A: 设置合理的超时时间，使用 Promise.race 结合 setTimeout，或者使用 AbortController 取消请求。

### Q: 为什么有些函数调用会失败？
A: 常见原因包括：参数错误、权限不足、合约状态不满足条件、Gas 不足、网络问题等。

### Q: 如何优化批量函数调用的性能？
A: 使用并行调用、合理设置并发数、缓存结果、使用 multicall 合约等方法。

### Q: 静态调用和普通调用有什么区别？
A: 静态调用不会改变区块链状态，不消耗 Gas，主要用于预检查和模拟执行。

## 下一步

- [事件监听](/ethers/contracts/events) - 学习合约事件处理
- [错误处理](/ethers/contracts/error-handling) - 深入了解错误处理
- [批量调用](/ethers/contracts/batch-calls) - 掌握批量操作技巧
- [交易处理](/ethers/transactions/basics) - 学习交易管理