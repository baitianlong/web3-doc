---
title: 自定义网络
description: 使用 Ethers.js 配置和管理自定义网络，包括本地开发网络、测试网络和 Layer 2 网络
keywords: [ethers, 自定义网络, 网络配置, Provider, 链配置, RPC]
---

# 自定义网络

在区块链开发中，经常需要连接到各种不同的网络，包括本地开发网络、测试网络、Layer 2 网络或私有链。本文档将详细介绍如何使用 Ethers.js 配置和管理自定义网络。

## 网络配置基础

### 1. 网络对象结构

```typescript
interface Network {
  name: string;           // 网络名称
  chainId: number;        // 链 ID
  ensAddress?: string;    // ENS 注册表地址
  _defaultProvider?: any; // 默认 Provider 构造函数
}

// 扩展网络配置
interface CustomNetworkConfig extends Network {
  rpcUrls: string[];           // RPC 端点列表
  blockExplorerUrls?: string[]; // 区块浏览器 URL
  nativeCurrency?: {           // 原生代币信息
    name: string;
    symbol: string;
    decimals: number;
  };
  iconUrls?: string[];         // 网络图标
  faucetUrls?: string[];       // 测试币水龙头
}
```

### 2. 基本网络配置

```typescript
import { ethers } from 'ethers';

// 定义自定义网络
const customNetworks = {
  // 本地开发网络
  localhost: {
    name: 'Localhost',
    chainId: 1337,
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // Polygon Mumbai 测试网
  polygonMumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrls: [
      'https://rpc-mumbai.maticvigil.com',
      'https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID'
    ],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    faucetUrls: ['https://faucet.polygon.technology/']
  },
  
  // Arbitrum One
  arbitrumOne: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-mainnet.infura.io/v3/YOUR-PROJECT-ID'
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // Optimism
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism-mainnet.infura.io/v3/YOUR-PROJECT-ID'
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // BSC 主网
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org'
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

// 创建自定义网络 Provider
function createCustomProvider(networkName: keyof typeof customNetworks) {
  const network = customNetworks[networkName];
  
  if (!network) {
    throw new Error(`未知网络: ${networkName}`);
  }
  
  // 使用第一个 RPC URL 创建 Provider
  const provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
    name: network.name,
    chainId: network.chainId
  });
  
  return provider;
}

// 使用示例
const polygonProvider = createCustomProvider('polygonMumbai');
const arbitrumProvider = createCustomProvider('arbitrumOne');
```

## 高级网络配置

### 1. 多端点故障转移

```typescript
class NetworkManager {
  private networks: Map<string, CustomNetworkConfig>;
  private providers: Map<string, ethers.Provider>;

  constructor() {
    this.networks = new Map();
    this.providers = new Map();
  }

  // 添加网络配置
  addNetwork(name: string, config: CustomNetworkConfig) {
    this.networks.set(name, config);
  }

  // 创建带故障转移的 Provider
  createProvider(networkName: string, options: {
    timeout?: number;
    retries?: number;
    quorum?: number;
  } = {}): ethers.Provider {
    const network = this.networks.get(networkName);
    if (!network) {
      throw new Error(`网络 ${networkName} 未配置`);
    }

    const { timeout = 10000, retries = 3, quorum = 1 } = options;

    if (network.rpcUrls.length === 1) {
      // 单个 RPC 端点
      return new ethers.JsonRpcProvider(network.rpcUrls[0], {
        name: network.name,
        chainId: network.chainId
      });
    } else {
      // 多个 RPC 端点，使用 FallbackProvider
      const providers = network.rpcUrls.map((url, index) => ({
        provider: new ethers.JsonRpcProvider(url, {
          name: network.name,
          chainId: network.chainId
        }),
        priority: index + 1,
        weight: 1
      }));

      return new ethers.FallbackProvider(providers, {
        quorum,
        // 可以添加更多配置
      });
    }
  }

  // 获取或创建 Provider
  getProvider(networkName: string): ethers.Provider {
    if (!this.providers.has(networkName)) {
      const provider = this.createProvider(networkName);
      this.providers.set(networkName, provider);
    }
    return this.providers.get(networkName)!;
  }

  // 测试网络连接
  async testConnection(networkName: string): Promise<{
    success: boolean;
    chainId?: number;
    blockNumber?: number;
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const provider = this.getProvider(networkName);
      
      const [chainId, blockNumber] = await Promise.all([
        provider.getNetwork().then(n => n.chainId),
        provider.getBlockNumber()
      ]);
      
      const latency = Date.now() - startTime;

      return {
        success: true,
        chainId: Number(chainId),
        blockNumber,
        latency
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 批量测试所有网络
  async testAllNetworks(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const networkName of this.networks.keys()) {
      results[networkName] = await this.testConnection(networkName);
    }
    
    return results;
  }

  // 获取网络信息
  getNetworkInfo(networkName: string) {
    const network = this.networks.get(networkName);
    if (!network) {
      throw new Error(`网络 ${networkName} 未配置`);
    }
    return { ...network };
  }

  // 列出所有网络
  listNetworks(): string[] {
    return Array.from(this.networks.keys());
  }

  // 移除网络
  removeNetwork(networkName: string) {
    this.networks.delete(networkName);
    this.providers.delete(networkName);
  }
}

// 使用示例
const networkManager = new NetworkManager();

// 添加网络
networkManager.addNetwork('polygon-mumbai', customNetworks.polygonMumbai);
networkManager.addNetwork('arbitrum-one', customNetworks.arbitrumOne);

// 测试连接
async function testNetworks() {
  const results = await networkManager.testAllNetworks();
  console.log('网络连接测试结果:', results);
  
  // 获取 Provider
  const polygonProvider = networkManager.getProvider('polygon-mumbai');
  const blockNumber = await polygonProvider.getBlockNumber();
  console.log('Polygon Mumbai 当前区块:', blockNumber);
}
```

### 2. 网络自动检测和切换

```typescript
class NetworkDetector {
  private provider: ethers.Provider;
  private knownNetworks: Map<number, CustomNetworkConfig>;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.knownNetworks = new Map();
    this.initializeKnownNetworks();
  }

  private initializeKnownNetworks() {
    // 添加已知网络
    Object.entries(customNetworks).forEach(([name, config]) => {
      this.knownNetworks.set(config.chainId, { ...config, name });
    });
  }

  // 检测当前网络
  async detectCurrentNetwork(): Promise<{
    chainId: number;
    name: string;
    isKnown: boolean;
    config?: CustomNetworkConfig;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      const knownNetwork = this.knownNetworks.get(chainId);

      if (knownNetwork) {
        return {
          chainId,
          name: knownNetwork.name,
          isKnown: true,
          config: knownNetwork
        };
      } else {
        return {
          chainId,
          name: network.name || `Unknown Network (${chainId})`,
          isKnown: false
        };
      }
    } catch (error) {
      throw new Error(`网络检测失败: ${error.message}`);
    }
  }

  // 验证网络兼容性
  async validateNetwork(expectedChainId: number): Promise<boolean> {
    try {
      const currentNetwork = await this.detectCurrentNetwork();
      return currentNetwork.chainId === expectedChainId;
    } catch (error) {
      console.error('网络验证失败:', error);
      return false;
    }
  }

  // 监听网络变化
  onNetworkChange(callback: (network: any) => void) {
    this.provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        console.log('网络已切换:', {
          from: oldNetwork.name,
          to: newNetwork.name,
          chainId: Number(newNetwork.chainId)
        });
      }
      callback(newNetwork);
    });
  }

  // 停止监听
  removeAllListeners() {
    this.provider.removeAllListeners('network');
  }
}

// 网络切换助手（用于浏览器环境）
class NetworkSwitcher {
  private ethereum: any;

  constructor() {
    this.ethereum = (window as any).ethereum;
    if (!this.ethereum) {
      throw new Error('未检测到 MetaMask 或其他 Web3 钱包');
    }
  }

  // 请求切换网络
  async switchToNetwork(chainId: number): Promise<boolean> {
    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // 网络未添加，尝试添加
        console.log('网络未添加，尝试添加网络...');
        return false;
      } else {
        throw new Error(`切换网络失败: ${error.message}`);
      }
    }
  }

  // 添加自定义网络到钱包
  async addNetwork(config: CustomNetworkConfig): Promise<boolean> {
    try {
      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${config.chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: config.rpcUrls,
          blockExplorerUrls: config.blockExplorerUrls,
          nativeCurrency: config.nativeCurrency,
          iconUrls: config.iconUrls
        }],
      });
      return true;
    } catch (error: any) {
      throw new Error(`添加网络失败: ${error.message}`);
    }
  }

  // 智能网络切换（先尝试切换，失败则添加）
  async smartSwitchToNetwork(config: CustomNetworkConfig): Promise<boolean> {
    try {
      // 先尝试切换
      const switched = await this.switchToNetwork(config.chainId);
      if (switched) {
        return true;
      }

      // 切换失败，尝试添加网络
      await this.addNetwork(config);
      
      // 添加成功后再次尝试切换
      return await this.switchToNetwork(config.chainId);
    } catch (error) {
      console.error('智能网络切换失败:', error);
      return false;
    }
  }
}
```

## 本地开发网络配置

### 1. Hardhat 网络配置

```typescript
// Hardhat 本地网络配置
const hardhatNetwork = {
  name: 'Hardhat',
  chainId: 31337,
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
};

// Hardhat 网络管理器
class HardhatNetworkManager {
  private provider: ethers.JsonRpcProvider;
  private accounts: string[] = [];

  constructor(rpcUrl: string = 'http://127.0.0.1:8545') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      name: 'Hardhat',
      chainId: 31337
    });
  }

  // 获取测试账户
  async getTestAccounts(): Promise<string[]> {
    if (this.accounts.length === 0) {
      this.accounts = await this.provider.listAccounts();
    }
    return this.accounts;
  }

  // 获取测试账户的 Signer
  async getTestSigner(index: number = 0): Promise<ethers.Signer> {
    const accounts = await this.getTestAccounts();
    if (index >= accounts.length) {
      throw new Error(`账户索引 ${index} 超出范围`);
    }
    return this.provider.getSigner(accounts[index]);
  }

  // 为账户充值（仅限测试网络）
  async fundAccount(address: string, amountInEth: string) {
    try {
      // 使用 hardhat_setBalance 方法
      await this.provider.send('hardhat_setBalance', [
        address,
        ethers.parseEther(amountInEth).toString()
      ]);
      
      console.log(`已为账户 ${address} 充值 ${amountInEth} ETH`);
    } catch (error) {
      throw new Error(`充值失败: ${error.message}`);
    }
  }

  // 重置网络状态
  async resetNetwork() {
    try {
      await this.provider.send('hardhat_reset', []);
      console.log('Hardhat 网络已重置');
    } catch (error) {
      throw new Error(`重置网络失败: ${error.message}`);
    }
  }

  // 挖掘指定数量的区块
  async mineBlocks(count: number) {
    try {
      for (let i = 0; i < count; i++) {
        await this.provider.send('evm_mine', []);
      }
      console.log(`已挖掘 ${count} 个区块`);
    } catch (error) {
      throw new Error(`挖掘区块失败: ${error.message}`);
    }
  }

  // 设置下一个区块的时间戳
  async setNextBlockTimestamp(timestamp: number) {
    try {
      await this.provider.send('evm_setNextBlockTimestamp', [timestamp]);
      console.log(`下一个区块时间戳设置为: ${new Date(timestamp * 1000)}`);
    } catch (error) {
      throw new Error(`设置时间戳失败: ${error.message}`);
    }
  }

  // 快进时间
  async increaseTime(seconds: number) {
    try {
      await this.provider.send('evm_increaseTime', [seconds]);
      await this.provider.send('evm_mine', []); // 挖掘一个区块使时间生效
      console.log(`时间已快进 ${seconds} 秒`);
    } catch (error) {
      throw new Error(`快进时间失败: ${error.message}`);
    }
  }

  // 获取网络状态
  async getNetworkStatus() {
    try {
      const [blockNumber, gasPrice, accounts] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.getTestAccounts()
      ]);

      return {
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString(),
        accountCount: accounts.length,
        chainId: (await this.provider.getNetwork()).chainId
      };
    } catch (error) {
      throw new Error(`获取网络状态失败: ${error.message}`);
    }
  }
}
```

### 2. Ganache 网络配置

```typescript
// Ganache 网络配置
const ganacheNetwork = {
  name: 'Ganache',
  chainId: 1337, // 或其他自定义 chainId
  rpcUrls: ['http://127.0.0.1:7545'],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  }
};

class GanacheNetworkManager {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string = 'http://127.0.0.1:7545') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl, {
      name: 'Ganache',
      chainId: 1337
    });
  }

  // 获取 Ganache 账户
  async getGanacheAccounts(): Promise<{
    address: string;
    privateKey: string;
    balance: string;
  }[]> {
    try {
      const accounts = await this.provider.listAccounts();
      const accountsInfo = [];

      for (const account of accounts) {
        const balance = await this.provider.getBalance(account);
        // 注意：Ganache 通常不直接暴露私钥，这里仅作示例
        accountsInfo.push({
          address: account,
          privateKey: 'PRIVATE_KEY_FROM_GANACHE', // 需要从 Ganache 界面获取
          balance: ethers.formatEther(balance)
        });
      }

      return accountsInfo;
    } catch (error) {
      throw new Error(`获取 Ganache 账户失败: ${error.message}`);
    }
  }

  // 创建带私钥的 Wallet
  createWalletFromPrivateKey(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.provider);
  }

  // 快照和恢复（如果 Ganache 支持）
  async takeSnapshot(): Promise<string> {
    try {
      const snapshotId = await this.provider.send('evm_snapshot', []);
      console.log('快照已创建:', snapshotId);
      return snapshotId;
    } catch (error) {
      throw new Error(`创建快照失败: ${error.message}`);
    }
  }

  async revertToSnapshot(snapshotId: string): Promise<boolean> {
    try {
      const result = await this.provider.send('evm_revert', [snapshotId]);
      console.log('已恢复到快照:', snapshotId);
      return result;
    } catch (error) {
      throw new Error(`恢复快照失败: ${error.message}`);
    }
  }
}
```

## 测试网络配置

### 1. 多测试网管理

```typescript
// 测试网络配置
const testNetworks = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrls: [
      'https://sepolia.infura.io/v3/YOUR-PROJECT-ID',
      'https://rpc.sepolia.org'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    faucetUrls: [
      'https://sepoliafaucet.com',
      'https://faucet.sepolia.dev'
    ]
  },
  
  goerli: {
    name: 'Goerli',
    chainId: 5,
    rpcUrls: [
      'https://goerli.infura.io/v3/YOUR-PROJECT-ID',
      'https://rpc.goerli.mudit.blog'
    ],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'GOR',
      decimals: 18
    },
    faucetUrls: [
      'https://goerlifaucet.com',
      'https://faucet.goerli.mudit.blog'
    ]
  },
  
  mumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrls: [
      'https://rpc-mumbai.maticvigil.com',
      'https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID'
    ],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    faucetUrls: ['https://faucet.polygon.technology/']
  }
};

class TestNetworkManager {
  private networks: Map<string, CustomNetworkConfig>;
  private providers: Map<string, ethers.Provider>;

  constructor() {
    this.networks = new Map();
    this.providers = new Map();
    
    // 初始化测试网络
    Object.entries(testNetworks).forEach(([name, config]) => {
      this.networks.set(name, config);
    });
  }

  // 获取测试网络 Provider
  getTestProvider(networkName: string): ethers.Provider {
    if (!this.providers.has(networkName)) {
      const network = this.networks.get(networkName);
      if (!network) {
        throw new Error(`测试网络 ${networkName} 未配置`);
      }

      const provider = new ethers.JsonRpcProvider(network.rpcUrls[0], {
        name: network.name,
        chainId: network.chainId
      });

      this.providers.set(networkName, provider);
    }

    return this.providers.get(networkName)!;
  }

  // 获取水龙头信息
  getFaucetInfo(networkName: string): string[] {
    const network = this.networks.get(networkName);
    return network?.faucetUrls || [];
  }

  // 检查测试币余额
  async checkTestBalance(networkName: string, address: string): Promise<{
    balance: string;
    balanceInEth: string;
    symbol: string;
  }> {
    const provider = this.getTestProvider(networkName);
    const network = this.networks.get(networkName)!;
    
    const balance = await provider.getBalance(address);
    
    return {
      balance: balance.toString(),
      balanceInEth: ethers.formatEther(balance),
      symbol: network.nativeCurrency?.symbol || 'ETH'
    };
  }

  // 批量检查多个网络的余额
  async checkBalanceOnAllNetworks(address: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const networkName of this.networks.keys()) {
      try {
        results[networkName] = await this.checkTestBalance(networkName, address);
      } catch (error) {
        results[networkName] = {
          error: error.message
        };
      }
    }
    
    return results;
  }

  // 获取网络状态
  async getNetworkStatus(networkName: string) {
    try {
      const provider = this.getTestProvider(networkName);
      const network = this.networks.get(networkName)!;
      
      const [blockNumber, feeData, chainId] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData(),
        provider.getNetwork().then(n => n.chainId)
      ]);

      return {
        networkName,
        chainId: Number(chainId),
        blockNumber,
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        faucets: network.faucetUrls,
        explorer: network.blockExplorerUrls?.[0]
      };
    } catch (error) {
      throw new Error(`获取网络状态失败: ${error.message}`);
    }
  }
}
```

## 环境配置管理

### 1. 多环境配置

```typescript
// 环境配置类型
type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  [networkName: string]: {
    chainId: number;
    rpcUrls: string[];
    timeout?: number;
  };
}

class NetworkConfigManager {
  private configs: Map<Environment, EnvironmentConfig>;
  private currentEnvironment: Environment;
  private environments: Environment[] = ['development', 'staging', 'production'];

  constructor() {
    this.configs = new Map();
    this.currentEnvironment = 'development';
  }

  // 加载环境配置
  loadEnvironmentConfig(environment: Environment): EnvironmentConfig {
    const configs: Record<Environment, EnvironmentConfig> = {
      development: {
        mainnet: {
          chainId: 1337,
          rpcUrls: ['http://localhost:8545'],
          timeout: 5000
        },
        testnet: {
          chainId: 31337,
          rpcUrls: ['http://localhost:8546'],
          timeout: 5000
        }
      },
      
      staging: {
        mainnet: {
          chainId: 11155111, // Sepolia
          rpcUrls: [
            process.env.STAGING_SEPOLIA_RPC_1,
            process.env.STAGING_SEPOLIA_RPC_2
          ].filter(Boolean),
          timeout: 8000
        },
        testnet: {
          chainId: 80001, // Mumbai
          rpcUrls: [
            process.env.STAGING_MUMBAI_RPC_1,
            process.env.STAGING_MUMBAI_RPC_2
          ].filter(Boolean),
          timeout: 8000
        }
      },
      
      production: {
        mainnet: {
          chainId: 1,
          rpcUrls: [
            process.env.PROD_MAINNET_RPC_1,
            process.env.PROD_MAINNET_RPC_2,
            process.env.PROD_MAINNET_RPC_3
          ].filter(Boolean),
          timeout: 10000
        },
        testnet: {
          chainId: 11155111,
          rpcUrls: [
            process.env.PROD_TESTNET_RPC_1,
            process.env.PROD_TESTNET_RPC_2
          ].filter(Boolean),
          timeout: 10000
        }
      }
    };
    
    this.currentEnvironment = environment;
    this.configs.set(environment, configs[environment]);
    
    return configs[environment];
  }
  
  // 获取网络配置
  getNetworkConfig(networkName: string) {
    const envConfig = this.configs.get(this.currentEnvironment);
    if (!envConfig || !envConfig[networkName]) {
      throw new Error(`网络配置 ${networkName} 在环境 ${this.currentEnvironment} 中不存在`);
    }
    
    return envConfig[networkName];
  }
  
  // 验证配置完整性
  validateConfigs() {
    const results = [];
    
    for (const [env, config] of this.configs.entries()) {
      for (const [network, networkConfig] of Object.entries(config)) {
        const validation = {
          environment: env,
          network,
          valid: true,
          issues: []
        };
        
        // 检查必需字段
        if (!networkConfig.chainId) {
          validation.issues.push('缺少 chainId');
          validation.valid = false;
        }
        
        if (!networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
          validation.issues.push('缺少 RPC URLs');
          validation.valid = false;
        }
        
        // 检查 RPC URL 格式
        if (networkConfig.rpcUrls) {
          networkConfig.rpcUrls.forEach((url, index) => {
            if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
              validation.issues.push(`RPC URL ${index} 格式无效: ${url}`);
              validation.valid = false;
            }
          });
        }
        
        // 检查超时设置
        if (networkConfig.timeout && networkConfig.timeout < 5000) {
          validation.issues.push('超时时间过短，建议至少 5 秒');
        }
        
        results.push(validation);
      }
    }
    
    return results;
  }
  
  // 创建环境特定的 Provider
  createEnvironmentProvider(networkName: string, options = {}) {
    const config = this.getNetworkConfig(networkName);
    
    if (config.rpcUrls.length === 1) {
      return new ethers.JsonRpcProvider(config.rpcUrls[0], {
        name: networkName,
        chainId: config.chainId
      });
    } else {
      const providers = config.rpcUrls.map(url => 
        new ethers.JsonRpcProvider(url, {
          name: networkName,
          chainId: config.chainId
        })
      );
      
      return new ethers.FallbackProvider(providers, {
        quorum: 1,
        ...options
      });
    }
  }
  
  // 切换环境
  switchEnvironment(environment: Environment) {
    if (!this.environments.includes(environment)) {
      throw new Error(`不支持的环境: ${environment}`);
    }
    
    this.loadEnvironmentConfig(environment);
    return this.currentEnvironment;
  }
  
  // 获取当前环境
  getCurrentEnvironment() {
    return this.currentEnvironment;
  }
  
  // 列出所有环境
  listEnvironments() {
    return this.environments;
  }
}
```

## 完整使用示例

```typescript
// 完整的自定义网络使用示例
async function customNetworkExample() {
  console.log('=== 自定义网络配置示例 ===');
  
  // 1. 基础网络管理
  const networkManager = new NetworkManager();
  
  // 添加多个网络
  networkManager.addNetwork('polygon-mumbai', testNetworks.mumbai);
  networkManager.addNetwork('arbitrum-one', customNetworks.arbitrumOne);
  networkManager.addNetwork('local-hardhat', hardhatNetwork);
  
  // 测试所有网络连接
  console.log('测试网络连接...');
  const connectionResults = await networkManager.testAllNetworks();
  console.log('连接测试结果:', connectionResults);
  
  // 2. 本地开发网络
  console.log('\n=== 本地开发网络 ===');
  const hardhatManager = new HardhatNetworkManager();
  
  try {
    const networkStatus = await hardhatManager.getNetworkStatus();
    console.log('Hardhat 网络状态:', networkStatus);
    
    // 获取测试账户
    const testAccounts = await hardhatManager.getTestAccounts();
    console.log('测试账户:', testAccounts.slice(0, 3));
    
    // 为账户充值
    if (testAccounts.length > 0) {
      await hardhatManager.fundAccount(testAccounts[0], '100');
    }
  } catch (error) {
    console.log('Hardhat 网络未运行:', error.message);
  }
  
  // 3. 测试网络管理
  console.log('\n=== 测试网络管理 ===');
  const testManager = new TestNetworkManager();
  
  // 检查测试账户余额（需要提供实际地址）
  const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  
  try {
    const balances = await testManager.checkBalanceOnAllNetworks(testAddress);
    console.log('测试网络余额:', balances);
  } catch (error) {
    console.log('检查余额失败:', error.message);
  }
  
  // 4. 环境配置管理
  console.log('\n=== 环境配置管理 ===');
  const configManager = new NetworkConfigManager();
  
  // 加载开发环境配置
  configManager.loadEnvironmentConfig('development');
  
  // 验证配置
  const validationResults = configManager.validateConfigs();
  console.log('配置验证结果:', validationResults);
  
  // 5. 网络检测和切换（浏览器环境）
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    console.log('\n=== 网络检测和切换 ===');
    
    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const detector = new NetworkDetector(browserProvider);
      
      const currentNetwork = await detector.detectCurrentNetwork();
      console.log('当前网络:', currentNetwork);
      
      // 监听网络变化
      detector.onNetworkChange((network) => {
        console.log('网络已变化:', network);
      });
      
      // 网络切换器
      const switcher = new NetworkSwitcher();
      
      // 尝试切换到 Polygon Mumbai
      const switched = await switcher.smartSwitchToNetwork(testNetworks.mumbai);
      console.log('网络切换结果:', switched);
      
    } catch (error) {
      console.log('浏览器环境网络操作失败:', error.message);
    }
  }
  
  // 6. 创建多网络应用
  console.log('\n=== 多网络应用示例 ===');
  
  const multiNetworkApp = {
    providers: new Map<string, ethers.Provider>(),
    
    // 初始化多个网络
    async initialize() {
      const networks = ['polygon-mumbai', 'arbitrum-one'];
      
      for (const networkName of networks) {
        try {
          const provider = networkManager.getProvider(networkName);
          this.providers.set(networkName, provider);
          
          const blockNumber = await provider.getBlockNumber();
          console.log(`${networkName} 当前区块: ${blockNumber}`);
        } catch (error) {
          console.log(`初始化 ${networkName} 失败:`, error.message);
        }
      }
    },
    
    // 在指定网络执行操作
    async executeOnNetwork(networkName: string, operation: (provider: ethers.Provider) => Promise<any>) {
      const provider = this.providers.get(networkName);
      if (!provider) {
        throw new Error(`网络 ${networkName} 未初始化`);
      }
      
      return await operation(provider);
    },
    
    // 跨网络比较
    async compareNetworks() {
      const results = {};
      
      for (const [networkName, provider] of this.providers.entries()) {
        try {
          const [blockNumber, feeData] = await Promise.all([
            provider.getBlockNumber(),
            provider.getFeeData()
          ]);
          
          results[networkName] = {
            blockNumber,
            gasPrice: feeData.gasPrice?.toString(),
            maxFeePerGas: feeData.maxFeePerGas?.toString()
          };
        } catch (error) {
          results[networkName] = { error: error.message };
        }
      }
      
      return results;
    }
  };
  
  await multiNetworkApp.initialize();
  const comparison = await multiNetworkApp.compareNetworks();
  console.log('网络比较结果:', comparison);
  
  return {
    networkManager,
    testManager,
    configManager,
    multiNetworkApp
  };
}

// 运行示例
customNetworkExample().catch(console.error);
```

## 总结

自定义网络配置是 Ethers.js 开发中的重要技能，本文档涵盖了：

### 核心功能
- **网络配置基础**：网络对象结构、Provider 创建
- **常见网络类型**：本地开发网络、测试网络、Layer 2 网络
- **网络检测切换**：自动检测、智能切换

### 高级特性
- **多端点故障转移**：FallbackProvider、连接池管理
- **环境配置管理**：开发/测试/生产环境分离
- **网络状态监控**：连接测试、性能监控

### 最佳实践
1. **配置管理**：使用环境变量、配置验证
2. **错误处理**：连接失败重试、优雅降级
3. **性能优化**：连接池、缓存策略
4. **安全性**：RPC 端点验证、链 ID 检查

通过合理配置和管理自定义网络，可以构建更加稳定、高效的区块链应用程序。

## 下一步

- [离线签名](/ethers/advanced/offline-signing) - 学习离线签名技术
- [多签钱包](/ethers/advanced/multisig) - 掌握多重签名钱包
- [元交易](/ethers/advanced/meta-transactions) - 学习元交易技术
- [ENS 域名服务](/ethers/advanced/ens) - 学习 ENS 域名解析