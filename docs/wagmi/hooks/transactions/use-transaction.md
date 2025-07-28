---
title: useTransaction
description: 获取交易详情的 React Hook
keywords: [wagmi, useTransaction, 交易详情, 交易查询, 区块链查询, React Hook, Web3]
---

# useTransaction

`useTransaction` 用于根据交易哈希获取交易的详细信息，包括交易参数、状态和元数据。

## 基本用法

```tsx
import { useTransaction } from 'wagmi'

function TransactionDetails({ txHash }: { txHash: string }) {
  const { data: transaction, isLoading, error } = useTransaction({
    hash: txHash as `0x${string}`,
  })

  if (isLoading) return <div>加载交易信息中...</div>
  if (error) return <div>获取交易失败: {error.message}</div>
  if (!transaction) return <div>交易不存在</div>

  return (
    <div>
      <h3>交易详情</h3>
      <p>发送者: {transaction.from}</p>
      <p>接收者: {transaction.to}</p>
      <p>金额: {transaction.value.toString()} wei</p>
      <p>Gas 限制: {transaction.gas.toString()}</p>
      <p>Gas 价格: {transaction.gasPrice?.toString()} wei</p>
    </div>
  )
}
```

## 参数配置

### 基本参数
- `hash` - 交易哈希（必需）
- `chainId` - 指定链 ID
- `enabled` - 是否启用查询

### 缓存参数
- `cacheTime` - 缓存时间
- `staleTime` - 数据过期时间
- `refetchInterval` - 自动刷新间隔

## 返回值

- `data` - 交易详情对象
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isSuccess` - 是否成功获取
- `isError` - 是否有错误
- `refetch` - 手动刷新函数

## 详细示例

### 完整交易信息展示

```tsx
import { useTransaction, useTransactionReceipt } from 'wagmi'
import { formatEther, formatGwei } from 'viem'
import { useState } from 'react'

function ComprehensiveTransactionView() {
  const [txHash, setTxHash] = useState('')

  const { 
    data: transaction, 
    isLoading: txLoading, 
    error: txError 
  } = useTransaction({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const { 
    data: receipt, 
    isLoading: receiptLoading 
  } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getTransactionStatus = () => {
    if (!transaction) return '未知'
    if (!receipt) return '待确认'
    return receipt.status === 'success' ? '成功' : '失败'
  }

  const calculateTransactionFee = () => {
    if (!receipt || !transaction) return '0'
    
    const gasUsed = receipt.gasUsed
    const gasPrice = transaction.gasPrice || receipt.effectiveGasPrice || 0n
    const fee = gasUsed * gasPrice
    
    return formatEther(fee)
  }

  return (
    <div className="comprehensive-transaction-view">
      <h3>交易查询器</h3>
      
      <div className="search-section">
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="输入交易哈希 (0x...)"
          className="hash-input"
        />
        <button 
          onClick={() => setTxHash('')}
          disabled={!txHash}
        >
          清除
        </button>
      </div>

      {txLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>查询交易信息中...</span>
        </div>
      )}

      {txError && (
        <div className="error">
          查询失败: {txError.message}
        </div>
      )}

      {transaction && (
        <div className="transaction-details">
          <div className="detail-section">
            <h4>基本信息</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">交易哈希:</span>
                <span className="value hash">{transaction.hash}</span>
              </div>
              <div className="detail-item">
                <span className="label">状态:</span>
                <span className={`value status ${getTransactionStatus().toLowerCase()}`}>
                  {getTransactionStatus()}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">区块号:</span>
                <span className="value">
                  {transaction.blockNumber ? 
                    transaction.blockNumber.toString() : 
                    '待确认'
                  }
                </span>
              </div>
              <div className="detail-item">
                <span className="label">区块位置:</span>
                <span className="value">
                  {transaction.transactionIndex !== undefined ? 
                    transaction.transactionIndex.toString() : 
                    '-'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>地址信息</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">发送者:</span>
                <span className="value address">{transaction.from}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(transaction.from)}
                  className="copy-btn"
                >
                  复制
                </button>
              </div>
              <div className="detail-item">
                <span className="label">接收者:</span>
                <span className="value address">
                  {transaction.to || '合约创建'}
                </span>
                {transaction.to && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(transaction.to!)}
                    className="copy-btn"
                  >
                    复制
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>金额和费用</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">转账金额:</span>
                <span className="value amount">
                  {formatEther(transaction.value)} ETH
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Gas 限制:</span>
                <span className="value">{transaction.gas.toString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Gas 价格:</span>
                <span className="value">
                  {transaction.gasPrice ? 
                    `${formatGwei(transaction.gasPrice)} Gwei` : 
                    'EIP-1559'
                  }
                </span>
              </div>
              {receipt && (
                <div className="detail-item">
                  <span className="label">实际费用:</span>
                  <span className="value fee">
                    {calculateTransactionFee()} ETH
                  </span>
                </div>
              )}
            </div>
          </div>

          {transaction.maxFeePerGas && (
            <div className="detail-section">
              <h4>EIP-1559 费用</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">最大费用:</span>
                  <span className="value">
                    {formatGwei(transaction.maxFeePerGas)} Gwei
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">优先费用:</span>
                  <span className="value">
                    {transaction.maxPriorityFeePerGas ? 
                      formatGwei(transaction.maxPriorityFeePerGas) + ' Gwei' : 
                      '-'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>其他信息</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Nonce:</span>
                <span className="value">{transaction.nonce}</span>
              </div>
              <div className="detail-item">
                <span className="label">数据大小:</span>
                <span className="value">
                  {transaction.input ? 
                    `${(transaction.input.length - 2) / 2} bytes` : 
                    '0 bytes'
                  }
                </span>
              </div>
              <div className="detail-item">
                <span className="label">链 ID:</span>
                <span className="value">{transaction.chainId || '-'}</span>
              </div>
            </div>
          </div>

          {transaction.input && transaction.input !== '0x' && (
            <div className="detail-section">
              <h4>输入数据</h4>
              <div className="input-data">
                <textarea
                  value={transaction.input}
                  readOnly
                  rows={6}
                  className="data-textarea"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(transaction.input)}
                  className="copy-btn"
                >
                  复制数据
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {receiptLoading && transaction && (
        <div className="receipt-loading">
          <div className="spinner"></div>
          <span>获取交易收据中...</span>
        </div>
      )}
    </div>
  )
}
```

### 交易历史记录

```tsx
import { useTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

interface TransactionHistory {
  hash: string
  timestamp: number
  description?: string
}

function TransactionHistoryViewer() {
  const [history, setHistory] = useState<TransactionHistory[]>([])
  const [selectedTx, setSelectedTx] = useState<string | null>(null)

  const { data: transaction } = useTransaction({
    hash: selectedTx as `0x${string}`,
    enabled: !!selectedTx,
  })

  // 从本地存储加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('tx-history')
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  const addToHistory = (hash: string, description?: string) => {
    const newEntry: TransactionHistory = {
      hash,
      timestamp: Date.now(),
      description,
    }
    
    const updated = [newEntry, ...history.slice(0, 19)] // 保留最近20条
    setHistory(updated)
    localStorage.setItem('tx-history', JSON.stringify(updated))
  }

  const removeFromHistory = (hash: string) => {
    const updated = history.filter(tx => tx.hash !== hash)
    setHistory(updated)
    localStorage.setItem('tx-history', JSON.stringify(updated))
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="transaction-history-viewer">
      <h3>交易历史记录</h3>
      
      <div className="add-transaction">
        <input
          type="text"
          placeholder="输入交易哈希"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const hash = (e.target as HTMLInputElement).value.trim()
              if (hash) {
                addToHistory(hash)
                ;(e.target as HTMLInputElement).value = ''
              }
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.querySelector('.add-transaction input') as HTMLInputElement
            const hash = input.value.trim()
            if (hash) {
              addToHistory(hash)
              input.value = ''
            }
          }}
        >
          添加
        </button>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state">
            <p>暂无交易记录</p>
            <p>输入交易哈希开始查看历史</p>
          </div>
        ) : (
          history.map((tx) => (
            <div 
              key={tx.hash}
              className={`history-item ${selectedTx === tx.hash ? 'selected' : ''}`}
              onClick={() => setSelectedTx(tx.hash)}
            >
              <div className="tx-info">
                <div className="tx-hash">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </div>
                <div className="tx-time">
                  {formatTimestamp(tx.timestamp)}
                </div>
                {tx.description && (
                  <div className="tx-description">{tx.description}</div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFromHistory(tx.hash)
                }}
                className="remove-btn"
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>

      {selectedTx && transaction && (
        <div className="selected-transaction">
          <h4>交易详情</h4>
          <div className="quick-details">
            <div className="detail">
              <span>发送者:</span>
              <span>{transaction.from.slice(0, 10)}...{transaction.from.slice(-8)}</span>
            </div>
            <div className="detail">
              <span>接收者:</span>
              <span>
                {transaction.to ? 
                  `${transaction.to.slice(0, 10)}...${transaction.to.slice(-8)}` : 
                  '合约创建'
                }
              </span>
            </div>
            <div className="detail">
              <span>金额:</span>
              <span>{formatEther(transaction.value)} ETH</span>
            </div>
            <div className="detail">
              <span>状态:</span>
              <span>
                {transaction.blockNumber ? '已确认' : '待确认'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 交易比较工具

```tsx
import { useTransaction } from 'wagmi'
import { useState } from 'react'
import { formatEther, formatGwei } from 'viem'

function TransactionComparison() {
  const [txHash1, setTxHash1] = useState('')
  const [txHash2, setTxHash2] = useState('')

  const { data: tx1 } = useTransaction({
    hash: txHash1 as `0x${string}`,
    enabled: !!txHash1,
  })

  const { data: tx2 } = useTransaction({
    hash: txHash2 as `0x${string}`,
    enabled: !!txHash2,
  })

  const compareField = (field: string, value1: any, value2: any) => {
    const isDifferent = value1 !== value2
    
    return (
      <div className={`comparison-row ${isDifferent ? 'different' : 'same'}`}>
        <div className="field-name">{field}</div>
        <div className="value1">{value1}</div>
        <div className="value2">{value2}</div>
        <div className="diff-indicator">
          {isDifferent ? '≠' : '='}
        </div>
      </div>
    )
  }

  const formatValue = (value: any, type: string) => {
    if (!value) return '-'
    
    switch (type) {
      case 'ether':
        return formatEther(value) + ' ETH'
      case 'gwei':
        return formatGwei(value) + ' Gwei'
      case 'address':
        return `${value.slice(0, 10)}...${value.slice(-8)}`
      case 'bigint':
        return value.toString()
      default:
        return value.toString()
    }
  }

  return (
    <div className="transaction-comparison">
      <h3>交易对比工具</h3>
      
      <div className="input-section">
        <div className="input-group">
          <label>交易 1:</label>
          <input
            type="text"
            value={txHash1}
            onChange={(e) => setTxHash1(e.target.value)}
            placeholder="输入第一个交易哈希"
          />
        </div>
        <div className="input-group">
          <label>交易 2:</label>
          <input
            type="text"
            value={txHash2}
            onChange={(e) => setTxHash2(e.target.value)}
            placeholder="输入第二个交易哈希"
          />
        </div>
      </div>

      {tx1 && tx2 && (
        <div className="comparison-table">
          <div className="table-header">
            <div className="field-name">字段</div>
            <div className="value1">交易 1</div>
            <div className="value2">交易 2</div>
            <div className="diff-indicator">差异</div>
          </div>

          {compareField(
            '发送者',
            formatValue(tx1.from, 'address'),
            formatValue(tx2.from, 'address')
          )}

          {compareField(
            '接收者',
            formatValue(tx1.to, 'address'),
            formatValue(tx2.to, 'address')
          )}

          {compareField(
            '金额',
            formatValue(tx1.value, 'ether'),
            formatValue(tx2.value, 'ether')
          )}

          {compareField(
            'Gas 限制',
            formatValue(tx1.gas, 'bigint'),
            formatValue(tx2.gas, 'bigint')
          )}

          {compareField(
            'Gas 价格',
            formatValue(tx1.gasPrice, 'gwei'),
            formatValue(tx2.gasPrice, 'gwei')
          )}

          {compareField(
            'Nonce',
            formatValue(tx1.nonce, 'bigint'),
            formatValue(tx2.nonce, 'bigint')
          )}

          {compareField(
            '区块号',
            formatValue(tx1.blockNumber, 'bigint'),
            formatValue(tx2.blockNumber, 'bigint')
          )}

          {compareField(
            '链 ID',
            formatValue(tx1.chainId, 'bigint'),
            formatValue(tx2.chainId, 'bigint')
          )}

          {(tx1.maxFeePerGas || tx2.maxFeePerGas) && compareField(
            '最大费用',
            formatValue(tx1.maxFeePerGas, 'gwei'),
            formatValue(tx2.maxFeePerGas, 'gwei')
          )}

          {(tx1.maxPriorityFeePerGas || tx2.maxPriorityFeePerGas) && compareField(
            '优先费用',
            formatValue(tx1.maxPriorityFeePerGas, 'gwei'),
            formatValue(tx2.maxPriorityFeePerGas, 'gwei')
          )}
        </div>
      )}

      {(tx1 || tx2) && !(tx1 && tx2) && (
        <div className="partial-data">
          <p>请输入两个交易哈希进行对比</p>
        </div>
      )}
    </div>
  )
}
```

## 高级用法

### 实时交易监控

```tsx
import { useTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

function RealTimeTransactionMonitor() {
  const [monitoredTxs, setMonitoredTxs] = useState<string[]>([])
  const [newTxHash, setNewTxHash] = useState('')

  // 为每个监控的交易创建 hook
  const transactionData = monitoredTxs.map(hash => ({
    hash,
    ...useTransaction({
      hash: hash as `0x${string}`,
      refetchInterval: 5000, // 每5秒刷新一次
    })
  }))

  const addTransaction = () => {
    if (newTxHash && !monitoredTxs.includes(newTxHash)) {
      setMonitoredTxs(prev => [...prev, newTxHash])
      setNewTxHash('')
    }
  }

  const removeTransaction = (hash: string) => {
    setMonitoredTxs(prev => prev.filter(tx => tx !== hash))
  }

  return (
    <div className="real-time-monitor">
      <h3>实时交易监控</h3>
      
      <div className="add-monitor">
        <input
          type="text"
          value={newTxHash}
          onChange={(e) => setNewTxHash(e.target.value)}
          placeholder="输入要监控的交易哈希"
        />
        <button onClick={addTransaction}>添加监控</button>
      </div>

      <div className="monitored-transactions">
        {transactionData.map(({ hash, data, isLoading, error }) => (
          <div key={hash} className="monitor-item">
            <div className="monitor-header">
              <span className="tx-hash">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </span>
              <button onClick={() => removeTransaction(hash)}>
                停止监控
              </button>
            </div>
            
            <div className="monitor-status">
              {isLoading && <span className="loading">🔄 更新中...</span>}
              {error && <span className="error">❌ 错误: {error.message}</span>}
              {data && (
                <div className="tx-status">
                  <span className={`status ${data.blockNumber ? 'confirmed' : 'pending'}`}>
                    {data.blockNumber ? '✅ 已确认' : '⏳ 待确认'}
                  </span>
                  {data.blockNumber && (
                    <span className="block-number">
                      区块: {data.blockNumber.toString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {monitoredTxs.length === 0 && (
        <div className="empty-monitor">
          <p>暂无监控的交易</p>
          <p>添加交易哈希开始实时监控</p>
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 如何处理不存在的交易？
A: 检查 `error` 状态，通常会返回 "transaction not found" 错误。

### Q: 交易数据什么时候会更新？
A: 交易一旦上链就不会改变，但确认状态可能会更新。

### Q: 如何获取交易的确认数？
A: 使用当前区块号减去交易所在区块号。

### Q: 为什么有些字段是 undefined？
A: 某些字段（如 EIP-1559 相关）只在特定类型的交易中存在。

## 下一步

- [useTransactionReceipt](/wagmi/hooks/transactions/use-transaction-receipt) - 学习获取交易收据
- [useWaitForTransaction](/wagmi/hooks/transactions/use-wait-for-transaction) - 学习等待交易确认
- [useBlockNumber](/wagmi/hooks/network/use-block-number) - 学习获取区块信息