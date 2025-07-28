---
title: useContractReads
description: 批量读取多个智能合约数据的 React Hook
keywords: [wagmi, useContractReads, 批量合约读取, 智能合约, React Hook, Web3]
---

# useContractReads

`useContractReads` 允许您在单个请求中批量读取多个智能合约函数，提供更好的性能和用户体验。

## 基本用法

```tsx
import { useContractReads } from 'wagmi'

const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

function TokenInfo({ tokenAddress }: { tokenAddress: string }) {
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
    ],
  })

  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>读取失败</div>

  const [name, symbol, decimals] = data || []

  return (
    <div>
      <h3>{name?.result} ({symbol?.result})</h3>
      <p>精度: {decimals?.result}</p>
    </div>
  )
}
```

## 参数配置

### 合约配置
- `contracts` - 合约调用配置数组
- `allowFailure` - 是否允许部分失败
- `overrides` - 全局覆盖配置

### 查询选项
- `enabled` - 是否启用查询
- `watch` - 是否监听区块变化
- `cacheTime` - 缓存时间
- `staleTime` - 数据过期时间

## 返回值

### 数据结构
- `data` - 结果数组，每个元素包含 `result` 和 `status`
- `isLoading` - 是否正在加载
- `isError` - 是否出错
- `refetch` - 手动重新获取

## 详细示例

### 多代币余额查询

```tsx
import { useContractReads } from 'wagmi'
import { formatUnits } from 'viem'

const tokens = [
  { address: '0x...', symbol: 'USDC', decimals: 6 },
  { address: '0x...', symbol: 'USDT', decimals: 6 },
  { address: '0x...', symbol: 'DAI', decimals: 18 },
]

function MultiTokenBalance({ userAddress }: { userAddress: string }) {
  const { data, isLoading } = useContractReads({
    contracts: tokens.map(token => ({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })),
    watch: true,
  })

  if (isLoading) return <div>加载余额中...</div>

  return (
    <div className="multi-token-balance">
      <h3>代币余额</h3>
      {tokens.map((token, index) => {
        const balance = data?.[index]
        return (
          <div key={token.address} className="token-balance">
            <span className="token-symbol">{token.symbol}:</span>
            <span className="balance">
              {balance?.result ? 
                formatUnits(balance.result as bigint, token.decimals) : 
                '0'
              }
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

### 跨合约数据聚合

```tsx
import { useContractReads } from 'wagmi'

function DeFiDashboard({ userAddress }: { userAddress: string }) {
  const { data, isLoading, error } = useContractReads({
    contracts: [
      // Uniswap V3 位置
      {
        address: '0x...', // Uniswap V3 NFT Manager
        abi: uniswapV3ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      // Compound 借贷余额
      {
        address: '0x...', // cUSDC
        abi: compoundABI,
        functionName: 'balanceOfUnderlying',
        args: [userAddress],
      },
      // Aave 存款余额
      {
        address: '0x...', // aUSDC
        abi: aaveABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      // ENS 域名数量
      {
        address: '0x...', // ENS Registry
        abi: ensABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
    ],
    allowFailure: true, // 允许部分调用失败
  })

  if (isLoading) return <div>加载 DeFi 数据中...</div>

  const [uniswapPositions, compoundBalance, aaveBalance, ensCount] = data || []

  return (
    <div className="defi-dashboard">
      <h2>DeFi 仪表板</h2>
      
      <div className="protocol-section">
        <h3>Uniswap V3</h3>
        <p>流动性位置: {uniswapPositions?.result?.toString() || '0'}</p>
      </div>

      <div className="protocol-section">
        <h3>Compound</h3>
        <p>借出余额: {compoundBalance?.result ? 
          formatUnits(compoundBalance.result as bigint, 6) : '0'} USDC</p>
      </div>

      <div className="protocol-section">
        <h3>Aave</h3>
        <p>存款余额: {aaveBalance?.result ? 
          formatUnits(aaveBalance.result as bigint, 6) : '0'} USDC</p>
      </div>

      <div className="protocol-section">
        <h3>ENS</h3>
        <p>拥有域名: {ensCount?.result?.toString() || '0'}</p>
      </div>

      {error && (
        <div className="error-section">
          部分数据加载失败，请稍后重试
        </div>
      )}
    </div>
  )
}
```

### 动态合约列表

```tsx
import { useContractReads } from 'wagmi'
import { useState, useMemo } from 'react'

function DynamicContractReads() {
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([
    '0x...', // USDC
    '0x...', // USDT
  ])
  const [userAddress, setUserAddress] = useState('')

  // 动态生成合约调用配置
  const contracts = useMemo(() => {
    if (!userAddress) return []
    
    return tokenAddresses.flatMap(address => [
      {
        address,
        abi: ERC20_ABI,
        functionName: 'name' as const,
      },
      {
        address,
        abi: ERC20_ABI,
        functionName: 'symbol' as const,
      },
      {
        address,
        abi: ERC20_ABI,
        functionName: 'balanceOf' as const,
        args: [userAddress],
      },
    ])
  }, [tokenAddresses, userAddress])

  const { data, isLoading } = useContractReads({
    contracts,
    enabled: contracts.length > 0,
  })

  const addToken = (address: string) => {
    if (!tokenAddresses.includes(address)) {
      setTokenAddresses(prev => [...prev, address])
    }
  }

  const removeToken = (address: string) => {
    setTokenAddresses(prev => prev.filter(addr => addr !== address))
  }

  // 解析批量结果
  const tokens = useMemo(() => {
    if (!data) return []
    
    const result = []
    for (let i = 0; i < tokenAddresses.length; i++) {
      const baseIndex = i * 3
      result.push({
        address: tokenAddresses[i],
        name: data[baseIndex]?.result,
        symbol: data[baseIndex + 1]?.result,
        balance: data[baseIndex + 2]?.result,
      })
    }
    return result
  }, [data, tokenAddresses])

  return (
    <div className="dynamic-reads">
      <div className="controls">
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder="用户地址"
        />
        
        <div className="token-management">
          <input
            type="text"
            placeholder="代币合约地址"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToken(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        </div>
      </div>

      {isLoading && <div>加载中...</div>}

      <div className="token-list">
        {tokens.map((token, index) => (
          <div key={token.address} className="token-item">
            <div className="token-info">
              <h4>{token.name} ({token.symbol})</h4>
              <p>余额: {token.balance?.toString() || '0'}</p>
            </div>
            <button onClick={() => removeToken(token.address)}>
              移除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 高级用法

### 错误处理和部分失败

```tsx
import { useContractReads } from 'wagmi'

function RobustBatchRead() {
  const { data, isLoading } = useContractReads({
    contracts: [
      {
        address: '0x...', // 可能失败的合约
        abi: contractABI,
        functionName: 'riskyFunction',
      },
      {
        address: '0x...', // 稳定的合约
        abi: contractABI,
        functionName: 'stableFunction',
      },
    ],
    allowFailure: true, // 允许部分失败
    onError: (error) => {
      console.error('批量读取出错:', error)
    },
  })

  if (isLoading) return <div>加载中...</div>

  return (
    <div className="robust-batch">
      {data?.map((result, index) => (
        <div key={index} className="result-item">
          {result.status === 'success' ? (
            <div className="success">
              结果 {index + 1}: {JSON.stringify(result.result)}
            </div>
          ) : (
            <div className="error">
              调用 {index + 1} 失败: {result.error?.message}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 性能优化

```tsx
import { useContractReads } from 'wagmi'
import { useMemo } from 'react'

function OptimizedBatchRead({ addresses }: { addresses: string[] }) {
  // 使用 useMemo 优化合约配置
  const contracts = useMemo(() => 
    addresses.map(address => ({
      address,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: ['0x...'],
    })), [addresses]
  )

  const { data } = useContractReads({
    contracts,
    // 优化缓存策略
    staleTime: 30_000, // 30秒内不重新获取
    cacheTime: 300_000, // 缓存5分钟
    // 减少不必要的重新获取
    refetchOnWindowFocus: false,
  })

  return (
    <div className="optimized-batch">
      {data?.map((result, index) => (
        <div key={addresses[index]}>
          {addresses[index]}: {result.result?.toString() || '0'}
        </div>
      ))}
    </div>
  )
}
```

## 最佳实践

### 1. 合理分组

```tsx
// 将相关的合约调用分组
function GroupedReads() {
  // 基础信息组
  const { data: basicInfo } = useContractReads({
    contracts: [
      { address: '0x...', abi: ERC20_ABI, functionName: 'name' },
      { address: '0x...', abi: ERC20_ABI, functionName: 'symbol' },
      { address: '0x...', abi: ERC20_ABI, functionName: 'decimals' },
    ],
  })

  // 动态数据组
  const { data: dynamicData } = useContractReads({
    contracts: [
      { address: '0x...', abi: ERC20_ABI, functionName: 'totalSupply' },
      { address: '0x...', abi: ERC20_ABI, functionName: 'balanceOf', args: ['0x...'] },
    ],
    watch: true, // 只有动态数据需要监听
  })

  return <div>...</div>
}
```

### 2. 条件批量查询

```tsx
function ConditionalBatchRead({ shouldFetchPrices }: { shouldFetchPrices: boolean }) {
  const { data } = useContractReads({
    contracts: [
      // 基础合约调用
      {
        address: '0x...',
        abi: contractABI,
        functionName: 'basicData',
      },
      // 条件性合约调用
      ...(shouldFetchPrices ? [{
        address: '0x...',
        abi: priceOracleABI,
        functionName: 'getPrice',
      }] : []),
    ],
  })

  return <div>...</div>
}
```

## 常见问题

### Q: 如何处理大量合约调用？
A: 分批处理，避免单次调用过多合约，合理设置缓存策略。

### Q: 部分调用失败怎么办？
A: 设置 `allowFailure: true`，在结果中检查每个调用的状态。

### Q: 如何优化性能？
A: 使用 `useMemo` 优化配置，设置合适的缓存时间，避免不必要的重新渲染。

## 下一步

- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习单个合约读取
- [useContractInfiniteReads](/wagmi/hooks/contracts/use-contract-infinite-reads) - 学习无限滚动读取
- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习合约写入操作