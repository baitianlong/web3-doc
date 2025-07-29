---
title: 钱包连接
description: 使用 Ethers.js 实现前端钱包连接的完整指南
keywords: [ethers, 钱包连接, MetaMask, 钱包监听, 账户切换, 网络切换, 前端集成]
---

# 钱包连接

钱包连接是 Web3 前端开发的基础环节。通过 Ethers.js，可以轻松集成 MetaMask 等主流钱包，实现账户连接、网络切换、断开连接等功能。本文档将详细介绍钱包连接的实现方式和最佳实践。

## 钱包连接基础

### 1. 检查钱包环境

```typescript
// 检查是否安装了 MetaMask
if (typeof window.ethereum !== 'undefined') {
  console.log('检测到 MetaMask 钱包');
} else {
  alert('请先安装 MetaMask 钱包插件');
}
```

### 2. 连接钱包

```typescript
import { ethers } from 'ethers';

// 连接钱包
async function connectWallet() {
  if (!window.ethereum) {
    alert('请先安装 MetaMask');
    return;
  }
  try {
    // 请求账户授权
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    console.log('连接账户:', account);
    // 创建 provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    // 获取当前网络
    const network = await provider.getNetwork();
    console.log('当前网络:', network);
    return { account, provider, network };
  } catch (error) {
    console.error('连接钱包失败:', error);
  }
}

// 调用连接
connectWallet();
```

### 3. 监听账户和网络变化

```typescript
// 监听账户变化
window.ethereum.on('accountsChanged', (accounts) => {
  if (accounts.length === 0) {
    console.log('钱包已断开连接');
  } else {
    console.log('账户切换为:', accounts[0]);
  }
});

// 监听网络变化
window.ethereum.on('chainChanged', (chainId) => {
  console.log('网络切换为:', chainId);
  // 建议刷新页面以重新初始化 provider
  window.location.reload();
});
```

### 4. 断开连接

```typescript
// MetaMask 不支持主动断开连接，但可以通过 UI 让用户切换账户或锁定钱包
// 建议在前端清除相关状态
function disconnectWallet() {
  // 清除本地状态
  // setAccount(null);
  // setProvider(null);
  console.log('已断开钱包连接');
}
```

### 5. 错误处理与用户体验

```typescript
// 处理连接错误
async function safeConnectWallet() {
  try {
    await connectWallet();
  } catch (error: any) {
    if (error.code === 4001) {
      alert('用户拒绝了连接请求');
    } else {
      alert('连接钱包时发生错误');
    }
  }
}
```

## 钱包连接最佳实践

- 检查钱包环境，友好提示用户安装钱包
- 监听账户和网络变化，及时更新前端状态
- 处理用户拒绝授权、网络不支持等异常
- 不要在前端保存私钥等敏感信息
- 支持多钱包扩展（如 WalletConnect、Coinbase Wallet 等）

## 参考资料
- [Ethers.js 官方文档](https://docs.ethers.org/v6/)
- [MetaMask 官方文档](https://docs.metamask.io/) 