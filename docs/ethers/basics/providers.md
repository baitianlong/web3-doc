# Provider 提供者

Provider 是 Ethers.js 中连接区块链网络的核心组件，它提供了读取区块链状态和发送交易的能力。本章将详细介绍各种 Provider 的使用方法。

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

### 4. Gas 相关查询

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
console.log('估算 Gas:', await estimateGas(tx));
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
```

### 2. 合约事件监听

```typescript
// ERC-20 代币合约 ABI
const tokenABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const tokenAddress = '0x...'; // USDC 合约地址
const contract = new ethers.Contract(tokenAddress, tokenABI, provider);

// 监听所有转账事件
contract.on('Transfer', (from, to, value, event) => {
  console.log('转账事件:');
  console.log('从:', from);
  console.log('到:', to);
  console.log('金额:', ethers.formatUnits(value, 6)); // USDC 有 6 位小数
  console.log('交易哈希:', event.log.transactionHash);
});

// 监听特定地址的转账
const userAddress = '0x...';
const filter = contract.filters.Transfer(userAddress, null);

contract.on(filter, (from, to, value, event) => {
  console.log(`${userAddress} 发送了转账`);
});

// 查询历史事件
const fromBlock = await provider.getBlockNumber() - 1000;
const events = await contract.queryFilter('Transfer', fromBlock);

console.log(`找到 ${events.length} 个转账事件`);
```

### 3. 自定义过滤器

```typescript
// 创建自定义过滤器
const filter = {
  address: '0x...', // 合约地址
  topics: [
    ethers.id('Transfer(address,address,uint256)'), // 事件签名
    null, // from 地址（null 表示任意）
    ethers.zeroPadValue('0x...', 32) // to 地址
  ],
  fromBlock: 'latest'
};

// 监听过滤器
provider.on(filter, (log) => {
  console.log('匹配的日志:', log);
});

// 查询历史日志
const logs = await provider.getLogs({
  ...filter,
  fromBlock: await provider.getBlockNumber() - 1000,
  toBlock: 'latest'
});

console.log(`找到 ${logs.length} 条日志`);
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
async function getBatch