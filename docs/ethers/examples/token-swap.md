---
title: 代币交换
description: 使用 Ethers.js 实现 Uniswap 等 DEX 代币兑换的完整实战指南
keywords: [ethers, 代币交换, token swap, Uniswap, DEX, 兑换, approve, 滑点, 前端集成]
---

# 代币交换

代币交换（Token Swap）是 DeFi 应用中最常见的功能之一。通过 Ethers.js，可以集成 Uniswap 等主流 DEX，实现自动化或前端的代币兑换。本文档将介绍代币交换的原理、授权、滑点控制、交易监听与最佳实践。

## 代币交换基础

### 1. 代币交换原理
- 用户将一种代币（如 USDC）兑换为另一种代币（如 WETH）
- 需要先授权（approve）DEX 路由合约支配用户的代币
- 通过 DEX 路由合约发起兑换交易
- 交易确认后获得目标代币

### 2. 主流 DEX 路由合约地址

```typescript
const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
```

## 代币授权（Approve）

在兑换前，需授权路由合约支配你的代币：

```typescript
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)'
];

async function approveToken(tokenAddress: string, owner: string, spender: string, amount: bigint, signer: ethers.Signer) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const tx = await token.approve(spender, amount);
  console.log('授权交易已发送:', tx.hash);
  await tx.wait();
  console.log('授权已确认');
}

// 示例：授权 1000 USDC 给 Uniswap V2 Router
// approveToken(USDC_ADDRESS, userAddress, UNISWAP_V2_ROUTER, ethers.parseUnits('1000', 6), signer);
```

## Uniswap V2 代币兑换

```typescript
const UNISWAP_V2_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

async function swapTokensV2({
  routerAddress,
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMin,
  to,
  signer
}: {
  routerAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  amountOutMin: bigint,
  to: string,
  signer: ethers.Signer
}) {
  const router = new ethers.Contract(routerAddress, UNISWAP_V2_ABI, signer);
  const path = [tokenIn, tokenOut];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10分钟后过期
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  );
  console.log('兑换交易已发送:', tx.hash);
  const receipt = await tx.wait();
  console.log('兑换已确认，区块:', receipt.blockNumber);
}

// 示例：将 100 USDC 兑换为 WETH
// swapTokensV2({
//   routerAddress: UNISWAP_V2_ROUTER,
//   tokenIn: USDC_ADDRESS,
//   tokenOut: WETH_ADDRESS,
//   amountIn: ethers.parseUnits('100', 6),
//   amountOutMin: ethers.parseUnits('0.05', 18), // 滑点控制
//   to: userAddress,
//   signer
// });
```

## Uniswap V3 代币兑换

Uniswap V3 采用参数结构体，兑换方式略有不同：

```typescript
const UNISWAP_V3_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
];

async function swapTokensV3({
  routerAddress,
  tokenIn,
  tokenOut,
  fee,
  amountIn,
  amountOutMin,
  to,
  signer
}: {
  routerAddress: string,
  tokenIn: string,
  tokenOut: string,
  fee: number,
  amountIn: bigint,
  amountOutMin: bigint,
  to: string,
  signer: ethers.Signer
}) {
  const router = new ethers.Contract(routerAddress, UNISWAP_V3_ABI, signer);
  const params = {
    tokenIn,
    tokenOut,
    fee,
    recipient: to,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    amountIn,
    amountOutMinimum: amountOutMin,
    sqrtPriceLimitX96: 0n
  };
  const tx = await router.exactInputSingle(params);
  console.log('兑换交易已发送:', tx.hash);
  const receipt = await tx.wait();
  console.log('兑换已确认，区块:', receipt.blockNumber);
}

// 示例：将 100 USDC 兑换为 WETH（0.05% 池）
// swapTokensV3({
//   routerAddress: UNISWAP_V3_ROUTER,
//   tokenIn: USDC_ADDRESS,
//   tokenOut: WETH_ADDRESS,
//   fee: 500,
//   amountIn: ethers.parseUnits('100', 6),
//   amountOutMin: ethers.parseUnits('0.05', 18),
//   to: userAddress,
//   signer
// });
```

## 滑点控制与最小成交量

- `amountOutMin` 参数用于防止滑点过大导致损失
- 建议通过预估兑换结果（如调用 `getAmountsOut` 或链上预言机）动态设置

## 交易状态监听与错误处理

```typescript
// 监听交易状态
const tx = await router.swapExactTokensForTokens(...);
console.log('交易已发送:', tx.hash);
const receipt = await tx.wait();
if (receipt.status === 1) {
  console.log('交易成功');
} else {
  console.error('交易失败');
}

// 常见错误处理
try {
  // ...兑换逻辑
} catch (error: any) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    alert('余额不足');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    alert('兑换失败，可能因授权不足或池流动性不足');
  } else {
    alert('兑换发生未知错误');
  }
}
```

## 最佳实践与安全提示

- 兑换前务必授权足够额度，避免 approve 无限额度带来的风险
- 关注滑点，防止极端行情下损失
- 监听交易状态，及时反馈用户
- 建议使用 WebSocketProvider 获取更快的交易确认
- 生产环境建议集成多 DEX 路由（如 1inch、Paraswap）以获得更优价格
- 注意防范钓鱼合约和假代币

## 参考资料
- [Uniswap V2 Router 合约](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02)
- [Uniswap V3 Router 合约](https://docs.uniswap.org/contracts/v3/reference/periphery/SwapRouter)
- [Ethers.js 官方文档](https://docs.ethers.org/v6/) 