---
title: DeFi 应用开发
description: 使用 Wagmi 构建完整的 DeFi 应用
keywords: [wagmi, DeFi, 去中心化金融, React, Web3, 代币交换, 流动性挖矿]
---

# DeFi 应用开发

本章将详细介绍如何使用 Wagmi 构建一个完整的 DeFi 应用，包括代币交换、流动性提供、收益农场等核心功能。

## 项目架构

### 1. 技术栈

```typescript
// 核心依赖
const techStack = {
  frontend: {
    framework: 'React + TypeScript',
    hooks: 'Wagmi',
    ui: 'Tailwind CSS + Headless UI',
    state: 'Zustand',
    routing: 'React Router'
  },
  blockchain: {
    library: 'Viem',
    protocols: ['Uniswap V3', 'Compound', 'Aave'],
    networks: ['Ethereum', 'Polygon', 'Arbitrum']
  }
}
```

### 2. 项目结构

```
src/
├── components/
│   ├── common/           # 通用组件
│   ├── defi/            # DeFi 特定组件
│   └── layout/          # 布局组件
├── hooks/
│   ├── defi/            # DeFi 相关 hooks
│   └── common/          # 通用 hooks
├── stores/              # 状态管理
├── types/               # 类型定义
├── utils/               # 工具函数
└── constants/           # 常量配置
```

## 核心功能实现

### 1. 代币交换功能

```tsx
// components/defi/TokenSwap.tsx
import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useBalance, 
  useContractRead, 
  useContractWrite,
  usePrepareContractWrite 
} from 'wagmi'
import { parseUnits, formatUnits } from 'viem'

interface SwapState {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  slippage: number
  deadline: number
}

export function TokenSwap() {
  const { address } = useAccount()
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: '',
    tokenOut: '',
    amountIn: '',
    amountOut: '',
    slippage: 0.5,
    deadline: 20
  })

  // Uniswap V3 Router 地址
  const UNISWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

  // 获取代币余额
  const { data: tokenInBalance } = useBalance({
    address,
    token: swapState.tokenIn as `0x${string}`,
    enabled: !!swapState.tokenIn && !!address
  })

  // 获取交换报价
  const { data: quote } = useContractRead({
    address: UNISWAP_ROUTER,
    abi: [
      {
        name: 'quoteExactInputSingle',
        type: 'function',
        inputs: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        outputs: [{ name: 'amountOut', type: 'uint256' }]
      }
    ],
    functionName: 'quoteExactInputSingle',
    args: [
      swapState.tokenIn,
      swapState.tokenOut,
      3000, // 0.3% fee tier
      swapState.amountIn ? parseUnits(swapState.amountIn, 18) : 0n,
      0n
    ],
    enabled: !!(swapState.tokenIn && swapState.tokenOut && swapState.amountIn)
  })

  // 准备交换交易
  const { config: swapConfig } = usePrepareContractWrite({
    address: UNISWAP_ROUTER,
    abi: [
      {
        name: 'exactInputSingle',
        type: 'function',
        inputs: [
          {
            name: 'params',
            type: 'tuple',
            components: [
              { name: 'tokenIn', type: 'address' },
              { name: 'tokenOut', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'recipient', type: 'address' },
              { name: 'deadline', type: 'uint256' },
              { name: 'amountIn', type: 'uint256' },
              { name: 'amountOutMinimum', type: 'uint256' },
              { name: 'sqrtPriceLimitX96', type: 'uint160' }
            ]
          }
        ],
        outputs: [{ name: 'amountOut', type: 'uint256' }]
      }
    ],
    functionName: 'exactInputSingle',
    args: [{
      tokenIn: swapState.tokenIn,
      tokenOut: swapState.tokenOut,
      fee: 3000,
      recipient: address!,
      deadline: BigInt(Math.floor(Date.now() / 1000) + swapState.deadline * 60),
      amountIn: swapState.amountIn ? parseUnits(swapState.amountIn, 18) : 0n,
      amountOutMinimum: quote ? quote * BigInt(100 - swapState.slippage * 100) / 100n : 0n,
      sqrtPriceLimitX96: 0n
    }],
    enabled: !!(quote && swapState.amountIn && address)
  })

  const { write: executeSwap, isLoading: isSwapping } = useContractWrite(swapConfig)

  // 更新输出金额
  useEffect(() => {
    if (quote) {
      setSwapState(prev => ({
        ...prev,
        amountOut: formatUnits(quote, 18)
      }))
    }
  }, [quote])

  const handleSwap = () => {
    if (!executeSwap) return
    executeSwap()
  }

  const switchTokens = () => {
    setSwapState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: prev.amountOut,
      amountOut: prev.amountIn
    }))
  }

  return (
    <div className="swap-container">
      <div className="swap-card">
        <h2>代币交换</h2>
        
        {/* 输入代币 */}
        <div className="token-input-section">
          <div className="token-input">
            <label>卖出</label>
            <div className="input-row">
              <input
                type="text"
                value={swapState.amountIn}
                onChange={(e) => setSwapState(prev => ({
                  ...prev,
                  amountIn: e.target.value
                }))}
                placeholder="0.0"
              />
              <select
                value={swapState.tokenIn}
                onChange={(e) => setSwapState(prev => ({
                  ...prev,
                  tokenIn: e.target.value
                }))}
              >
                <option value="">选择代币</option>
                <option value="0xA0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8">USDC</option>
                <option value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2">WETH</option>
              </select>
            </div>
            {tokenInBalance && (
              <div className="balance-info">
                余额: {formatUnits(tokenInBalance.value, tokenInBalance.decimals)}
              </div>
            )}
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="swap-button-container">
          <button onClick={switchTokens} className="switch-button">
            ⇅
          </button>
        </div>

        {/* 输出代币 */}
        <div className="token-output-section">
          <div className="token-input">
            <label>买入</label>
            <div className="input-row">
              <input
                type="text"
                value={swapState.amountOut}
                readOnly
                placeholder="0.0"
              />
              <select
                value={swapState.tokenOut}
                onChange={(e) => setSwapState(prev => ({
                  ...prev,
                  tokenOut: e.target.value
                }))}
              >
                <option value="">选择代币</option>
                <option value="0xA0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8">USDC</option>
                <option value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2">WETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* 交换设置 */}
        <div className="swap-settings">
          <div className="setting-item">
            <label>滑点容忍度: {swapState.slippage}%</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={swapState.slippage}
              onChange={(e) => setSwapState(prev => ({
                ...prev,
                slippage: Number(e.target.value)
              }))}
            />
          </div>
          
          <div className="setting-item">
            <label>交易截止时间: {swapState.deadline} 分钟</label>
            <input
              type="range"
              min="1"
              max="60"
              value={swapState.deadline}
              onChange={(e) => setSwapState(prev => ({
                ...prev,
                deadline: Number(e.target.value)
              }))}
            />
          </div>
        </div>

        {/* 执行交换 */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !executeSwap}
          className="swap-execute-button"
        >
          {isSwapping ? '交换中...' : '执行交换'}
        </button>
      </div>
    </div>
  )
}
```

### 2. 流动性提供

```tsx
// components/defi/LiquidityProvider.tsx
import { useState } from 'react'
import { 
  useAccount, 
  useBalance, 
  useContractWrite,
  usePrepareContractWrite 
} from 'wagmi'
import { parseUnits } from 'viem'

interface LiquidityState {
  token0: string
  token1: string
  amount0: string
  amount1: string
  fee: number
  tickLower: number
  tickUpper: number
}

export function LiquidityProvider() {
  const { address } = useAccount()
  const [liquidityState, setLiquidityState] = useState<LiquidityState>({
    token0: '',
    token1: '',
    amount0: '',
    amount1: '',
    fee: 3000,
    tickLower: -887220,
    tickUpper: 887220
  })

  const POSITION_MANAGER = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'

  // 准备添加流动性交易
  const { config: addLiquidityConfig } = usePrepareContractWrite({
    address: POSITION_MANAGER,
    abi: [
      {
        name: 'mint',
        type: 'function',
        inputs: [
          {
            name: 'params',
            type: 'tuple',
            components: [
              { name: 'token0', type: 'address' },
              { name: 'token1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickLower', type: 'int24' },
              { name: 'tickUpper', type: 'int24' },
              { name: 'amount0Desired', type: 'uint256' },
              { name: 'amount1Desired', type: 'uint256' },
              { name: 'amount0Min', type: 'uint256' },
              { name: 'amount1Min', type: 'uint256' },
              { name: 'recipient', type: 'address' },
              { name: 'deadline', type: 'uint256' }
            ]
          }
        ],
        outputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'liquidity', type: 'uint128' },
          { name: 'amount0', type: 'uint256' },
          { name: 'amount1', type: 'uint256' }
        ]
      }
    ],
    functionName: 'mint',
    args: [{
      token0: liquidityState.token0,
      token1: liquidityState.token1,
      fee: liquidityState.fee,
      tickLower: liquidityState.tickLower,
      tickUpper: liquidityState.tickUpper,
      amount0Desired: liquidityState.amount0 ? parseUnits(liquidityState.amount0, 18) : 0n,
      amount1Desired: liquidityState.amount1 ? parseUnits(liquidityState.amount1, 18) : 0n,
      amount0Min: 0n,
      amount1Min: 0n,
      recipient: address!,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 1200)
    }],
    enabled: !!(liquidityState.token0 && liquidityState.token1 && liquidityState.amount0 && liquidityState.amount1 && address)
  })

  const { write: addLiquidity, isLoading: isAdding } = useContractWrite(addLiquidityConfig)

  const handleAddLiquidity = () => {
    if (!addLiquidity) return
    addLiquidity()
  }

  return (
    <div className="liquidity-provider">
      <h2>提供流动性</h2>
      
      <div className="liquidity-form">
        <div className="token-pair-section">
          <div className="token-input">
            <label>代币 A</label>
            <div className="input-row">
              <input
                type="text"
                value={liquidityState.amount0}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  amount0: e.target.value
                }))}
                placeholder="0.0"
              />
              <select
                value={liquidityState.token0}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  token0: e.target.value
                }))}
              >
                <option value="">选择代币</option>
                <option value="0xA0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8">USDC</option>
                <option value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2">WETH</option>
              </select>
            </div>
          </div>

          <div className="token-input">
            <label>代币 B</label>
            <div className="input-row">
              <input
                type="text"
                value={liquidityState.amount1}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  amount1: e.target.value
                }))}
                placeholder="0.0"
              />
              <select
                value={liquidityState.token1}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  token1: e.target.value
                }))}
              >
                <option value="">选择代币</option>
                <option value="0xA0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8">USDC</option>
                <option value="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2">WETH</option>
              </select>
            </div>
          </div>
        </div>

        <div className="fee-tier-section">
          <label>手续费等级</label>
          <div className="fee-options">
            {[500, 3000, 10000].map(fee => (
              <button
                key={fee}
                onClick={() => setLiquidityState(prev => ({ ...prev, fee }))}
                className={liquidityState.fee === fee ? 'active' : ''}
              >
                {fee / 10000}%
              </button>
            ))}
          </div>
        </div>

        <div className="price-range-section">
          <label>价格范围</label>
          <div className="range-inputs">
            <div className="range-input">
              <label>最低价格</label>
              <input
                type="number"
                value={liquidityState.tickLower}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  tickLower: Number(e.target.value)
                }))}
              />
            </div>
            <div className="range-input">
              <label>最高价格</label>
              <input
                type="number"
                value={liquidityState.tickUpper}
                onChange={(e) => setLiquidityState(prev => ({
                  ...prev,
                  tickUpper: Number(e.target.value)
                }))}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleAddLiquidity}
          disabled={isAdding || !addLiquidity}
          className="add-liquidity-button"
        >
          {isAdding ? '添加中...' : '添加流动性'}
        </button>
      </div>
    </div>
  )
}
```

### 3. 收益农场

```tsx
// components/defi/YieldFarming.tsx
import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useBalance, 
  useContractRead,
  useContractWrite,
  usePrepareContractWrite 
} from 'wagmi'
import { formatUnits, parseUnits } from 'viem'

interface FarmPool {
  id: string
  name: string
  stakingToken: string
  rewardToken: string
  apy: number
  totalStaked: bigint
  userStaked: bigint
  pendingRewards: bigint
}

export function YieldFarming() {
  const { address } = useAccount()
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')

  const FARM_CONTRACT = '0x...' // 农场合约地址

  // 获取农场池信息
  const { data: poolInfo } = useContractRead({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'poolInfo',
        type: 'function',
        inputs: [{ name: 'pid', type: 'uint256' }],
        outputs: [
          { name: 'lpToken', type: 'address' },
          { name: 'allocPoint', type: 'uint256' },
          { name: 'lastRewardBlock', type: 'uint256' },
          { name: 'accRewardPerShare', type: 'uint256' }
        ]
      }
    ],
    functionName: 'poolInfo',
    args: [BigInt(selectedPool || 0)],
    enabled: !!selectedPool
  })

  // 获取用户信息
  const { data: userInfo } = useContractRead({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'userInfo',
        type: 'function',
        inputs: [
          { name: 'pid', type: 'uint256' },
          { name: 'user', type: 'address' }
        ],
        outputs: [
          { name: 'amount', type: 'uint256' },
          { name: 'rewardDebt', type: 'uint256' }
        ]
      }
    ],
    functionName: 'userInfo',
    args: [BigInt(selectedPool || 0), address!],
    enabled: !!(selectedPool && address)
  })

  // 获取待领取奖励
  const { data: pendingRewards } = useContractRead({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'pendingReward',
        type: 'function',
        inputs: [
          { name: 'pid', type: 'uint256' },
          { name: 'user', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ],
    functionName: 'pendingReward',
    args: [BigInt(selectedPool || 0), address!],
    enabled: !!(selectedPool && address)
  })

  // 准备质押交易
  const { config: stakeConfig } = usePrepareContractWrite({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'deposit',
        type: 'function',
        inputs: [
          { name: 'pid', type: 'uint256' },
          { name: 'amount', type: 'uint256' }
        ]
      }
    ],
    functionName: 'deposit',
    args: [
      BigInt(selectedPool || 0),
      stakeAmount ? parseUnits(stakeAmount, 18) : 0n
    ],
    enabled: !!(selectedPool && stakeAmount)
  })

  // 准备取消质押交易
  const { config: unstakeConfig } = usePrepareContractWrite({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'withdraw',
        type: 'function',
        inputs: [
          { name: 'pid', type: 'uint256' },
          { name: 'amount', type: 'uint256' }
        ]
      }
    ],
    functionName: 'withdraw',
    args: [
      BigInt(selectedPool || 0),
      unstakeAmount ? parseUnits(unstakeAmount, 18) : 0n
    ],
    enabled: !!(selectedPool && unstakeAmount)
  })

  // 准备领取奖励交易
  const { config: harvestConfig } = usePrepareContractWrite({
    address: FARM_CONTRACT,
    abi: [
      {
        name: 'deposit',
        type: 'function',
        inputs: [
          { name: 'pid', type: 'uint256' },
          { name: 'amount', type: 'uint256' }
        ]
      }
    ],
    functionName: 'deposit',
    args: [BigInt(selectedPool || 0), 0n],
    enabled: !!selectedPool
  })

  const { write: stake, isLoading: isStaking } = useContractWrite(stakeConfig)
  const { write: unstake, isLoading: isUnstaking } = useContractWrite(unstakeConfig)
  const { write: harvest, isLoading: isHarvesting } = useContractWrite(harvestConfig)

  const farmPools: FarmPool[] = [
    {
      id: '0',
      name: 'USDC-ETH LP',
      stakingToken: '0x...',
      rewardToken: '0x...',
      apy: 45.2,
      totalStaked: 1000000000000000000000n,
      userStaked: userInfo?.[0] || 0n,
      pendingRewards: pendingRewards || 0n
    },
    // 更多农场池...
  ]

  return (
    <div className="yield-farming">
      <h2>收益农场</h2>
      
      <div className="farm-pools">
        {farmPools.map(pool => (
          <div 
            key={pool.id} 
            className={`farm-pool ${selectedPool === pool.id ? 'selected' : ''}`}
            onClick={() => setSelectedPool(pool.id)}
          >
            <div className="pool-header">
              <h3>{pool.name}</h3>
              <div className="apy">APY: {pool.apy}%</div>
            </div>
            
            <div className="pool-stats">
              <div className="stat">
                <label>总质押量</label>
                <span>{formatUnits(pool.totalStaked, 18)}</span>
              </div>
              <div className="stat">
                <label>我的质押</label>
                <span>{formatUnits(pool.userStaked, 18)}</span>
              </div>
              <div className="stat">
                <label>待领取奖励</label>
                <span>{formatUnits(pool.pendingRewards, 18)}</span>
              </div>
            </div>

            {selectedPool === pool.id && (
              <div className="pool-actions">
                <div className="action-section">
                  <h4>质押</h4>
                  <div className="input-group">
                    <input
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="输入质押数量"
                    />
                    <button
                      onClick={() => stake?.()}
                      disabled={isStaking || !stake}
                    >
                      {isStaking ? '质押中...' : '质押'}
                    </button>
                  </div>
                </div>

                <div className="action-section">
                  <h4>取消质押</h4>
                  <div className="input-group">
                    <input
                      type="text"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="输入取消质押数量"
                    />
                    <button
                      onClick={() => unstake?.()}
                      disabled={isUnstaking || !unstake}
                    >
                      {isUnstaking ? '取消质押中...' : '取消质押'}
                    </button>
                  </div>
                </div>

                <div className="action-section">
                  <button
                    onClick={() => harvest?.()}
                    disabled={isHarvesting || !harvest || pool.pendingRewards === 0n}
                    className="harvest-button"
                  >
                    {isHarvesting ? '领取中...' : '领取奖励'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. 借贷功能

```tsx
// components/defi/LendingBorrowing.tsx
import { useState } from 'react'
import { 
  useAccount, 
  useBalance, 
  useContractRead,
  useContractWrite,
  usePrepareContractWrite 
} from 'wagmi'
import { formatUnits, parseUnits } from 'viem'

interface LendingMarket {
  asset: string
  symbol: string
  supplyAPY: number
  borrowAPY: number
  totalSupply: bigint
  totalBorrow: bigint
  userSupply: bigint
  userBorrow: bigint
  collateralFactor: number
}

export function LendingBorrowing() {
  const { address } = useAccount()
  const [selectedAsset, setSelectedAsset] = useState('')
  const [supplyAmount, setSupplyAmount] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')

  const COMPOUND_COMPTROLLER = '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'

  // 获取市场信息
  const { data: marketInfo } = useContractRead({
    address: selectedAsset as `0x${string}`,
    abi: [
      {
        name: 'getAccountSnapshot',
        type: 'function',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [
          { name: '', type: 'uint256' },
          { name: 'cTokenBalance', type: 'uint256' },
          { name: 'borrowBalance', type: 'uint256' },
          { name: 'exchangeRateMantissa', type: 'uint256' }
        ]
      }
    ],
    functionName: 'getAccountSnapshot',
    args: [address!],
    enabled: !!(selectedAsset && address)
  })

  // 准备供应交易
  const { config: supplyConfig } = usePrepareContractWrite({
    address: selectedAsset as `0x${string}`,
    abi: [
      {
        name: 'mint',
        type: 'function',
        inputs: [{ name: 'mintAmount', type: 'uint256' }]
      }
    ],
    functionName: 'mint',
    args: [supplyAmount ? parseUnits(supplyAmount, 18) : 0n],
    enabled: !!(selectedAsset && supplyAmount)
  })

  // 准备借贷交易
  const { config: borrowConfig } = usePrepareContractWrite({
    address: selectedAsset as `0x${string}`,
    abi: [
      {
        name: 'borrow',
        type: 'function',
        inputs: [{ name: 'borrowAmount', type: 'uint256' }]
      }
    ],
    functionName: 'borrow',
    args: [borrowAmount ? parseUnits(borrowAmount, 18) : 0n],
    enabled: !!(selectedAsset && borrowAmount)
  })

  // 准备还款交易
  const { config: repayConfig } = usePrepareContractWrite({
    address: selectedAsset as `0x${string}`,
    abi: [
      {
        name: 'repayBorrow',
        type: 'function',
        inputs: [{ name: 'repayAmount', type: 'uint256' }]
      }
    ],
    functionName: 'repayBorrow',
    args: [repayAmount ? parseUnits(repayAmount, 18) : 0n],
    enabled: !!(selectedAsset && repayAmount)
  })

  const { write: supply, isLoading: isSupplying } = useContractWrite(supplyConfig)
  const { write: borrow, isLoading: isBorrowing } = useContractWrite(borrowConfig)
  const { write: repay, isLoading: isRepaying } = useContractWrite(repayConfig)

  const lendingMarkets: LendingMarket[] = [
    {
      asset: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', // cDAI
      symbol: 'DAI',
      supplyAPY: 2.5,
      borrowAPY: 4.2,
      totalSupply: 1000000000000000000000000n,
      totalBorrow: 800000000000000000000000n,
      userSupply: marketInfo?.[1] || 0n,
      userBorrow: marketInfo?.[2] || 0n,
      collateralFactor: 0.75
    },
    // 更多市场...
  ]

  return (
    <div className="lending-borrowing">
      <h2>借贷市场</h2>
      
      <div className="lending-markets">
        {lendingMarkets.map(market => (
          <div 
            key={market.asset} 
            className={`lending-market ${selectedAsset === market.asset ? 'selected' : ''}`}
            onClick={() => setSelectedAsset(market.asset)}
          >
            <div className="market-header">
              <h3>{market.symbol}</h3>
              <div className="market-rates">
                <span className="supply-apy">供应 APY: {market.supplyAPY}%</span>
                <span className="borrow-apy">借贷 APY: {market.borrowAPY}%</span>
              </div>
            </div>
            
            <div className="market-stats">
              <div className="stat">
                <label>我的供应</label>
                <span>{formatUnits(market.userSupply, 18)} {market.symbol}</span>
              </div>
              <div className="stat">
                <label>我的借贷</label>
                <span>{formatUnits(market.userBorrow, 18)} {market.symbol}</span>
              </div>
              <div className="stat">
                <label>抵押系数</label>
                <span>{market.collateralFactor * 100}%</span>
              </div>
            </div>

            {selectedAsset === market.asset && (
              <div className="market-actions">
                <div className="action-tabs">
                  <div className="action-section">
                    <h4>供应</h4>
                    <div className="input-group">
                      <input
                        type="text"
                        value={supplyAmount}
                        onChange={(e) => setSupplyAmount(e.target.value)}
                        placeholder={`输入 ${market.symbol} 数量`}
                      />
                      <button
                        onClick={() => supply?.()}
                        disabled={isSupplying || !supply}
                      >
                        {isSupplying ? '供应中...' : '供应'}
                      </button>
                    </div>
                  </div>

                  <div className="action-section">
                    <h4>借贷</h4>
                    <div className="input-group">
                      <input
                        type="text"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        placeholder={`输入借贷 ${market.symbol} 数量`}
                      />
                      <button
                        onClick={() => borrow?.()}
                        disabled={isBorrowing || !borrow}
                      >
                        {isBorrowing ? '借贷中...' : '借贷'}
                      </button>
                    </div>
                  </div>

                  <div className="action-section">
                    <h4>还款</h4>
                    <div className="input-group">
                      <input
                        type="text"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder={`输入还款 ${market.symbol} 数量`}
                      />
                      <button
                        onClick={() => repay?.()}
                        disabled={isRepaying || !repay}
                      >
                        {isRepaying ? '还款中...' : '还款'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5. 主应用组件

```tsx
// components/DeFiApp.tsx
import { useState } from 'react'
import { TokenSwap } from './defi/TokenSwap'
import { LiquidityProvider } from './defi/LiquidityProvider'
import { YieldFarming } from './defi/YieldFarming'
import { LendingBorrowing } from './defi/LendingBorrowing'

type DeFiTab = 'swap' | 'liquidity' | 'farming' | 'lending'

export function DeFiApp() {
  const [activeTab, setActiveTab] = useState<DeFiTab>('swap')

  const tabs = [
    { id: 'swap', label: '代币交换', component: TokenSwap },
    { id: 'liquidity', label: '流动性', component: LiquidityProvider },
    { id: 'farming', label: '收益农场', component: YieldFarming },
    { id: 'lending', label: '借贷', component: LendingBorrowing }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TokenSwap

  return (
    <div className="defi-app">
      <header className="app-header">
        <h1>DeFi 应用</h1>
        <nav className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DeFiTab)}
              className={activeTab === tab.id ? 'active' : ''}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-content">
        <ActiveComponent />
      </main>
    </div>
  )
}
```

## 样式配置

```css
/* styles/defi.css */
.defi-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  margin-bottom: 30px;
}

.tab-navigation {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.tab-navigation button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-navigation button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.swap-container,
.liquidity-provider,
.yield-farming,
.lending-borrowing {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.token-input-section,
.token-output-section {
  margin-bottom: 16px;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-row input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.input-row select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.swap-execute-button,
.add-liquidity-button,
.harvest-button {
  width: 100%;
  padding: 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.swap-execute-button:hover,
.add-liquidity-button:hover,
.harvest-button:hover {
  background: #2563eb;
}

.swap-execute-button:disabled,
.add-liquidity-button:disabled,
.harvest-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.farm-pool,
.lending-market {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.farm-pool.selected,
.lending-market.selected {
  border-color: #3b82f6;
  background: #f8fafc;
}

.pool-stats,
.market-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.stat {
  text-align: center;
}

.stat label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat span {
  font-weight: 600;
  color: #111827;
}
```

## 部署和优化

### 1. 性能优化

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### 2. 错误处理

```typescript
// hooks/useErrorHandler.ts
import { useState } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null)

  const handleError = (error: any) => {
    console.error('DeFi App Error:', error)
    
    if (error.message.includes('User rejected')) {
      setError('用户取消了交易')
    } else if (error.message.includes('insufficient funds')) {
      setError('余额不足')
    } else {
      setError('交易失败，请重试')
    }
  }

  const clearError = () => setError(null)

  return { error, handleError, clearError }
}
```

## 总结

通过本章的学习，你已经掌握了：

1. **DeFi 应用架构设计**
2. **代币交换功能实现**
3. **流动性提供机制**
4. **收益农场开发**
5. **借贷功能集成**
6. **用户界面优化**

这个完整的 DeFi 应用展示了 Wagmi 在复杂金融应用中的强大能力，为你开发更高级的 DeFi 产品奠定了基础。

## 下一步

- [NFT 市场开发](/wagmi/examples/nft-marketplace) - 学习构建 NFT 交易平台
- [多链应用](/wagmi/examples/multi-chain) - 学习跨链应用开发
- [钱包连接器](/wagmi/examples/wallet-connector) - 学习钱包集成最佳实践