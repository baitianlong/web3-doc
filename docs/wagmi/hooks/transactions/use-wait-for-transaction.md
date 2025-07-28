---
title: useWaitForTransaction
description: 等待交易确认的 React Hook
keywords: [wagmi, useWaitForTransaction, 交易确认, 交易状态, 区块确认, React Hook, Web3]
---

# useWaitForTransaction

`useWaitForTransaction` 用于等待交易确认，监控交易状态并提供确认进度信息。它是处理交易后续状态的重要工具。

## 基本用法

```tsx
import { useSendTransaction, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'

function TransactionWithConfirmation() {
  const { data: txData, sendTransaction } = useSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: parseEther('0.01'),
  })

  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransaction({
    hash: txData?.hash,
  })

  return (
    <div>
      <button onClick={() => sendTransaction?.()}>
        发送交易
      </button>
      
      {isConfirming && <div>⏳ 等待确认中...</div>}
      {isConfirmed && <div>✅ 交易已确认！</div>}
      
      {receipt && (
        <div>
          <p>区块号: {receipt.blockNumber}</p>
          <p>Gas 使用: {receipt.gasUsed.toString()}</p>
        </div>
      )}
    </div>
  )
}
```

## 参数配置

### 基本参数
- `hash` - 交易哈希
- `confirmations` - 需要的确认数（默认 1）
- `timeout` - 超时时间（毫秒）

### 高级参数
- `enabled` - 是否启用监听
- `onReplaced` - 交易被替换时的回调
- `onSuccess` - 确认成功时的回调
- `onError` - 确认失败时的回调

## 返回值

- `data` - 交易收据
- `error` - 错误信息
- `isLoading` - 是否正在等待
- `isSuccess` - 是否确认成功
- `isError` - 是否有错误
- `status` - 当前状态

## 详细示例

### 多级确认监控

```tsx
import { useWaitForTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

function MultiLevelConfirmation({ txHash }: { txHash: string }) {
  const [confirmationLevels] = useState([1, 3, 6, 12])
  const [currentLevel, setCurrentLevel] = useState(0)

  const { 
    data: receipt, 
    isLoading,
    isSuccess 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    confirmations: confirmationLevels[currentLevel],
    onSuccess: () => {
      if (currentLevel < confirmationLevels.length - 1) {
        setCurrentLevel(prev => prev + 1)
      }
    },
  })

  const getConfirmationStatus = () => {
    if (isLoading) return `等待 ${confirmationLevels[currentLevel]} 个确认...`
    if (isSuccess && currentLevel === confirmationLevels.length - 1) return '所有确认完成'
    if (isSuccess) return `${confirmationLevels[currentLevel]} 个确认完成`
    return '等待交易上链...'
  }

  const getSecurityLevel = () => {
    const level = confirmationLevels[currentLevel]
    if (level === 1) return '基础'
    if (level === 3) return '安全'
    if (level === 6) return '高安全'
    return '极高安全'
  }

  return (
    <div className="multi-level-confirmation">
      <h3>交易确认进度</h3>
      
      <div className="confirmation-status">
        <div className="status-text">{getConfirmationStatus()}</div>
        <div className="security-level">
          安全级别: <span className={`level-${currentLevel}`}>
            {getSecurityLevel()}
          </span>
        </div>
      </div>

      <div className="confirmation-progress">
        {confirmationLevels.map((level, index) => (
          <div 
            key={level}
            className={`progress-step ${
              index < currentLevel ? 'completed' : 
              index === currentLevel && isLoading ? 'active' : 
              index === currentLevel && isSuccess ? 'completed' : 
              'pending'
            }`}
          >
            <div className="step-number">{level}</div>
            <div className="step-label">
              {level === 1 ? '基础确认' :
               level === 3 ? '安全确认' :
               level === 6 ? '高安全' :
               '极高安全'}
            </div>
          </div>
        ))}
      </div>

      {receipt && (
        <div className="transaction-details">
          <h4>交易详情</h4>
          <div className="detail-item">
            <span>区块号:</span>
            <span>{receipt.blockNumber}</span>
          </div>
          <div className="detail-item">
            <span>Gas 使用:</span>
            <span>{receipt.gasUsed.toString()}</span>
          </div>
          <div className="detail-item">
            <span>状态:</span>
            <span className={receipt.status === 'success' ? 'success' : 'failed'}>
              {receipt.status === 'success' ? '成功' : '失败'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 交易状态时间线

```tsx
import { useWaitForTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

interface TimelineEvent {
  timestamp: number
  event: string
  description: string
  status: 'pending' | 'completed' | 'failed'
}

function TransactionTimeline({ txHash }: { txHash: string }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    {
      timestamp: Date.now(),
      event: 'transaction_sent',
      description: '交易已发送到网络',
      status: 'completed'
    }
  ])

  const { 
    data: receipt, 
    isLoading, 
    isSuccess, 
    isError,
    error 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    confirmations: 1,
    timeout: 300_000, // 5分钟超时
    onSuccess: (data) => {
      addTimelineEvent('transaction_confirmed', '交易已确认', 'completed')
    },
    onError: (error) => {
      addTimelineEvent('transaction_failed', `交易失败: ${error.message}`, 'failed')
    },
  })

  const addTimelineEvent = (event: string, description: string, status: TimelineEvent['status']) => {
    setTimeline(prev => [...prev, {
      timestamp: Date.now(),
      event,
      description,
      status
    }])
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getElapsedTime = () => {
    const start = timeline[0]?.timestamp || Date.now()
    return Math.floor((Date.now() - start) / 1000)
  }

  return (
    <div className="transaction-timeline">
      <h3>交易时间线</h3>
      
      <div className="timeline-header">
        <div className="tx-hash">
          交易哈希: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </div>
        <div className="elapsed-time">
          耗时: {getElapsedTime()}秒
        </div>
      </div>

      <div className="timeline-container">
        {timeline.map((event, index) => (
          <div key={index} className={`timeline-item ${event.status}`}>
            <div className="timeline-marker">
              {event.status === 'completed' ? '✅' :
               event.status === 'failed' ? '❌' :
               '⏳'}
            </div>
            
            <div className="timeline-content">
              <div className="event-time">{formatTime(event.timestamp)}</div>
              <div className="event-description">{event.description}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="timeline-item pending">
            <div className="timeline-marker">⏳</div>
            <div className="timeline-content">
              <div className="event-time">{formatTime(Date.now())}</div>
              <div className="event-description">确认中...</div>
            </div>
          </div>
        )}
      </div>

      {receipt && (
        <div className="final-status">
          <h4>最终状态</h4>
          <div className="status-grid">
            <div className="status-item">
              <span>区块号:</span>
              <span>{receipt.blockNumber}</span>
            </div>
            <div className="status-item">
              <span>Gas 使用:</span>
              <span>{receipt.gasUsed.toString()}</span>
            </div>
            <div className="status-item">
              <span>交易费用:</span>
              <span>{receipt.effectiveGasPrice ? 
                (Number(receipt.gasUsed * receipt.effectiveGasPrice) / 1e18).toFixed(6) + ' ETH' :
                '计算中...'
              }</span>
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="error-status">
          <h4>错误信息</h4>
          <p>{error?.message}</p>
        </div>
      )}
    </div>
  )
}
```

### 批量交易确认

```tsx
import { useWaitForTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

interface BatchTransaction {
  id: string
  hash: string
  description: string
  status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  receipt?: any
}

function BatchTransactionConfirmation({ transactions }: { 
  transactions: BatchTransaction[] 
}) {
  const [txList, setTxList] = useState(transactions)

  // 为每个交易创建确认监听器
  const confirmationHooks = txList.map(tx => 
    useWaitForTransaction({
      hash: tx.hash as `0x${string}`,
      enabled: tx.status === 'confirming',
      onSuccess: (receipt) => {
        setTxList(prev => prev.map(t => 
          t.id === tx.id 
            ? { ...t, status: 'confirmed', receipt }
            : t
        ))
      },
      onError: () => {
        setTxList(prev => prev.map(t => 
          t.id === tx.id 
            ? { ...t, status: 'failed' }
            : t
        ))
      },
    })
  )

  // 开始确认流程
  useEffect(() => {
    setTxList(prev => prev.map(tx => 
      tx.status === 'pending' 
        ? { ...tx, status: 'confirming' }
        : tx
    ))
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'confirming': return '🔄'
      case 'confirmed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  const overallStatus = (() => {
    const confirmed = txList.filter(tx => tx.status === 'confirmed').length
    const failed = txList.filter(tx => tx.status === 'failed').length
    const total = txList.length

    if (confirmed === total) return 'all_confirmed'
    if (failed > 0) return 'some_failed'
    return 'confirming'
  })()

  return (
    <div className="batch-confirmation">
      <h3>批量交易确认</h3>
      
      <div className="batch-summary">
        <div className="summary-stats">
          <div className="stat">
            <span>总数:</span>
            <span>{txList.length}</span>
          </div>
          <div className="stat">
            <span>已确认:</span>
            <span>{txList.filter(tx => tx.status === 'confirmed').length}</span>
          </div>
          <div className="stat">
            <span>失败:</span>
            <span>{txList.filter(tx => tx.status === 'failed').length}</span>
          </div>
        </div>
        
        <div className={`overall-status ${overallStatus}`}>
          {overallStatus === 'all_confirmed' ? '✅ 全部确认' :
           overallStatus === 'some_failed' ? '⚠️ 部分失败' :
           '⏳ 确认中...'}
        </div>
      </div>

      <div className="transaction-list">
        {txList.map((tx, index) => (
          <div key={tx.id} className={`transaction-item ${tx.status}`}>
            <div className="tx-header">
              <span className="tx-number">#{index + 1}</span>
              <span className="tx-status">{getStatusIcon(tx.status)}</span>
            </div>
            
            <div className="tx-content">
              <div className="tx-description">{tx.description}</div>
              <div className="tx-hash">
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </div>
            </div>
            
            <div className="tx-details">
              {tx.status === 'confirming' && (
                <div className="confirming-indicator">
                  <div className="spinner"></div>
                  <span>确认中...</span>
                </div>
              )}
              
              {tx.receipt && (
                <div className="receipt-info">
                  <div>区块: {tx.receipt.blockNumber}</div>
                  <div>Gas: {tx.receipt.gasUsed.toString()}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="batch-actions">
        <button 
          onClick={() => window.location.reload()}
          disabled={overallStatus === 'confirming'}
        >
          刷新状态
        </button>
        
        {overallStatus === 'all_confirmed' && (
          <button className="success-button">
            继续下一步
          </button>
        )}
      </div>
    </div>
  )
}
```

## 高级用法

### 智能重试机制

```tsx
import { useWaitForTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

function SmartRetryConfirmation({ txHash }: { txHash: string }) {
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const maxRetries = 3

  const { 
    data: receipt, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    timeout: 120_000, // 2分钟超时
    onError: (error) => {
      console.error('Confirmation failed:', error)
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setIsRetrying(true)
          setRetryCount(prev => prev + 1)
          refetch()
          setIsRetrying(false)
        }, 5000) // 5秒后重试
      }
    },
  })

  const getRetryMessage = () => {
    if (isRetrying) return '正在重试...'
    if (retryCount > 0) return `已重试 ${retryCount}/${maxRetries} 次`
    return ''
  }

  const canRetry = retryCount < maxRetries && isError && !isRetrying

  return (
    <div className="smart-retry-confirmation">
      <h3>智能重试确认</h3>
      
      <div className="confirmation-status">
        {isLoading && <div className="loading">⏳ 等待确认中...</div>}
        {isRetrying && <div className="retrying">🔄 重试中...</div>}
        {receipt && <div className="success">✅ 交易已确认</div>}
        {isError && !isRetrying && (
          <div className="error">
            ❌ 确认失败: {error?.message}
          </div>
        )}
      </div>

      <div className="retry-info">
        <div className="retry-count">{getRetryMessage()}</div>
        {canRetry && (
          <button 
            onClick={() => {
              setIsRetrying(true)
              setRetryCount(prev => prev + 1)
              refetch()
              setIsRetrying(false)
            }}
            className="retry-button"
          >
            手动重试
          </button>
        )}
      </div>

      {receipt && (
        <div className="receipt-summary">
          <h4>确认详情</h4>
          <div className="detail">区块号: {receipt.blockNumber}</div>
          <div className="detail">Gas 使用: {receipt.gasUsed.toString()}</div>
          <div className="detail">状态: {receipt.status}</div>
        </div>
      )}
    </div>
  )
}
```

### 确认进度可视化

```tsx
import { useWaitForTransaction, useBlockNumber } from 'wagmi'
import { useState, useEffect } from 'react'

function ConfirmationProgress({ txHash }: { txHash: string }) {
  const [targetConfirmations] = useState(6)
  const [txBlockNumber, setTxBlockNumber] = useState<number | null>(null)

  const { data: currentBlock } = useBlockNumber({
    watch: true, // 实时监听新区块
  })

  const { 
    data: receipt, 
    isLoading, 
    isSuccess 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    confirmations: 1, // 先等待1个确认
    onSuccess: (data) => {
      setTxBlockNumber(Number(data.blockNumber))
    },
  })

  const currentConfirmations = txBlockNumber && currentBlock 
    ? Math.max(0, Number(currentBlock) - txBlockNumber + 1)
    : 0

  const progressPercentage = Math.min(
    (currentConfirmations / targetConfirmations) * 100, 
    100
  )

  const getConfirmationColor = (confirmations: number) => {
    if (confirmations >= targetConfirmations) return '#10b981' // 绿色
    if (confirmations >= targetConfirmations / 2) return '#f59e0b' // 黄色
    return '#ef4444' // 红色
  }

  const getSecurityLevel = (confirmations: number) => {
    if (confirmations >= 12) return '极高安全'
    if (confirmations >= 6) return '高安全'
    if (confirmations >= 3) return '中等安全'
    if (confirmations >= 1) return '基础安全'
    return '未确认'
  }

  return (
    <div className="confirmation-progress">
      <h3>确认进度可视化</h3>
      
      <div className="progress-header">
        <div className="tx-info">
          <div>交易哈希: {txHash.slice(0, 10)}...{txHash.slice(-8)}</div>
          {txBlockNumber && (
            <div>交易区块: {txBlockNumber}</div>
          )}
          {currentBlock && (
            <div>当前区块: {currentBlock.toString()}</div>
          )}
        </div>
      </div>

      <div className="progress-visual">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: getConfirmationColor(currentConfirmations)
            }}
          />
        </div>
        
        <div className="progress-text">
          {currentConfirmations} / {targetConfirmations} 确认
          ({progressPercentage.toFixed(1)}%)
        </div>
      </div>

      <div className="confirmation-details">
        <div className="detail-grid">
          <div className="detail-item">
            <span>当前确认数:</span>
            <span className="confirmations">
              {currentConfirmations}
            </span>
          </div>
          <div className="detail-item">
            <span>目标确认数:</span>
            <span>{targetConfirmations}</span>
          </div>
          <div className="detail-item">
            <span>安全级别:</span>
            <span className={`security-level level-${Math.floor(currentConfirmations / 3)}`}>
              {getSecurityLevel(currentConfirmations)}
            </span>
          </div>
          <div className="detail-item">
            <span>预计完成:</span>
            <span>
              {currentConfirmations >= targetConfirmations 
                ? '已完成' 
                : `约 ${(targetConfirmations - currentConfirmations) * 12} 秒`
              }
            </span>
          </div>
        </div>
      </div>

      <div className="confirmation-timeline">
        <h4>确认时间线</h4>
        <div className="timeline">
          {Array.from({ length: targetConfirmations }, (_, i) => (
            <div 
              key={i}
              className={`timeline-step ${
                i < currentConfirmations ? 'completed' : 'pending'
              }`}
            >
              <div className="step-number">{i + 1}</div>
              <div className="step-status">
                {i < currentConfirmations ? '✅' : '⏳'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading && !receipt && (
        <div className="waiting-status">
          <div className="spinner"></div>
          <span>等待交易上链...</span>
        </div>
      )}

      {currentConfirmations >= targetConfirmations && (
        <div className="completion-status">
          <div className="success-icon">🎉</div>
          <div className="success-text">
            交易已获得 {targetConfirmations} 个确认，安全级别: {getSecurityLevel(currentConfirmations)}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 网络拥堵检测

```tsx
import { useWaitForTransaction, useFeeData, useBlockNumber } from 'wagmi'
import { useState, useEffect } from 'react'

function NetworkCongestionDetector({ txHash }: { txHash: string }) {
  const [congestionLevel, setCongestionLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [estimatedTime, setEstimatedTime] = useState<number>(0)

  const { data: feeData } = useFeeData({
    watch: true,
  })

  const { data: currentBlock } = useBlockNumber({
    watch: true,
  })

  const { 
    data: receipt, 
    isLoading, 
    isSuccess,
    error 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    timeout: 600_000, // 10分钟超时
  })

  // 检测网络拥堵程度
  useEffect(() => {
    if (feeData?.gasPrice) {
      const gasPriceGwei = Number(feeData.gasPrice) / 1e9
      
      if (gasPriceGwei > 100) {
        setCongestionLevel('high')
        setEstimatedTime(300) // 5分钟
      } else if (gasPriceGwei > 50) {
        setCongestionLevel('medium')
        setEstimatedTime(120) // 2分钟
      } else {
        setCongestionLevel('low')
        setEstimatedTime(60) // 1分钟
      }
    }
  }, [feeData])

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getCongestionText = (level: string) => {
    switch (level) {
      case 'high': return '网络拥堵严重'
      case 'medium': return '网络中等拥堵'
      case 'low': return '网络畅通'
      default: return '检测中...'
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  return (
    <div className="network-congestion-detector">
      <h3>网络拥堵检测</h3>
      
      <div className="congestion-status">
        <div 
          className="congestion-indicator"
          style={{ backgroundColor: getCongestionColor(congestionLevel) }}
        >
          <div className="congestion-level">
            {getCongestionText(congestionLevel)}
          </div>
          <div className="gas-price">
            当前 Gas: {feeData?.gasPrice ? 
              `${(Number(feeData.gasPrice) / 1e9).toFixed(1)} Gwei` : 
              '获取中...'
            }
          </div>
        </div>
      </div>

      <div className="time-estimation">
        <h4>预计确认时间</h4>
        <div className="time-info">
          <div className="estimated-time">
            {formatTime(estimatedTime)}
          </div>
          <div className="time-note">
            基于当前网络状况估算
          </div>
        </div>
      </div>

      <div className="transaction-status">
        {isLoading && (
          <div className="waiting">
            <div className="spinner"></div>
            <div className="status-text">
              等待确认中... 
              {congestionLevel === 'high' && (
                <span className="warning">
                  (网络拥堵，可能需要更长时间)
                </span>
              )}
            </div>
          </div>
        )}

        {isSuccess && receipt && (
          <div className="success">
            <div className="success-icon">✅</div>
            <div className="success-text">
              交易已确认！区块号: {receipt.blockNumber}
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            <div className="error-icon">❌</div>
            <div className="error-text">
              确认超时: {error.message}
              {congestionLevel === 'high' && (
                <div className="suggestion">
                  建议: 网络拥堵时可以提高 Gas 价格或稍后重试
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="network-tips">
        <h4>网络状况建议</h4>
        <div className="tips-list">
          {congestionLevel === 'high' && (
            <>
              <div className="tip warning">
                ⚠️ 网络严重拥堵，建议提高 Gas 价格或等待网络恢复
              </div>
              <div className="tip">
                💡 可以考虑在非高峰时段进行交易
              </div>
            </>
          )}
          {congestionLevel === 'medium' && (
            <div className="tip info">
              ℹ️ 网络中等拥堵，交易可能需要稍长时间确认
            </div>
          )}
          {congestionLevel === 'low' && (
            <div className="tip success">
              ✅ 网络畅通，交易应该很快确认
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

## 最佳实践

### 1. 合理设置确认数

```tsx
function OptimalConfirmations({ txHash, transactionValue }: { 
  txHash: string
  transactionValue: bigint 
}) {
  // 根据交易价值动态设置确认数
  const getOptimalConfirmations = (value: bigint) => {
    const ethValue = Number(value) / 1e18
    
    if (ethValue < 0.1) return 1      // 小额交易
    if (ethValue < 1) return 3        // 中等交易
    if (ethValue < 10) return 6       // 大额交易
    return 12                         // 超大额交易
  }

  const confirmations = getOptimalConfirmations(transactionValue)

  const { data: receipt, isLoading } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    confirmations,
    timeout: confirmations * 60_000, // 每个确认1分钟超时
  })

  return (
    <div>
      <p>交易价值: {(Number(transactionValue) / 1e18).toFixed(4)} ETH</p>
      <p>建议确认数: {confirmations}</p>
      {isLoading && <p>等待 {confirmations} 个确认...</p>}
      {receipt && <p>✅ 已获得足够确认</p>}
    </div>
  )
}
```

### 2. 错误处理和重试

```tsx
function RobustConfirmation({ txHash }: { txHash: string }) {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const { 
    data: receipt, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    timeout: 180_000, // 3分钟超时
    retry: (failureCount, error) => {
      // 自定义重试逻辑
      if (failureCount < maxRetries) {
        console.log(`重试第 ${failureCount + 1} 次:`, error)
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const handleManualRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      refetch()
    }
  }

  return (
    <div>
      {isLoading && <div>⏳ 等待确认中...</div>}
      {isError && (
        <div>
          <div>❌ 确认失败: {error?.message}</div>
          {retryCount < maxRetries && (
            <button onClick={handleManualRetry}>
              重试 ({retryCount}/{maxRetries})
            </button>
          )}
        </div>
      )}
      {receipt && <div>✅ 交易已确认</div>}
    </div>
  )
}
```

### 3. 用户体验优化

```tsx
function UserFriendlyConfirmation({ txHash }: { txHash: string }) {
  const [startTime] = useState(Date.now())
  const [showDetails, setShowDetails] = useState(false)

  const { 
    data: receipt, 
    isLoading, 
    isSuccess, 
    isError 
  } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    onSuccess: () => {
      // 成功时的用户反馈
      if ('Notification' in window) {
        new Notification('交易确认成功！', {
          body: '您的交易已成功确认',
          icon: '/success-icon.png'
        })
      }
    },
  })

  const getElapsedTime = () => {
    return Math.floor((Date.now() - startTime) / 1000)
  }

  return (
    <div className="user-friendly-confirmation">
      <div className="status-header">
        {isLoading && (
          <div className="loading-status">
            <div className="pulse-animation">⏳</div>
            <div>
              <div className="main-text">正在确认交易...</div>
              <div className="sub-text">
                已等待 {getElapsedTime()} 秒
              </div>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="success-status">
            <div className="success-animation">🎉</div>
            <div>
              <div className="main-text">交易确认成功！</div>
              <div className="sub-text">
                耗时 {getElapsedTime()} 秒
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="error-status">
            <div className="error-animation">⚠️</div>
            <div>
              <div className="main-text">确认超时</div>
              <div className="sub-text">
                请检查网络状况或稍后重试
              </div>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="toggle-details"
      >
        {showDetails ? '隐藏' : '显示'}详情
      </button>

      {showDetails && receipt && (
        <div className="transaction-details">
          <div className="detail-item">
            <span>区块号:</span>
            <span>{receipt.blockNumber}</span>
          </div>
          <div className="detail-item">
            <span>Gas 使用:</span>
            <span>{receipt.gasUsed.toString()}</span>
          </div>
          <div className="detail-item">
            <span>交易状态:</span>
            <span>{receipt.status}</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 如何处理长时间未确认的交易？
A: 设置合理的超时时间，提供重试机制，或建议用户提高 Gas 价格。

### Q: 确认数设置多少合适？
A: 根据交易价值决定：小额1个，中等3个，大额6-12个确认。

### Q: 如何检测交易被替换？
A: 使用 `onReplaced` 回调监听交易替换事件。

### Q: 网络拥堵时如何优化用户体验？
A: 显示网络状况，提供时间估算，允许用户调整 Gas 价格。

## 下一步

- [useSendTransaction](/wagmi/hooks/transactions/use-send-transaction) - 学习发送交易
- [useTransaction](/wagmi/hooks/transactions/use-transaction) - 学习获取交易详情
- [useTransactionReceipt](/wagmi/hooks/transactions/use-transaction-receipt) - 学习获取交易收据
