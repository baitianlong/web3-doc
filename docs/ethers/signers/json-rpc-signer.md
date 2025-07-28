---
title: JsonRpcSigner
description: 深入了解 Ethers.js 中的 JsonRpcSigner，掌握浏览器钱包交互
keywords: [ethers.js, JsonRpcSigner, MetaMask, 浏览器钱包, JSON-RPC]
---

# JsonRpcSigner

`JsonRpcSigner` 是通过 JSON-RPC 协议与外部钱包（如 MetaMask）交互的 Signer 实现。它是构建 Web3 前端应用时最常用的签名者类型。

## 基本概念

JsonRpcSigner 不直接管理私钥，而是通过 JSON-RPC 调用外部钱包进行签名操作：

```typescript
import { ethers } from 'ethers';

// 检查是否有可用的钱包
if (typeof window.ethereum !== 'undefined') {
  // 创建 BrowserProvider
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 请求连接钱包
  await provider.send('eth_requestAccounts', []);
  
  // 获取 JsonRpcSigner
  const signer = await provider.getSigner();
  
  console.log('签名者类型:', signer.constructor.name); // JsonRpcSigner
  console.log('连接的地址:', await signer.getAddress());
}
```

## 创建和连接

### 1. 基本连接

```typescript
async function connectWallet(): Promise<ethers.JsonRpcSigner | null> {
  // 检查钱包是否可用
  if (typeof window.ethereum === 'undefined') {
    console.error('未检测到钱包');
    return null;
  }

  try {
    // 创建 Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // 请求用户授权
    await provider.send('eth_requestAccounts', []);
    
    // 获取 Signer
    const signer = await provider.getSigner();
    
    // 获取基本信息
    const address = await signer.getAddress();
    const chainId = await signer.getChainId();
    
    console.log('钱包连接成功:', { address, chainId });
    return signer;
    
  } catch (error: any) {
    if (error.code === 4001) {
      console.error('用户拒绝连接');
    } else {
      console.error('连接失败:', error.message);
    }
    return null;
  }
}
```

### 2. 高级连接管理

```typescript
class WalletConnection {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private isConnecting = false;

  async connect(): Promise<boolean> {
    if (this.isConnecting) {
      console.log('正在连接中...');
      return false;
    }

    this.isConnecting = true;

    try {
      // 检查钱包可用性
      if (!this.isWalletAvailable()) {
        throw new Error('未检测到钱包，请安装 MetaMask');
      }

      // 创建 Provider
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // 检查是否已连接
      const accounts = await this.provider.listAccounts();
      if (accounts.length === 0) {
        // 请求连接
        await this.provider.send('eth_requestAccounts', []);
      }

      // 获取 Signer
      this.signer = await this.provider.getSigner();

      // 验证连接
      await this.validateConnection();

      console.log('钱包连接成功');
      return true;

    } catch (error: any) {
      console.error('连接失败:', error.message);
      this.cleanup();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  private isWalletAvailable(): boolean {
    return typeof window.ethereum !== 'undefined';
  }

  private async validateConnection(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer 未初始化');
    }

    // 测试基本操作
    const address = await this.signer.getAddress();
    const chainId = await this.signer.getChainId();

    if (!address || !chainId) {
      throw new Error('无法获取钱包信息');
    }
  }

  async disconnect(): Promise<void> {
    this.cleanup();
    console.log('钱包已断开连接');
  }

  private cleanup(): void {
    this.provider = null;
    this.signer = null;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  isConnected(): boolean {
    return this.signer !== null;
  }

  async getAccountInfo() {
    if (!this.signer || !this.provider) {
      throw new Error('钱包未连接');
    }

    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    const chainId = await this.signer.getChainId();
    const network = await this.provider.getNetwork();

    return {
      address,
      balance: ethers.formatEther(balance),
      chainId,
      networkName: network.name
    };
  }
}
```

## 账户管理

### 1. 多账户处理

```typescript
class MultiAccountManager {
  private provider: ethers.BrowserProvider;
  private signers: Map<string, ethers.JsonRpcSigner> = new Map();
  private currentAccount: string | null = null;

  constructor() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('钱包不可用');
    }
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 监听账户变化
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('账户已变化:', accounts);
      this.handleAccountsChanged(accounts);
    });

    // 监听链变化
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('链已变化:', chainId);
      this.handleChainChanged(chainId);
    });
  }

  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    // 清除现有 Signers
    this.signers.clear();
    this.currentAccount = null;

    if (accounts.length > 0) {
      // 重新加载账户
      await this.loadAccounts();
    } else {
      console.log('所有账户已断开连接');
    }
  }

  private handleChainChanged(chainId: string): void {
    // 链变化时重新加载页面（推荐做法）
    window.location.reload();
  }

  async loadAccounts(): Promise<string[]> {
    try {
      const accounts = await this.provider.listAccounts();
      
      // 为每个账户创建 Signer
      for (const account of accounts) {
        const signer = await this.provider.getSigner(account.address);
        this.signers.set(account.address, signer);
      }

      // 设置默认账户
      if (accounts.length > 0 && !this.currentAccount) {
        this.currentAccount = accounts[0].address;
      }

      return Array.from(this.signers.keys());
    } catch (error) {
      console.error('加载账户失败:', error);
      return [];
    }
  }

  switchAccount(address: string): boolean {
    if (this.signers.has(address)) {
      this.currentAccount = address;
      console.log('已切换到账户:', address);
      return true;
    }
    return false;
  }

  getCurrentSigner(): ethers.JsonRpcSigner | null {
    if (this.currentAccount) {
      return this.signers.get(this.currentAccount) || null;
    }
    return null;
  }

  getAllAccounts(): string[] {
    return Array.from(this.signers.keys());
  }

  async getAccountBalances(): Promise<Map<string, string>> {
    const balances = new Map<string, string>();
    
    for (const [address, signer] of this.signers) {
      try {
        const balance = await this.provider.getBalance(address);
        balances.set(address, ethers.formatEther(balance));
      } catch (error) {
        console.error(`获取 ${address} 余额失败:`, error);
        balances.set(address, '0');
      }
    }

    return balances;
  }
}
```

### 2. 网络管理

```typescript
class NetworkManager {
  private provider: ethers.BrowserProvider;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
  }

  async getCurrentNetwork() {
    const network = await this.provider.getNetwork();
    return {
      name: network.name,
      chainId: Number(network.chainId),
      ensAddress: network.ensAddress
    };
  }

  async switchToNetwork(chainId: number): Promise<boolean> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // 网络不存在，尝试添加
        console.log('网络不存在，尝试添加...');
        return await this.addNetwork(chainId);
      } else {
        console.error('切换网络失败:', error);
        return false;
      }
    }
  }

  async addNetwork(chainId: number): Promise<boolean> {
    const networkConfigs: { [key: number]: any } = {
      137: { // Polygon
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      56: { // BSC
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }
    };

    const config = networkConfigs[chainId];
    if (!config) {
      console.error('不支持的网络 ID:', chainId);
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config]
      });
      return true;
    } catch (error) {
      console.error('添加网络失败:', error);
      return false;
    }
  }

  async addToken(tokenAddress: string, symbol: string, decimals: number): Promise<boolean> {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals
          }
        }
      });
      return true;
    } catch (error) {
      console.error('添加代币失败:', error);
      return false;
    }
  }
}
```

## 交易处理

### 1. 安全交易发送

```typescript
class SecureTransactionManager {
  private signer: ethers.JsonRpcSigner;

  constructor(signer: ethers.JsonRpcSigner) {
    this.signer = signer;
  }

  async sendTransaction(transaction: any): Promise<ethers.TransactionResponse> {
    try {
      // 验证交易参数
      await this.validateTransaction(transaction);

      // 估算 Gas
      const gasEstimate = await this.signer.estimateGas(transaction);
      transaction.gasLimit = gasEstimate;

      // 获取 Gas 价格
      if (!transaction.gasPrice && !transaction.maxFeePerGas) {
        const feeData = await this.signer.provider!.getFeeData();
        if (feeData.maxFeePerGas) {
          transaction.maxFeePerGas = feeData.maxFeePerGas;
          transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        } else {
          transaction.gasPrice = feeData.gasPrice;
        }
      }

      // 发送交易
      const txResponse = await this.signer.sendTransaction(transaction);
      
      console.log('交易已发送:', txResponse.hash);
      return txResponse;

    } catch (error: any) {
      this.handleTransactionError(error);
      throw error;
    }
  }

  private async validateTransaction(transaction: any): Promise<void> {
    // 检查必要字段
    if (!transaction.to) {
      throw new Error('缺少接收地址');
    }

    // 检查余额
    const address = await this.signer.getAddress();
    const balance = await this.signer.provider!.getBalance(address);
    
    if (balance < (transaction.value || 0n)) {
      throw new Error('余额不足');
    }

    // 验证地址格式
    if (!ethers.isAddress(transaction.to)) {
      throw new Error('无效的接收地址');
    }
  }

  private handleTransactionError(error: any): void {
    if (error.code === 4001) {
      console.error('用户拒绝交易');
    } else if (error.code === -32603) {
      console.error('交易执行失败');
    } else if (error.code === -32000) {
      console.error('余额不足或 Gas 不足');
    } else {
      console.error('交易失败:', error.message);
    }
  }

  async waitForTransaction(
    txHash: string, 
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      console.log(`等待交易确认: ${txHash}`);
      const receipt = await this.signer.provider!.waitForTransaction(
        txHash, 
        confirmations
      );
      
      if (receipt) {
        console.log(`交易已确认 (${confirmations} 个确认):`, receipt.hash);
        return receipt;
      }
      
      return null;
    } catch (error) {
      console.error('等待交易确认失败:', error);
      throw error;
    }
  }
}
```

### 2. 批量交易

```typescript
class BatchTransactionManager {
  private signer: ethers.JsonRpcSigner;
  private pendingTransactions: Map<string, Promise<ethers.TransactionResponse>> = new Map();

  constructor(signer: ethers.JsonRpcSigner) {
    this.signer = signer;
  }

  async sendBatchTransactions(
    transactions: any[]
  ): Promise<ethers.TransactionResponse[]> {
    const results: ethers.TransactionResponse[] = [];
    
    for (let i = 0; i < transactions.length; i++) {
      try {
        console.log(`发送交易 ${i + 1}/${transactions.length}`);
        
        // 获取当前 nonce
        const nonce = await this.signer.getNonce('pending');
        transactions[i].nonce = nonce;
        
        // 发送交易
        const txResponse = await this.signer.sendTransaction(transactions[i]);
        results.push(txResponse);
        
        // 存储待处理交易
        this.pendingTransactions.set(txResponse.hash, Promise.resolve(txResponse));
        
        // 短暂延迟避免 nonce 冲突
        await this.delay(100);
        
      } catch (error) {
        console.error(`交易 ${i + 1} 失败:`, error);
        throw error;
      }
    }

    return results;
  }

  async waitForAllTransactions(
    txHashes: string[],
    confirmations: number = 1
  ): Promise<(ethers.TransactionReceipt | null)[]> {
    const promises = txHashes.map(hash => 
      this.signer.provider!.waitForTransaction(hash, confirmations)
    );

    return await Promise.all(promises);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getPendingTransactions(): string[] {
    return Array.from(this.pendingTransactions.keys());
  }

  async checkTransactionStatus(txHash: string): Promise<string> {
    try {
      const receipt = await this.signer.provider!.getTransactionReceipt(txHash);
      
      if (receipt) {
        return receipt.status === 1 ? 'success' : 'failed';
      } else {
        return 'pending';
      }
    } catch (error) {
      return 'unknown';
    }
  }
}
```

## 错误处理和用户体验

### 1. 用户友好的错误处理

```typescript
class UserFriendlyErrorHandler {
  static getErrorMessage(error: any): string {
    const errorMessages: { [key: number]: string } = {
      4001: '用户拒绝了请求',
      4100: '请求的方法或账户未授权',
      4200: '钱包不支持请求的方法',
      4900: '钱包未连接到请求的链',
      4901: '钱包未连接',
      -32700: '无效的 JSON',
      -32600: '无效的请求',
      -32601: '方法不存在',
      -32602: '无效的参数',
      -32603: '内部错误'
    };

    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // 处理常见的错误消息
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('user rejected')) {
      return '用户取消了操作';
    } else if (message.includes('insufficient funds')) {
      return '余额不足';
    } else if (message.includes('gas')) {
      return 'Gas 费用问题，请检查设置';
    } else if (message.includes('nonce')) {
      return '交易顺序错误，请重试';
    } else {
      return error.message || '未知错误';
    }
  }

  static async handleError(error: any, context: string): Promise<void> {
    const userMessage = this.getErrorMessage(error);
    
    console.error(`${context} 错误:`, {
      code: error.code,
      message: error.message,
      userMessage
    });

    // 可以在这里添加用户通知逻辑
    // 例如：显示 toast 消息、更新 UI 状态等
  }
}
```

### 2. 连接状态管理

```typescript
class ConnectionStateManager {
  private isConnected = false;
  private currentAccount: string | null = null;
  private currentChainId: number | null = null;
  private listeners: Array<(state: ConnectionState) => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        this.handleAccountsChanged(accounts);
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        this.handleChainChanged(parseInt(chainId, 16));
      });

      window.ethereum.on('connect', (connectInfo: any) => {
        this.handleConnect(connectInfo);
      });

      window.ethereum.on('disconnect', (error: any) => {
        this.handleDisconnect(error);
      });
    }
  }

  private handleAccountsChanged(accounts: string[]): void {
    const wasConnected = this.isConnected;
    const previousAccount = this.currentAccount;

    if (accounts.length === 0) {
      this.isConnected = false;
      this.currentAccount = null;
    } else {
      this.isConnected = true;
      this.currentAccount = accounts[0];
    }

    if (wasConnected !== this.isConnected || previousAccount !== this.currentAccount) {
      this.notifyListeners();
    }
  }

  private handleChainChanged(chainId: number): void {
    const previousChainId = this.currentChainId;
    this.currentChainId = chainId;

    if (previousChainId !== chainId) {
      this.notifyListeners();
    }
  }

  private handleConnect(connectInfo: any): void {
    this.isConnected = true;
    this.currentChainId = parseInt(connectInfo.chainId, 16);
    this.notifyListeners();
  }

  private handleDisconnect(error: any): void {
    this.isConnected = false;
    this.currentAccount = null;
    this.currentChainId = null;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const state: ConnectionState = {
      isConnected: this.isConnected,
      account: this.currentAccount,
      chainId: this.currentChainId
    };

    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('连接状态监听器错误:', error);
      }
    });
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getCurrentState(): ConnectionState {
    return {
      isConnected: this.isConnected,
      account: this.currentAccount,
      chainId: this.currentChainId
    };
  }
}

interface ConnectionState {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
}
```

## 最佳实践

### 1. 完整的钱包集成示例

```typescript
class WalletIntegration {
  private connection: WalletConnection;
  private accountManager: MultiAccountManager;
  private networkManager: NetworkManager;
  private transactionManager: SecureTransactionManager | null = null;
  private stateManager: ConnectionStateManager;

  constructor() {
    this.connection = new WalletConnection();
    this.accountManager = new MultiAccountManager();
    this.stateManager = new ConnectionStateManager();
    
    // 监听连接状态变化
    this.stateManager.onStateChange((state) => {
      this.handleStateChange(state);
    });
  }

  async initialize(): Promise<boolean> {
    try {
      // 尝试连接钱包
      const connected = await this.connection.connect();
      
      if (connected) {
        // 加载账户
        await this.accountManager.loadAccounts();
        
        // 初始化网络管理器
        const provider = this.connection.getProvider()!;
        this.networkManager = new NetworkManager(provider);
        
        // 初始化交易管理器
        const signer = this.connection.getSigner()!;
        this.transactionManager = new SecureTransactionManager(signer);
        
        console.log('钱包集成初始化成功');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('钱包集成初始化失败:', error);
      return false;
    }
  }

  private handleStateChange(state: ConnectionState): void {
    console.log('连接状态变化:', state);
    
    if (!state.isConnected) {
      // 清理状态
      this.transactionManager = null;
    } else if (state.account) {
      // 重新初始化
      this.initialize();
    }
  }

  // 公共 API
  isConnected(): boolean {
    return this.connection.isConnected();
  }

  async getAccountInfo() {
    return await this.connection.getAccountInfo();
  }

  async sendTransaction(transaction: any) {
    if (!this.transactionManager) {
      throw new Error('钱包未连接');
    }
    return await this.transactionManager.sendTransaction(transaction);
  }

  async switchNetwork(chainId: number) {
    if (!this.networkManager) {
      throw new Error('网络管理器未初始化');
    }
    return await this.networkManager.switchToNetwork(chainId);
  }

  async disconnect() {
    await this.connection.disconnect();
  }
}
```

## 常见问题

### Q: 如何检测用户是否安装了钱包？
A: 检查 `window.ethereum` 是否存在，但要注意可能有多个钱包扩展。

### Q: 用户拒绝连接怎么办？
A: 捕获错误码 4001，提供友好提示，可以提供重试选项。

### Q: 如何处理网络切换？
A: 监听 `chainChanged` 事件，通常建议重新加载页面以确保状态一致。

### Q: 如何优化用户体验？
A: 提供清晰的错误信息、加载状态、交易进度提示等。

## 下一步

- [Wallet](/ethers/signers/wallet) - 学习私钥钱包管理
- [消息签名](/ethers/signers/message-signing) - 掌握消息签名技巧
- [钱包连接](/ethers/examples/wallet-connection) - 完整的钱包连接示例