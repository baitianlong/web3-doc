---
title: Contract 基础
description: Ethers.js 中 Contract 对象的基础使用方法
keywords: [ethers, contract, 智能合约, ABI, 合约交互, Web3]
---

# Contract 基础

Contract 是 Ethers.js 中与智能合约交互的核心组件。它提供了调用合约函数、监听事件、估算 Gas 等功能。

## Contract 基础概念

Contract 对象代表区块链上的智能合约，提供以下功能：

- 调用合约的只读函数（view/pure）
- 发送交易调用合约函数
- 监听合约事件
- 估算函数调用的 Gas 消耗
- 编码和解码函数调用数据

## 创建 Contract 实例

### 1. 基本创建方式

```typescript
import { ethers } from 'ethers';

// 创建 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 合约地址和 ABI
const contractAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// 只读合约（使用 Provider）
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 可写合约（使用 Signer）
const wallet = new ethers.Wallet('0x...privateKey', provider);
const contractWithSigner = contract.connect(wallet);
```

### 2. 使用完整 JSON ABI

```typescript
// 从编译器输出的完整 ABI
const fullABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
];

const contract = new ethers.Contract(contractAddress, fullABI, provider);
```

### 3. 动态创建合约实例

```typescript
class ContractFactory {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // 创建 ERC-20 合约实例
  createERC20Contract(address: string): ethers.Contract {
    const abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ];

    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  // 创建 ERC-721 合约实例
  createERC721Contract(address: string): ethers.Contract {
    const abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function balanceOf(address owner) view returns (uint256)",
      "function approve(address to, uint256 tokenId)",
      "function transferFrom(address from, address to, uint256 tokenId)",
      "function safeTransferFrom(address from, address to, uint256 tokenId)",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];

    return new ethers.Contract(address, abi, this.signer || this.provider);
  }

  // 从合约地址自动检测类型
  async detectContractType(address: string): Promise<string> {
    const contract = new ethers.Contract(address, [
      "function supportsInterface(bytes4 interfaceId) view returns (bool)"
    ], this.provider);

    try {
      // ERC-721 接口 ID
      const isERC721 = await contract.supportsInterface('0x80ac58cd');
      if (isERC721) return 'ERC721';

      // ERC-1155 接口 ID
      const isERC1155 = await contract.supportsInterface('0xd9b67a26');
      if (isERC1155) return 'ERC1155';

      // 尝试调用 ERC-20 函数
      const erc20Contract = new ethers.Contract(address, [
        "function decimals() view returns (uint8)"
      ], this.provider);
      
      await erc20Contract.decimals();
      return 'ERC20';
    } catch (error) {
      return 'Unknown';
    }
  }
}

// 使用示例
const factory = new ContractFactory(provider, wallet);
const tokenContract = factory.createERC20Contract('0x...');
const contractType = await factory.detectContractType('0x...');
```

## 合约函数调用

### 1. 只读函数调用

```typescript
// 基本调用
async function getTokenInfo(contract: ethers.Contract) {
  try {
    // 并行调用多个只读函数
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      totalSupplyRaw: totalSupply
    };
  } catch (error) {
    console.error('获取代币信息失败:', error);
    throw error;
  }
}

// 带参数的函数调用
async function getUserBalance(contract: ethers.Contract, userAddress: string) {
  try {
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    
    return {
      raw: balance,
      formatted: ethers.formatUnits(balance, decimals),
      decimals: Number(decimals)
    };
  } catch (error) {
    console.error('获取余额失败:', error);
    throw error;
  }
}

// 使用示例
const tokenInfo = await getTokenInfo(contract);
const userBalance = await getUserBalance(contract, '0x...');
console.log(`${tokenInfo.name} (${tokenInfo.symbol})`);
console.log(`用户余额: ${userBalance.formatted}`);
```

### 2. 写入函数调用

```typescript
async function transferTokens(
  contract: ethers.Contract,
  to: string,
  amount: string
): Promise<ethers.ContractTransactionResponse> {
  try {
    // 获取代币精度
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);

    // 检查余额
    const senderAddress = await contract.runner?.getAddress();
    if (!senderAddress) {
      throw new Error('无法获取发送者地址');
    }

    const balance = await contract.balanceOf(senderAddress);
    if (balance < amountWei) {
      throw new Error(`余额不足。当前余额: ${ethers.formatUnits(balance, decimals)}`);
    }

    // 估算 Gas
    const gasEstimate = await contract.transfer.estimateGas(to, amountWei);
    const gasLimit = gasEstimate * 120n / 100n; // 增加 20% 缓冲

    // 发送交易
    const tx = await contract.transfer(to, amountWei, {
      gasLimit
    });

    console.log('交易已发送:', tx.hash);
    return tx;
  } catch (error) {
    console.error('转账失败:', error);
    throw error;
  }
}

// 授权代币
async function approveTokens(
  contract: ethers.Contract,
  spender: string,
  amount: string
): Promise<ethers.ContractTransactionResponse> {
  try {
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);

    // 检查当前授权额度
    const senderAddress = await contract.runner?.getAddress();
    const currentAllowance = await contract.allowance(senderAddress, spender);
    
    if (currentAllowance >= amountWei) {
      console.log('授权额度已足够');
      return null as any;
    }

    // 如果当前授权不为 0，先重置为 0（某些代币要求）
    if (currentAllowance > 0n) {
      const resetTx = await contract.approve(spender, 0);
      await resetTx.wait();
      console.log('已重置授权额度');
    }

    // 设置新的授权额度
    const tx = await contract.approve(spender, amountWei);
    console.log('授权交易已发送:', tx.hash);
    return tx;
  } catch (error) {
    console.error('授权失败:', error);
    throw error;
  }
}

// 使用示例
const transferTx = await transferTokens(contractWithSigner, '0x...', '100');
await transferTx.wait();
console.log('转账完成');

const approveTx = await approveTokens(contractWithSigner, '0x...', '1000');
if (approveTx) {
  await approveTx.wait();
  console.log('授权完成');
}
```

### 3. 函数重载处理

```typescript
// 处理函数重载的合约
const contractWithOverloads = new ethers.Contract(address, [
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)"
], signer);

// 调用不同的重载版本
async function transferNFT(
  contract: ethers.Contract,
  from: string,
  to: string,
  tokenId: number,
  data?: string
) {
  if (data) {
    // 调用带 data 参数的版本
    return await contract['safeTransferFrom(address,address,uint256,bytes)'](
      from, to, tokenId, data
    );
  } else {
    // 调用不带 data 参数的版本
    return await contract['safeTransferFrom(address,address,uint256)'](
      from, to, tokenId
    );
  }
}
```

## 合约事件处理

### 1. 监听事件

```typescript
// 监听单个事件
contract.on('Transfer', (from, to, value, event) => {
  console.log('转账事件:');
  console.log('从:', from);
  console.log('到:', to);
  console.log('金额:', ethers.formatEther(value));
  console.log('交易哈希:', event.log.transactionHash);
});

// 监听所有事件
contract.on('*', (event) => {
  console.log('合约事件:', event);
});

// 一次性监听
contract.once('Transfer', (from, to, value) => {
  console.log('收到第一个转账事件');
});

// 移除监听器
const transferListener = (from, to, value) => {
  console.log('转账:', from, '->', to, value);
};

contract.on('Transfer', transferListener);
// 稍后移除
contract.off('Transfer', transferListener);
```

### 2. 查询历史事件

```typescript
async function getTransferHistory(
  contract: ethers.Contract,
  address: string,
  fromBlock: number = 0,
  toBlock: number | string = 'latest'
) {
  try {
    // 创建过滤器
    const filter = contract.filters.Transfer(address, null); // 查询从 address 发出的转账
    
    // 查询事件
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
      from: event.args?.from,
      to: event.args?.to,
      value: event.args?.value,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: null // 需要额外查询区块信息获取时间戳
    }));
  } catch (error) {
    console.error('查询转账历史失败:', error);
    throw error;
  }
}

// 获取详细的事件信息（包含时间戳）
async function getDetailedTransferHistory(
  contract: ethers.Contract,
  address: string,
  fromBlock: number = 0,
  toBlock: number | string = 'latest'
) {
  const events = await getTransferHistory(contract, address, fromBlock, toBlock);
  
  // 批量获取区块信息
  const blockNumbers = [...new Set(events.map(e => e.blockNumber))];
  const blocks = await Promise.all(
    blockNumbers.map(blockNumber => contract.runner?.provider?.getBlock(blockNumber))
  );
  
  const blockMap = new Map(
    blocks.map(block => [block?.number, block?.timestamp])
  );
  
  return events.map(event => ({
    ...event,
    timestamp: blockMap.get(event.blockNumber) || null,
    date: blockMap.get(event.blockNumber) 
      ? new Date(blockMap.get(event.blockNumber)! * 1000) 
      : null
  }));
}

// 使用示例
const history = await getDetailedTransferHistory(contract, userAddress, -1000); // 最近 1000 个区块
console.log('转账历史:', history);
```

## 错误处理和调试

### 1. 错误类型识别

```typescript
async function handleContractCall(contract: ethers.Contract, functionName: string, ...args: any[]) {
  try {
    const result = await contract[functionName](...args);
    return { success: true, result };
  } catch (error: any) {
    console.error(`调用 ${functionName} 失败:`, error);

    // 识别错误类型
    if (error.code === 'CALL_EXCEPTION') {
      return {
        success: false,
        error: 'CALL_EXCEPTION',
        message: '合约调用异常',
        reason: error.reason,
        data: error.data
      };
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: '余额不足'
      };
    }

    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return {
        success: false,
        error: 'UNPREDICTABLE_GAS_LIMIT',
        message: '无法估算 Gas 限制，交易可能会失败'
      };
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: '网络连接错误'
      };
    }

    return {
      success: false,
      error: 'UNKNOWN',
      message: error.message || '未知错误'
    };
  }
}

// 使用示例
const result = await handleContractCall(contract, 'transfer', '0x...', ethers.parseEther('100'));
if (!result.success) {
  console.error('交易失败:', result.message);
}
```

### 2. 合约调用调试

```typescript
class ContractDebugger {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 调试函数调用
  async debugFunctionCall(functionName: string, args: any[] = []) {
    console.log(`调试函数调用: ${functionName}`);
    console.log('参数:', args);

    try {
      // 检查函数是否存在
      if (!this.contract[functionName]) {
        throw new Error(`函数 ${functionName} 不存在`);
      }

      // 如果是写入函数，先尝试 callStatic
      const fragment = this.contract.interface.getFunction(functionName);
      if (fragment && fragment.stateMutability !== 'view' && fragment.stateMutability !== 'pure') {
        console.log('尝试静态调用...');
        const staticResult = await this.contract[functionName].staticCall(...args);
        console.log('静态调用结果:', staticResult);

        // 估算 Gas
        const gasEstimate = await this.contract[functionName].estimateGas(...args);
        console.log('Gas 估算:', gasEstimate.toString());
      }

      // 执行实际调用
      const result = await this.contract[functionName](...args);
      console.log('调用成功:', result);
      return result;
    } catch (error: any) {
      console.error('调用失败:', error);
      
      // 尝试解析错误原因
      if (error.data) {
        try {
          const decodedError = this.contract.interface.parseError(error.data);
          console.log('解析的错误:', decodedError);
        } catch (parseError) {
          console.log('无法解析错误数据');
        }
      }
      
      throw error;
    }
  }

  // 检查合约状态
  async checkContractState() {
    const address = await this.contract.getAddress();
    const provider = this.contract.runner?.provider;
    
    if (!provider) {
      throw new Error('无法获取 Provider');
    }

    const code = await provider.getCode(address);
    const isContract = code !== '0x';

    console.log('合约地址:', address);
    console.log('是否为合约:', isContract);
    console.log('字节码长度:', code.length);

    if (!isContract) {
      console.warn('警告: 地址不是合约地址');
    }

    return {
      address,
      isContract,
      codeLength: code.length,
      bytecode: code
    };
  }

  // 列出所有可用函数
  listFunctions() {
    const functions = this.contract.interface.fragments
      .filter(fragment => fragment.type === 'function')
      .map(fragment => ({
        name: fragment.name,
        signature: fragment.format(),
        stateMutability: (fragment as any).stateMutability,
        inputs: (fragment as any).inputs?.map((input: any) => ({
          name: input.name,
          type: input.type
        })),
        outputs: (fragment as any).outputs?.map((output: any) => ({
          name: output.name,
          type: output.type
        }))
      }));

    console.log('可用函数:');
    functions.forEach(func => {
      console.log(`- ${func.name} (${func.stateMutability})`);
      console.log(`  签名: ${func.signature}`);
    });

    return functions;
  }

  // 列出所有事件
  listEvents() {
    const events = this.contract.interface.fragments
      .filter(fragment => fragment.type === 'event')
      .map(fragment => ({
        name: fragment.name,
        signature: fragment.format(),
        inputs: (fragment as any).inputs?.map((input: any) => ({
          name: input.name,
          type: input.type,
          indexed: input.indexed
        }))
      }));

    console.log('可用事件:');
    events.forEach(event => {
      console.log(`- ${event.name}`);
      console.log(`  签名: ${event.signature}`);
    });

    return events;
  }
}

// 使用示例
const debugger = new ContractDebugger(contract);
await debugger.checkContractState();
debugger.listFunctions();
debugger.listEvents();
await debugger.debugFunctionCall('transfer', ['0x...', ethers.parseEther('100')]);
```

## 最佳实践

### 1. 合约实例管理

```typescript
class ContractManager {
  private contracts = new Map<string, ethers.Contract>();
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // 注册合约
  registerContract(name: string, address: string, abi: any[]): void {
    const contract = new ethers.Contract(
      address, 
      abi, 
      this.signer || this.provider
    );
    this.contracts.set(name, contract);
  }

  // 获取合约
  getContract(name: string): ethers.Contract {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`合约 ${name} 未注册`);
    }
    return contract;
  }

  // 切换签名者
  setSigner(signer: ethers.Signer): void {
    this.signer = signer;
    // 更新所有合约的签名者
    for (const [name, contract] of this.contracts) {
      this.contracts.set(name, contract.connect(signer));
    }
  }

  // 批量调用只读函数
  async batchCall(calls: Array<{
    contract: string;
    function: string;
    args?: any[];
  }>): Promise<any[]> {
    const promises = calls.map(call => {
      const contract = this.getContract(call.contract);
      return contract[call.function](...(call.args || []));
    });

    return await Promise.all(promises);
  }
}

// 使用示例
const manager = new ContractManager(provider, wallet);

// 注册常用合约
manager.registerContract('USDC', '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8', ERC20_ABI);
manager.registerContract('WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', ERC20_ABI);

// 批量查询
const results = await manager.batchCall([
  { contract: 'USDC', function: 'balanceOf', args: [userAddress] },
  { contract: 'WETH', function: 'balanceOf', args: [userAddress] },
  { contract: 'USDC', function: 'decimals' },
  { contract: 'WETH', function: 'decimals' }
]);

console.log('USDC 余额:', ethers.formatUnits(results[0], results[2]));
console.log('WETH 余额:', ethers.formatUnits(results[1], results[3]));
```

### 2. 性能优化

```typescript
// 合约调用缓存
class ContractCallCache {
  private cache = new Map<string, {
    result: any;
    timestamp: number;
    ttl: number;
  }>();

  // 生成缓存键
  private generateKey(contract: ethers.Contract, functionName: string, args: any[]): string {
    const address = contract.target;
    const argsStr = JSON.stringify(args);
    return `${address}:${functionName}:${argsStr}`;
  }

  // 缓存调用
  async cachedCall(
    contract: ethers.Contract,
    functionName: string,
    args: any[] = [],
    ttl: number = 60000 // 默认缓存 1 分钟
  ): Promise<any> {
    const key = this.generateKey(contract, functionName, args);
    const cached = this.cache.get(key);

    // 检查缓存
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result;
    }

    // 执行调用
    const result = await contract[functionName](...args);
    
    // 存储缓存
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });

    return result;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }
}

// 使用示例
const cache = new ContractCallCache();

// 缓存代币信息（缓存 5 分钟）
const tokenName = await cache.cachedCall(contract, 'name', [], 300000);
const tokenSymbol = await cache.cachedCall(contract, 'symbol', [], 300000);

// 缓存用户余额（缓存 30 秒）
const balance = await cache.cachedCall(contract, 'balanceOf', [userAddress], 30000);
```

## 常见问题

### Q: 如何处理合约函数的返回值？
A: Ethers.js 会自动解析返回值。对于 BigNumber 类型，使用 `ethers.formatUnits()` 进行格式化。对于结构体，返回值是一个对象。

### Q: 为什么有些函数调用失败？
A: 常见原因包括：Gas 不足、权限不够、参数错误、合约状态不满足条件等。使用 `staticCall` 可以预先检查调用是否会成功。

### Q: 如何优化合约调用的性能？
A: 使用批量调用、缓存只读函数结果、合理设置 Gas 限制、使用 WebSocket 连接等方法。

### Q: 如何处理合约升级？
A: 对于代理合约，确保使用正确的代理地址。对于直接升级，需要更新合约地址和 ABI。

## 下一步

- [合约部署](/ethers/contracts/deployment) - 学习如何部署智能合约
- [函数调用](/ethers/contracts/function-calls) - 深入了解函数调用技巧
- [事件监听](/ethers/contracts/events) - 掌握事件处理方法
- [ABI 处理](/ethers/contracts/abi) - 学习 ABI 的高级用法