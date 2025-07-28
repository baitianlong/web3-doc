# 安装和设置

本章将详细介绍如何在不同环境中安装和配置 Ethers.js，以及如何设置开发环境。

## 安装方式

### 1. NPM 安装（推荐）

```bash
# 安装最新版本
npm install ethers

# 安装特定版本
npm install ethers@^6.0.0

# 查看版本信息
npm list ethers
```

### 2. Yarn 安装

```bash
# 使用 Yarn 安装
yarn add ethers

# 查看版本
yarn list ethers
```

### 3. CDN 引入

```html
<!-- 生产环境 -->
<script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.min.js"></script>

<!-- 开发环境（未压缩） -->
<script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.js"></script>

<!-- 使用 -->
<script>
    console.log(ethers.version);
</script>
```

### 4. ES6 模块导入

```html
<!-- 现代浏览器支持 -->
<script type="module">
    import { ethers } from 'https://cdn.skypack.dev/ethers@^6.0.0';
    console.log(ethers.version);
</script>
```

## 项目设置

### 1. Node.js 项目设置

```bash
# 创建项目目录
mkdir my-web3-project
cd my-web3-project

# 初始化 package.json
npm init -y

# 安装依赖
npm install ethers
npm install --save-dev @types/node typescript ts-node nodemon

# 创建 TypeScript 配置
npx tsc --init
```

**package.json 配置：**
```json
{
  "name": "my-web3-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "watch": "nodemon --exec ts-node src/index.ts"
  },
  "dependencies": {
    "ethers": "^6.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

**tsconfig.json 配置：**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**基本示例文件 (src/index.ts)：**
```typescript
import { ethers } from 'ethers';

async function main() {
    console.log('Ethers.js 版本:', ethers.version);
    
    // 创建 Provider
    const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
    
    // 获取最新区块号
    const blockNumber = await provider.getBlockNumber();
    console.log('最新区块号:', blockNumber);
}

main().catch(console.error);
```

### 2. React 项目设置

```bash
# 创建 React 应用
npx create-react-app my-dapp --template typescript
cd my-dapp

# 安装 Ethers.js
npm install ethers

# 安装额外依赖
npm install @types/react @types/react-dom
```

**React 组件示例：**
```typescript
// src/components/WalletConnect.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

const WalletConnect: React.FC = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 请求连接
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 创建 Provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        // 获取 Signer
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // 获取余额
        const balance = await provider.getBalance(address);
        const balanceInEth = ethers.formatEther(balance);
        
        // 获取链 ID
        const network = await provider.getNetwork();
        
        setWallet({
          address,
          balance: balanceInEth,
          chainId: Number(network.chainId)
        });
        
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    } else {
      alert('请安装 MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setProvider(null);
  };

  return (
    <div>
      {!wallet ? (
        <button onClick={connectWallet}>连接钱包</button>
      ) : (
        <div>
          <p>地址: {wallet.address}</p>
          <p>余额: {wallet.balance} ETH</p>
          <p>链 ID: {wallet.chainId}</p>
          <button onClick={disconnectWallet}>断开连接</button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
```

### 3. Vue.js 项目设置

```bash
# 创建 Vue 应用
npm create vue@latest my-dapp
cd my-dapp

# 安装依赖
npm install
npm install ethers
```

**Vue 组件示例：**
```vue
<!-- src/components/WalletConnect.vue -->
<template>
  <div>
    <div v-if="!wallet">
      <button @click="connectWallet">连接钱包</button>
    </div>
    <div v-else>
      <p>地址: {{ wallet.address }}</p>
      <p>余额: {{ wallet.balance }} ETH</p>
      <p>链 ID: {{ wallet.chainId }}</p>
      <button @click="disconnectWallet">断开连接</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ethers } from 'ethers';

interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

const wallet = ref<WalletInfo | null>(null);
const provider = ref<ethers.BrowserProvider | null>(null);

const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      provider.value = ethProvider;
      
      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await ethProvider.getBalance(address);
      const network = await ethProvider.getNetwork();
      
      wallet.value = {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId)
      };
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  } else {
    alert('请安装 MetaMask!');
  }
};

const disconnectWallet = () => {
  wallet.value = null;
  provider.value = null;
};
</script>
```

### 4. Next.js 项目设置

```bash
# 创建 Next.js 应用
npx create-next-app@latest my-dapp --typescript --tailwind --eslint
cd my-dapp

# 安装 Ethers.js
npm install ethers
```

**Next.js 页面示例：**
```typescript
// pages/index.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  useEffect(() => {
    // 检查是否已连接钱包
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        
        setAccount(address);
        setBalance(ethers.formatEther(balance));
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        await checkConnection();
      } catch (error) {
        console.error('连接失败:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Web3 DApp</h1>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          连接钱包
        </button>
      ) : (
        <div>
          <p>账户: {account}</p>
          <p>余额: {balance} ETH</p>
        </div>
      )}
    </div>
  );
}
```

## 环境配置

### 1. 环境变量设置

**创建 .env 文件：**
```bash
# .env
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
PRIVATE_KEY=your_private_key_for_testing
ETHERSCAN_API_KEY=your_etherscan_api_key

# 网络配置
MAINNET_RPC_URL=https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}
```

**环境变量使用：**
```typescript
// src/config.ts
export const config = {
  networks: {
    mainnet: {
      name: 'Ethereum Mainnet',
      chainId: 1,
      rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID'
    },
    sepolia: {
      name: 'Sepolia Testnet',
      chainId: 11155111,
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR-PROJECT-ID'
    },
    polygon: {
      name: 'Polygon Mainnet',
      chainId: 137,
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID'
    }
  },
  apiKeys: {
    infura: process.env.INFURA_PROJECT_ID,
    alchemy: process.env.ALCHEMY_API_KEY,
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
```

### 2. 网络配置

```typescript
// src/providers.ts
import { ethers } from 'ethers';
import { config } from './config';

export class ProviderManager {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  getProvider(network: string): ethers.JsonRpcProvider {
    if (!this.providers.has(network)) {
      const networkConfig = config.networks[network];
      if (!networkConfig) {
        throw new Error(`不支持的网络: ${network}`);
      }
      
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      this.providers.set(network, provider);
    }
    
    return this.providers.get(network)!;
  }

  async getNetworkInfo(network: string) {
    const provider = this.getProvider(network);
    const networkInfo = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getGasPrice();
    
    return {
      name: networkInfo.name,
      chainId: Number(networkInfo.chainId),
      blockNumber,
      gasPrice: ethers.formatUnits(gasPrice, 'gwei')
    };
  }
}

// 使用示例
const providerManager = new ProviderManager();
const mainnetProvider = providerManager.getProvider('mainnet');
```

### 3. 钱包管理

```typescript
// src/wallet.ts
import { ethers } from 'ethers';

export class WalletManager {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.Provider | null = null;

  // 从私钥创建钱包
  createFromPrivateKey(privateKey: string, provider: ethers.Provider): ethers.Wallet {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.provider = provider;
    return this.wallet;
  }

  // 从助记词创建钱包
  createFromMnemonic(mnemonic: string, provider: ethers.Provider): ethers.Wallet {
    this.wallet = ethers.Wallet.fromPhrase(mnemonic, provider);
    this.provider = provider;
    return this.wallet;
  }

  // 创建随机钱包
  createRandom(provider: ethers.Provider): ethers.Wallet {
    this.wallet = ethers.Wallet.createRandom(provider);
    this.provider = provider;
    return this.wallet;
  }

  // 获取钱包信息
  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error('钱包未初始化');
    }

    const address = await this.wallet.getAddress();
    const balance = await this.wallet.provider!.getBalance(address);
    
    return {
      address,
      balance: ethers.formatEther(balance),
      privateKey: this.wallet.privateKey,
      mnemonic: this.wallet.mnemonic?.phrase
    };
  }

  // 发送交易
  async sendTransaction(to: string, value: string, gasLimit?: number) {
    if (!this.wallet) {
      throw new Error('钱包未初始化');
    }

    const tx = {
      to,
      value: ethers.parseEther(value),
      gasLimit: gasLimit || 21000
    };

    const transaction = await this.wallet.sendTransaction(tx);
    return transaction;
  }
}
```

## 开发工具集成

### 1. Hardhat 集成

```bash
# 安装 Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers ethers
```

**hardhat.config.ts：**
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

export default config;
```

### 2. 测试配置

```typescript
// test/wallet.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Wallet Tests', function () {
  it('应该能够创建钱包', async function () {
    const wallet = ethers.Wallet.createRandom();
    expect(wallet.address).to.be.a('string');
    expect(wallet.privateKey).to.be.a('string');
  });

  it('应该能够签名消息', async function () {
    const wallet = ethers.Wallet.createRandom();
    const message = 'Hello World';
    const signature = await wallet.signMessage(message);
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    expect(recoveredAddress).to.equal(wallet.address);
  });
});
```

### 3. 部署脚本

```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('部署账户:', deployer.address);
  console.log('账户余额:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 部署合约
  const Token = await ethers.getContractFactory('MyToken');
  const token = await Token.deploy('MyToken', 'MTK', ethers.parseEther('1000000'));
  
  await token.waitForDeployment();
  console.log('合约地址:', await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## 常见问题解决

### 1. 版本兼容性

```typescript
// Ethers v5 到 v6 的迁移
// v5
const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(privateKey, provider);

// v6
const provider = new ethers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(privateKey, provider);
```

### 2. 浏览器兼容性

```typescript
// 检查浏览器支持
if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  // 浏览器环境且支持 Web3
  const provider = new ethers.BrowserProvider(window.ethereum);
} else {
  // Node.js 环境或不支持 Web3
  console.log('请在支持 Web3 的浏览器中运行');
}
```

### 3. 错误处理

```typescript
// 网络连接错误处理
async function safeProviderCall<T>(
  providerCall: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await providerCall();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.log(`重试 ${i + 1}/${retries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('所有重试都失败了');
}

// 使用示例
const blockNumber = await safeProviderCall(() => provider.getBlockNumber());
```

## 性能优化

### 1. Provider 复用

```typescript
// 单例模式管理 Provider
class ProviderSingleton {
  private static instances: Map<string, ethers.JsonRpcProvider> = new Map();

  static getInstance(rpcUrl: string): ethers.JsonRpcProvider {
    if (!this.instances.has(rpcUrl)) {
      this.instances.set(rpcUrl, new ethers.JsonRpcProvider(rpcUrl));
    }
    return this.instances.get(rpcUrl)!;
  }
}
```

### 2. 批量请求

```typescript
// 批量获取余额
async function getBatchBalances(
  provider: ethers.JsonRpcProvider,
  addresses: string[]
): Promise<string[]> {
  const promises = addresses.map(address => provider.getBalance(address));
  const balances = await Promise.all(promises);
  return balances.map(balance => ethers.formatEther(balance));
}
```

## 下一步

- [Provider 提供者](/ethers/basics/providers) - 深入了解 Provider 的使用
- [Signer 签名者](/ethers/basics/signers) - 学习签名者的管理
- [Contract 合约](/ethers/basics/contracts) - 掌握合约交互技巧