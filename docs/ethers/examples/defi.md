---
title: DeFi 交互
description: 使用 Ethers.js 与 DeFi 协议交互的完整指南
keywords: [ethers, DeFi, 去中心化金融, Uniswap, Compound, Aave, 代币交换, 流动性挖矿]
---

# DeFi 交互

去中心化金融（DeFi）是区块链技术最重要的应用之一。本文档将详细介绍如何使用 Ethers.js 与各种 DeFi 协议进行交互。

## DeFi 基础概念

### 1. 主要 DeFi 协议类型

```typescript
// DeFi 协议分类
interface DeFiProtocols {
  // 去中心化交易所 (DEX)
  dex: {
    uniswap: 'v2' | 'v3';
    sushiswap: string;
    pancakeswap: string;
    curve: string;
  };
  
  // 借贷协议
  lending: {
    compound: string;
    aave: 'v2' | 'v3';
    maker: string;
  };
  
  // 流动性挖矿
  farming: {
    yearn: string;
    convex: string;
    harvest: string;
  };
  
  // 衍生品
  derivatives: {
    synthetix: string;
    perpetual: string;
    dydx: string;
  };
}
```

### 2. 常用 DeFi 合约地址

```typescript
// 以太坊主网 DeFi 合约地址
const DEFI_CONTRACTS = {
  // 代币地址
  tokens: {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  
  // Uniswap V3
  uniswapV3: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  },
  
  // Compound V3
  compound: {
    comptroller: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    cUSDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    cETH: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    cDAI: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
  },
  
  // Aave V3
  aave: {
    pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    poolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
    oracle: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
  }
};
```

## Uniswap 交互

### 1. Uniswap V3 代币交换

```typescript
import { ethers } from 'ethers';

// Uniswap V3 Router ABI（简化版）
const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)'
];

// Uniswap V3 Quoter ABI
const UNISWAP_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)'
];

class UniswapV3Trader {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.router = new ethers.Contract(
      DEFI_CONTRACTS.uniswapV3.router,
      UNISWAP_V3_ROUTER_ABI,
      signer
    );
    this.quoter = new ethers.Contract(
      DEFI_CONTRACTS.uniswapV3.quoter,
      UNISWAP_V3_QUOTER_ABI,
      provider
    );
  }
  
  // 获取交换报价
  async getQuote(tokenIn, tokenOut, amountIn, fee = 3000) {
    try {
      const amountOut = await this.quoter.quoteExactInputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        0 // sqrtPriceLimitX96 = 0 表示无价格限制
      );
      
      return {
        amountIn,
        amountOut,
        tokenIn,
        tokenOut,
        fee,
        priceImpact: this.calculatePriceImpact(amountIn, amountOut),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`获取报价失败: ${error.message}`);
    }
  }
  
  // 执行精确输入交换
  async swapExactInput(tokenIn, tokenOut, amountIn, amountOutMinimum, fee = 3000, deadline = null) {
    try {
      // 设置默认截止时间（30分钟后）
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      const params = {
        tokenIn,
        tokenOut,
        fee,
        recipient: await this.signer.getAddress(),
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0
      };
      
      // 如果是 ETH 交换，需要发送 ETH
      const value = tokenIn === ethers.ZeroAddress ? amountIn : 0;
      
      const tx = await this.router.exactInputSingle(params, { value });
      
      console.log('交换交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`交换失败: ${error.message}`);
    }
  }
  
  // 执行精确输出交换
  async swapExactOutput(tokenIn, tokenOut, amountOut, amountInMaximum, fee = 3000, deadline = null) {
    try {
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      const params = {
        tokenIn,
        tokenOut,
        fee,
        recipient: await this.signer.getAddress(),
        deadline,
        amountOut,
        amountInMaximum,
        sqrtPriceLimitX96: 0
      };
      
      const value = tokenIn === ethers.ZeroAddress ? amountInMaximum : 0;
      
      const tx = await this.router.exactOutputSingle(params, { value });
      
      console.log('精确输出交换交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`精确输出交换失败: ${error.message}`);
    }
  }
  
  // 多跳交换
  async swapMultiHop(path, amountIn, amountOutMinimum, deadline = null) {
    try {
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      // 构建路径编码
      const encodedPath = this.encodePath(path);
      
      const params = {
        path: encodedPath,
        recipient: await this.signer.getAddress(),
        deadline,
        amountIn,
        amountOutMinimum
      };
      
      const tx = await this.router.exactInput(params);
      
      console.log('多跳交换交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`多跳交换失败: ${error.message}`);
    }
  }
  
  // 编码交换路径
  encodePath(path) {
    let encoded = '0x';
    
    for (let i = 0; i < path.length; i++) {
      if (i === 0) {
        // 第一个代币地址
        encoded += path[i].token.slice(2);
      } else {
        // 费用等级（3字节）+ 代币地址（20字节）
        const fee = path[i].fee.toString(16).padStart(6, '0');
        encoded += fee + path[i].token.slice(2);
      }
    }
    
    return encoded;
  }
  
  // 计算价格影响
  calculatePriceImpact(amountIn, amountOut) {
    // 简化的价格影响计算
    // 实际应用中需要更复杂的计算
    const ratio = Number(amountOut) / Number(amountIn);
    return Math.abs(1 - ratio) * 100;
  }
  
  // 获取最佳交换路径
  async findBestPath(tokenIn, tokenOut, amountIn) {
    const commonFees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    const commonTokens = [
      DEFI_CONTRACTS.tokens.WETH,
      DEFI_CONTRACTS.tokens.USDC,
      DEFI_CONTRACTS.tokens.USDT
    ];
    
    const routes = [];
    
    // 直接路径
    for (const fee of commonFees) {
      try {
        const quote = await this.getQuote(tokenIn, tokenOut, amountIn, fee);
        routes.push({
          path: [{ token: tokenIn }, { token: tokenOut, fee }],
          amountOut: quote.amountOut,
          priceImpact: quote.priceImpact,
          hops: 1
        });
      } catch (error) {
        // 忽略失败的路径
      }
    }
    
    // 通过中间代币的路径
    for (const intermediateToken of commonTokens) {
      if (intermediateToken === tokenIn || intermediateToken === tokenOut) {
        continue;
      }
      
      for (const fee1 of commonFees) {
        for (const fee2 of commonFees) {
          try {
            // 第一跳报价
            const quote1 = await this.getQuote(tokenIn, intermediateToken, amountIn, fee1);
            // 第二跳报价
            const quote2 = await this.getQuote(intermediateToken, tokenOut, quote1.amountOut, fee2);
            
            routes.push({
              path: [
                { token: tokenIn },
                { token: intermediateToken, fee: fee1 },
                { token: tokenOut, fee: fee2 }
              ],
              amountOut: quote2.amountOut,
              priceImpact: quote1.priceImpact + quote2.priceImpact,
              hops: 2
            });
          } catch (error) {
            // 忽略失败的路径
          }
        }
      }
    }
    
    // 按输出金额排序，返回最佳路径
    routes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut));
    
    return routes[0] || null;
  }
}

// 使用示例
async function uniswapExample() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const signer = new ethers.Wallet('YOUR-PRIVATE-KEY', provider);
  
  const trader = new UniswapV3Trader(provider, signer);
  
  try {
    // 1. 获取 USDC -> WETH 交换报价
    const amountIn = ethers.parseUnits('1000', 6); // 1000 USDC
    const quote = await trader.getQuote(
      DEFI_CONTRACTS.tokens.USDC,
      DEFI_CONTRACTS.tokens.WETH,
      amountIn
    );
    
    console.log('交换报价:', {
      输入: ethers.formatUnits(quote.amountIn, 6) + ' USDC',
      输出: ethers.formatUnits(quote.amountOut, 18) + ' WETH',
      价格影响: quote.priceImpact.toFixed(2) + '%'
    });
    
    // 2. 查找最佳路径
    const bestPath = await trader.findBestPath(
      DEFI_CONTRACTS.tokens.USDC,
      DEFI_CONTRACTS.tokens.WETH,
      amountIn
    );
    
    console.log('最佳路径:', bestPath);
    
    // 3. 执行交换（需要先授权代币）
    const amountOutMinimum = quote.amountOut * 95n / 100n; // 5% 滑点容忍度
    
    const swapResult = await trader.swapExactInput(
      DEFI_CONTRACTS.tokens.USDC,
      DEFI_CONTRACTS.tokens.WETH,
      amountIn,
      amountOutMinimum
    );
    
    console.log('交换结果:', swapResult);
    
  } catch (error) {
    console.error('Uniswap 交互失败:', error.message);
  }
}
```

### 2. 流动性提供

```typescript
// Uniswap V3 NFT Position Manager ABI（简化版）
const POSITION_MANAGER_ABI = [
  'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)',
  'function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)',
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)'
];

class UniswapV3LiquidityProvider {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.positionManager = new ethers.Contract(
      DEFI_CONTRACTS.uniswapV3.nftManager,
      POSITION_MANAGER_ABI,
      signer
    );
  }
  
  // 添加流动性
  async addLiquidity(token0, token1, fee, amount0, amount1, tickLower, tickUpper, deadline = null) {
    try {
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      // 计算最小金额（5% 滑点容忍度）
      const amount0Min = amount0 * 95n / 100n;
      const amount1Min = amount1 * 95n / 100n;
      
      const params = {
        token0,
        token1,
        fee,
        tickLower,
        tickUpper,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min,
        amount1Min,
        recipient: await this.signer.getAddress(),
        deadline
      };
      
      const tx = await this.positionManager.mint(params);
      
      console.log('添加流动性交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      // 解析事件获取 tokenId
      const mintEvent = receipt.logs.find(log => 
        log.topics[0] === ethers.id('IncreaseLiquidity(uint256,uint128,uint256,uint256)')
      );
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        tokenId: mintEvent ? parseInt(mintEvent.topics[1], 16) : null
      };
      
    } catch (error) {
      throw new Error(`添加流动性失败: ${error.message}`);
    }
  }
  
  // 增加流动性
  async increaseLiquidity(tokenId, amount0, amount1, deadline = null) {
    try {
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      const amount0Min = amount0 * 95n / 100n;
      const amount1Min = amount1 * 95n / 100n;
      
      const params = {
        tokenId,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min,
        amount1Min,
        deadline
      };
      
      const tx = await this.positionManager.increaseLiquidity(params);
      
      console.log('增加流动性交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      };
      
    } catch (error) {
      throw new Error(`增加流动性失败: ${error.message}`);
    }
  }
  
  // 减少流动性
  async decreaseLiquidity(tokenId, liquidity, deadline = null) {
    try {
      if (!deadline) {
        deadline = Math.floor(Date.now() / 1000) + 1800;
      }
      
      const params = {
        tokenId,
        liquidity,
        amount0Min: 0,
        amount1Min: 0,
        deadline
      };
      
      const tx = await this.positionManager.decreaseLiquidity(params);
      
      console.log('减少流动性交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      };
      
    } catch (error) {
      throw new Error(`减少流动性失败: ${error.message}`);
    }
  }
  
  // 收集手续费
  async collectFees(tokenId) {
    try {
      const params = {
        tokenId,
        recipient: await this.signer.getAddress(),
        amount0Max: ethers.MaxUint128,
        amount1Max: ethers.MaxUint128
      };
      
      const tx = await this.positionManager.collect(params);
      
      console.log('收集手续费交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      };
      
    } catch (error) {
      throw new Error(`收集手续费失败: ${error.message}`);
    }
  }
  
  // 获取持仓信息
  async getPosition(tokenId) {
    try {
      const position = await this.positionManager.positions(tokenId);
      
      return {
        tokenId,
        nonce: position.nonce,
        operator: position.operator,
        token0: position.token0,
        token1: position.token1,
        fee: position.fee,
        tickLower: position.tickLower,
        tickUpper: position.tickUpper,
        liquidity: position.liquidity,
        tokensOwed0: position.tokensOwed0,
        tokensOwed1: position.tokensOwed1
      };
      
    } catch (error) {
      throw new Error(`获取持仓信息失败: ${error.message}`);
    }
  }
  
  // 计算价格范围对应的 tick
  calculateTicks(price0, price1, tickSpacing) {
    // 简化的 tick 计算
    // 实际应用中需要更精确的计算
    const tick0 = Math.floor(Math.log(price0) / Math.log(1.0001));
    const tick1 = Math.floor(Math.log(price1) / Math.log(1.0001));
    
    // 调整到 tickSpacing 的倍数
    const tickLower = Math.floor(tick0 / tickSpacing) * tickSpacing;
    const tickUpper = Math.ceil(tick1 / tickSpacing) * tickSpacing;
    
    return { tickLower, tickUpper };
  }
}
```

## Compound 借贷协议

### 1. Compound V3 交互

```typescript
// Compound V3 Comet ABI（简化版）
const COMPOUND_V3_ABI = [
  'function supply(address asset, uint amount)',
  'function withdraw(address asset, uint amount)',
  'function borrow(uint amount)',
  'function repay(uint amount)',
  'function balanceOf(address account) external view returns (uint256)',
  'function borrowBalanceOf(address account) external view returns (uint256)',
  'function collateralBalanceOf(address account, address asset) external view returns (uint128)',
  'function getSupplyRate(uint utilization) external view returns (uint64)',
  'function getBorrowRate(uint utilization) external view returns (uint64)',
  'function getUtilization() external view returns (uint)',
  'function getPrice(address priceFeed) external view returns (uint128)'
];

class CompoundV3Lender {
  constructor(provider, signer, marketAddress) {
    this.provider = provider;
    this.signer = signer;
    this.market = new ethers.Contract(marketAddress, COMPOUND_V3_ABI, signer);
  }
  
  // 供应资产
  async supply(asset, amount) {
    try {
      const tx = await this.market.supply(asset, amount);
      
      console.log('供应交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`供应失败: ${error.message}`);
    }
  }
  
  // 提取资产
  async withdraw(asset, amount) {
    try {
      const tx = await this.market.withdraw(asset, amount);
      
      console.log('提取交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`提取失败: ${error.message}`);
    }
  }
  
  // 借款
  async borrow(amount) {
    try {
      const tx = await this.market.borrow(amount);
      
      console.log('借款交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`借款失败: ${error.message}`);
    }
  }
  
  // 还款
  async repay(amount) {
    try {
      const tx = await this.market.repay(amount);
      
      console.log('还款交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`还款失败: ${error.message}`);
    }
  }
  
  // 获取账户信息
  async getAccountInfo(account) {
    try {
      const [balance, borrowBalance, utilization, supplyRate, borrowRate] = await Promise.all([
        this.market.balanceOf(account),
        this.market.borrowBalanceOf(account),
        this.market.getUtilization(),
        this.market.getSupplyRate(await this.market.getUtilization()),
        this.market.getBorrowRate(await this.market.getUtilization())
      ]);
      
      return {
        account,
        supplyBalance: balance,
        borrowBalance,
        utilization,
        supplyRate,
        borrowRate,
        supplyAPY: this.calculateAPY(supplyRate),
        borrowAPY: this.calculateAPY(borrowRate)
      };
      
    } catch (error) {
      throw new Error(`获取账户信息失败: ${error.message}`);
    }
  }
  
  // 获取抵押品余额
  async getCollateralBalance(account, asset) {
    try {
      const balance = await this.market.collateralBalanceOf(account, asset);
      return balance;
    } catch (error) {
      throw new Error(`获取抵押品余额失败: ${error.message}`);
    }
  }
  
  // 计算 APY
  calculateAPY(rate) {
    // Compound 利率是每秒的利率，需要转换为年化利率
    const secondsPerYear = 365 * 24 * 60 * 60;
    const ratePerSecond = Number(rate) / 1e18;
    const apy = (Math.pow(1 + ratePerSecond, secondsPerYear) - 1) * 100;
    return apy;
  }
  
  // 计算健康因子
  async calculateHealthFactor(account) {
    try {
      const accountInfo = await this.getAccountInfo(account);
      
      // 简化的健康因子计算
      // 实际需要考虑抵押品价值和清算阈值
      if (accountInfo.borrowBalance === 0n) {
        return Infinity; // 没有借款，健康因子为无穷大
      }
      
      // 这里需要获取抵押品价值和清算阈值
      // const collateralValue = await this.getCollateralValue(account);
      // const liquidationThreshold = 0.8; // 80%
      // const healthFactor = (collateralValue * liquidationThreshold) / borrowBalance;
      
      return 1.5; // 示例值
      
    } catch (error) {
      throw new Error(`计算健康因子失败: ${error.message}`);
    }
  }
}

// 使用示例
async function compoundExample() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const signer = new ethers.Wallet('YOUR-PRIVATE-KEY', provider);
  
  // Compound V3 USDC 市场
  const lender = new CompoundV3Lender(provider, signer, DEFI_CONTRACTS.compound.cUSDC);
  
  try {
    const userAddress = await signer.getAddress();
    
    // 1. 获取账户信息
    const accountInfo = await lender.getAccountInfo(userAddress);
    console.log('账户信息:', {
      供应余额: ethers.formatUnits(accountInfo.supplyBalance, 6) + ' USDC',
      借款余额: ethers.formatUnits(accountInfo.borrowBalance, 6) + ' USDC',
      供应APY: accountInfo.supplyAPY.toFixed(2) + '%',
      借款APY: accountInfo.borrowAPY.toFixed(2) + '%'
    });
    
    // 2. 供应 USDC
    const supplyAmount = ethers.parseUnits('1000', 6); // 1000 USDC
    const supplyResult = await lender.supply(DEFI_CONTRACTS.tokens.USDC, supplyAmount);
    console.log('供应结果:', supplyResult);
    
    // 3. 计算健康因子
    const healthFactor = await lender.calculateHealthFactor(userAddress);
    console.log('健康因子:', healthFactor);
    
  } catch (error) {
    console.error('Compound 交互失败:', error.message);
  }
}
```

## Aave 借贷协议

### 1. Aave V3 交互

```typescript
// Aave V3 Pool ABI（简化版）
const AAVE_V3_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
  'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)',
  'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)',
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) external view returns (uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt)'
];

class AaveV3Lender {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.pool = new ethers.Contract(
      DEFI_CONTRACTS.aave.pool,
      AAVE_V3_POOL_ABI,
      signer
    );
  }
  
  // 供应资产
  async supply(asset, amount, onBehalfOf = null) {
    try {
      const recipient = onBehalfOf || await this.signer.getAddress();
      
      const tx = await this.pool.supply(asset, amount, recipient, 0);
      
      console.log('Aave 供应交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`Aave 供应失败: ${error.message}`);
    }
  }
  
  // 提取资产
  async withdraw(asset, amount, to = null) {
    try {
      const recipient = to || await this.signer.getAddress();
      
      const tx = await this.pool.withdraw(asset, amount, recipient);
      
      console.log('Aave 提取交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`Aave 提取失败: ${error.message}`);
    }
  }
  
  // 借款
  async borrow(asset, amount, interestRateMode = 2, onBehalfOf = null) {
    try {
      const borrower = onBehalfOf || await this.signer.getAddress();
      
      const tx = await this.pool.borrow(asset, amount, interestRateMode, 0, borrower);
      
      console.log('Aave 借款交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`Aave 借款失败: ${error.message}`);
    }
  }
  
  // 还款
  async repay(asset, amount, interestRateMode = 2, onBehalfOf = null) {
    try {
      const borrower = onBehalfOf || await this.signer.getAddress();
      
      const tx = await this.pool.repay(asset, amount, interestRateMode, borrower);
      
      console.log('Aave 还款交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`Aave 还款失败: ${error.message}`);
    }
  }
  
  // 设置资产作为抵押品
  async setCollateral(asset, useAsCollateral) {
    try {
      const tx = await this.pool.setUserUseReserveAsCollateral(asset, useAsCollateral);
      
      console.log('设置抵押品交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
      
    } catch (error) {
      throw new Error(`设置抵押品失败: ${error.message}`);
    }
  }
  
  // 获取用户账户数据
  async getUserAccountData(user) {
    try {
      const accountData = await this.pool.getUserAccountData(user);
      
      return {
        totalCollateralBase: accountData.totalCollateralBase,
        totalDebtBase: accountData.totalDebtBase,
        availableBorrowsBase: accountData.availableBorrowsBase,
        currentLiquidationThreshold: accountData.currentLiquidationThreshold,
        ltv: accountData.ltv,
        healthFactor: accountData.healthFactor,
        // 转换为可读格式
        healthFactorFormatted: Number(accountData.healthFactor) / 1e18,
        ltvFormatted: Number(accountData.ltv) / 100, // LTV 以百分比表示
        liquidationThresholdFormatted: Number(accountData.currentLiquidationThreshold) / 100
      };
      
    } catch (error) {
      throw new Error(`获取用户账户数据失败: ${error.message}`);
    }
  }
  
  // 获取储备数据
  async getReserveData(asset) {
    try {
      const reserveData = await this.pool.getReserveData(asset);
      
      return {
        liquidityIndex: reserveData.liquidityIndex,
        currentLiquidityRate: reserveData.currentLiquidityRate,
        variableBorrowIndex: reserveData.variableBorrowIndex,
        currentVariableBorrowRate: reserveData.currentVariableBorrowRate,
        currentStableBorrowRate: reserveData.currentStableBorrowRate,
        lastUpdateTimestamp: reserveData.lastUpdateTimestamp,
        aTokenAddress: reserveData.aTokenAddress,
        stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
        variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
        // 转换为 APY
        supplyAPY: this.rayToAPY(reserveData.currentLiquidityRate),
        variableBorrowAPY: this.rayToAPY(reserveData.currentVariableBorrowRate),
        stableBorrowAPY: this.rayToAPY(reserveData.currentStableBorrowRate)
      };
      
    } catch (error) {
      throw new Error(`获取储备数据失败: ${error.message}`);
    }
  }
  
  // 将 Ray 格式转换为 APY
  rayToAPY(ray) {
    const RAY = 1e27;
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    const ratePerSecond = Number(ray) / RAY;
    const apy = (Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1) * 100;
    
    return apy;
  }
  
  // 计算最大可借金额
  async getMaxBorrowAmount(user, asset) {
    try {
      const accountData = await this.getUserAccountData(user);
      const reserveData = await this.getReserveData(asset);
      
      // 简化计算，实际需要考虑资产价格
      const maxBorrowBase = accountData.availableBorrowsBase;
      
      return {
        maxBorrowBase,
        healthFactorAfterBorrow: this.calculateHealthFactorAfterBorrow(
          accountData,
          maxBorrowBase
        )
      };
      
    } catch (error) {
      throw new Error(`计算最大可借金额失败: ${error.message}`);
    }
  }
  
  // 计算借款后的健康因子
  calculateHealthFactorAfterBorrow(accountData, borrowAmount) {
    const totalCollateral = Number(accountData.totalCollateralBase);
    const totalDebt = Number(accountData.totalDebtBase) + Number(borrowAmount);
    const liquidationThreshold = Number(accountData.currentLiquidationThreshold) / 10000;
    
    if (totalDebt === 0) {
      return Infinity;
    }
    
    return (totalCollateral * liquidationThreshold) / totalDebt;
  }
}

// 使用示例
async function aaveExample() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const signer = new ethers.Wallet('YOUR-PRIVATE-KEY', provider);
  
  const lender = new AaveV3Lender(provider, signer);
  
  try {
    const userAddress = await signer.getAddress();
    
    // 1. 获取用户账户数据
    const accountData = await lender.getUserAccountData(userAddress);
    console.log('Aave 账户数据:', {
      总抵押品: ethers.formatUnits(accountData.totalCollateralBase, 8) + ' USD',
      总债务: ethers.formatUnits(accountData.totalDebtBase, 8) + ' USD',
      可借金额: ethers.formatUnits(accountData.availableBorrowsBase, 8) + ' USD',
      健康因子: accountData.healthFactorFormatted.toFixed(2),
      LTV: accountData.ltvFormatted.toFixed(2) + '%',
      清算阈值: accountData.liquidationThresholdFormatted.toFixed(2) + '%'
    });
    
    // 2. 获取 USDC 储备数据
    const usdcReserveData = await lender.getReserveData(DEFI_CONTRACTS.tokens.USDC);
    console.log('USDC 储备数据:', {
      供应APY: usdcReserveData.supplyAPY.toFixed(2) + '%',
      可变借款APY: usdcReserveData.variableBorrowAPY.toFixed(2) + '%',
      稳定借款APY: usdcReserveData.stableBorrowAPY.toFixed(2) + '%',
      aToken地址: usdcReserveData.aTokenAddress
    });
    
    // 3. 供应 USDC
    const supplyAmount = ethers.parseUnits('1000', 6); // 1000 USDC
    const supplyResult = await lender.supply(DEFI_CONTRACTS.tokens.USDC, supplyAmount);
    console.log('Aave 供应结果:', supplyResult);
    
    // 4. 设置 USDC 作为抵押品
    const collateralResult = await lender.setCollateral(DEFI_CONTRACTS.tokens.USDC, true);
    console.log('设置抵押品结果:', collateralResult);
    
  } catch (error) {
    console.error('Aave 交互失败:', error.message);
  }
}
```

## DeFi 组合策略

### 1. 收益聚合器

```typescript
class DeFiYieldAggregator {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.protocols = {
      uniswap: new UniswapV3LiquidityProvider(provider, signer),
      compound: new CompoundV3Lender(provider, signer, DEFI_CONTRACTS.compound.cUSDC),
      aave: new AaveV3Lender(provider, signer)
    };
  }
  
  // 获取所有协议的收益率
  async getAllYields(asset) {
    const yields = {};
    
    try {
      // Compound 收益率
      const compoundAccount = await this.protocols.compound.getAccountInfo(ethers.ZeroAddress);
      yields.compound = {
        protocol: 'Compound V3',
        supplyAPY: compoundAccount.supplyAPY,
        borrowAPY: compoundAccount.borrowAPY,
        risk: 'low'
      };
    } catch (error) {
      console.warn('获取 Compound 收益率失败:', error.message);
    }
    
    try {
      // Aave 收益率
      const aaveReserve = await this.protocols.aave.getReserveData(asset);
      yields.aave = {
        protocol: 'Aave V3',
        supplyAPY: aaveReserve.supplyAPY,
        variableBorrowAPY: aaveReserve.variableBorrowAPY,
        stableBorrowAPY: aaveReserve.stableBorrowAPY,
        risk: 'low'
      };
    } catch (error) {
      console.warn('获取 Aave 收益率失败:', error.message);
    }
    
    // 可以添加更多协议...
    
    return yields;
  }
  
  // 找到最佳收益策略
  async findBestYieldStrategy(asset, amount, riskTolerance = 'medium') {
    const yields = await this.getAllYields(asset);
    const strategies = [];
    
    // 单一协议策略
    for (const [protocolName, yieldData] of Object.entries(yields)) {
      if (this.matchesRiskTolerance(yieldData.risk, riskTolerance)) {
        strategies.push({
          type: 'single',
          protocol: protocolName,
          allocation: { [protocolName]: 100 },
          expectedAPY: yieldData.supplyAPY,
          risk: yieldData.risk,
          description: `100% 分配到 ${yieldData.protocol}`
        });
      }
    }
    
    // 多协议分散策略
    if (Object.keys(yields).length >= 2) {
      const protocols = Object.keys(yields);
      const avgAPY = Object.values(yields).reduce((sum, y) => sum + y.supplyAPY, 0) / protocols.length;
      
      strategies.push({
        type: 'diversified',
        protocol: 'multi',
        allocation: protocols.reduce((acc, p) => ({ ...acc, [p]: 100 / protocols.length }), {}),
        expectedAPY: avgAPY,
        risk: 'medium',
        description: `平均分配到 ${protocols.length} 个协议`
      });
    }
    
    // 按预期收益排序
    strategies.sort((a, b) => b.expectedAPY - a.expectedAPY);
    
    return strategies;
  }
  
  // 执行收益策略
  async executeStrategy(strategy, asset, amount) {
    const results = [];
    
    for (const [protocolName, percentage] of Object.entries(strategy.allocation)) {
      const allocatedAmount = (amount * BigInt(percentage)) / 100n;
      
      if (allocatedAmount === 0n) continue;
      
      try {
        let result;
        
        switch (protocolName) {
          case 'compound':
            result = await this.protocols.compound.supply(asset, allocatedAmount);
            break;
          case 'aave':
            result = await this.protocols.aave.supply(asset, allocatedAmount);
            break;
          default:
            throw new Error(`不支持的协议: ${protocolName}`);
        }
        
        results.push({
          protocol: protocolName,
          amount: allocatedAmount,
          percentage,
          result,
          status: 'success'
        });
        
      } catch (error) {
        results.push({
          protocol: protocolName,
          amount: allocatedAmount,
          percentage,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    return {
      strategy,
      executions: results,
      totalAmount: amount,
      successCount: results.filter(r => r.status === 'success').length,
      failureCount: results.filter(r => r.status === 'failed').length
    };
  }
  
  // 检查风险容忍度匹配
  matchesRiskTolerance(protocolRisk, userRisk) {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    return riskLevels[protocolRisk] <= riskLevels[userRisk];
  }
  
  // 监控投资组合
  async monitorPortfolio(userAddress) {
    const portfolio = {
      totalValue: 0n,
      positions: [],
      totalAPY: 0,
      riskScore: 0
    };
    
    try {
      // Compound 持仓
      const compoundAccount = await this.protocols.compound.getAccountInfo(userAddress);
      if (compoundAccount.supplyBalance > 0n) {
        portfolio.positions.push({
          protocol: 'Compound V3',
          balance: compoundAccount.supplyBalance,
          apy: compoundAccount.supplyAPY,
          risk: 'low'
        });
        portfolio.totalValue += compoundAccount.supplyBalance;
      }
    } catch (error) {
      console.warn('获取 Compound 持仓失败:', error.message);
    }
    
    try {
      // Aave 持仓
      const aaveAccount = await this.protocols.aave.getUserAccountData(userAddress);
      if (aaveAccount.totalCollateralBase > 0n) {
        portfolio.positions.push({
          protocol: 'Aave V3',
          balance: aaveAccount.totalCollateralBase,
          apy: 0, // 需要根据具体资产计算
          risk: 'low'
        });
        portfolio.totalValue += aaveAccount.totalCollateralBase;
      }
    } catch (error) {
      console.warn('获取 Aave 持仓失败:', error.message);
    }
    
    // 计算加权平均 APY
    if (portfolio.positions.length > 0) {
      const totalWeightedAPY = portfolio.positions.reduce((sum, pos) => {
        const weight = Number(pos.balance) / Number(portfolio.totalValue);
        return sum + (pos.apy * weight);
      }, 0);
      
      portfolio.totalAPY = totalWeightedAPY;
    }
    
    return portfolio;
  }
  
  // 重新平衡投资组合
  async rebalancePortfolio(userAddress, targetStrategy) {
    const currentPortfolio = await this.monitorPortfolio(userAddress);
    const rebalanceActions = [];
    
    // 计算目标分配
    const totalValue = currentPortfolio.totalValue;
    
    for (const [protocol, targetPercentage] of Object.entries(targetStrategy.allocation)) {
      const targetAmount = (totalValue * BigInt(targetPercentage)) / 100n;
      const currentPosition = currentPortfolio.positions.find(p => 
        p.protocol.toLowerCase().includes(protocol)
      );
      const currentAmount = currentPosition ? currentPosition.balance : 0n;
      
      if (targetAmount > currentAmount) {
        // 需要增加投资
        rebalanceActions.push({
          action: 'increase',
          protocol,
          amount: targetAmount - currentAmount,
          currentAmount,
          targetAmount
        });
      } else if (targetAmount < currentAmount) {
        // 需要减少投资
        rebalanceActions.push({
          action: 'decrease',
          protocol,
          amount: currentAmount - targetAmount,
          currentAmount,
          targetAmount
        });
      }
    }
    
    return {
      currentPortfolio,
      targetStrategy,
      rebalanceActions,
      rebalanceNeeded: rebalanceActions.length > 0
    };
  }
}

// 使用示例
async function yieldAggregatorExample() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const signer = new ethers.Wallet('YOUR-PRIVATE-KEY', provider);
  
  const aggregator = new DeFiYieldAggregator(provider, signer);
  
  try {
    const userAddress = await signer.getAddress();
    
    // 1. 获取所有协议收益率
    const yields = await aggregator.getAllYields(DEFI_CONTRACTS.tokens.USDC);
    console.log('所有协议收益率:', yields);
    
    // 2. 找到最佳策略
    const strategies = await aggregator.findBestYieldStrategy(
      DEFI_CONTRACTS.tokens.USDC,
      ethers.parseUnits('10000', 6), // 10000 USDC
      'medium'
    );
    console.log('推荐策略:', strategies);
    
    // 3. 执行最佳策略
    if (strategies.length > 0) {
      const bestStrategy = strategies[0];
      const executionResult = await aggregator.executeStrategy(
        bestStrategy,
        DEFI_CONTRACTS.tokens.USDC,
        ethers.parseUnits('10000', 6)
      );
      console.log('策略执行结果:', executionResult);
    }
    
    // 4. 监控投资组合
    const portfolio = await aggregator.monitorPortfolio(userAddress);
    console.log('当前投资组合:', portfolio);
    
    // 5. 检查是否需要重新平衡
    if (strategies.length > 0) {
      const rebalanceAnalysis = await aggregator.rebalancePortfolio(userAddress, strategies[0]);
      console.log('重新平衡分析:', rebalanceAnalysis);
    }
    
  } catch (error) {
    console.error('收益聚合器示例失败:', error.message);
  }
}
```

## 总结

DeFi 交互是 Web3 开发的核心技能，本文档涵盖了：

### 核心协议
- **Uniswap V3**：代币交换、流动性提供
- **Compound V3**：借贷、利息计算
- **Aave V3**：供应、借款、抵押管理

### 高级功能
- **收益聚合**：多协议比较、最优策略
- **投资组合管理**：监控、重新平衡
- **风险管理**：健康因子、清算保护

### 最佳实践
1. **安全性**：验证合约地址、检查授权
2. **效率**：批量操作、Gas 优化
3. **监控**：实时数据、风险指标
4. **用户体验**：清晰的错误处理、进度反馈

通过掌握这些 DeFi 交互技术，可以构建功能强大的去中心化金融应用。