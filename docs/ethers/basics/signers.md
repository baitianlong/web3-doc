# Signer 签名者

Signer 是 Ethers.js 中用于签名交易和消息的核心组件。它代表一个可以签名的账户，通常与私钥关联。

## Signer 基础概念

Signer 是一个抽象类，提供了签名功能：

- 签名交易
- 签名消息
- 发送交易
- 获取地址
- 连接到 Provider

```typescript
import { ethers } from 'ethers';

// 基本 Signer 使用
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);

// 获取地址
const address = await wallet.getAddress();
console.log('钱包地址:', address);

// 获取余额
const balance = await wallet.provider.getBalance(address);
console.log('余额:', ethers.formatEther(balance), 'ETH');
```

## Signer 类型

### 1. Wallet（钱包）

最常用的 Signer 实现，基于私钥或助记词。

```typescript
// 从私钥创建钱包
const privateKey = '0x...';
const wallet = new ethers.Wallet(privateKey);

// 连接到 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const connectedWallet = wallet.connect(provider);

// 从助记词创建钱包
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const walletFromMnemonic = ethers.Wallet.fromPhrase(mnemonic);

// 指定派生路径
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
const wallet0 = hdNode.derivePath("m/44'/60'/0'/0/0"); // 第一个账户
const wallet1 = hdNode.derivePath("m/44'/60'/0'/0/1"); // 第二个账户

console.log('第一个账户地址:', wallet0.address);
console.log('第二个账户地址:', wallet1.address);
```

### 2. JsonRpcSigner

通过 JSON-RPC 连接的 Signer，通常用于浏览器环境。

```typescript
// 浏览器环境中的 Signer
if (typeof window.ethereum !== 'undefined') {
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 请求连接钱包
  await provider.send('eth_requestAccounts', []);
  
  // 获取 Signer
  const signer = await provider.getSigner();
  
  // 获取连接的账户
  const address = await signer.getAddress();
  console.log('连接的账户:', address);
  
  // 获取链 ID
  const chainId = await signer.getChainId();
  console.log('链 ID:', chainId);
}
```

### 3. VoidSigner

只读的 Signer，不能签名但可以模拟调用。

```typescript
// 创建只读 Signer
const address = '0x...';
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const voidSigner = new ethers.VoidSigner(address, provider);

// 可以用于估算 Gas 和模拟调用
const contract = new ethers.Contract(contractAddress, abi, voidSigner);
const gasEstimate = await contract.someFunction.estimateGas();
console.log('估算 Gas:', gasEstimate.toString());
```

## 签名操作

### 1. 消息签名

```typescript
const wallet = new ethers.Wallet('0x...privateKey');

// 签名普通消息
const message = 'Hello, Ethereum!';
const signature = await wallet.signMessage(message);
console.log('签名:', signature);

// 验证签名
const recoveredAddress = ethers.verifyMessage(message, signature);
console.log('恢复的地址:', recoveredAddress);
console.log('签名验证:', recoveredAddress === wallet.address);

// 签名字节数组
const messageBytes = ethers.toUtf8Bytes(message);
const signatureBytes = await wallet.signMessage(messageBytes);
```

### 2. 类型化数据签名（EIP-712）

```typescript
// EIP-712 类型化数据签名
const domain = {
  name: 'MyDApp',
  version: '1',
  chainId: 1,
  verifyingContract: '0x...'
};

const types = {
  Person: [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' }
  ],
  Mail: [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' }
  ]
};

const value = {
  from: {
    name: 'Alice',
    wallet: '0x...'
  },
  to: {
    name: 'Bob',
    wallet: '0x...'
  },
  contents: 'Hello, Bob!'
};

// 签名类型化数据
const signature = await wallet.signTypedData(domain, types, value);
console.log('EIP-712 签名:', signature);

// 验证类型化数据签名
const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
console.log('恢复的地址:', recoveredAddress);
```

### 3. 交易签名

```typescript
// 创建交易对象
const transaction = {
  to: '0x...',
  value: ethers.parseEther('1.0'),
  gasLimit: 21000,
  gasPrice: ethers.parseUnits('20', 'gwei'),
  nonce: await wallet.getNonce()
};

// 签名交易
const signedTransaction = await wallet.signTransaction(transaction);
console.log('签名的交易:', signedTransaction);

// 发送签名的交易
const txResponse = await wallet.provider.broadcastTransaction(signedTransaction);
console.log('交易哈希:', txResponse.hash);
```

## 实际应用案例

### 1. 多账户管理器

```typescript
class MultiWalletManager {
  private wallets: Map<string, ethers.Wallet> = new Map();
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 从助记词创建多个钱包
  createWalletsFromMnemonic(mnemonic: string, count: number = 5): string[] {
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const addresses: string[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${i}`).connect(this.provider);
      this.wallets.set(wallet.address, wallet);
      addresses.push(wallet.address);
    }

    return addresses;
  }

  // 获取钱包
  getWallet(address: string): ethers.Wallet | undefined {
    return this.wallets.get(address);
  }

  // 获取所有钱包余额
  async getAllBalances(): Promise<Array<{address: string, balance: string}>> {
    const balances = [];
    
    for (const [address, wallet] of this.wallets) {
      const balance = await wallet.provider!.getBalance(address);
      balances.push({
        address,
        balance: ethers.formatEther(balance)
      });
    }

    return balances;
  }

  // 批量转账
  async batchTransfer(fromAddress: string, transfers: Array<{to: string, amount: string}>) {
    const wallet = this.getWallet(fromAddress);
    if (!wallet) throw new Error('钱包不存在');

    const transactions = [];
    let nonce = await wallet.getNonce();

    for (const transfer of transfers) {
      const tx = await wallet.sendTransaction({
        to: transfer.to,
        value: ethers.parseEther(transfer.amount),
        nonce: nonce++
      });
      transactions.push(tx);
    }

    return transactions;
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR-PROJECT-ID');
const manager = new MultiWalletManager(provider);

const mnemonic = 'your twelve word mnemonic phrase here...';
const addresses = manager.createWalletsFromMnemonic(mnemonic, 3);
console.log('创建的钱包地址:', addresses);

// 获取所有余额
const balances = await manager.getAllBalances();
console.log('钱包余额:', balances);
```

### 2. 签名验证服务

```typescript
class SignatureVerificationService {
  // 验证消息签名
  static verifyMessageSignature(
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

  // 验证登录签名
  static verifyLoginSignature(
    address: string,
    signature: string,
    nonce: string,
    timestamp: number
  ): boolean {
    // 检查时间戳（5分钟内有效）
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 300) {
      console.error('签名已过期');
      return false;
    }

    // 构造登录消息
    const message = `登录验证\n地址: ${address}\n随机数: ${nonce}\n时间戳: ${timestamp}`;
    
    return this.verifyMessageSignature(message, signature, address);
  }

  // 验证 EIP-712 签名
  static verifyTypedDataSignature(
    domain: any,
    types: any,
    value: any,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('类型化数据签名验证失败:', error);
      return false;
    }
  }
}

// 使用示例
const message = 'Hello, World!';
const wallet = new ethers.Wallet('0x...');
const signature = await wallet.signMessage(message);

const isValid = SignatureVerificationService.verifyMessageSignature(
  message,
  signature,
  wallet.address
);
console.log('签名验证结果:', isValid);
```

### 3. 安全钱包包装器

```typescript
class SecureWallet {
  private wallet: ethers.Wallet;
  private maxGasPrice: bigint;
  private dailyLimit: bigint;
  private dailySpent: bigint = 0n;
  private lastResetDate: string;

  constructor(
    privateKey: string,
    provider: ethers.Provider,
    maxGasPriceGwei: number = 100,
    dailyLimitEth: number = 10
  ) {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.maxGasPrice = ethers.parseUnits(maxGasPriceGwei.toString(), 'gwei');
    this.dailyLimit = ethers.parseEther(dailyLimitEth.toString());
    this.lastResetDate = new Date().toDateString();
  }

  // 重置每日限额
  private resetDailyLimitIfNeeded() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpent = 0n;
      this.lastResetDate = today;
    }
  }

  // 安全发送交易
  async sendTransaction(transaction: any) {
    this.resetDailyLimitIfNeeded();

    // 检查 Gas 价格
    const gasPrice = transaction.gasPrice || await this.wallet.provider!.getGasPrice();
    if (gasPrice > this.maxGasPrice) {
      throw new Error(`Gas 价格过高: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
    }

    // 检查每日限额
    const value = BigInt(transaction.value || 0);
    if (this.dailySpent + value > this.dailyLimit) {
      throw new Error('超出每日转账限额');
    }

    // 估算 Gas
    const gasEstimate = await this.wallet.estimateGas(transaction);
    const gasLimit = gasEstimate * 120n / 100n; // 增加 20% 缓冲

    // 发送交易
    const tx = await this.wallet.sendTransaction({
      ...transaction,
      gasLimit,
      gasPrice
    });

    // 更新每日支出
    this.dailySpent += value;

    return tx;
  }

  // 批量转账（带安全检查）
  async batchTransfer(transfers: Array<{to: string, amount: string}>) {
    this.resetDailyLimitIfNeeded();

    // 计算总金额
    const totalAmount = transfers.reduce(
      (sum, transfer) => sum + ethers.parseEther(transfer.amount),
      0n
    );

    if (this.dailySpent + totalAmount > this.dailyLimit) {
      throw new Error('批量转账超出每日限额');
    }

    const transactions = [];
    let nonce = await this.wallet.getNonce();

    for (const transfer of transfers) {
      const tx = await this.sendTransaction({
        to: transfer.to,
        value: ethers.parseEther(transfer.amount),
        nonce: nonce++
      });
      transactions.push(tx);
    }

    return transactions;
  }

  // 获取钱包信息
  async getWalletInfo() {
    this.resetDailyLimitIfNeeded();
    
    const address = await this.wallet.getAddress();
    const balance = await this.wallet.provider!.getBalance(address);
    
    return {
      address,
      balance: ethers.formatEther(balance),
      dailyLimit: ethers.formatEther(this.dailyLimit),
      dailySpent: ethers.formatEther(this.dailySpent),
      remainingDaily: ethers.formatEther(this.dailyLimit - this.dailySpent)
    };
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR-PROJECT-ID');
const secureWallet = new SecureWallet(
  '0x...privateKey',
  provider,
  50, // 最大 50 Gwei
  5   // 每日限额 5 ETH
);

const walletInfo = await secureWallet.getWalletInfo();
console.log('安全钱包信息:', walletInfo);
```

### 4. 离线签名工具

```typescript
class OfflineSigningTool {
  private wallet: ethers.Wallet;

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
  }

  // 离线签名交易
  async signTransactionOffline(transactionData: {
    to: string;
    value: string;
    gasLimit: number;
    gasPrice: string;
    nonce: number;
    chainId: number;
    data?: string;
  }) {
    const transaction = {
      to: transactionData.to,
      value: ethers.parseEther(transactionData.value),
      gasLimit: transactionData.gasLimit,
      gasPrice: ethers.parseUnits(transactionData.gasPrice, 'gwei'),
      nonce: transactionData.nonce,
      chainId: transactionData.chainId,
      data: transactionData.data || '0x'
    };

    const signedTransaction = await this.wallet.signTransaction(transaction);
    
    return {
      signedTransaction,
      transactionHash: ethers.keccak256(signedTransaction),
      from: this.wallet.address
    };
  }

  // 批量离线签名
  async batchSignTransactions(transactions: any[]) {
    const signedTransactions = [];
    
    for (const tx of transactions) {
      const signed = await this.signTransactionOffline(tx);
      signedTransactions.push(signed);
    }
    
    return signedTransactions;
  }

  // 签名授权消息
  async signPermitMessage(tokenAddress: string, spender: string, value: string, deadline: number, nonce: number) {
    const domain = {
      name: 'Token',
      version: '1',
      chainId: 1,
      verifyingContract: tokenAddress
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const values = {
      owner: this.wallet.address,
      spender,
      value: ethers.parseEther(value),
      nonce,
      deadline
    };

    const signature = await this.wallet.signTypedData(domain, types, values);
    
    // 分解签名
    const sig = ethers.Signature.from(signature);
    
    return {
      signature,
      v: sig.v,
      r: sig.r,
      s: sig.s,
      deadline,
      nonce
    };
  }
}

// 使用示例
const offlineTool = new OfflineSigningTool('0x...privateKey');

// 离线签名交易
const signedTx = await offlineTool.signTransactionOffline({
  to: '0x...',
  value: '1.0',
  gasLimit: 21000,
  gasPrice: '20',
  nonce: 42,
  chainId: 1
});

console.log('离线签名的交易:', signedTx);

// 签名 Permit 消息
const permitSignature = await offlineTool.signPermitMessage(
  '0x...tokenAddress',
  '0x...spenderAddress',
  '100',
  Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
  0
);

console.log('Permit 签名:', permitSignature);
```

## 安全最佳实践

### 1. 私钥管理

```typescript
// 不要在代码中硬编码私钥
// ❌ 错误做法
const wallet = new ethers.Wallet('0x1234567890abcdef...');

// ✅ 正确做法
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('未设置私钥环境变量');
}
const wallet = new ethers.Wallet(privateKey);

// 使用加密存储
import * as crypto from 'crypto';

class EncryptedWalletStorage {
  static encrypt(privateKey: string, password: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decrypt(encryptedKey: string, password: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 2. 交易验证

```typescript
class TransactionValidator {
  static async validateTransaction(transaction: any, wallet: ethers.Wallet) {
    // 验证接收地址
    if (!ethers.isAddress(transaction.to)) {
      throw new Error('无效的接收地址');
    }

    // 验证金额
    const value = BigInt(transaction.value || 0);
    if (value < 0) {
      throw new Error('转账金额不能为负数');
    }

    // 检查余额
    const balance = await wallet.provider!.getBalance(wallet.address);
    const gasLimit = BigInt(transaction.gasLimit || 21000);
    const gasPrice = BigInt(transaction.gasPrice || await wallet.provider!.getGasPrice());
    const totalCost = value + (gasLimit * gasPrice);

    if (balance < totalCost) {
      throw new Error('余额不足');
    }

    // 验证 nonce
    const currentNonce = await wallet.getNonce();
    if (transaction.nonce !== undefined && transaction.nonce < currentNonce) {
      throw new Error('Nonce 过低');
    }

    return true;
  }
}
```

## 错误处理

```typescript
async function safeSignAndSend(wallet: ethers.Wallet, transaction: any) {
  try {
    // 验证交易
    await TransactionValidator.validateTransaction(transaction, wallet);
    
    // 发送交易
    const tx = await wallet.sendTransaction(transaction);
    console.log('交易已发送:', tx.hash);
    
    // 等待确认
    const receipt = await tx.wait();
    console.log('交易已确认:', receipt.status === 1 ? '成功' : '失败');
    
    return receipt;
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('余额不足');
    } else if (error.code === 'USER_REJECTED') {
      console.error('用户拒绝交易');
    } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
      console.error('Gas 价格过低');
    } else {
      console.error('交易失败:', error.message);
    }
    throw error;
  }
}
```

## 下一步

- [Contract 合约](/ethers/basics/contracts) - 学习合约交互
- [Wallet 钱包](/ethers/basics/wallets) - 深入了解钱包管理
- [连接钱包](/ethers/core/wallet-connection) - 实现钱包连接功能