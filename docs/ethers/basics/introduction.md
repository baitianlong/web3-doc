# Ethers.js 简介

Ethers.js 是一个完整且紧凑的 JavaScript 库，用于与以太坊区块链及其生态系统进行交互。它是构建 Web3 前端应用的首选库之一。

## 什么是 Ethers.js

Ethers.js 是一个模块化的库，提供了与以太坊区块链交互所需的所有功能：

- **Provider（提供者）**：连接到以太坊网络
- **Signer（签名者）**：管理私钥和签名交易
- **Contract（合约）**：与智能合约交互
- **Utilities（工具）**：格式化、编码、解码等实用功能

## 核心特性

### 1. 模块化设计
```javascript
// 只导入需要的模块
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
```

### 2. TypeScript 支持
```typescript
import { ethers, Contract, Provider } from 'ethers';

interface TokenContract extends Contract {
  balanceOf(address: string): Promise<ethers.BigNumber>;
  transfer(to: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction>;
}
```

### 3. 多种网络支持
```javascript
// 主网
const mainnetProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 测试网
const sepoliaProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR-PROJECT-ID');

// 本地网络
const localProvider = new ethers.JsonRpcProvider('http://localhost:8545');
```

## 与其他库的比较

### Ethers.js vs Web3.js

| 特性 | Ethers.js | Web3.js |
|------|-----------|---------|
| 包大小 | 较小，模块化 | 较大，单体 |
| TypeScript | 原生支持 | 需要额外类型 |
| API 设计 | 面向对象，直观 | 函数式 |
| 文档质量 | 详细完整 | 相对简单 |
| 社区支持 | 快速增长 | 历史悠久 |

```javascript
// Ethers.js - 简洁直观
const balance = await provider.getBalance(address);
const contract = new ethers.Contract(address, abi, signer);
const tx = await contract.transfer(to, amount);

// Web3.js - 相对复杂
const balance = await web3.eth.getBalance(address);
const contract = new web3.eth.Contract(abi, address);
const tx = await contract.methods.transfer(to, amount).send({from: account});
```

## 基本概念

### Provider（提供者）
Provider 是与区块链网络的连接，用于读取区块链状态：

```javascript
// 创建 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 读取区块链数据
const blockNumber = await provider.getBlockNumber();
const balance = await provider.getBalance('0x...');
const gasPrice = await provider.getGasPrice();
```

### Signer（签名者）
Signer 是可以签名交易的对象，通常连接到私钥：

```javascript
// 从私钥创建 Signer
const wallet = new ethers.Wallet('0x...privateKey', provider);

// 从助记词创建 Signer
const mnemonic = 'abandon abandon abandon...';
const walletFromMnemonic = ethers.Wallet.fromMnemonic(mnemonic);

// 连接到 Provider
const connectedWallet = walletFromMnemonic.connect(provider);
```

### Contract（合约）
Contract 对象用于与智能合约交互：

```javascript
const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// 只读合约（使用 Provider）
const contract = new ethers.Contract(contractAddress, contractABI, provider);
const balance = await contract.balanceOf(userAddress);

// 可写合约（使用 Signer）
const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
const tx = await contractWithSigner.transfer(toAddress, amount);
```

## 快速开始示例

### 1. 基本设置
```html
<!DOCTYPE html>
<html>
<head>
    <title>Ethers.js 示例</title>
    <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
</head>
<body>
    <script>
        // 基本设置代码
    </script>
</body>
</html>
```

### 2. 连接钱包并获取余额
```javascript
async function connectWallet() {
    // 检查是否安装了 MetaMask
    if (typeof window.ethereum !== 'undefined') {
        try {
            // 请求连接钱包
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // 创建 Provider 和 Signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // 获取地址和余额
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);
            
            console.log('地址:', address);
            console.log('余额:', ethers.formatEther(balance), 'ETH');
            
            return { provider, signer, address };
        } catch (error) {
            console.error('连接钱包失败:', error);
        }
    } else {
        alert('请安装 MetaMask!');
    }
}
```

### 3. 与 ERC-20 代币交互
```javascript
async function interactWithToken() {
    const { provider, signer } = await connectWallet();
    
    // USDC 合约地址（主网）
    const tokenAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
    const tokenABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)"
    ];
    
    // 创建合约实例
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
    const tokenWithSigner = tokenContract.connect(signer);
    
    // 读取代币信息
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    const totalSupply = await tokenContract.totalSupply();
    
    console.log(`代币名称: ${name}`);
    console.log(`代币符号: ${symbol}`);
    console.log(`小数位数: ${decimals}`);
    console.log(`总供应量: ${ethers.formatUnits(totalSupply, decimals)}`);
    
    // 获取用户余额
    const userAddress = await signer.getAddress();
    const balance = await tokenContract.balanceOf(userAddress);
    console.log(`用户余额: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    
    // 转账代币（需要用户确认）
    try {
        const amount = ethers.parseUnits('10', decimals); // 转账 10 个代币
        const tx = await tokenWithSigner.transfer('0x...接收地址', amount);
        console.log('交易哈希:', tx.hash);
        
        // 等待交易确认
        const receipt = await tx.wait();
        console.log('交易已确认，区块号:', receipt.blockNumber);
    } catch (error) {
        console.error('转账失败:', error);
    }
}
```

### 4. 监听事件
```javascript
async function listenToEvents() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
    
    // USDC 合约
    const tokenAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
    const tokenABI = [
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
    
    // 监听所有转账事件
    contract.on('Transfer', (from, to, value, event) => {
        console.log('转账事件:');
        console.log('从:', from);
        console.log('到:', to);
        console.log('金额:', ethers.formatUnits(value, 6)); // USDC 有 6 位小数
        console.log('交易哈希:', event.transactionHash);
    });
    
    // 监听特定地址的转账
    const userAddress = '0x...用户地址';
    const filter = contract.filters.Transfer(userAddress, null);
    
    contract.on(filter, (from, to, value, event) => {
        console.log(`${userAddress} 发送了转账`);
    });
    
    // 查询历史事件
    const fromBlock = await provider.getBlockNumber() - 1000; // 最近 1000 个区块
    const events = await contract.queryFilter('Transfer', fromBlock);
    
    console.log(`找到 ${events.length} 个转账事件`);
    events.forEach(event => {
        console.log('历史转账:', event.args);
    });
}
```

## 常用工具函数

### 1. 格式化和解析
```javascript
// 以太币单位转换
const weiAmount = ethers.parseEther('1.5'); // 1.5 ETH 转为 wei
const etherAmount = ethers.formatEther(weiAmount); // wei 转为 ETH

// 自定义精度
const tokenAmount = ethers.parseUnits('100', 6); // 100 个 6 位小数的代币
const formattedAmount = ethers.formatUnits(tokenAmount, 6);

// 地址相关
const isValidAddress = ethers.isAddress('0x...');
const checksumAddress = ethers.getAddress('0x...'); // 转为校验和格式
```

### 2. 哈希和签名
```javascript
// 计算哈希
const messageHash = ethers.id('Hello World'); // keccak256 哈希
const solidityHash = ethers.solidityPackedKeccak256(['string'], ['Hello World']);

// 签名消息
const wallet = new ethers.Wallet('0x...privateKey');
const message = 'Hello World';
const signature = await wallet.signMessage(message);

// 验证签名
const recoveredAddress = ethers.verifyMessage(message, signature);
console.log('签名者地址:', recoveredAddress);
```

### 3. 编码和解码
```javascript
// ABI 编码
const abiCoder = ethers.AbiCoder.defaultAbiCoder();
const encoded = abiCoder.encode(['uint256', 'string'], [123, 'hello']);

// ABI 解码
const decoded = abiCoder.decode(['uint256', 'string'], encoded);
console.log('解码结果:', decoded);

// 函数选择器
const functionSelector = ethers.id('transfer(address,uint256)').slice(0, 10);
console.log('函数选择器:', functionSelector);
```

## 错误处理

### 1. 常见错误类型
```javascript
try {
    const tx = await contract.transfer(to, amount);
    await tx.wait();
} catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error('余额不足');
    } else if (error.code === 'USER_REJECTED') {
        console.error('用户拒绝交易');
    } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
        console.error('Gas 价格过低');
    } else {
        console.error('未知错误:', error.message);
    }
}
```

### 2. 合约调用错误
```javascript
try {
    const result = await contract.someFunction();
} catch (error) {
    if (error.reason) {
        console.error('合约错误:', error.reason);
    } else if (error.data) {
        // 尝试解码错误数据
        console.error('错误数据:', error.data);
    }
}
```

## 使用场景

### 1. DeFi 应用
- 代币交换
- 流动性挖矿
- 借贷协议
- 收益农场

### 2. NFT 应用
- NFT 市场
- 数字收藏品
- 游戏道具
- 艺术品交易

### 3. DAO 治理
- 投票系统
- 提案管理
- 代币分发
- 治理代币

### 4. 钱包应用
- 多签钱包
- 硬件钱包集成
- 资产管理
- 交易历史

## 开发环境设置

### 1. Node.js 项目
```bash
# 创建新项目
mkdir my-web3-app
cd my-web3-app
npm init -y

# 安装 Ethers.js
npm install ethers

# 安装开发依赖
npm install --save-dev @types/node typescript ts-node
```

### 2. React 项目
```bash
# 创建 React 应用
npx create-react-app my-dapp --template typescript
cd my-dapp

# 安装 Ethers.js
npm install ethers

# 安装 Web3 相关依赖
npm install @web3-react/core @web3-react/injected-connector
```

### 3. Vue.js 项目
```bash
# 创建 Vue 应用
npm create vue@latest my-dapp
cd my-dapp

# 安装依赖
npm install
npm install ethers
```

## 下一步

- [安装和设置](/ethers/basics/installation) - 详细的安装和配置指南
- [Provider 提供者](/ethers/basics/providers) - 深入了解 Provider 的使用
- [Signer 签名者](/ethers/basics/signers) - 学习签名者的管理和使用
- [Contract 合约](/ethers/basics/contracts) - 掌握合约交互的技巧