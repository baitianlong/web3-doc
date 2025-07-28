---
title: Ethers.js vs Web3.js 对比
description: 详细对比 Ethers.js 和 Web3.js 的差异和选择建议
keywords: [ethers.js, web3.js, 对比, 选择, Web3库, 区块链开发]
---

# Ethers.js vs Web3.js 对比

本章将详细对比 Ethers.js 和 Web3.js 这两个主流的以太坊 JavaScript 库，帮助您选择最适合的开发方案。

## 概述对比

| 特性 | Ethers.js | Web3.js |
|------|-----------|---------|
| **首次发布** | 2016年 | 2014年 |
| **设计理念** | 模块化、类型安全 | 单体、功能全面 |
| **包大小** | ~300KB (压缩后) | ~1.5MB (压缩后) |
| **TypeScript** | 原生支持 | 需要额外类型定义 |
| **API 设计** | 面向对象、直观 | 函数式、传统 |
| **文档质量** | 详细完整 | 相对简单 |
| **学习曲线** | 较平缓 | 较陡峭 |
| **社区活跃度** | 快速增长 | 历史悠久 |

## 1. 安装和设置对比

### Ethers.js 安装
```bash
# 安装 Ethers.js
npm install ethers

# 包大小更小，模块化设计
import { ethers } from 'ethers';
```

### Web3.js 安装
```bash
# 安装 Web3.js
npm install web3

# 包含更多功能，但体积较大
import Web3 from 'web3';
```

## 2. Provider 连接对比

### Ethers.js - 清晰的 Provider 概念
```javascript
// Ethers.js - 直观的 Provider 设计
import { ethers } from 'ethers';

// JSON-RPC Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 浏览器 Provider
const browserProvider = new ethers.BrowserProvider(window.ethereum);

// WebSocket Provider
const wsProvider = new ethers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');

// 故障转移 Provider
const fallbackProvider = new ethers.FallbackProvider([
  new ethers.InfuraProvider('mainnet', 'PROJECT-ID'),
  new ethers.AlchemyProvider('mainnet', 'API-KEY')
]);
```

### Web3.js - 传统的连接方式
```javascript
// Web3.js - 需要手动配置
import Web3 from 'web3';

// HTTP Provider
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 浏览器 Provider
const web3Browser = new Web3(window.ethereum);

// WebSocket Provider
const web3WS = new Web3('wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID');

// 需要手动实现故障转移逻辑
```

## 3. 账户和钱包管理对比

### Ethers.js - 优雅的钱包设计
```javascript
// 创建钱包
const wallet = ethers.Wallet.createRandom();
console.log('地址:', wallet.address);
console.log('私钥:', wallet.privateKey);
console.log('助记词:', wallet.mnemonic.phrase);

// 从私钥恢复
const walletFromKey = new ethers.Wallet('0x...privateKey');

// 从助记词恢复
const walletFromMnemonic = ethers.Wallet.fromPhrase('word1 word2 ...');

// 连接到 Provider
const connectedWallet = wallet.connect(provider);

// 获取余额
const balance = await connectedWallet.provider.getBalance(wallet.address);
```

### Web3.js - 传统的账户管理
```javascript
// 创建账户
const account = web3.eth.accounts.create();
console.log('地址:', account.address);
console.log('私钥:', account.privateKey);

// 从私钥恢复
const accountFromKey = web3.eth.accounts.privateKeyToAccount('0x...privateKey');

// 助记词需要额外库支持
// npm install @truffle/hdwallet-provider

// 添加到钱包
web3.eth.accounts.wallet.add(account);

// 获取余额
const balance = await web3.eth.getBalance(account.address);
```

## 4. 合约交互对比

### Ethers.js - 类型安全的合约交互
```javascript
// 定义 ABI
const abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// 创建合约实例
const contract = new ethers.Contract(contractAddress, abi, provider);

// 只读调用
const balance = await contract.balanceOf(userAddress);
console.log('余额:', ethers.formatEther(balance));

// 写入调用（需要 Signer）
const contractWithSigner = contract.connect(signer);
const tx = await contractWithSigner.transfer(toAddress, ethers.parseEther('1.0'));
const receipt = await tx.wait();

// 事件监听
contract.on('Transfer', (from, to, amount, event) => {
  console.log(`转账: ${from} -> ${to}, 金额: ${ethers.formatEther(amount)}`);
});
```

### Web3.js - 传统的合约调用
```javascript
// 创建合约实例
const contract = new web3.eth.Contract(abi, contractAddress);

// 只读调用
const balance = await contract.methods.balanceOf(userAddress).call();
console.log('余额:', web3.utils.fromWei(balance, 'ether'));

// 写入调用
const tx = await contract.methods.transfer(toAddress, web3.utils.toWei('1.0', 'ether'))
  .send({ from: fromAddress });

// 事件监听
contract.events.Transfer({
  fromBlock: 'latest'
}, (error, event) => {
  if (!error) {
    console.log(`转账: ${event.returnValues.from} -> ${event.returnValues.to}`);
  }
});
```

## 5. 交易处理对比

### Ethers.js - 简洁的交易处理
```javascript
// 发送 ETH
const tx = await signer.sendTransaction({
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('20', 'gwei')
});

// 等待确认
const receipt = await tx.wait();
console.log('交易哈希:', receipt.hash);
console.log('Gas 使用:', receipt.gasUsed.toString());

// 交易替换
const newTx = await signer.sendTransaction({
  ...tx,
  gasPrice: ethers.parseUnits('25', 'gwei'), // 提高 Gas 价格
  nonce: tx.nonce // 使用相同 nonce
});
```

### Web3.js - 详细的交易配置
```javascript
// 发送 ETH
const tx = {
  from: fromAddress,
  to: '0x...',
  value: web3.utils.toWei('1.0', 'ether'),
  gas: 21000,
  gasPrice: web3.utils.toWei('20', 'gwei')
};

const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

console.log('交易哈希:', receipt.transactionHash);
console.log('Gas 使用:', receipt.gasUsed);

// 交易替换需要手动管理 nonce
const nonce = await web3.eth.getTransactionCount(fromAddress);
const newTx = {
  ...tx,
  gasPrice: web3.utils.toWei('25', 'gwei'),
  nonce: nonce
};
```

## 6. 错误处理对比

### Ethers.js - 结构化错误处理
```javascript
try {
  const tx = await contract.transfer(to, amount);
  await tx.wait();
} catch (error) {
  // Ethers.js 提供详细的错误信息
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('余额不足');
  } else if (error.code === 'USER_REJECTED') {
    console.error('用户拒绝交易');
  } else if (error.reason) {
    console.error('合约错误:', error.reason);
  } else {
    console.error('未知错误:', error.message);
  }
}
```

### Web3.js - 基础错误处理
```javascript
try {
  const tx = await contract.methods.transfer(to, amount).send({ from: account });
} catch (error) {
  // Web3.js 错误信息相对简单
  if (error.message.includes('insufficient funds')) {
    console.error('余额不足');
  } else if (error.message.includes('User denied')) {
    console.error('用户拒绝交易');
  } else {
    console.error('交易失败:', error.message);
  }
}
```

## 7. TypeScript 支持对比

### Ethers.js - 原生 TypeScript 支持
```typescript
import { ethers, Contract, Provider, Signer } from 'ethers';

// 强类型支持
interface TokenContract extends Contract {
  balanceOf(address: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<ethers.ContractTransaction>;
}

// 类型安全的合约交互
const tokenContract = new ethers.Contract(
  contractAddress, 
  abi, 
  provider
) as TokenContract;

const balance: bigint = await tokenContract.balanceOf(userAddress);
```

### Web3.js - 需要额外类型定义
```typescript
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// 需要安装 @types/web3
// npm install --save-dev @types/web3

// 类型支持有限
const web3 = new Web3('...');
const contract: Contract = new web3.eth.Contract(abi, contractAddress);

// 返回类型通常是 any
const balance = await contract.methods.balanceOf(userAddress).call();
```

## 8. 性能对比

### 包大小对比
```bash
# Ethers.js - 模块化，按需加载
ethers: ~300KB (gzipped)
├── @ethersproject/providers: ~50KB
├── @ethersproject/contracts: ~40KB
└── @ethersproject/wallet: ~30KB

# Web3.js - 单体包
web3: ~1.5MB (gzipped)
├── web3-eth: ~400KB
├── web3-utils: ~200KB
└── web3-core: ~300KB
```

### 运行时性能
```javascript
// Ethers.js - 优化的 BigNumber 处理
const amount = ethers.parseEther('1.0'); // 使用原生 BigInt
const formatted = ethers.formatEther(amount); // 高效格式化

// Web3.js - 传统的 BN.js
const amount = web3.utils.toWei('1.0', 'ether'); // 字符串处理
const formatted = web3.utils.fromWei(amount, 'ether'); // 额外转换
```

## 9. 生态系统对比

### Ethers.js 生态
- **Hardhat**: 原生集成 Ethers.js
- **Wagmi**: 基于 Ethers.js 的 React Hooks
- **RainbowKit**: 钱包连接组件
- **Ethers.js 插件**: 丰富的扩展生态

### Web3.js 生态
- **Truffle**: 传统的开发框架
- **Ganache**: 本地区块链
- **Web3Modal**: 钱包连接
- **历史悠久**: 更多传统项目使用

## 10. 迁移指南

### 从 Web3.js 迁移到 Ethers.js

```javascript
// Web3.js 代码
const web3 = new Web3(window.ethereum);
const contract = new web3.eth.Contract(abi, address);
const balance = await contract.methods.balanceOf(user).call();
const tx = await contract.methods.transfer(to, amount).send({ from: user });

// 等效的 Ethers.js 代码
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(address, abi, signer);
const balance = await contract.balanceOf(user);
const tx = await contract.transfer(to, amount);
```

### 常见迁移模式

| Web3.js | Ethers.js |
|---------|-----------|
| `web3.utils.toWei()` | `ethers.parseEther()` |
| `web3.utils.fromWei()` | `ethers.formatEther()` |
| `web3.eth.getBalance()` | `provider.getBalance()` |
| `web3.eth.sendTransaction()` | `signer.sendTransaction()` |
| `contract.methods.func().call()` | `contract.func()` |
| `contract.methods.func().send()` | `contract.func()` (with signer) |

## 选择建议

### 选择 Ethers.js 的情况
- ✅ 新项目开发
- ✅ 重视类型安全
- ✅ 需要模块化设计
- ✅ 包大小敏感
- ✅ 使用现代开发工具（Hardhat、Wagmi）

### 选择 Web3.js 的情况
- ✅ 维护现有项目
- ✅ 团队熟悉 Web3.js
- ✅ 使用 Truffle 生态
- ✅ 需要特定的 Web3.js 功能

## 总结

| 方面 | Ethers.js | Web3.js |
|------|-----------|---------|
| **适合新项目** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **类型安全** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **包大小** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **学习曲线** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **文档质量** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **社区支持** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **历史项目兼容** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

对于新项目，我们推荐使用 **Ethers.js**，因为它提供了更好的开发体验、类型安全和现代化的 API 设计。

## 下一步

- [Ethers.js 安装和设置](/ethers/basics/installation) - 开始使用 Ethers.js
- [Provider 详解](/ethers/providers/basics) - 深入了解 Provider
- [实战应用](/ethers/examples/wallet-connection) - 通过实例学习