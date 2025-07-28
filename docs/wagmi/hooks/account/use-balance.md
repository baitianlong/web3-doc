---
title: useBalance
description: 获取账户余额的 React Hook
keywords: [wagmi, useBalance, 余额查询, ETH余额, 代币余额, React Hook, Web3]
---

# useBalance

`useBalance` 是 Wagmi 中用于获取账户余额的 Hook。它支持查询 ETH 余额和 ERC-20 代币余额，提供实时更新和格式化功能。

## 基本用法

```tsx
import { useBalance } from 'wagmi'

function Balance() {
  const { data, isError, isLoading } = useBalance({
    address: '0x...',
  })

  if (isLoading) return <div>获取余额中...</div>
  if (isError) return <div>获取余额失败</div>

  return (
    <div>
      余额: {data?.formatted} {data?.symbol}
    </div>
  )
}
```

## 参数配置

### 基础参数
- `address` - 要查询的账户地址
- `token` - ERC-20 代币合约地址（可选，不传则查询 ETH）
- `chainId` - 指定链 ID
- `formatUnits` - 格式化单位
- `watch` - 是否监听余额变化

### 查询配置
- `enabled` - 是否启用查询
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### 余额数据
- `data.decimals` - 代币精度
- `data.formatted` - 格式化后的余额
- `data.symbol` - 代币符号
- `data.value` - 原始余额值（BigNumber）

### 状态信息
- `isLoading` - 是否正在加载
- `isError` - 是否出错
- `isSuccess` - 是否成功
- `isFetching` - 是否正在获取

## 详细示例

### ETH 余额查询

```tsx
import { useBalance, useAccount } from 'wagmi'

function EthBalance() {
  const { address } = useAccount()
  const { data: balance, isLoading, isError } = useBalance({
    address,
    watch: true, // 实时监听余额变化
  })

  if (!address) return <div>请先连接钱包</div>
  if (isLoading) return <div>加载中...</div>
  if (isError) return <div>获取余额失败</div>

  return (
    <div className="eth-balance">
      <h3>ETH 余额</h3>
      <div className="balance-display">
        <span className="amount">{balance?.formatted}</span>
        <span className="symbol">{balance?.symbol}</span>
      </div>
      <div className="balance-details">
        <p>精度: {balance?.decimals}</p>
        <p>原始值: {balance?.value.toString()}</p>
      </div>
    </div>
  )
}
```

### ERC-20 代币余额

```tsx
import { useBalance } from 'wagmi'

function TokenBalance({ address, tokenAddress, tokenSymbol }: {
  address: string
  tokenAddress: string
  tokenSymbol: string
}) {
  const { data: balance, isLoading, error } = useBalance({
    address,
    token: tokenAddress,
    watch: true,
  })

  if (isLoading) {
    return (
      <div className="token-balance loading">
        <div className="skeleton"></div>
        <span>加载 {tokenSymbol} 余额...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="token-balance error">
        <span>❌ 获取 {tokenSymbol} 余额失败</span>
      </div>
    )
  }

  return (
    <div className="token-balance">
      <div className="token-info">
        <span className="symbol">{balance?.symbol || tokenSymbol}</span>
        <span className="amount">{balance?.formatted || '0'}</span>
      </div>
      <div className="token-details">
        <small>精度: {balance?.decimals}</small>
      </div>
    </div>
  )
}
```

### 多代币余额查询

```tsx
import { useBalance, useAccount } from 'wagmi'

const TOKENS = [
  { address: '0xA0b86a33E6441E6C7D3E4C7C5C6C7D3E4C7C5C6C', symbol: 'USDC' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
]

function MultiTokenBalance() {
  const { address } = useAccount()

  return (
    <div className="multi-token-balance">
      <h3>代币余额</h3>
      
      {/* ETH 余额 */}
      <EthBalanceCard address={address} />
      
      {/* 代币余额 */}
      {TOKENS.map((token) => (
        <TokenBalanceCard
          key={token.address}
          address={address}
          tokenAddress={token.address}
          tokenSymbol={token.symbol}
        />
      ))}
    </div>
  )
}

function EthBalanceCard({ address }: { address?: string }) {
  const { data: balance } = useBalance({ address, watch: true })

  return (
    <div className="balance-card eth">
      <div className="token-icon">Ξ</div>
      <div className="balance-info">
        <div className="symbol">ETH</div>
        <div className="amount">{balance?.formatted || '0'}</div>
      </div>
    </div>
  )
}

function TokenBalanceCard({ address, tokenAddress, tokenSymbol }: {
  address?: string
  tokenAddress: string
  tokenSymbol: string
}) {
  const { data: balance, isLoading } = useBalance({
    address,
    token: tokenAddress,
    watch: true,
  })

  return (
    <div className="balance-card token">
      <div className="token-icon">{tokenSymbol[0]}</div>
      <div className="balance-info">
        <div className="symbol">{tokenSymbol}</div>
        <div className="amount">
          {isLoading ? '...' : (balance?.formatted || '0')}
        </div>
      </div>
    </div>
  )
}
```

## 高级用法

### 余额变化监听

```tsx
import { useBalance, useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

function BalanceWatcher() {
  const { address } = useAccount()
  const { data: balance } = useBalance({
    address,
    watch: true,
  })
  
  const [balanceHistory, setBalanceHistory] = useState<Array<{
    balance: string
    timestamp: number
  }>>([])

  useEffect(() => {
    if (balance) {
      setBalanceHistory(prev => [
        ...prev.slice(-9), // 只保留最近10条记录
        {
          balance: balance.formatted,
          timestamp: Date.now()
        }
      ])
    }
  }, [balance])

  const getBalanceChange = () => {
    if (balanceHistory.length < 2) return null
    
    const current = parseFloat(balanceHistory[balanceHistory.length - 1].balance)
    const previous = parseFloat(balanceHistory[balanceHistory.length - 2].balance)
    const change = current - previous
    
    return {
      amount: change,
      percentage: previous > 0 ? (change / previous) * 100 : 0,
      isIncrease: change > 0
    }
  }

  const balanceChange = getBalanceChange()

  return (
    <div className="balance-watcher">
      <div className="current-balance">
        <h3>当前余额</h3>
        <div className="balance-amount">
          {balance?.formatted} {balance?.symbol}
        </div>
        
        {balanceChange && (
          <div className={`balance-change ${balanceChange.isIncrease ? 'increase' : 'decrease'}`}>
            {balanceChange.isIncrease ? '↗' : '↘'} 
            {Math.abs(balanceChange.amount).toFixed(6)} 
            ({balanceChange.percentage.toFixed(2)}%)
          </div>
        )}
      </div>

      <div className="balance-history">
        <h4>余额历史</h4>
        <div className="history-list">
          {balanceHistory.slice(-5).reverse().map((record, index) => (
            <div key={index} className="history-item">
              <span className="balance">{record.balance}</span>
              <span className="time">
                {new Date(record.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 余额格式化和转换

```tsx
import { useBalance } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'

function FormattedBalance({ address, tokenAddress }: {
  address?: string
  tokenAddress?: string
}) {
  const { data: balance } = useBalance({
    address,
    token: tokenAddress,
  })

  // 自定义格式化函数
  const formatBalance = (value: bigint, decimals: number) => {
    const formatted = formatUnits(value, decimals)
    const num = parseFloat(formatted)
    
    if (num === 0) return '0'
    if (num < 0.001) return '< 0.001'
    if (num < 1) return num.toFixed(6)
    if (num < 1000) return num.toFixed(4)
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`
    return `${(num / 1000000).toFixed(2)}M`
  }

  // 获取美元价值（示例）
  const getUSDValue = async (amount: string, symbol: string) => {
    // 这里可以调用价格 API
    // const price = await fetchTokenPrice(symbol)
    // return parseFloat(amount) * price
    return 0 // 占位符
  }

  if (!balance) return <div>无余额数据</div>

  return (
    <div className="formatted-balance">
      <div className="balance-main">
        <span className="amount">
          {formatBalance(balance.value, balance.decimals)}
        </span>
        <span className="symbol">{balance.symbol}</span>
      </div>
      
      <div className="balance-formats">
        <div className="format-item">
          <label>完整精度:</label>
          <span>{balance.formatted}</span>
        </div>
        <div className="format-item">
          <label>原始值:</label>
          <span>{balance.value.toString()}</span>
        </div>
        <div className="format-item">
          <label>科学计数法:</label>
          <span>{parseFloat(balance.formatted).toExponential(2)}</span>
        </div>
      </div>
    </div>
  )
}
```

### 条件查询和缓存

```tsx
import { useBalance, useAccount } from 'wagmi'
import { useState } from 'react'

function ConditionalBalance() {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<string | undefined>()
  
  // 只在连接时查询
  const { data: ethBalance } = useBalance({
    address,
    enabled: isConnected,
    staleTime: 30_000, // 30秒内不重新获取
    cacheTime: 300_000, // 缓存5分钟
  })

  // 只在选择代币时查询
  const { data: tokenBalance, isFetching } = useBalance({
    address,
    token: selectedToken,
    enabled: isConnected && !!selectedToken,
    staleTime: 60_000, // 代币余额缓存更久
  })

  const tokens = [
    { address: '0xA0b86a33E6441E6C7D3E4C7C5C6C7D3E4C7C5C6C', symbol: 'USDC' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
  ]

  return (
    <div className="conditional-balance">
      <div className="eth-balance">
        <h3>ETH 余额</h3>
        {isConnected ? (
          <p>{ethBalance?.formatted || '0'} ETH</p>
        ) : (
          <p>请先连接钱包</p>
        )}
      </div>

      <div className="token-selector">
        <h3>代币余额</h3>
        <select
          value={selectedToken || ''}
          onChange={(e) => setSelectedToken(e.target.value || undefined)}
        >
          <option value="">选择代币</option>
          {tokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
        
        {selectedToken && (
          <div className="token-balance">
            {isFetching ? (
              <p>获取中...</p>
            ) : (
              <p>
                {tokenBalance?.formatted || '0'} {tokenBalance?.symbol}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

## 错误处理

```tsx
import { useBalance } from 'wagmi'
import { useState } from 'react'

function RobustBalance({ address, tokenAddress }: {
  address?: string
  tokenAddress?: string
}) {
  const [retryCount, setRetryCount] = useState(0)
  
  const {
    data: balance,
    error,
    isLoading,
    refetch
  } = useBalance({
    address,
    token: tokenAddress,
    retry: (failureCount, error) => {
      // 最多重试3次
      if (failureCount < 3) {
        setRetryCount(failureCount + 1)
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const handleManualRetry = () => {
    setRetryCount(0)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="balance-loading">
        <div className="spinner"></div>
        <span>获取余额中...</span>
        {retryCount > 0 && <span>(重试 {retryCount}/3)</span>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="balance-error">
        <p>❌ 获取余额失败</p>
        <p className="error-message">{error.message}</p>
        <button onClick={handleManualRetry} className="retry-button">
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="balance-success">
      <span>{balance?.formatted} {balance?.symbol}</span>
    </div>
  )
}
```

## 最佳实践

### 1. 性能优化

```tsx
import { useBalance } from 'wagmi'
import { useMemo } from 'react'

function OptimizedBalance({ address, tokens }: {
  address?: string
  tokens: Array<{ address: string; symbol: string }>
}) {
  // 使用 useMemo 优化代币列表
  const tokenQueries = useMemo(() => 
    tokens.map(token => ({
      address,
      token: token.address,
      enabled: !!address,
      staleTime: 30_000,
    })), [address, tokens]
  )

  return (
    <div className="optimized-balance">
      {tokenQueries.map((query, index) => (
        <TokenBalanceItem
          key={tokens[index].address}
          query={query}
          symbol={tokens[index].symbol}
        />
      ))}
    </div>
  )
}

function TokenBalanceItem({ query, symbol }: {
  query: any
  symbol: string
}) {
  const { data: balance, isLoading } = useBalance(query)

  return (
    <div className="token-item">
      <span className="symbol">{symbol}</span>
      <span className="balance">
        {isLoading ? '...' : (balance?.formatted || '0')}
      </span>
    </div>
  )
}
```

## 常见问题

### Q: 如何获取代币的美元价值？
A: 需要结合价格 API，将代币数量乘以当前价格。

### Q: 余额更新频率如何控制？
A: 使用 `staleTime` 和 `cacheTime` 参数控制缓存策略。

### Q: 如何处理大数值的精度问题？
A: 使用 `formatUnits` 和 `parseUnits` 函数处理 BigNumber。

### Q: 支持查询历史余额吗？
A: 不支持，只能查询当前余额。历史数据需要使用其他方案。

## 下一步

- [useAccount](/wagmi/hooks/account/use-account) - 学习如何获取账户信息
- [useToken](/wagmi/hooks/contracts/use-token) - 学习如何获取代币信息
- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习合约读取操作