---
title: useSendTransaction
description: 发送以太坊交易的 React Hook
keywords: [wagmi, useSendTransaction, 发送交易, 以太坊, 转账, React Hook, Web3]
---

# useSendTransaction

`useSendTransaction` 是 Wagmi 中用于发送以太坊交易的 Hook。它提供了简单的 ETH 转账、合约调用和交易状态管理功能。

## 基本用法

```tsx
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

function SendTransaction() {
  const { data, isLoading, isSuccess, sendTransaction } = useSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: parseEther('0.01'),
  })

  return (
    <div>
      <button 
        disabled={isLoading} 
        onClick={() => sendTransaction?.()}
      >
        {isLoading ? '发送中...' : '发送 0.01 ETH'}
      </button>
      {isSuccess && <div>交易成功！哈希: {data?.hash}</div>}
    </div>
  )
}
```

## 参数配置

### 基本参数
- `to` - 接收地址
- `value` - 发送的 ETH 数量（wei）
- `data` - 交易数据（合约调用）
- `gasLimit` - Gas 限制
- `gasPrice` - Gas 价格
- `nonce` - 交易 nonce

### 高级参数
- `maxFeePerGas` - EIP-1559 最大费用
- `maxPriorityFeePerGas` - EIP-1559 优先费用
- `accessList` - 访问列表

## 返回值

- `data` - 交易哈希和相关信息
- `error` - 错误信息
- `isLoading` - 是否正在发送
- `isSuccess` - 是否成功
- `sendTransaction` - 发送交易函数
- `reset` - 重置状态

## 详细示例

### ETH 转账

```tsx
import { useSendTransaction, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'

function EthTransfer() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

  const {
    data: txData,
    sendTransaction,
    isLoading: isSending,
    error: sendError,
  } = useSendTransaction({
    to: to as `0x${string}`,
    value: amount ? parseEther(amount) : undefined,
  })

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransaction({
    hash: txData?.hash,
  })

  const handleSend = () => {
    if (!to || !amount) return
    sendTransaction?.()
  }

  return (
    <div className="eth-transfer">
      <h3>ETH 转账</h3>
      
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

      <button
        onClick={handleSend}
        disabled={!sendTransaction || isSending || isConfirming}
        className="send-button"
      >
        {isSending ? '发送中...' :
         isConfirming ? '确认中...' :
         '发送 ETH'}
      </button>

      {sendError && (
        <div className="error">
          发送失败: {sendError.message}
        </div>
      )}

      {txData && (
        <div className="transaction-status">
          <p>交易哈希: {txData.hash}</p>
          {isConfirming && <p>⏳ 等待确认...</p>}
          {isConfirmed && <p>✅ 交易已确认</p>}
        </div>
      )}
    </div>
  )
}
```

### 批量转账

```tsx
import { useSendTransaction } from 'wagmi'
import { encodeFunctionData, parseEther } from 'viem'
import { useState } from 'react'

const BATCH_TRANSFER_ABI = [
  {
    name: 'batchTransfer',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
  },
] as const

function BatchTransfer() {
  const [recipients, setRecipients] = useState<string[]>([''])
  const [amounts, setAmounts] = useState<string[]>([''])

  const { sendTransaction, isLoading } = useSendTransaction()

  const addRecipient = () => {
    setRecipients([...recipients, ''])
    setAmounts([...amounts, ''])
  }

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
    setAmounts(amounts.filter((_, i) => i !== index))
  }

  const handleBatchTransfer = () => {
    const validRecipients = recipients.filter(addr => addr.trim())
    const validAmounts = amounts.filter(amt => amt.trim())

    if (validRecipients.length !== validAmounts.length) return

    const totalValue = validAmounts.reduce(
      (sum, amt) => sum + parseEther(amt),
      0n
    )

    const data = encodeFunctionData({
      abi: BATCH_TRANSFER_ABI,
      functionName: 'batchTransfer',
      args: [
        validRecipients as `0x${string}`[],
        validAmounts.map(amt => parseEther(amt)),
      ],
    })

    sendTransaction?.({
      to: '0x...', // 批量转账合约地址
      value: totalValue,
      data,
    })
  }

  return (
    <div className="batch-transfer">
      <h3>批量转账</h3>
      
      {recipients.map((recipient, index) => (
        <div key={index} className="recipient-row">
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              const newRecipients = [...recipients]
              newRecipients[index] = e.target.value
              setRecipients(newRecipients)
            }}
            placeholder="接收地址"
          />
          <input
            type="number"
            value={amounts[index]}
            onChange={(e) => {
              const newAmounts = [...amounts]
              newAmounts[index] = e.target.value
              setAmounts(newAmounts)
            }}
            placeholder="金额 (ETH)"
            step="0.01"
          />
          {recipients.length > 1 && (
            <button onClick={() => removeRecipient(index)}>删除</button>
          )}
        </div>
      ))}

      <div className="batch-controls">
        <button onClick={addRecipient}>添加接收者</button>
        <button 
          onClick={handleBatchTransfer}
          disabled={isLoading}
        >
          {isLoading ? '发送中...' : '批量转账'}
        </button>
      </div>
    </div>
  )
}
```

### 动态 Gas 设置

```tsx
import { useSendTransaction, useFeeData } from 'wagmi'
import { parseEther, parseGwei } from 'viem'
import { useState, useMemo } from 'react'

function DynamicGasTransfer() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [gasMultiplier, setGasMultiplier] = useState(1.2)

  const { data: feeData } = useFeeData()

  const gasConfig = useMemo(() => {
    if (!feeData) return {}

    return {
      maxFeePerGas: feeData.maxFeePerGas 
        ? BigInt(Math.floor(Number(feeData.maxFeePerGas) * gasMultiplier))
        : undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        ? BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * gasMultiplier))
        : undefined,
    }
  }, [feeData, gasMultiplier])

  const { sendTransaction, isLoading } = useSendTransaction({
    to: to as `0x${string}`,
    value: amount ? parseEther(amount) : undefined,
    ...gasConfig,
  })

  const estimatedCost = useMemo(() => {
    if (!feeData?.maxFeePerGas) return '0'
    
    const gasLimit = 21000n // 标准转账 Gas
    const totalCost = gasLimit * BigInt(Math.floor(Number(feeData.maxFeePerGas) * gasMultiplier))
    
    return (Number(totalCost) / 1e18).toFixed(6)
  }, [feeData, gasMultiplier])

  return (
    <div className="dynamic-gas-transfer">
      <h3>动态 Gas 转账</h3>
      
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

      <div className="gas-controls">
        <label>Gas 倍数: {gasMultiplier}x</label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={gasMultiplier}
          onChange={(e) => setGasMultiplier(parseFloat(e.target.value))}
        />
        
        <div className="gas-info">
          <p>预估 Gas 费用: {estimatedCost} ETH</p>
          <p>当前 Gas 价格: {feeData?.gasPrice ? 
            `${Number(feeData.gasPrice) / 1e9} Gwei` : 
            '加载中...'
          }</p>
        </div>
      </div>

      <button
        onClick={() => sendTransaction?.()}
        disabled={!sendTransaction || isLoading}
        className="send-button"
      >
        {isLoading ? '发送中...' : '发送交易'}
      </button>
    </div>
  )
}
```

## 高级用法

### 交易重试机制

```tsx
import { useSendTransaction } from 'wagmi'
import { useState, useCallback } from 'react'

function RetryableTransaction() {
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)

  const { sendTransaction, isLoading, error } = useSendTransaction({
    onError: (error) => {
      setLastError(error.message)
      console.error('交易失败:', error)
    },
    onSuccess: (data) => {
      setRetryCount(0)
      setLastError(null)
      console.log('交易成功:', data.hash)
    },
  })

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      sendTransaction?.({
        to: '0x...',
        value: parseEther('0.01'),
        // 增加 Gas 价格以提高成功率
        gasPrice: parseGwei('20'),
      })
    }
  }, [sendTransaction, retryCount])

  return (
    <div className="retryable-transaction">
      <button onClick={handleRetry} disabled={isLoading || retryCount >= 3}>
        {isLoading ? '发送中...' : 
         retryCount > 0 ? `重试 (${retryCount}/3)` : 
         '发送交易'}
      </button>

      {lastError && (
        <div className="error">
          错误: {lastError}
          {retryCount < 3 && (
            <button onClick={handleRetry}>重试</button>
          )}
        </div>
      )}
    </div>
  )
}
```

### 交易队列管理

```tsx
import { useSendTransaction } from 'wagmi'
import { useState, useCallback } from 'react'

interface QueuedTransaction {
  id: string
  to: string
  value: bigint
  status: 'pending' | 'sending' | 'success' | 'failed'
  hash?: string
  error?: string
}

function TransactionQueue() {
  const [queue, setQueue] = useState<QueuedTransaction[]>([])
  const [currentTx, setCurrentTx] = useState<QueuedTransaction | null>(null)

  const { sendTransaction, isLoading } = useSendTransaction({
    onSuccess: (data) => {
      if (currentTx) {
        setQueue(prev => prev.map(tx => 
          tx.id === currentTx.id 
            ? { ...tx, status: 'success', hash: data.hash }
            : tx
        ))
        processNextTransaction()
      }
    },
    onError: (error) => {
      if (currentTx) {
        setQueue(prev => prev.map(tx => 
          tx.id === currentTx.id 
            ? { ...tx, status: 'failed', error: error.message }
            : tx
        ))
        processNextTransaction()
      }
    },
  })

  const addToQueue = useCallback((to: string, value: bigint) => {
    const newTx: QueuedTransaction = {
      id: Date.now().toString(),
      to,
      value,
      status: 'pending',
    }
    
    setQueue(prev => [...prev, newTx])
    
    if (!currentTx && !isLoading) {
      processNextTransaction()
    }
  }, [currentTx, isLoading])

  const processNextTransaction = useCallback(() => {
    setQueue(prev => {
      const pendingTx = prev.find(tx => tx.status === 'pending')
      if (pendingTx) {
        setCurrentTx(pendingTx)
        sendTransaction?.({
          to: pendingTx.to as `0x${string}`,
          value: pendingTx.value,
        })
        return prev.map(tx => 
          tx.id === pendingTx.id 
            ? { ...tx, status: 'sending' }
            : tx
        )
      } else {
        setCurrentTx(null)
        return prev
      }
    })
  }, [sendTransaction])

  return (
    <div className="transaction-queue">
      <h3>交易队列</h3>
      
      <button 
        onClick={() => addToQueue('0x...', parseEther('0.01'))}
        disabled={isLoading}
      >
        添加交易到队列
      </button>

      <div className="queue-list">
        {queue.map(tx => (
          <div key={tx.id} className={`queue-item ${tx.status}`}>
            <span>到: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
            <span>金额: {Number(tx.value) / 1e18} ETH</span>
            <span className="status">{tx.status}</span>
            {tx.hash && (
              <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank">
                查看
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 最佳实践

### 1. 错误处理

```tsx
function ErrorHandling() {
  const { sendTransaction, error } = useSendTransaction({
    onError: (error) => {
      // 根据错误类型提供不同的用户提示
      if (error.message.includes('insufficient funds')) {
        alert('余额不足')
      } else if (error.message.includes('user rejected')) {
        alert('用户取消了交易')
      } else {
        alert('交易失败，请重试')
      }
    },
  })

  return (
    <div>
      <button onClick={() => sendTransaction?.()}>
        发送交易
      </button>
      {error && (
        <div className="error-details">
          <h4>交易失败</h4>
          <p>{error.message}</p>
          <details>
            <summary>技术详情</summary>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
```

### 2. 用户体验优化

```tsx
function OptimizedUX() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { sendTransaction, isLoading } = useSendTransaction({
    onMutate: () => setIsSubmitting(true),
    onSettled: () => setIsSubmitting(false),
  })

  return (
    <button 
      onClick={() => sendTransaction?.()} 
      disabled={isSubmitting}
      className={`tx-button ${isSubmitting ? 'submitting' : ''}`}
    >
      {isLoading ? (
        <>
          <span className="spinner"></span>
          发送中...
        </>
      ) : (
        '发送交易'
      )}
    </button>
  )
}
```

## 常见问题

### Q: 如何处理 Gas 估算失败？
A: 手动设置 Gas 限制，或使用 `usePrepareSendTransaction` 预先验证。

### Q: 交易被拒绝怎么办？
A: 检查用户余额、Gas 设置和网络状态，提供重试选项。

### Q: 如何加速慢交易？
A: 使用更高的 Gas 价格重新发送，或使用 RBF (Replace-By-Fee)。

## 下一步

- [usePrepareSendTransaction](/wagmi/hooks/transactions/use-prepare-send-transaction) - 学习交易准备
- [useWaitForTransaction](/wagmi/hooks/transactions/use-wait-for-transaction) - 学习等待交易确认
- [useTransaction](/wagmi/hooks/transactions/use-transaction) - 学习获取交易详情