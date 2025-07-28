---
title: Signer 基础
description: 深入了解 Ethers.js 中的 Signer 概念，掌握签名者的基本使用方法
keywords: [ethers.js, Signer, 签名者, 私钥管理, 交易签名]
---

# Signer 基础

Signer 是 Ethers.js 中的核心抽象类，代表一个可以签名交易和消息的实体。它是连接私钥和区块链交互的桥梁。

## 什么是 Signer

Signer 是一个抽象类，定义了签名操作的接口：

```typescript
import { ethers } from 'ethers';

// Signer 是抽象类，不能直接实例化
// const signer = new ethers.Signer(); // ❌ 错误

// 需要使用具体的实现类
const wallet = new ethers.Wallet('0x...privateKey'); // ✅ 正确
const browserSigner = await provider.getSigner(); // ✅ 正确
```

## Signer 的核心功能

### 1. 基本属性和方法

```typescript
// 获取地址
const address = await signer.getAddress();
console.log('签名者地址:', address);

// 获取链 ID
const chainId = await signer.getChainId();
console.log('链 ID:', chainId);

// 获取交易计数（nonce）
const nonce = await signer.getNonce();
console.log('当前 nonce:', nonce);

// 检查是否连接到 Provider
if (signer.provider) {
  console.log('已连接到 Provider');
  const balance = await signer.provider.getBalance(address);
  console.log('余额:', ethers.formatEther(balance));
}
```

### 2. 连接到 Provider

```typescript
// 创建 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 方式1：创建时连接
const wallet = new ethers.Wallet('0x...privateKey', provider);

// 方式2：后续连接
const wallet2 = new ethers.Wallet('0x...privateKey');
const connectedWallet = wallet2.connect(provider);

// 方式3：从 Provider 获取 Signer
const browserProvider = new ethers.BrowserProvider(window.ethereum);
const browserSigner = await browserProvider.getSigner();
```

## Signer 类型

### 1. Wallet（钱包签名者）

基于私钥的签名者，最常用的 Signer 实现：

```typescript
// 从私钥创建
const wallet = new ethers.Wallet('0x...privateKey');

// 从助记词创建
const walletFromMnemonic = ethers.Wallet.fromPhrase(
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
);

// 创建随机钱包
const randomWallet = ethers.Wallet.createRandom();
console.log('随机钱包地址:', randomWallet.address);
console.log('私钥:', randomWallet.privateKey);
```

### 2. JsonRpcSigner（JSON-RPC 签名者）

通过 JSON-RPC 连接的签名者，通常来自浏览器钱包：

```typescript
// 浏览器环境
if (typeof window.ethereum !== 'undefined') {
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  
  console.log('连接的账户:', await signer.getAddress());
}
```

### 3. VoidSigner（只读签名者）

只读的签名者，不能签名但可以模拟调用：

```typescript
const voidSigner = new ethers.VoidSigner('0x...address', provider);

// 可以用于估算 Gas
const contract = new ethers.Contract(contractAddress, abi, voidSigner);
const gasEstimate = await contract.someFunction.estimateGas();
```

## 签名操作

### 1. 消息签名

```typescript
const wallet = new ethers.Wallet('0x...privateKey');

// 签名字符串消息
const message = 'Hello, Ethereum!';
const signature = await wallet.signMessage(message);
console.log('签名:', signature);

// 验证签名
const recoveredAddress = ethers.verifyMessage(message, signature);
console.log('恢复的地址:', recoveredAddress);
console.log('签名验证:', recoveredAddress === wallet.address);
```

### 2. 交易签名

```typescript
// 创建交易对象
const transaction = {
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('20', 'gwei')
};

// 签名交易
const signedTx = await wallet.signTransaction(transaction);
console.log('签名的交易:', signedTx);

// 发送交易（需要连接到 Provider）
const connectedWallet = wallet.connect(provider);
const txResponse = await connectedWallet.sendTransaction(transaction);
console.log('交易哈希:', txResponse.hash);
```

## 实用工具类

### 1. Signer 管理器

```typescript
class SignerManager {
  private signers: Map<string, ethers.Signer> = new Map();
  private currentSigner: ethers.Signer | null = null;

  // 添加签名者
  addSigner(name: string, signer: ethers.Signer) {
    this.signers.set(name, signer);
    if (!this.currentSigner) {
      this.currentSigner = signer;
    }
  }

  // 切换签名者
  switchSigner(name: string): boolean {
    const signer = this.signers.get(name);
    if (signer) {
      this.currentSigner = signer;
      return true;
    }
    return false;
  }

  // 获取当前签名者
  getCurrentSigner(): ethers.Signer | null {
    return this.currentSigner;
  }

  // 获取当前地址
  async getCurrentAddress(): Promise<string | null> {
    if (this.currentSigner) {
      return await this.currentSigner.getAddress();
    }
    return null;
  }

  // 列出所有签名者
  async listSigners(): Promise<Array<{name: string, address: string}>> {
    const result = [];
    for (const [name, signer] of this.signers) {
      const address = await signer.getAddress();
      result.push({ name, address });
    }
    return result;
  }

  // 移除签名者
  removeSigner(name: string): boolean {
    const removed = this.signers.delete(name);
    if (removed && this.currentSigner === this.signers.get(name)) {
      this.currentSigner = this.signers.values().next().value || null;
    }
    return removed;
  }
}

// 使用示例
const manager = new SignerManager();

// 添加不同类型的签名者
const wallet1 = new ethers.Wallet('0x...key1', provider);
const wallet2 = new ethers.Wallet('0x...key2', provider);

manager.addSigner('主钱包', wallet1);
manager.addSigner('备用钱包', wallet2);

// 切换签名者
manager.switchSigner('备用钱包');

// 获取当前地址
const currentAddress = await manager.getCurrentAddress();
console.log('当前地址:', currentAddress);
```

### 2. 签名验证工具

```typescript
class SignatureValidator {
  // 验证消息签名
  static verifyMessage(
    message: string,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('签名验证失败:', error);
      return false;
    }
  }

  // 验证交易签名
  static verifyTransaction(
    transaction: any,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      const serializedTx = ethers.Transaction.from(transaction).serialized;
      const recoveredAddress = ethers.recoverAddress(
        ethers.keccak256(serializedTx),
        signature
      );
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('交易签名验证失败:', error);
      return false;
    }
  }

  // 批量验证签名
  static async verifyBatchSignatures(
    signatures: Array<{
      message: string;
      signature: string;
      expectedAddress: string;
    }>
  ): Promise<boolean[]> {
    return signatures.map(({ message, signature, expectedAddress }) =>
      this.verifyMessage(message, signature, expectedAddress)
    );
  }
}
```

## 安全最佳实践

### 1. 私钥安全

```typescript
// ❌ 不要在代码中硬编码私钥
const badWallet = new ethers.Wallet('0x1234567890abcdef...');

// ✅ 使用环境变量
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('未设置私钥环境变量');
}
const wallet = new ethers.Wallet(privateKey);

// ✅ 使用加密存储
class SecureWalletStorage {
  static encrypt(privateKey: string, password: string): string {
    // 使用 ethers 内置加密
    return ethers.Wallet.fromPhrase(privateKey).encrypt(password);
  }

  static async decrypt(encryptedJson: string, password: string): Promise<ethers.Wallet> {
    return await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
  }
}
```

### 2. 签名验证

```typescript
// 始终验证签名来源
async function secureSignMessage(signer: ethers.Signer, message: string): Promise<string> {
  const address = await signer.getAddress();
  const signature = await signer.signMessage(message);
  
  // 验证签名
  const isValid = SignatureValidator.verifyMessage(message, signature, address);
  if (!isValid) {
    throw new Error('签名验证失败');
  }
  
  return signature;
}
```

### 3. 交易安全

```typescript
// 安全的交易发送
async function secureTransaction(
  signer: ethers.Signer,
  transaction: any
): Promise<ethers.TransactionResponse> {
  // 验证签名者有足够余额
  const address = await signer.getAddress();
  const balance = await signer.provider!.getBalance(address);
  
  if (balance < transaction.value) {
    throw new Error('余额不足');
  }

  // 估算 Gas
  const gasEstimate = await signer.estimateGas(transaction);
  transaction.gasLimit = gasEstimate;

  // 获取当前 Gas 价格
  const gasPrice = await signer.provider!.getGasPrice();
  transaction.gasPrice = gasPrice;

  // 发送交易
  return await signer.sendTransaction(transaction);
}
```

## 错误处理

```typescript
async function handleSignerErrors(signer: ethers.Signer) {
  try {
    const address = await signer.getAddress();
    console.log('签名者地址:', address);
    
  } catch (error: any) {
    if (error.code === 'UNSUPPORTED_OPERATION') {
      console.error('不支持的操作');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('网络错误');
    } else if (error.code === 'USER_REJECTED') {
      console.error('用户拒绝操作');
    } else {
      console.error('未知错误:', error.message);
    }
  }
}
```

## 常见问题

### Q: Signer 和 Provider 有什么区别？
A: Provider 只能读取区块链数据，Signer 可以签名和发送交易。Signer 通常需要连接到 Provider 来获取网络信息。

### Q: 如何安全地存储私钥？
A: 使用环境变量、加密存储或硬件钱包。永远不要在代码中硬编码私钥。

### Q: VoidSigner 有什么用途？
A: 用于只读操作，如估算 Gas、模拟合约调用等，不需要真实私钥。

### Q: 如何处理用户拒绝签名？
A: 捕获 `USER_REJECTED` 错误，提供友好的用户提示。

## 下一步

- [JsonRpcSigner](/ethers/signers/json-rpc-signer) - 学习浏览器钱包签名者
- [Wallet](/ethers/signers/wallet) - 深入了解钱包签名者
- [消息签名](/ethers/signers/message-signing) - 掌握消息签名技巧
- [类型化数据签名](/ethers/signers/typed-data) - 学习 EIP-712 签名