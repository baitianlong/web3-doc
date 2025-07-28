---
title: useContractRead
description: 读取智能合约数据的 React Hook
keywords: [wagmi, useContractRead, 合约读取, 智能合约, React Hook, Web3]
---

# useContractRead

`useContractRead` 是 Wagmi 中用于读取智能合约数据的核心 Hook。它提供了类型安全、自动缓存和错误处理的合约调用功能。

## 基本用法

```tsx
import { useContractRead } from 'wagmi'

const contractConfig = {
  address: '0x...',
  abi: [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'owner', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ],
} as const

function TokenBalance({ address }: { address: string }) {
  const { data, isError, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'balanceOf',
    args: [address],
  })

  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>读取失败</div>

  return <div>余额: {data?.toString()}</div>
}
```

## 参数配置

### 合约配置
- `address` - 合约地址
- `abi` - 合约 ABI
- `functionName` - 函数名称
- `args` - 函数参数

### 查询选项
- `enabled` - 是否启用查询
- `watch` - 是否监听区块变化
- `chainId` - 指定链 ID
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### 数据
- `data` - 合约返回的数据
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isError` - 是否出错
- `isSuccess` - 是否成功
- `refetch` - 手动重新获取

## 详细示例

### ERC-20 代币信息

```tsx
import { useContractRead } from 'wagmi'
import { formatUnits } from 'viem'

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
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

function TokenInfo({ tokenAddress, userAddress }: {
  tokenAddress: string
  userAddress?: string
}) {
  const { data: name } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
  })

  const { data: symbol } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })

  const { data: decimals } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })

  const { data: totalSupply } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
  })

  const { data: balance, isLoading: balanceLoading } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress!],
    enabled: !!userAddress,
    watch: true, // 监听余额变化
  })

  return (
    <div className="token-info">
      <h3>{name} ({symbol})</h3>
      <div className="token-details">
        <p>总供应量: {totalSupply && decimals ? 
          formatUnits(totalSupply, decimals) : '...'}</p>
        
        {userAddress && (
          <p>您的余额: {
            balanceLoading ? '加载中...' : 
            balance && decimals ? 
            formatUnits(balance, decimals) : '0'
          }</p>
        )}
      </div>
    </div>
  )
}
```

### 条件查询

```tsx
import { useContractRead } from 'wagmi'
import { useState } from 'react'

function ConditionalRead() {
  const [targetAddress, setTargetAddress] = useState('')
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data, isLoading, error, refetch } = useContractRead({
    address: '0x...',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [targetAddress],
    enabled: shouldFetch && !!targetAddress,
    // 只在手动触发时查询
    staleTime: Infinity,
  })

  const handleFetch = () => {
    if (targetAddress) {
      setShouldFetch(true)
      refetch()
    }
  }

  return (
    <div className="conditional-read">
      <input
        type="text"
        value={targetAddress}
        onChange={(e) => setTargetAddress(e.target.value)}
        placeholder="输入地址"
      />
      <button onClick={handleFetch} disabled={!targetAddress}>
        查询余额
      </button>
      
      {isLoading && <div>查询中...</div>}
      {error && <div>查询失败: {error.message}</div>}
      {data && <div>余额: {data.toString()}</div>}
    </div>
  )
}
```

### 实时数据监听

```tsx
import { useContractRead } from 'wagmi'
import { useEffect, useState } from 'react'

function RealTimePrice() {
  const [priceHistory, setPriceHistory] = useState<bigint[]>([])

  const { data: currentPrice } = useContractRead({
    address: '0x...', // 价格预言机合约
    abi: [
      {
        name: 'latestAnswer',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'int256' }],
      },
    ],
    functionName: 'latestAnswer',
    watch: true, // 实时监听
    refetchInterval: 10000, // 每10秒刷新
  })

  useEffect(() => {
    if (currentPrice) {
      setPriceHistory(prev => [...prev.slice(-9), currentPrice])
    }
  }, [currentPrice])

  return (
    <div className="real-time-price">
      <h3>实时价格</h3>
      <div className="current-price">
        当前价格: ${currentPrice ? (Number(currentPrice) / 1e8).toFixed(2) : '...'}
      </div>
      
      <div className="price-history">
        <h4>价格历史</h4>
        {priceHistory.map((price, index) => (
          <div key={index} className="price-item">
            ${(Number(price) / 1e8).toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 高级用法

### 错误处理和重试

```tsx
import { useContractRead } from 'wagmi'
import { useState } from 'react'

function RobustContractRead() {
  const [retryCount, setRetryCount] = useState(0)

  const {
    data,
    error,
    isLoading,
    refetch
  } = useContractRead({
    address: '0x...',
    abi: contractABI,
    functionName: 'getData',
    retry: (failureCount, error) => {
      setRetryCount(failureCount)
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('合约读取失败:', error)
    },
    onSuccess: (data) => {
      console.log('合约读取成功:', data)
      setRetryCount(0)
    },
  })

  return (
    <div className="robust-read">
      {isLoading && (
        <div>
          加载中... {retryCount > 0 && `(重试 ${retryCount}/3)`}
        </div>
      )}
      
      {error && (
        <div className="error-section">
          <p>读取失败: {error.message}</p>
          <button onClick={() => refetch()}>重试</button>
        </div>
      )}
      
      {data && (
        <div className="success-section">
          数据: {JSON.stringify(data)}
        </div>
      )}
    </div>
  )
}
```

### 性能优化

```tsx
import { useContractRead } from 'wagmi'
import { useMemo } from 'react'

function OptimizedRead({ addresses }: { addresses: string[] }) {
  // 使用 useMemo 优化配置
  const contractConfig = useMemo(() => ({
    address: '0x...',
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
  }), [])

  return (
    <div className="optimized-read">
      {addresses.map((address) => (
        <BalanceItem
          key={address}
          address={address}
          contractConfig={contractConfig}
        />
      ))}
    </div>
  )
}

function BalanceItem({ address, contractConfig }: {
  address: string
  contractConfig: any
}) {
  const { data: balance } = useContractRead({
    ...contractConfig,
    args: [address],
    staleTime: 60_000, // 1分钟缓存
    cacheTime: 300_000, // 5分钟内保持缓存
  })

  return (
    <div className="balance-item">
      {address}: {balance?.toString() || '0'}
    </div>
  )
}
```

## 最佳实践

### 1. 类型安全

```tsx
import { useContractRead } from 'wagmi'

// 定义严格的 ABI 类型
const STRICT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

function TypeSafeRead() {
  const { data } = useContractRead({
    address: '0x...',
    abi: STRICT_ABI,
    functionName: 'balanceOf', // 自动补全
    args: ['0x...'], // 类型检查
  })

  // data 类型自动推断为 bigint
  return <div>{data?.toString()}</div>
}
```

### 2. 缓存策略

```tsx
function CachedRead() {
  const { data } = useContractRead({
    address: '0x...',
    abi: contractABI,
    functionName: 'getData',
    // 静态数据长时间缓存
    staleTime: 600_000, // 10分钟
    cacheTime: 1800_000, // 30分钟
    // 减少不必要的重新获取
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return <div>{data}</div>
}
```

## 常见问题

### Q: 如何处理大数值？
A: 使用 `formatUnits` 和 `parseUnits` 处理 BigInt 类型的数值。

### Q: 如何优化多个合约调用？
A: 使用 `useContractReads` 进行批量调用，或合理设置缓存策略。

### Q: 如何处理网络切换？
A: 设置 `chainId` 参数，或使用 `useNetwork` 监听网络变化。

## 下一步

- [useContractReads](/wagmi/hooks/contracts/use-contract-reads) - 学习批量合约读取
- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习合约写入操作
- [useContractEvent](/wagmi/hooks/contracts/use-contract-event) - 学习事件监听