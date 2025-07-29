---
title: 多链应用
description: 使用 Ethers.js 构建支持多链的 DApp 实战指南
keywords: [ethers, 多链, 多网络, provider, 跨链, 链切换, DApp]
---

# 多链应用

多链 DApp 能够支持多条区块链网络（如以太坊主网、Polygon、BSC、Arbitrum 等），为用户提供更丰富的资产和交互体验。Ethers.js 提供了灵活的 Provider 配置和链切换能力。本文档将介绍多链 DApp 的开发要点和最佳实践。

## 多链 Provider 配置

### 1. 支持多网络的 Provider

```typescript
import { ethers } from 'ethers';

// 多链 RPC 配置
const RPC_URLS = {
  mainnet: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
  polygon: 'https://polygon-rpc.com',
  bsc: 'https://bsc-dataseed.binance.org/',
  arbitrum: 'https://arb1.arbitrum.io/rpc'
};

// 根据链 ID 获取 provider
function getProvider(chain: 'mainnet' | 'polygon' | 'bsc' | 'arbitrum') {
  return new ethers.JsonRpcProvider(RPC_URLS[chain]);
}

// 示例：获取 Polygon 区块高度
const polygonProvider = getProvider('polygon');
polygonProvider.getBlockNumber().then((blockNumber) => {
  console.log('Polygon 当前区块:', blockNumber);
});
```

### 2. 动态切换链

```typescript
// 前端请求用户切换链（以 MetaMask 为例）
async function switchNetwork(chainId: string) {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
    console.log('已切换到链:', chainId);
  } catch (error: any) {
    // 未添加链时自动添加
    if (error.code === 4902) {
      // 这里以 Polygon 为例
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          rpcUrls: ['https://polygon-rpc.com'],
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          blockExplorerUrls: ['https://polygonscan.com']
        }]
      });
    }
  }
}

// 切换到 Polygon
switchNetwork('0x89');
```

## 跨链资产与合约交互

### 1. 跨链资产查询

```typescript
// 查询不同链上的账户余额
async function getMultiChainBalances(address: string) {
  const chains = ['mainnet', 'polygon', 'bsc', 'arbitrum'] as const;
  for (const chain of chains) {
    const provider = getProvider(chain);
    const balance = await provider.getBalance(address);
    console.log(`${chain} 余额:`, ethers.formatEther(balance));
  }
}

// 查询示例
getMultiChainBalances('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
```

### 2. 跨链合约调用

```typescript
// 在不同链上调用合约
async function callContractOnChains(contractAddress: string, abi: any, method: string, args: any[]) {
  const chains = ['mainnet', 'polygon', 'bsc', 'arbitrum'] as const;
  for (const chain of chains) {
    const provider = getProvider(chain);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const result = await contract[method](...args);
    console.log(`${chain} 调用结果:`, result);
  }
}

// 示例：查询 ERC20 代币名称
const ERC20_ABI = [
  'function name() view returns (string)'
];
callContractOnChains('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', ERC20_ABI, 'name', []);
```

## 多链开发注意事项

- 统一管理多链 RPC 配置，支持主流公链和 Layer2
- 处理不同链的 gas 机制、代币精度和合约差异
- 前端 UI 明确展示当前链和网络状态
- 监听链切换和账户变化，自动刷新数据
- 跨链资产转移需借助桥接协议（如官方 Bridge、LayerZero、Wormhole 等）
- 注意不同链的安全性和兼容性

## 参考资料
- [Ethers.js 官方文档](https://docs.ethers.org/v6/)
- [MetaMask 多链开发文档](https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods)
- [Chainlist 公链信息](https://chainlist.org/) 