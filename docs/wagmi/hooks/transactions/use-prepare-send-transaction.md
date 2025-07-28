---
title: usePrepareSendTransaction
description: 准备发送交易的 React Hook
keywords: [wagmi, usePrepareSendTransaction, 交易准备, Gas估算, 交易验证, React Hook, Web3]
---

# usePrepareSendTransaction

`usePrepareSendTransaction` 用于准备发送交易，提供 Gas 估算、参数验证和交易模拟功能，确保交易在实际发送前的可行性。

## 基本用法

```tsx
import { usePrepareSendTransaction, useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

function PreparedTransaction() {
  const { config, error: prepareError } = usePrepareSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: parseEther('0.01'),
  })

  const { sendTransaction, isLoading } = useSendTransaction(config)

  return (
    <div>
      <button 
        disabled={!sendTransaction || isLoading}
        onClick={() => sendTransaction?.()}
      >
        {isLoading ? '发送中...' : '发送 0.01 ETH'}
      </button>
      
      {prepareError && (
        <div className="error">
          准备失败: {prepareError.message}
        </div>
      )}
    </div>
  )
}
```

## 参数配置

### 交易参数
- `to` - 接收地址
- `value` - 发送的 ETH 数量
- `data` - 交易数据
- `gasLimit` - Gas 限制
- `gasPrice` - Gas 价格
- `nonce` - 交易 nonce

### 控制参数
- `enabled` - 是否启用准备
- `cacheTime` - 缓存时间
- `staleTime` - 数据过期时间

## 返回值

- `config` - 准备好的交易配置
- `error` - 准备过程中的错误
- `isLoading` - 是否正在准备
- `isSuccess` - 是否准备成功
- `isError` - 是否有错误

## 详细示例

### 动态交易准备

```tsx
import { usePrepareSendTransaction, useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { useState, useMemo } from 'react'

function DynamicTransactionPrep() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  // 验证输入
  const isValidInput = useMemo(() => {
    return recipient.startsWith('0x') && 
           recipient.length === 42 && 
           amount && 
           parseFloat(amount) > 0
  }, [recipient, amount])

  const {
    config,
    error: prepareError,
    isLoading: isPreparing,
    isSuccess: isPrepared,
  } = usePrepareSendTransaction({
    to: recipient as `0x${string}`,
    value: amount ? parseEther(amount) : undefined,
    enabled: isValidInput,
  })

  const {
    sendTransaction,
    isLoading: isSending,
    error: sendError,
  } = useSendTransaction(config)

  return (
    <div className="dynamic-transaction-prep">
      <h3>动态交易准备</h3>
      
      <div className="form-group">
        <label>接收地址:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className={recipient && !recipient.startsWith('0x') ? 'invalid' : ''}
        />
      </div>

      <div className="form-group">
        <label>转账金额 (ETH):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.01"
          min="0"
        />
      </div>

      <div className="preparation-status">
        {isPreparing && (
          <div className="preparing">
            🔄 准备交易中...
          </div>
        )}
        
        {prepareError && (
          <div className="prepare-error">
            ❌ 准备失败: {prepareError.message}
          </div>
        )}
        
        {isPrepared && (
          <div className="prepared">
            ✅ 交易已准备就绪
            <div className="gas-estimate">
              预估 Gas: {config.gas?.toString() || '21000'}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => sendTransaction?.()}
        disabled={!sendTransaction || isSending || !isPrepared}
        className="send-button"
      >
        {isSending ? '发送中...' : 
         !isPrepared ? '准备中...' : 
         '发送交易'}
      </button>

      {sendError && (
        <div className="send-error">
          发送失败: {sendError.message}
        </div>
      )}
    </div>
  )
}
```

### Gas 估算和优化

```tsx
import { usePrepareSendTransaction, useFeeData } from 'wagmi'
import { parseEther, formatGwei } from 'viem'
import { useState, useMemo } from 'react'

function GasOptimizedPrep() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [gasStrategy, setGasStrategy] = useState<'slow' | 'standard' | 'fast'>('standard')

  const { data: feeData } = useFeeData()

  // 根据策略计算 Gas 价格
  const gasConfig = useMemo(() => {
    if (!feeData?.maxFeePerGas || !feeData?.maxPriorityFeePerGas) return {}

    const multipliers = {
      slow: 0.8,
      standard: 1.0,
      fast: 1.5,
    }

    const multiplier = multipliers[gasStrategy]

    return {
      maxFeePerGas: BigInt(Math.floor(Number(feeData.maxFeePerGas) * multiplier)),
      maxPriorityFeePerGas: BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * multiplier)),
    }
  }, [feeData, gasStrategy])

  const {
    config,
    error: prepareError,
    isLoading: isPreparing,
  } = usePrepareSendTransaction({
    to: to as `0x${string}`,
    value: amount ? parseEther(amount) : undefined,
    ...gasConfig,
    enabled: !!to && !!amount,
  })

  // 计算预估费用
  const estimatedCost = useMemo(() => {
    if (!config.gas || !gasConfig.maxFeePerGas) return null

    const totalCost = config.gas * gasConfig.maxFeePerGas
    return {
      wei: totalCost,
      eth: Number(totalCost) / 1e18,
      gwei: Number(totalCost) / 1e9,
    }
  }, [config.gas, gasConfig.maxFeePerGas])

  return (
    <div className="gas-optimized-prep">
      <h3>Gas 优化交易准备</h3>
      
      <div className="form-group">
        <label>接收地址:</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div className="form-group">
        <label>转账金额 (ETH):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.01"
        />
      </div>

      <div className="gas-strategy">
        <label>Gas 策略:</label>
        <div className="strategy-options">
          {(['slow', 'standard', 'fast'] as const).map(strategy => (
            <button
              key={strategy}
              className={gasStrategy === strategy ? 'active' : ''}
              onClick={() => setGasStrategy(strategy)}
            >
              {strategy === 'slow' ? '慢速 (便宜)' :
               strategy === 'standard' ? '标准' :
               '快速 (昂贵)'}
            </button>
          ))}
        </div>
      </div>

      {feeData && (
        <div className="fee-info">
          <h4>当前网络费用</h4>
          <div className="fee-details">
            <div>基础费用: {formatGwei(feeData.gasPrice || 0n)} Gwei</div>
            <div>最大费用: {formatGwei(feeData.maxFeePerGas || 0n)} Gwei</div>
            <div>优先费用: {formatGwei(feeData.maxPriorityFeePerGas || 0n)} Gwei</div>
          </div>
        </div>
      )}

      {isPreparing && (
        <div className="preparing">
          🔄 估算 Gas 中...
        </div>
      )}

      {estimatedCost && (
        <div className="cost-estimate">
          <h4>预估交易费用</h4>
          <div className="cost-details">
            <div>Gas 限制: {config.gas?.toString()}</div>
            <div>Gas 价格: {formatGwei(gasConfig.maxFeePerGas || 0n)} Gwei</div>
            <div>预估费用: {estimatedCost.eth.toFixed(6)} ETH</div>
            <div>总成本: {(parseFloat(amount || '0') + estimatedCost.eth).toFixed(6)} ETH</div>
          </div>
        </div>
      )}

      {prepareError && (
        <div className="error">
          准备失败: {prepareError.message}
        </div>
      )}
    </div>
  )
}
```

### 批量交易准备

```tsx
import { usePrepareSendTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { useState, useMemo } from 'react'

interface BatchTransaction {
  id: string
  to: string
  amount: string
  prepared: boolean
  error?: string
}

function BatchTransactionPrep() {
  const [transactions, setTransactions] = useState<BatchTransaction[]>([
    { id: '1', to: '', amount: '', prepared: false }
  ])

  const addTransaction = () => {
    setTransactions(prev => [
      ...prev,
      { id: Date.now().toString(), to: '', amount: '', prepared: false }
    ])
  }

  const updateTransaction = (id: string, field: 'to' | 'amount', value: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, [field]: value, prepared: false } : tx
    ))
  }

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id))
  }

  // 为每个交易准备配置
  const preparedTransactions = transactions.map(tx => {
    const { config, error, isSuccess } = usePrepareSendTransaction({
      to: tx.to as `0x${string}`,
      value: tx.amount ? parseEther(tx.amount) : undefined,
      enabled: !!tx.to && !!tx.amount,
    })

    return {
      ...tx,
      config,
      error: error?.message,
      prepared: isSuccess,
    }
  })

  const totalAmount = useMemo(() => {
    return preparedTransactions.reduce((sum, tx) => {
      return sum + (tx.amount ? parseFloat(tx.amount) : 0)
    }, 0)
  }, [preparedTransactions])

  const allPrepared = preparedTransactions.every(tx => tx.prepared)
  const hasErrors = preparedTransactions.some(tx => tx.error)

  return (
    <div className="batch-transaction-prep">
      <h3>批量交易准备</h3>
      
      <div className="batch-summary">
        <div>交易数量: {transactions.length}</div>
        <div>总金额: {totalAmount.toFixed(4)} ETH</div>
        <div>准备状态: {allPrepared ? '✅ 全部就绪' : '⏳ 准备中'}</div>
      </div>

      <div className="transactions-list">
        {preparedTransactions.map((tx, index) => (
          <div key={tx.id} className="transaction-item">
            <div className="transaction-header">
              <span>交易 #{index + 1}</span>
              <button onClick={() => removeTransaction(tx.id)}>删除</button>
            </div>
            
            <div className="transaction-inputs">
              <input
                type="text"
                value={tx.to}
                onChange={(e) => updateTransaction(tx.id, 'to', e.target.value)}
                placeholder="接收地址"
              />
              <input
                type="number"
                value={tx.amount}
                onChange={(e) => updateTransaction(tx.id, 'amount', e.target.value)}
                placeholder="金额 (ETH)"
                step="0.01"
              />
            </div>

            <div className="transaction-status">
              {tx.prepared && (
                <div className="prepared">
                  ✅ 已准备 (Gas: {tx.config?.gas?.toString()})
                </div>
              )}
              {tx.error && (
                <div className="error">
                  ❌ {tx.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="batch-controls">
        <button onClick={addTransaction}>添加交易</button>
        <button 
          disabled={!allPrepared || hasErrors}
          className="execute-batch"
        >
          {allPrepared ? '执行批量交易' : '等待准备完成'}
        </button>
      </div>
    </div>
  )
}
```

## 高级用法

### 条件性准备

```tsx
import { usePrepareSendTransaction } from 'wagmi'
import { useAccount, useBalance } from 'wagmi'
import { parseEther } from 'viem'
import { useState, useMemo } from 'react'

function ConditionalPrep() {
  const [amount, setAmount] = useState('')
  const { address } = useAccount()
  const { data: balance } = useBalance({ address })

  // 检查是否有足够余额
  const hasSufficientBalance = useMemo(() => {
    if (!balance || !amount) return false
    
    const sendAmount = parseEther(amount)
    const gasBuffer = parseEther('0.001') // 预留 Gas 费用
    
    return balance.value >= sendAmount + gasBuffer
  }, [balance, amount])

  const {
    config,
    error,
    isLoading,
  } = usePrepareSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: amount ? parseEther(amount) : undefined,
    enabled: !!amount && hasSufficientBalance,
  })

  return (
    <div className="conditional-prep">
      <div className="balance-info">
        <p>当前余额: {balance?.formatted} {balance?.symbol}</p>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="转账金额"
        step="0.01"
      />

      {amount && !hasSufficientBalance && (
        <div className="warning">
          ⚠️ 余额不足（需要预留 Gas 费用）
        </div>
      )}

      {isLoading && (
        <div className="preparing">
          🔄 准备交易中...
        </div>
      )}

      {error && (
        <div className="error">
          准备失败: {error.message}
        </div>
      )}

      {config && (
        <div className="prepared">
          ✅ 交易已准备就绪
        </div>
      )}
    </div>
  )
}
```

### 实时 Gas 监控

```tsx
import { usePrepareSendTransaction, useFeeData } from 'wagmi'
import { parseEther, formatGwei } from 'viem'
import { useState, useEffect } from 'react'

function GasMonitoring() {
  const [gasHistory, setGasHistory] = useState<number[]>([])
  const { data: feeData } = useFeeData({ watch: true })

  // 记录 Gas 价格历史
  useEffect(() => {
    if (feeData?.gasPrice) {
      const gasPriceGwei = Number(feeData.gasPrice) / 1e9
      setGasHistory(prev => [...prev.slice(-20), gasPriceGwei]) // 保留最近20个数据点
    }
  }, [feeData])

  const { config, isLoading } = usePrepareSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: parseEther('0.01'),
  })

  const averageGas = gasHistory.length > 0 
    ? gasHistory.reduce((sum, price) => sum + price, 0) / gasHistory.length
    : 0

  const currentGas = feeData?.gasPrice ? Number(feeData.gasPrice) / 1e9 : 0
  const isGasHigh = currentGas > averageGas * 1.2

  return (
    <div className="gas-monitoring">
      <h3>实时 Gas 监控</h3>
      
      <div className="gas-stats">
        <div className="stat">
          <label>当前 Gas:</label>
          <span className={isGasHigh ? 'high' : 'normal'}>
            {currentGas.toFixed(2)} Gwei
          </span>
        </div>
        
        <div className="stat">
          <label>平均 Gas:</label>
          <span>{averageGas.toFixed(2)} Gwei</span>
        </div>
        
        <div className="stat">
          <label>预估费用:</label>
          <span>
            {config?.gas ? 
              ((Number(config.gas) * currentGas) / 1e9).toFixed(6) + ' ETH' :
              '计算中...'
            }
          </span>
        </div>
      </div>

      {isGasHigh && (
        <div className="gas-warning">
          ⚠️ 当前 Gas 价格较高，建议稍后再试
        </div>
      )}

      <div className="gas-chart">
        <h4>Gas 价格趋势</h4>
        <div className="chart-container">
          {gasHistory.map((price, index) => (
            <div
              key={index}
              className="chart-bar"
              style={{
                height: `${(price / Math.max(...gasHistory)) * 100}%`,
                backgroundColor: price > averageGas * 1.2 ? '#ff6b6b' : '#51cf66'
              }}
            />
          ))}
        </div>
      </div>

      <button disabled={isLoading}>
        {isLoading ? '准备中...' : '发送交易'}
      </button>
    </div>
  )
}
```

## 最佳实践

### 1. 错误处理和用户反馈

```tsx
function BestPracticePrep() {
  const { config, error, isLoading, isSuccess } = usePrepareSendTransaction({
    to: '0x...',
    value: parseEther('0.01'),
    onError: (error) => {
      // 记录错误用于调试
      console.error('Transaction preparation failed:', error)
    },
  })

  const getErrorMessage = (error: any) => {
    if (error.message.includes('insufficient funds')) {
      return '余额不足，请检查您的账户余额'
    } else if (error.message.includes('gas')) {
      return 'Gas 估算失败，请稍后重试'
    } else if (error.message.includes('network')) {
      return '网络连接问题，请检查网络状态'
    }
    return '交易准备失败，请重试'
  }

  return (
    <div className="best-practice-prep">
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>正在准备交易...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h4>准备失败</h4>
          <p>{getErrorMessage(error)}</p>
          <details>
            <summary>技术详情</summary>
            <pre>{error.message}</pre>
          </details>
        </div>
      )}

      {isSuccess && config && (
        <div className="success-state">
          <h4>交易已准备就绪</h4>
          <div className="transaction-details">
            <div>Gas 限制: {config.gas?.toString()}</div>
            <div>Gas 价格: {config.gasPrice?.toString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. 性能优化

```tsx
function OptimizedPrep() {
  const [debouncedAmount, setDebouncedAmount] = useState('')
  const [amount, setAmount] = useState('')

  // 防抖处理用户输入
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount)
    }, 500)

    return () => clearTimeout(timer)
  }, [amount])

  const { config } = usePrepareSendTransaction({
    to: '0x...',
    value: debouncedAmount ? parseEther(debouncedAmount) : undefined,
    enabled: !!debouncedAmount,
    // 缓存配置
    staleTime: 30_000, // 30秒内不重新准备
    cacheTime: 60_000, // 缓存1分钟
  })

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="输入金额"
      />
      {/* 其他组件 */}
    </div>
  )
}
```

## 常见问题

### Q: 准备失败的常见原因？
A: 1) 余额不足 2) Gas 估算失败 3) 网络问题 4) 参数错误

### Q: 如何优化准备性能？
A: 使用防抖、合理设置缓存时间、条件性启用准备

### Q: Gas 估算不准确怎么办？
A: 手动设置 Gas 限制，或增加 Gas 缓冲

### Q: 如何处理网络切换？
A: 监听网络变化，重新准备交易

## 下一步

- [useSendTransaction](/wagmi/hooks/transactions/use-send-transaction) - 学习发送准备好的交易
- [useWaitForTransaction](/wagmi/hooks/transactions/use-wait-for-transaction) - 学习等待交易确认
- [useFeeData](/wagmi/hooks/network/use-fee-data) - 学习获取 Gas 费用信息