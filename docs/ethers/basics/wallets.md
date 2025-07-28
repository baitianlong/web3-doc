# Wallet 钱包

Wallet 是 Ethers.js 中最重要的组件之一，它封装了私钥管理、交易签名、账户操作等功能。本章将详细介绍钱包的创建、管理和使用。

## Wallet 基础概念

Wallet 继承自 Signer，提供了完整的账户管理功能：

- 私钥和助记词管理
- 交易签名和发送
- 消息签名
- 地址生成和验证
- HD 钱包支持

```typescript
import { ethers } from 'ethers';

// 创建随机钱包
const randomWallet = ethers.Wallet.createRandom();
console.log('地址:', randomWallet.address);
console.log('私钥:', randomWallet.privateKey);
console.log('助记词:', randomWallet.mnemonic?.phrase);

// 从私钥创建钱包
const wallet = new ethers.Wallet('0x...privateKey');

// 连接到 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const connectedWallet = wallet.connect(provider);
```

## 钱包创建方式

### 1. 随机钱包生成

```typescript
// 创建随机钱包
const wallet = ethers.Wallet.createRandom();

// 带自定义熵的随机钱包
const customEntropy = ethers.randomBytes(32);
const walletWithEntropy = ethers.Wallet.createRandom({
  extraEntropy: customEntropy
});

// 指定语言的助记词
const walletChinese = ethers.Wallet.createRandom({
  locale: ethers.wordlists.ZhCn
});

console.log('随机钱包信息:');
console.log('地址:', wallet.address);
console.log('私钥:', wallet.privateKey);
console.log('助记词:', wallet.mnemonic?.phrase);
console.log('助记词路径:', wallet.mnemonic?.path);
```

### 2. 从私钥创建

```typescript
// 从私钥创建钱包
const privateKey = '0x...';
const wallet = new ethers.Wallet(privateKey);

// 验证私钥格式
function isValidPrivateKey(key: string): boolean {
  try {
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}

// 从压缩私钥创建
function createWalletFromCompressedKey(compressedKey: string) {
  // 移除前缀并补齐长度
  const cleanKey = compressedKey.replace(/^0x/, '');
  const paddedKey = '0x' + cleanKey.padStart(64, '0');
  
  if (!is