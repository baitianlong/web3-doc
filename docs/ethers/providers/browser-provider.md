---
title: BrowserProvider
description: 深入了解 Ethers.js 中的 BrowserProvider，用于浏览器钱包集成
keywords: [ethers.js, BrowserProvider, MetaMask, 浏览器钱包, Web3]
---

# BrowserProvider

`BrowserProvider` 是 Ethers.js 中专门用于浏览器环境的 Provider，它连接到注入的 Web3 Provider（如 MetaMask、WalletConnect 等）。这是构建 DApp 前端的核心组件。

## 基本用法

```typescript
import { ethers } from 'ethers';

// 检查是否有注入的钱包
if (typeof window.ethereum !== 'undefined') {
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // 请求连接钱包
  await provider.send('eth_requestAccounts', []);
  
  console.log('钱包已连接');
} else {
  console.log('请安装 MetaMask 或其他 Web3 钱包');
}
```

## 构造函数

### 基本构造

```typescript
// 使用默认的 window.ethereum
const provider = new ethers.BrowserProvider(window.ethereum);

// 使用自定义的 EIP-1193 Provider
const customProvider = new ethers.BrowserProvider(customEthereumProvider);

// 带网络配置
const providerWithNetwork = new ethers.BrowserProvider(
  window.ethereum,
  'mainnet' // 或者网络对象
);
```

## 钱包连接

### 1. 检测钱包

```typescript
// 检测钱包类型
function detectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    if (window.ethereum.isMetaMask) {
      return 'MetaMask';
    } else if (window.ethereum.isCoinbaseWallet) {
      return 'Coinbase Wallet';
    } else if (window.ethereum.isImToken) {
      return 'imToken';
    } else {
      return 'Unknown Wallet';
    }
  }
  return null;
}

// 检查钱包可用性
async function checkWalletAvailability() {
  const walletType = detectWallet();
  
  if (!walletType) {
    throw new Error('未检测到 Web3 钱包，请安装 MetaMask 或其他钱包');
  }
  
  console.log('检测到钱包:', walletType);
  return walletType;
}
```

### 2. 连接钱包

```typescript
class WalletConnector {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connect() {
    try {
      // 检查钱包
      await checkWalletAvailability();
      
      // 创建 Provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // 请求账户访问权限
      await this.provider.send('eth_requestAccounts', []);
      
      // 获取 Signer
      this.signer = await this.provider.getSigner();
      
      // 获取账户信息
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      
      console.log('连接成功:', {
        address,
        chainId: Number(network.chainId),
        networkName: network.name
      });
      
      return {
        provider: this.provider,
        signer: this.signer,
        address,
        chainId: Number(network.chainId)
      };
      
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('用户拒绝连接钱包');
      } else if (error.code === -32002) {
        throw new Error('钱包连接请求待处理，请检查钱包');
      } else {
        throw new Error(`连接失败: ${error.message}`);
      }
    }
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    console.log('钱包已断开连接');
  }

  getProvider() {
    return this.provider;
  }

  getSigner() {
    return this.signer;
  }
}

// 使用示例
const wallet = new WalletConnector();
const connection = await wallet.connect();
```

### 3. 自动重连

```typescript
class AutoReconnectWallet extends WalletConnector {
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect() {
    const result = await super.connect();
    this.isConnected = true;
    this.setupEventListeners();
    return result;
  }

  private setupEventListeners() {
    if (window.ethereum) {
      // 监听账户变化
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      
      // 监听网络变化
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      
      // 监听连接状态
      window.ethereum.on('connect', this.handleConnect.bind(this));
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  private async handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      console.log('账户已断开连接');
      await this.disconnect();
    } else {
      console.log('账户已切换:', accounts[0]);
      // 重新获取 Signer
      if (this.provider) {
        this.signer = await this.provider.getSigner();
      }
    }
  }

  private handleChainChanged(chainId: string) {
    console.log('网络已切换:', parseInt(chainId, 16));
    // 刷新页面或重新初始化
    window.location.reload();
  }

  private handleConnect(connectInfo: any) {
    console.log('钱包已连接:', connectInfo);
    this.isConnected = true;
    this.reconnectAttempts = 0;
  }

  private async handleDisconnect(error: any) {
    console.log('钱包已断开连接:', error);
    this.isConnected = false;
    
    // 尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, 2000);
    }
  }

  async disconnect() {
    await super.disconnect();
    this.isConnected = false;
    
    // 移除事件监听器
    if (window.ethereum) {
      window.ethereum.removeAllListeners();
    }
  }
}
```

## 网络管理

### 1. 网络切换

```typescript
class NetworkManager {
  constructor(private provider: ethers.BrowserProvider) {}

  async switchNetwork(chainId: number) {
    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` }
      ]);
    } catch (error: any) {
      // 如果网络不存在，尝试添加
      if (error.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  async addNetwork(chainId: number) {
    const networkConfigs: Record<number, any> = {
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
      throw new Error(`不支持的网络: ${chainId}`);
    }

    await this.provider.send('wallet_addEthereumChain', [config]);
  }

  async getCurrentNetwork() {
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name
    };
  }

  async ensureNetwork(expectedChainId: number) {
    const current = await this.getCurrentNetwork();
    if (current.chainId !== expectedChainId) {
      await this.switchNetwork(expectedChainId);
    }
  }
}

// 使用示例
const networkManager = new NetworkManager(provider);

// 切换到 Polygon
await networkManager.switchNetwork(137);

// 确保在正确的网络上
await networkManager.ensureNetwork(1); // 主网
```

### 2. 网络监听

```typescript
class NetworkWatcher {
  private currentChainId: number | null = null;
  private callbacks: Array<(chainId: number) => void> = [];

  constructor(private provider: ethers.BrowserProvider) {
    this.setupWatcher();
  }

  private async setupWatcher() {
    // 获取初始网络
    const network = await this.provider.getNetwork();
    this.currentChainId = Number(network.chainId);

    // 监听网络变化
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        this.handleNetworkChange(newChainId);
      });
    }
  }

  private handleNetworkChange(newChainId: number) {
    const oldChainId = this.currentChainId;
    this.currentChainId = newChainId;

    console.log(`网络从 ${oldChainId} 切换到 ${newChainId}`);

    // 通知所有回调
    this.callbacks.forEach(callback => {
      try {
        callback(newChainId);
      } catch (error) {
        console.error('网络变化回调错误:', error);
      }
    });
  }

  onNetworkChange(callback: (chainId: number) => void) {
    this.callbacks.push(callback);
    
    // 返回取消监听的函数
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getCurrentChainId() {
    return this.currentChainId;
  }
}

// 使用示例
const watcher = new NetworkWatcher(provider);

const unsubscribe = watcher.onNetworkChange((chainId) => {
  console.log('网络已切换到:', chainId);
  // 处理网络切换逻辑
});

// 取消监听
// unsubscribe();
```

## 权限管理

### 1. 权限请求

```typescript
class PermissionManager {
  constructor(private provider: ethers.BrowserProvider) {}

  async requestAccounts() {
    try {
      const accounts = await this.provider.send('eth_requestAccounts', []);
      return accounts;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('用户拒绝连接');
      }
      throw error;
    }
  }

  async getAccounts() {
    try {
      const accounts = await this.provider.send('eth_accounts', []);
      return accounts;
    } catch (error) {
      console.error('获取账户失败:', error);
      return [];
    }
  }

  async getPermissions() {
    try {
      const permissions = await this.provider.send('wallet_getPermissions', []);
      return permissions;
    } catch (error) {
      console.error('获取权限失败:', error);
      return [];
    }
  }

  async requestPermissions(permissions: any[]) {
    try {
      const result = await this.provider.send('wallet_requestPermissions', [
        { eth_accounts: {} }
      ]);
      return result;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('用户拒绝权限请求');
      }
      throw error;
    }
  }

  async checkConnection() {
    const accounts = await this.getAccounts();
    return accounts.length > 0;
  }
}

// 使用示例
const permissionManager = new PermissionManager(provider);

// 检查是否已连接
const isConnected = await permissionManager.checkConnection();

if (!isConnected) {
  // 请求连接
  await permissionManager.requestAccounts();
}
```

## 签名操作

### 1. 消息签名

```typescript
class MessageSigner {
  constructor(private signer: ethers.JsonRpcSigner) {}

  async signMessage(message: string) {
    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('用户拒绝签名');
      }
      throw error;
    }
  }

  async signTypedData(domain: any, types: any, value: any) {
    try {
      const signature = await this.signer.signTypedData(domain, types, value);
      return signature;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('用户拒绝签名');
      }
      throw error;
    }
  }

  verifyMessage(message: string, signature: string, expectedAddress: string) {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  }

  verifyTypedData(domain: any, types: any, value: any, signature: string, expectedAddress: string) {
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  }
}

// 使用示例
const messageSigner = new MessageSigner(signer);

// 签名普通消息
const message = 'Hello, Web3!';
const signature = await messageSigner.signMessage(message);

// 验证签名
const isValid = messageSigner.verifyMessage(message, signature, await signer.getAddress());
console.log('签名验证:', isValid);

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
  ]
};

const value = {
  name: 'Alice',
  wallet: '0x...'
};

const typedSignature = await messageSigner.signTypedData(domain, types, value);
```

## React 集成

### 1. React Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: null,
    signer: null,
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false
  });

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('请安装 MetaMask');
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setState({
        provider,
        signer,
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false
      });

    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false
    });
  }, []);

  // 监听账户和网络变化
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect
  };
}
```

### 2. React 组件

```tsx
import React from 'react';
import { useWallet } from './useWallet';

export function WalletConnector() {
  const { 
    address, 
    chainId, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect 
  } = useWallet();

  if (isConnecting) {
    return <div>连接中...</div>;
  }

  if (isConnected) {
    return (
      <div>
        <p>地址: {address}</p>
        <p>网络: {chainId}</p>
        <button onClick={disconnect}>断开连接</button>
      </div>
    );
  }

  return (
    <button onClick={connect}>
      连接钱包
    </button>
  );
}
```

## 错误处理

### 常见错误码

```typescript
const ERROR_CODES = {
  4001: '用户拒绝请求',
  4100: '未授权的方法',
  4200: '不支持的方法',
  4900: '钱包已断开连接',
  4901: '钱包未连接到请求的链',
  4902: '无法识别的链ID',
  -32002: '请求待处理',
  -32603: '内部错误'
};

function handleWalletError(error: any) {
  const message = ERROR_CODES[error.code as keyof typeof ERROR_CODES] || error.message;
  console.error('钱包错误:', message);
  return message;
}
```

## 最佳实践

### 1. 用户体验优化

```typescript
class UXOptimizedWallet {
  private connectionPromise: Promise<any> | null = null;

  async connect() {
    // 防止重复连接
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    
    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection() {
    // 检查是否已经连接
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        // 已经连接，直接返回
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return { provider, signer, address: accounts[0] };
      }
    }

    // 执行连接流程
    return this.connectWallet();
  }

  private async connectWallet() {
    // 实际连接逻辑
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  }
}
```

### 2. 安全考虑

```typescript
// 验证钱包地址
function validateAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// 检查网络安全性
function isSecureNetwork(chainId: number): boolean {
  const secureNetworks = [1, 137, 56, 10, 42161]; // 主要网络
  return secureNetworks.includes(chainId);
}

// 限制交易金额
function validateTransactionAmount(amount: string, maxAmount: string): boolean {
  const amountBN = ethers.parseEther(amount);
  const maxAmountBN = ethers.parseEther(maxAmount);
  return amountBN <= maxAmountBN;
}
```

## 常见问题

### Q: 如何处理用户拒绝连接？
A: 捕获错误码 4001，提供友好的提示信息，引导用户重新尝试。

### Q: 如何检测钱包类型？
A: 通过 `window.ethereum` 的属性判断，如 `isMetaMask`、`isCoinbaseWallet` 等。

### Q: 如何处理网络切换？
A: 监听 `chainChanged` 事件，并提供网络切换功能。

### Q: 如何优化连接体验？
A: 检查已有连接、防止重复请求、提供加载状态、错误重试机制。

## 下一步

- [WebSocketProvider](/ethers/providers/websocket-provider) - 学习实时事件监听
- [Signer 基础](/ethers/signers/basics) - 了解签名者概念
- [钱包连接实战](/ethers/examples/wallet-connection) - 完整的钱包集成示例