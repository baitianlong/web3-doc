---
title: Wallet
description: 深入了解 Ethers.js 中的 Wallet 类，掌握私钥钱包管理和操作
keywords: [ethers.js, Wallet, 私钥管理, 助记词, HD钱包, 钱包创建]
---

# Wallet

`Wallet` 是 Ethers.js 中基于私钥的 Signer 实现，它直接管理私钥并提供完整的签名功能。Wallet 是构建去中心化应用时最常用的签名者类型之一。

## 基本概念

Wallet 继承自 Signer，封装了私钥管理和签名操作：

```typescript
import { ethers } from 'ethers';

// 从私钥创建钱包
const wallet = new ethers.Wallet('0x...privateKey');

// 连接到 Provider
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const connectedWallet = wallet.connect(provider);

console.log('钱包地址:', wallet.address);
console.log('私钥:', wallet.privateKey);
```

## 钱包创建方式

### 1. 从私钥创建

```typescript
// 直接使用私钥
const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const wallet = new ethers.Wallet(privateKey);

console.log('地址:', wallet.address);
console.log('私钥:', wallet.privateKey);

// 连接到网络
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const connectedWallet = wallet.connect(provider);
```

### 2. 创建随机钱包

```typescript
// 创建随机钱包
const randomWallet = ethers.Wallet.createRandom();

console.log('随机钱包信息:', {
  address: randomWallet.address,
  privateKey: randomWallet.privateKey,
  mnemonic: randomWallet.mnemonic?.phrase
});

// 可以选择指定熵源
const customEntropy = ethers.randomBytes(32);
const customWallet = ethers.Wallet.createRandom({
  entropy: customEntropy
});
```

### 3. 从助记词创建

```typescript
// 从助记词创建钱包
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const walletFromMnemonic = ethers.Wallet.fromPhrase(mnemonic);

console.log('从助记词创建的钱包:', {
  address: walletFromMnemonic.address,
  privateKey: walletFromMnemonic.privateKey,
  mnemonic: walletFromMnemonic.mnemonic?.phrase
});

// 指定派生路径
const customPath = "m/44'/60'/0'/0/1"; // 第二个账户
const walletWithPath = ethers.Wallet.fromPhrase(mnemonic, undefined, customPath);
console.log('自定义路径钱包地址:', walletWithPath.address);
```

### 4. 从加密 JSON 创建

```typescript
// 从加密的 JSON 钱包文件创建
async function createFromEncryptedJson() {
  const encryptedJson = `{
    "address": "...",
    "crypto": { ... },
    "id": "...",
    "version": 3
  }`;
  
  const password = 'your-password';
  
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
    console.log('从加密 JSON 创建的钱包:', wallet.address);
    return wallet;
  } catch (error) {
    console.error('解密失败:', error);
    throw error;
  }
}
```

## HD 钱包管理

### 1. HD 钱包基础

```typescript
// 创建 HD 钱包根节点
const mnemonic = ethers.Wallet.createRandom().mnemonic!;
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic.phrase);

console.log('HD 钱包根节点:', {
  address: hdNode.address,
  path: hdNode.path,
  mnemonic: hdNode.mnemonic?.phrase
});

// 派生子钱包
const child0 = hdNode.derivePath("m/44'/60'/0'/0/0"); // 第一个账户
const child1 = hdNode.derivePath("m/44'/60'/0'/0/1"); // 第二个账户
const child2 = hdNode.derivePath("m/44'/60'/0'/0/2"); // 第三个账户

console.log('派生的钱包地址:', [
  child0.address,
  child1.address,
  child2.address
]);
```

### 2. HD 钱包管理器

```typescript
class HDWalletManager {
  private rootNode: ethers.HDNodeWallet;
  private wallets: Map<number, ethers.HDNodeWallet> = new Map();
  private provider: ethers.Provider | null = null;

  constructor(mnemonic?: string) {
    if (mnemonic) {
      this.rootNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    } else {
      // 创建新的随机 HD 钱包
      const randomWallet = ethers.Wallet.createRandom();
      this.rootNode = ethers.HDNodeWallet.fromPhrase(randomWallet.mnemonic!.phrase);
    }
  }

  // 连接到 Provider
  connect(provider: ethers.Provider): void {
    this.provider = provider;
    
    // 为已创建的钱包连接 Provider
    for (const wallet of this.wallets.values()) {
      wallet.connect(provider);
    }
  }

  // 获取或创建指定索引的钱包
  getWallet(index: number): ethers.HDNodeWallet {
    if (!this.wallets.has(index)) {
      const path = `m/44'/60'/0'/0/${index}`;
      const wallet = this.rootNode.derivePath(path);
      
      if (this.provider) {
        wallet.connect(this.provider);
      }
      
      this.wallets.set(index, wallet);
    }
    
    return this.wallets.get(index)!;
  }

  // 批量创建钱包
  createWallets(count: number): ethers.HDNodeWallet[] {
    const wallets: ethers.HDNodeWallet[] = [];
    
    for (let i = 0; i < count; i++) {
      wallets.push(this.getWallet(i));
    }
    
    return wallets;
  }

  // 获取所有钱包地址
  getAllAddresses(): string[] {
    return Array.from(this.wallets.values()).map(wallet => wallet.address);
  }

  // 获取所有钱包余额
  async getAllBalances(): Promise<Map<string, string>> {
    if (!this.provider) {
      throw new Error('未连接到 Provider');
    }

    const balances = new Map<string, string>();
    
    for (const [index, wallet] of this.wallets) {
      try {
        const balance = await this.provider.getBalance(wallet.address);
        balances.set(wallet.address, ethers.formatEther(balance));
      } catch (error) {
        console.error(`获取钱包 ${index} 余额失败:`, error);
        balances.set(wallet.address, '0');
      }
    }
    
    return balances;
  }

  // 查找有余额的钱包
  async findWalletsWithBalance(): Promise<Array<{index: number, address: string, balance: string}>> {
    if (!this.provider) {
      throw new Error('未连接到 Provider');
    }

    const walletsWithBalance = [];
    
    for (const [index, wallet] of this.wallets) {
      try {
        const balance = await this.provider.getBalance(wallet.address);
        if (balance > 0n) {
          walletsWithBalance.push({
            index,
            address: wallet.address,
            balance: ethers.formatEther(balance)
          });
        }
      } catch (error) {
        console.error(`检查钱包 ${index} 余额失败:`, error);
      }
    }
    
    return walletsWithBalance;
  }

  // 获取助记词
  getMnemonic(): string {
    return this.rootNode.mnemonic!.phrase;
  }

  // 导出钱包信息
  exportWalletInfo(index: number): {
    address: string;
    privateKey: string;
    path: string;
    mnemonic: string;
  } {
    const wallet = this.getWallet(index);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      path: wallet.path!,
      mnemonic: this.getMnemonic()
    };
  }
}

// 使用示例
const hdManager = new HDWalletManager();
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
hdManager.connect(provider);

// 创建前 5 个钱包
const wallets = hdManager.createWallets(5);
console.log('创建的钱包地址:', wallets.map(w => w.address));

// 获取余额
const balances = await hdManager.getAllBalances();
console.log('钱包余额:', balances);
```

## 钱包加密和存储

### 1. 钱包加密

```typescript
class SecureWalletStorage {
  // 加密钱包
  static async encryptWallet(
    wallet: ethers.Wallet, 
    password: string,
    options?: any
  ): Promise<string> {
    try {
      const encryptedJson = await wallet.encrypt(password, options);
      return encryptedJson;
    } catch (error) {
      console.error('钱包加密失败:', error);
      throw error;
    }
  }

  // 解密钱包
  static async decryptWallet(
    encryptedJson: string, 
    password: string
  ): Promise<ethers.Wallet> {
    try {
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
      return wallet;
    } catch (error) {
      console.error('钱包解密失败:', error);
      throw error;
    }
  }

  // 安全存储到本地存储
  static storeEncryptedWallet(
    name: string, 
    encryptedJson: string
  ): void {
    try {
      const wallets = this.getStoredWallets();
      wallets[name] = {
        encryptedJson,
        timestamp: Date.now()
      };
      
      localStorage.setItem('encrypted_wallets', JSON.stringify(wallets));
      console.log(`钱包 ${name} 已安全存储`);
    } catch (error) {
      console.error('存储钱包失败:', error);
      throw error;
    }
  }

  // 从本地存储加载钱包
  static async loadStoredWallet(
    name: string, 
    password: string
  ): Promise<ethers.Wallet | null> {
    try {
      const wallets = this.getStoredWallets();
      const walletData = wallets[name];
      
      if (!walletData) {
        console.log(`钱包 ${name} 不存在`);
        return null;
      }
      
      return await this.decryptWallet(walletData.encryptedJson, password);
    } catch (error) {
      console.error('加载钱包失败:', error);
      return null;
    }
  }

  // 获取所有存储的钱包名称
  static getStoredWalletNames(): string[] {
    const wallets = this.getStoredWallets();
    return Object.keys(wallets);
  }

  // 删除存储的钱包
  static removeStoredWallet(name: string): boolean {
    try {
      const wallets = this.getStoredWallets();
      
      if (wallets[name]) {
        delete wallets[name];
        localStorage.setItem('encrypted_wallets', JSON.stringify(wallets));
        console.log(`钱包 ${name} 已删除`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('删除钱包失败:', error);
      return false;
    }
  }

  private static getStoredWallets(): any {
    try {
      const stored = localStorage.getItem('encrypted_wallets');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('读取存储的钱包失败:', error);
      return {};
    }
  }
}

// 使用示例
async function walletStorageExample() {
  // 创建钱包
  const wallet = ethers.Wallet.createRandom();
  console.log('创建的钱包地址:', wallet.address);

  // 加密钱包
  const password = 'secure-password-123';
  const encryptedJson = await SecureWalletStorage.encryptWallet(wallet, password);

  // 存储钱包
  SecureWalletStorage.storeEncryptedWallet('my-wallet', encryptedJson);

  // 加载钱包
  const loadedWallet = await SecureWalletStorage.loadStoredWallet('my-wallet', password);
  
  if (loadedWallet) {
    console.log('加载的钱包地址:', loadedWallet.address);
    console.log('地址匹配:', wallet.address === loadedWallet.address);
  }
}
```

### 2. 多钱包管理

```typescript
class MultiWalletManager {
  private wallets: Map<string, ethers.Wallet> = new Map();
  private currentWallet: string | null = null;
  private provider: ethers.Provider | null = null;

  constructor(provider?: ethers.Provider) {
    this.provider = provider || null;
  }

  // 添加钱包
  addWallet(name: string, wallet: ethers.Wallet): void {
    if (this.provider) {
      wallet = wallet.connect(this.provider);
    }
    
    this.wallets.set(name, wallet);
    
    if (!this.currentWallet) {
      this.currentWallet = name;
    }
    
    console.log(`钱包 ${name} 已添加:`, wallet.address);
  }

  // 从私钥添加钱包
  addWalletFromPrivateKey(name: string, privateKey: string): void {
    const wallet = new ethers.Wallet(privateKey);
    this.addWallet(name, wallet);
  }

  // 从助记词添加钱包
  addWalletFromMnemonic(name: string, mnemonic: string, path?: string): void {
    const wallet = ethers.Wallet.fromPhrase(mnemonic, undefined, path);
    this.addWallet(name, wallet);
  }

  // 创建随机钱包
  createRandomWallet(name: string): ethers.Wallet {
    const wallet = ethers.Wallet.createRandom();
    this.addWallet(name, wallet);
    return wallet;
  }

  // 切换当前钱包
  switchWallet(name: string): boolean {
    if (this.wallets.has(name)) {
      this.currentWallet = name;
      console.log(`已切换到钱包: ${name}`);
      return true;
    }
    
    console.error(`钱包 ${name} 不存在`);
    return false;
  }

  // 获取当前钱包
  getCurrentWallet(): ethers.Wallet | null {
    if (this.currentWallet) {
      return this.wallets.get(this.currentWallet) || null;
    }
    return null;
  }

  // 获取指定钱包
  getWallet(name: string): ethers.Wallet | null {
    return this.wallets.get(name) || null;
  }

  // 获取所有钱包信息
  async getAllWalletInfo(): Promise<Array<{
    name: string;
    address: string;
    balance?: string;
  }>> {
    const walletInfo = [];
    
    for (const [name, wallet] of this.wallets) {
      const info: any = {
        name,
        address: wallet.address
      };
      
      // 如果连接了 Provider，获取余额
      if (this.provider) {
        try {
          const balance = await this.provider.getBalance(wallet.address);
          info.balance = ethers.formatEther(balance);
        } catch (error) {
          console.error(`获取钱包 ${name} 余额失败:`, error);
          info.balance = 'Error';
        }
      }
      
      walletInfo.push(info);
    }
    
    return walletInfo;
  }

  // 移除钱包
  removeWallet(name: string): boolean {
    const removed = this.wallets.delete(name);
    
    if (removed) {
      console.log(`钱包 ${name} 已移除`);
      
      // 如果移除的是当前钱包，切换到其他钱包
      if (this.currentWallet === name) {
        const remainingWallets = Array.from(this.wallets.keys());
        this.currentWallet = remainingWallets.length > 0 ? remainingWallets[0] : null;
      }
    }
    
    return removed;
  }

  // 连接到 Provider
  connectProvider(provider: ethers.Provider): void {
    this.provider = provider;
    
    // 为所有钱包连接 Provider
    for (const [name, wallet] of this.wallets) {
      this.wallets.set(name, wallet.connect(provider));
    }
    
    console.log('所有钱包已连接到 Provider');
  }

  // 批量发送交易
  async sendBatchTransactions(
    transactions: Array<{
      walletName: string;
      transaction: any;
    }>
  ): Promise<Array<{
    walletName: string;
    txHash?: string;
    error?: string;
  }>> {
    const results = [];
    
    for (const { walletName, transaction } of transactions) {
      try {
        const wallet = this.getWallet(walletName);
        
        if (!wallet) {
          results.push({
            walletName,
            error: '钱包不存在'
          });
          continue;
        }
        
        const txResponse = await wallet.sendTransaction(transaction);
        results.push({
          walletName,
          txHash: txResponse.hash
        });
        
      } catch (error: any) {
        results.push({
          walletName,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // 导出钱包配置
  exportConfiguration(): any {
    const config: any = {
      wallets: {},
      currentWallet: this.currentWallet
    };
    
    for (const [name, wallet] of this.wallets) {
      config.wallets[name] = {
        address: wallet.address,
        // 注意：不导出私钥，仅导出地址用于识别
      };
    }
    
    return config;
  }

  // 获取钱包统计
  getStatistics(): {
    totalWallets: number;
    currentWallet: string | null;
    walletNames: string[];
  } {
    return {
      totalWallets: this.wallets.size,
      currentWallet: this.currentWallet,
      walletNames: Array.from(this.wallets.keys())
    };
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const manager = new MultiWalletManager(provider);

// 添加不同类型的钱包
manager.addWalletFromPrivateKey('主钱包', '0x...');
manager.addWalletFromMnemonic('HD钱包', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
manager.addWalletFromMnemonic('测试钱包', 'test test test test test test test test test test test junk');

// 创建随机钱包
const randomWallet = manager.createRandomWallet('随机钱包');
console.log('创建的随机钱包:', randomWallet.address);

// 获取所有钱包信息
const allWallets = await manager.getAllWalletInfo();
console.log('所有钱包:', allWallets);

// 切换钱包
manager.switchWallet('测试钱包');

// 发送交易
const currentWallet = manager.getCurrentWallet();
if (currentWallet) {
  const tx = await currentWallet.sendTransaction({
    to: '0x...',
    value: ethers.parseEther('0.1')
  });
  console.log('交易哈希:', tx.hash);
}
```

## 高级功能

### 1. 钱包工厂

```typescript
class WalletFactory {
  // 批量创建钱包
  static createBatch(count: number): ethers.Wallet[] {
    const wallets: ethers.Wallet[] = [];
    
    for (let i = 0; i < count; i++) {
      wallets.push(ethers.Wallet.createRandom());
    }
    
    return wallets;
  }

  // 从种子创建确定性钱包
  static createFromSeed(seed: string, count: number): ethers.Wallet[] {
    const wallets: ethers.Wallet[] = [];
    
    for (let i = 0; i < count; i++) {
      const entropy = ethers.keccak256(ethers.toUtf8Bytes(`${seed}-${i}`));
      const wallet = ethers.Wallet.createRandom({ entropy });
      wallets.push(wallet);
    }
    
    return wallets;
  }

  // 创建多签钱包地址
  static createMultisigAddress(
    owners: string[],
    threshold: number
  ): string {
    // 这里是简化示例，实际需要使用多签合约工厂
    const sortedOwners = owners.sort();
    const data = ethers.solidityPacked(
      ['address[]', 'uint256'],
      [sortedOwners, threshold]
    );
    return ethers.getCreate2Address(
      '0x...', // 工厂地址
      ethers.keccak256(data),
      '0x...' // 合约字节码哈希
    );
  }

  // 验证钱包格式
  static validateWallet(wallet: any): boolean {
    try {
      return (
        wallet &&
        typeof wallet.address === 'string' &&
        typeof wallet.privateKey === 'string' &&
        ethers.isAddress(wallet.address) &&
        wallet.privateKey.startsWith('0x') &&
        wallet.privateKey.length === 66
      );
    } catch {
      return false;
    }
  }
}
```

### 2. 钱包监控

```typescript
class WalletMonitor {
  private wallets: Map<string, ethers.Wallet> = new Map();
  private provider: ethers.Provider;
  private listeners: Map<string, any[]> = new Map();

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 添加监控钱包
  addWallet(name: string, wallet: ethers.Wallet): void {
    this.wallets.set(name, wallet.connect(this.provider));
    this.listeners.set(name, []);
  }

  // 监控余额变化
  watchBalance(
    walletName: string,
    callback: (balance: string, previousBalance: string) => void
  ): () => void {
    const wallet = this.wallets.get(walletName);
    if (!wallet) {
      throw new Error(`钱包 ${walletName} 不存在`);
    }

    let previousBalance = '0';

    const checkBalance = async () => {
      try {
        const balance = await this.provider.getBalance(wallet.address);
        const balanceStr = ethers.formatEther(balance);
        
        if (balanceStr !== previousBalance) {
          callback(balanceStr, previousBalance);
          previousBalance = balanceStr;
        }
      } catch (error) {
        console.error(`检查 ${walletName} 余额失败:`, error);
      }
    };

    // 立即检查一次
    checkBalance();

    // 定期检查
    const interval = setInterval(checkBalance, 10000); // 每10秒检查一次

    // 监听新区块
    const blockListener = () => checkBalance();
    this.provider.on('block', blockListener);

    // 存储监听器
    const listeners = this.listeners.get(walletName)!;
    listeners.push({ interval, blockListener });

    // 返回清理函数
    return () => {
      clearInterval(interval);
      this.provider.off('block', blockListener);
      
      const index = listeners.findIndex(l => l.interval === interval);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // 监控交易
  watchTransactions(
    walletName: string,
    callback: (tx: ethers.TransactionResponse) => void
  ): () => void {
    const wallet = this.wallets.get(walletName);
    if (!wallet) {
      throw new Error(`钱包 ${walletName} 不存在`);
    }

    const filter = {
      address: wallet.address
    };

    const listener = (log: any) => {
      // 处理交易日志
      if (log.address === wallet.address) {
        this.provider.getTransaction(log.transactionHash).then(tx => {
          if (tx) callback(tx);
        });
      }
    };

    this.provider.on(filter, listener);

    // 存储监听器
    const listeners = this.listeners.get(walletName)!;
    listeners.push({ filter, listener });

    return () => {
      this.provider.off(filter, listener);
      
      const index = listeners.findIndex(l => l.filter === filter);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // 获取钱包统计
  async getWalletStats(walletName: string): Promise<{
    address: string;
    balance: string;
    transactionCount: number;
    firstTransaction?: string;
    lastTransaction?: string;
  }> {
    const wallet = this.wallets.get(walletName);
    if (!wallet) {
      throw new Error(`钱包 ${walletName} 不存在`);
    }

    const [balance, transactionCount] = await Promise.all([
      this.provider.getBalance(wallet.address),
      this.provider.getTransactionCount(wallet.address)
    ]);

    const stats = {
      address: wallet.address,
      balance: ethers.formatEther(balance),
      transactionCount,
      firstTransaction: undefined as string | undefined,
      lastTransaction: undefined as string | undefined
    };

    // 获取最近的交易（简化实现）
    if (transactionCount > 0) {
      try {
        // 这里需要使用区块浏览器 API 或索引服务
        // 简化示例，实际应用中需要更复杂的实现
      } catch (error) {
        console.error('获取交易历史失败:', error);
      }
    }

    return stats;
  }

  // 清理所有监听器
  cleanup(): void {
    for (const [walletName, listeners] of this.listeners) {
      for (const listener of listeners) {
        if (listener.interval) {
          clearInterval(listener.interval);
        }
        if (listener.blockListener) {
          this.provider.off('block', listener.blockListener);
        }
        if (listener.filter && listener.listener) {
          this.provider.off(listener.filter, listener.listener);
        }
      }
    }
    
    this.listeners.clear();
  }
}
```

## 安全最佳实践

### 1. 私钥安全

```typescript
class SecureWalletManager {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  // 安全生成私钥
  static generateSecurePrivateKey(): string {
    const randomBytes = ethers.randomBytes(32);
    return ethers.hexlify(randomBytes);
  }

  // 验证私钥强度
  static validatePrivateKeyStrength(privateKey: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'strong';

    // 检查格式
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      issues.push('私钥格式无效');
      return { isValid: false, strength: 'weak', issues };
    }

    // 检查是否为零
    if (privateKey === '0x' + '0'.repeat(64)) {
      issues.push('私钥不能为零');
      strength = 'weak';
    }

    // 检查是否为最大值
    const maxKey = '0x' + 'f'.repeat(64);
    if (privateKey === maxKey) {
      issues.push('私钥不能为最大值');
      strength = 'weak';
    }

    // 检查熵（简化检查）
    const keyBytes = ethers.getBytes(privateKey);
    const uniqueBytes = new Set(keyBytes).size;
    
    if (uniqueBytes < 16) {
      issues.push('私钥熵不足');
      strength = 'weak';
    } else if (uniqueBytes < 32) {
      strength = 'medium';
    }

    return {
      isValid: issues.length === 0 || strength !== 'weak',
      strength,
      issues
    };
  }

  // 安全存储私钥
  static async secureStorePrivateKey(
    privateKey: string,
    password: string,
    additionalData?: string
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    
    const encryptionOptions = {
      scrypt: {
        N: 1 << 17, // 更高的 N 值增加安全性
        r: 8,
        p: 1
      }
    };

    return await wallet.encrypt(password, encryptionOptions);
  }

  // 安全加载私钥
  static async secureLoadPrivateKey(
    encryptedJson: string,
    password: string
  ): Promise<ethers.Wallet> {
    try {
      return await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
    } catch (error) {
      throw new Error('密码错误或数据损坏');
    }
  }
}
```

### 2. 交易安全

```typescript
class SecureTransactionManager {
  private wallet: ethers.Wallet;
  private maxGasPrice: bigint;
  private dailyLimit: bigint;
  private dailySpent: bigint = 0n;
  private lastResetDate: string;

  constructor(
    wallet: ethers.Wallet,
    maxGasPriceGwei: number = 100,
    dailyLimitEth: number = 10
  ) {
    this.wallet = wallet;
    this.maxGasPrice = ethers.parseUnits(maxGasPriceGwei.toString(), 'gwei');
    this.dailyLimit = ethers.parseEther(dailyLimitEth.toString());
    this.lastResetDate = new Date().toDateString();
  }

  // 安全发送交易
  async secureTransaction(transaction: any): Promise<ethers.TransactionResponse> {
    // 重置每日限额
    this.resetDailyLimitIfNeeded();

    // 验证交易
    await this.validateTransaction(transaction);

    // 检查每日限额
    this.checkDailyLimit(transaction.value || 0n);

    // 设置安全的 Gas 参数
    await this.setSafeGasParameters(transaction);

    // 发送交易
    const txResponse = await this.wallet.sendTransaction(transaction);

    // 更新每日支出
    this.dailySpent += transaction.value || 0n;

    return txResponse;
  }

  private async validateTransaction(transaction: any): Promise<void> {
    // 验证接收地址
    if (!transaction.to || !ethers.isAddress(transaction.to)) {
      throw new Error('无效的接收地址');
    }

    // 检查余额
    const balance = await this.wallet.provider!.getBalance(this.wallet.address);
    const totalCost = (transaction.value || 0n) + 
                     ((transaction.gasLimit || 21000n) * (transaction.gasPrice || 0n));

    if (balance < totalCost) {
      throw new Error('余额不足');
    }

    // 验证金额
    if (transaction.value && transaction.value < 0n) {
      throw new Error('交易金额不能为负数');
    }
  }

  private checkDailyLimit(value: bigint): void {
    if (this.dailySpent + value > this.dailyLimit) {
      throw new Error(`超出每日限额 ${ethers.formatEther(this.dailyLimit)} ETH`);
    }
  }

  private async setSafeGasParameters(transaction: any): Promise<void> {
    // 估算 Gas
    const gasEstimate = await this.wallet.estimateGas(transaction);
    transaction.gasLimit = gasEstimate * 120n / 100n; // 增加 20% 缓冲

    // 获取当前 Gas 价格
    const feeData = await this.wallet.provider!.getFeeData();
    
    if (feeData.maxFeePerGas) {
      // EIP-1559 交易
      transaction.maxFeePerGas = feeData.maxFeePerGas > this.maxGasPrice 
        ? this.maxGasPrice 
        : feeData.maxFeePerGas;
      transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else {
      // 传统交易
      transaction.gasPrice = feeData.gasPrice! > this.maxGasPrice 
        ? this.maxGasPrice 
        : feeData.gasPrice!;
    }
  }

  private resetDailyLimitIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailySpent = 0n;
      this.lastResetDate = today;
    }
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
```

## 常见问题

### Q: 如何安全地存储私钥？
A: 使用 `wallet.encrypt()` 方法加密私钥，设置强密码，并存储在安全的地方。生产环境建议使用硬件钱包或密钥管理服务。

### Q: HD 钱包和普通钱包有什么区别？
A: HD 钱包可以从一个助记词派生出多个子钱包，便于管理多个地址。普通钱包只有一个固定的私钥和地址。

### Q: 如何恢复丢失的钱包？
A: 如果有私钥或助记词，可以使用 `new ethers.Wallet(privateKey)` 或 `ethers.Wallet.fromPhrase(mnemonic)` 恢复。

### Q: 钱包可以离线使用吗？
A: 可以。钱包可以在离线环境中创建和签名交易，但发送交易需要连接到网络。

## 下一步

- [消息签名](/ethers/signers/message-signing) - 学习消息签名技巧
- [类型化数据签名](/ethers/signers/typed-data) - 掌握 EIP-712 签名
- [合约交互](/ethers/contracts/basics) - 学习合约交互
- [钱包连接](/ethers/examples/wallet-connection) - 完整的钱包连接示例
