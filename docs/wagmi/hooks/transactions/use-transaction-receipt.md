---
title: useTransactionReceipt
description: 获取交易收据的 React Hook
keywords: [wagmi, useTransactionReceipt, 交易收据, 交易结果, Gas使用, 事件日志, React Hook, Web3]
---

# useTransactionReceipt

`useTransactionReceipt` 用于获取已确认交易的收据信息，包括执行结果、Gas 使用情况、事件日志等详细数据。

## 基本用法

```tsx
import { useTransactionReceipt } from 'wagmi'

function TransactionReceipt({ txHash }: { txHash: string }) {
  const { data: receipt, isLoading, error } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
  })

  if (isLoading) return <div>获取收据中...</div>
  if (error) return <div>获取失败: {error.message}</div>
  if (!receipt) return <div>交易未确认</div>

  return (
    <div>
      <h3>交易收据</h3>
      <p>状态: {receipt.status === 'success' ? '成功' : '失败'}</p>
      <p>区块号: {receipt.blockNumber}</p>
      <p>Gas 使用: {receipt.gasUsed.toString()}</p>
      <p>事件数量: {receipt.logs.length}</p>
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

- `data` - 交易收据对象
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isSuccess` - 是否成功获取
- `isError` - 是否有错误
- `refetch` - 手动刷新函数

## 详细示例

### 完整收据信息展示

```tsx
import { useTransactionReceipt, useTransaction } from 'wagmi'
import { formatEther, formatGwei } from 'viem'
import { useState } from 'react'

function ComprehensiveReceiptView() {
  const [txHash, setTxHash] = useState('')

  const { data: transaction } = useTransaction({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const { 
    data: receipt, 
    isLoading, 
    error 
  } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const calculateEfficiency = () => {
    if (!transaction || !receipt) return null
    
    const gasLimit = transaction.gas
    const gasUsed = receipt.gasUsed
    const efficiency = (Number(gasUsed) / Number(gasLimit)) * 100
    
    return efficiency.toFixed(2)
  }

  const calculateTotalCost = () => {
    if (!receipt) return '0'
    
    const gasUsed = receipt.gasUsed
    const gasPrice = receipt.effectiveGasPrice || 0n
    const totalCost = gasUsed * gasPrice
    
    return formatEther(totalCost)
  }

  const getStatusColor = (status: string) => {
    return status === 'success' ? '#10b981' : '#ef4444'
  }

  return (
    <div className="comprehensive-receipt-view">
      <h3>交易收据查询</h3>
      
      <div className="search-section">
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="输入交易哈希"
          className="hash-input"
        />
      </div>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>获取交易收据中...</span>
        </div>
      )}

      {error && (
        <div className="error">
          获取失败: {error.message}
        </div>
      )}

      {receipt && (
        <div className="receipt-details">
          <div className="status-section">
            <h4>执行状态</h4>
            <div className="status-indicator">
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(receipt.status) }}
              >
                {receipt.status === 'success' ? '✅ 执行成功' : '❌ 执行失败'}
              </div>
              {receipt.status === 'reverted' && (
                <div className="revert-reason">
                  交易被回滚
                </div>
              )}
            </div>
          </div>

          <div className="block-section">
            <h4>区块信息</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">区块号:</span>
                <span className="value">{receipt.blockNumber.toString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">区块哈希:</span>
                <span className="value hash">{receipt.blockHash}</span>
              </div>
              <div className="detail-item">
                <span className="label">交易索引:</span>
                <span className="value">{receipt.transactionIndex}</span>
              </div>
            </div>
          </div>

          <div className="gas-section">
            <h4>Gas 使用情况</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Gas 使用:</span>
                <span className="value">{receipt.gasUsed.toString()}</span>
              </div>
              {transaction && (
                <div className="detail-item">
                  <span className="label">Gas 限制:</span>
                  <span className="value">{transaction.gas.toString()}</span>
                </div>
              )}
              {calculateEfficiency() && (
                <div className="detail-item">
                  <span className="label">使用效率:</span>
                  <span className="value">{calculateEfficiency()}%</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">有效 Gas 价格:</span>
                <span className="value">
                  {receipt.effectiveGasPrice ? 
                    formatGwei(receipt.effectiveGasPrice) + ' Gwei' : 
                    '-'
                  }
                </span>
              </div>
              <div className="detail-item">
                <span className="label">总费用:</span>
                <span className="value fee">{calculateTotalCost()} ETH</span>
              </div>
            </div>
          </div>

          <div className="logs-section">
            <h4>事件日志 ({receipt.logs.length})</h4>
            {receipt.logs.length === 0 ? (
              <div className="no-logs">此交易未产生任何事件日志</div>
            ) : (
              <div className="logs-list">
                {receipt.logs.map((log, index) => (
                  <div key={index} className="log-item">
                    <div className="log-header">
                      <span className="log-index">日志 #{index}</span>
                      <span className="log-address">
                        合约: {log.address.slice(0, 10)}...{log.address.slice(-8)}
                      </span>
                    </div>
                    <div className="log-details">
                      <div className="log-topics">
                        <strong>主题:</strong>
                        {log.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="topic">
                            {topicIndex}: {topic}
                          </div>
                        ))}
                      </div>
                      {log.data && log.data !== '0x' && (
                        <div className="log-data">
                          <strong>数据:</strong>
                          <div className="data-content">{log.data}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {receipt.contractAddress && (
            <div className="contract-section">
              <h4>合约创建</h4>
              <div className="detail-item">
                <span className="label">新合约地址:</span>
                <span className="value address">{receipt.contractAddress}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(receipt.contractAddress!)}
                  className="copy-btn"
                >
                  复制
                </button>
              </div>
            </div>
          )}

          <div className="raw-section">
            <h4>原始数据</h4>
            <details>
              <summary>查看完整收据数据</summary>
              <pre className="raw-data">
                {JSON.stringify(receipt, (key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2
                )}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 事件日志解析器

```tsx
import { useTransactionReceipt } from 'wagmi'
import { decodeEventLog } from 'viem'
import { useState } from 'react'

// 常见的 ERC-20 事件 ABI
const ERC20_EVENTS = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

function EventLogParser({ txHash }: { txHash: string }) {
  const [selectedABI, setSelectedABI] = useState<any[]>(ERC20_EVENTS)
  const [customABI, setCustomABI] = useState('')

  const { data: receipt } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const parseLog = (log: any) => {
    try {
      const decoded = decodeEventLog({
        abi: selectedABI,
        data: log.data,
        topics: log.topics,
      })
      return decoded
    } catch (error) {
      return null
    }
  }

  const formatEventValue = (value: any, type: string) => {
    if (typeof value === 'bigint') {
      if (type.includes('uint') && type.includes('256')) {
        // 可能是代币数量，尝试格式化
        return `${value.toString()} (${(Number(value) / 1e18).toFixed(6)} tokens)`
      }
      return value.toString()
    }
    return value
  }

  const loadCustomABI = () => {
    try {
      const abi = JSON.parse(customABI)
      setSelectedABI(abi)
    } catch (error) {
      alert('ABI 格式错误')
    }
  }

  return (
    <div className="event-log-parser">
      <h3>事件日志解析器</h3>
      
      <div className="abi-selector">
        <div className="preset-abis">
          <button 
            onClick={() => setSelectedABI(ERC20_EVENTS)}
            className={selectedABI === ERC20_EVENTS ? 'active' : ''}
          >
            ERC-20 事件
          </button>
        </div>
        
        <div className="custom-abi">
          <textarea
            value={customABI}
            onChange={(e) => setCustomABI(e.target.value)}
            placeholder="输入自定义 ABI JSON..."
            rows={4}
          />
          <button onClick={loadCustomABI}>加载自定义 ABI</button>
        </div>
      </div>

      {receipt && (
        <div className="parsed-logs">
          <h4>解析结果</h4>
          {receipt.logs.length === 0 ? (
            <div className="no-logs">此交易没有事件日志</div>
          ) : (
            receipt.logs.map((log, index) => {
              const parsed = parseLog(log)
              
              return (
                <div key={index} className="log-entry">
                  <div className="log-header">
                    <span className="log-index">日志 #{index}</span>
                    <span className="contract-address">
                      {log.address.slice(0, 10)}...{log.address.slice(-8)}
                    </span>
                  </div>
                  
                  {parsed ? (
                    <div className="parsed-content">
                      <div className="event-name">
                        事件: <strong>{parsed.eventName}</strong>
                      </div>
                      <div className="event-args">
                        {Object.entries(parsed.args).map(([key, value]) => (
                          <div key={key} className="arg-item">
                            <span className="arg-name">{key}:</span>
                            <span className="arg-value">
                              {formatEventValue(value, 'unknown')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="unparsed-content">
                      <div className="unparsed-notice">
                        无法解析此日志（可能需要不同的 ABI）
                      </div>
                      <div className="raw-log">
                        <div>主题: {log.topics.join(', ')}</div>
                        <div>数据: {log.data}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
```

### Gas 分析工具

```tsx
import { useTransactionReceipt, useTransaction } from 'wagmi'
import { formatEther, formatGwei } from 'viem'
import { useState, useMemo } from 'react'

function GasAnalyzer({ txHash }: { txHash: string }) {
  const { data: transaction } = useTransaction({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const { data: receipt } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  })

  const gasAnalysis = useMemo(() => {
    if (!transaction || !receipt) return null

    const gasLimit = transaction.gas
    const gasUsed = receipt.gasUsed
    const gasPrice = receipt.effectiveGasPrice || transaction.gasPrice || 0n
    
    const efficiency = (Number(gasUsed) / Number(gasLimit)) * 100
    const wastedGas = gasLimit - gasUsed
    const totalCost = gasUsed * gasPrice
    const wastedCost = wastedGas * gasPrice

    return {
      gasLimit: Number(gasLimit),
      gasUsed: Number(gasUsed),
      wastedGas: Number(wastedGas),
      efficiency,
      gasPrice: Number(gasPrice),
      totalCost: Number(totalCost),
      wastedCost: Number(wastedCost),
    }
  }, [transaction, receipt])

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#10b981' // 绿色
    if (efficiency >= 70) return '#f59e0b' // 黄色
    return '#ef4444' // 红色
  }

  const getEfficiencyLabel = (efficiency: number) => {
    if (efficiency >= 90) return '优秀'
    if (efficiency >= 70) return '良好'
    if (efficiency >= 50) return '一般'
    return '较差'
  }

  return (
    <div className="gas-analyzer">
      <h3>Gas 使用分析</h3>
      
      {gasAnalysis && (
        <div className="analysis-results">
          <div className="efficiency-overview">
            <div className="efficiency-circle">
              <div 
                className="efficiency-fill"
                style={{ 
                  background: `conic-gradient(${getEfficiencyColor(gasAnalysis.efficiency)} ${gasAnalysis.efficiency * 3.6}deg, #e5e7eb 0deg)`
                }}
              >
                <div className="efficiency-text">
                  <div className="percentage">{gasAnalysis.efficiency.toFixed(1)}%</div>
                  <div className="label">{getEfficiencyLabel(gasAnalysis.efficiency)}</div>
                </div>
              </div>
            </div>
            
            <div className="efficiency-details">
              <h4>Gas 效率分析</h4>
              <div className="detail-item">
                <span>Gas 限制:</span>
                <span>{gasAnalysis.gasLimit.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>实际使用:</span>
                <span>{gasAnalysis.gasUsed.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>浪费 Gas:</span>
                <span className="waste">{gasAnalysis.wastedGas.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="cost-breakdown">
            <h4>费用分析</h4>
            <div className="cost-grid">
              <div className="cost-item">
                <div className="cost-label">Gas 价格</div>
                <div className="cost-value">
                  {formatGwei(BigInt(gasAnalysis.gasPrice))} Gwei
                </div>
              </div>
              <div className="cost-item">
                <div className="cost-label">实际费用</div>
                <div className="cost-value">
                  {formatEther(BigInt(gasAnalysis.totalCost))} ETH
                </div>
              </div>
              <div className="cost-item">
                <div className="cost-label">浪费费用</div>
                <div className="cost-value waste">
                  {formatEther(BigInt(gasAnalysis.wastedCost))} ETH
                </div>
              </div>
              <div className="cost-item">
                <div className="cost-label">节省潜力</div>
                <div className="cost-value">
                  {((gasAnalysis.wastedCost / gasAnalysis.totalCost) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="optimization-tips">
            <h4>优化建议</h4>
            <div className="tips-list">
              {gasAnalysis.efficiency < 70 && (
                <div className="tip warning">
                  ⚠️ Gas 使用效率较低，建议优化合约代码或调整 Gas 限制
                </div>
              )}
              {gasAnalysis.wastedGas > 50000 && (
                <div className="tip info">
                  💡 浪费了较多 Gas，可以降低 Gas 限制以节省费用
                </div>
              )}
              {gasAnalysis.efficiency > 95 && (
                <div className="tip success">
                  ✅ Gas 使用效率很高，但可能存在 Gas 不足的风险
                </div>
              )}
              <div className="tip general">
                📊 建议 Gas 使用率保持在 80-95% 之间以获得最佳平衡
              </div>
            </div>
          </div>

          <div className="visual-breakdown">
            <h4>Gas 使用可视化</h4>
            <div className="gas-bar">
              <div 
                className="used-portion"
                style={{ width: `${gasAnalysis.efficiency}%` }}
              >
                已使用 ({gasAnalysis.efficiency.toFixed(1)}%)
              </div>
              <div 
                className="unused-portion"
                style={{ width: `${100 - gasAnalysis.efficiency}%` }}
              >
                未使用 ({(100 - gasAnalysis.efficiency).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {!gasAnalysis && transaction && receipt && (
        <div className="loading">
          <div className="spinner"></div>
          <span>分析 Gas 使用情况...</span>
        </div>
      )}
    </div>
  )
}
```

### 收据批量查询

```tsx
import { useTransactionReceipt } from 'wagmi'
import { useState } from 'react'

interface BatchReceiptQuery {
  hash: string
  status: 'pending' | 'success' | 'error'
  receipt?: any
  error?: string
}

function BatchReceiptQuery() {
  const [queries, setQueries] = useState<BatchReceiptQuery[]>([])
  const [inputHashes, setInputHashes] = useState('')

  // 为每个查询创建 hook
  const receiptHooks = queries.map(query => ({
    hash: query.hash,
    ...useTransactionReceipt({
      hash: query.hash as `0x${string}`,
      enabled: query.status === 'pending',
      onSuccess: (data) => {
        setQueries(prev => prev.map(q => 
          q.hash === query.hash 
            ? { ...q, status: 'success', receipt: data }
            : q
        ))
      },
      onError: (error) => {
        setQueries(prev => prev.map(q => 
          q.hash === query.hash 
            ? { ...q, status: 'error', error: error.message }
            : q
        ))
      },
    })
  }))

  const startBatchQuery = () => {
    const hashes = inputHashes
      .split('\n')
      .map(hash => hash.trim())
      .filter(hash => hash.length > 0)

    const newQueries: BatchReceiptQuery[] = hashes.map(hash => ({
      hash,
      status: 'pending'
    }))

    setQueries(newQueries)
  }

  const exportResults = () => {
    const results = queries.map(query => ({
      hash: query.hash,
      status: query.status,
      gasUsed: query.receipt?.gasUsed?.toString(),
      blockNumber: query.receipt?.blockNumber?.toString(),
      success: query.receipt?.status === 'success',
      logsCount: query.receipt?.logs?.length || 0,
    }))

    const csv = [
      'Hash,Status,GasUsed,BlockNumber,Success,LogsCount',
      ...results.map(r => `${r.hash},${r.status},${r.gasUsed || ''},${r.blockNumber || ''},${r.success || ''},${r.logsCount}`)
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction-receipts.csv'
    a.click()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const getStatusStats = () => {
    const total = queries.length
    const success = queries.filter(q => q.status === 'success').length
    const error = queries.filter(q => q.status === 'error').length
    const pending = queries.filter(q => q.status === 'pending').length

    return { total, success, error, pending }
  }

  const stats = getStatusStats()

  return (
    <div className="batch-receipt-query">
      <h3>批量收据查询</h3>
      
      <div className="input-section">
        <textarea
          value={inputHashes}
          onChange={(e) => setInputHashes(e.target.value)}
          placeholder="输入交易哈希，每行一个..."
          rows={6}
          className="hash-textarea"
        />
        <div className="batch-controls">
          <button 
            onClick={startBatchQuery}
            disabled={!inputHashes.trim()}
          >
            开始批量查询
          </button>
          {queries.length > 0 && (
            <button onClick={exportResults}>
              导出结果 (CSV)
            </button>
          )}
        </div>
      </div>

      {queries.length > 0 && (
        <div className="batch-results">
          <div className="stats-summary">
            <div className="stat">
              <span>总数:</span>
              <span>{stats.total}</span>
            </div>
            <div className="stat success">
              <span>成功:</span>
              <span>{stats.success}</span>
            </div>
            <div className="stat error">
              <span>失败:</span>
              <span>{stats.error}</span>
            </div>
            <div className="stat pending">
              <span>查询中:</span>
              <span>{stats.pending}</span>
            </div>
          </div>

          <div className="results-list">
            {queries.map((query, index) => (
              <div key={query.hash} className={`result-item ${query.status}`}>
                <div className="result-header">
                  <span className="index">#{index + 1}</span>
                  <span className="status-icon">{getStatusIcon(query.status)}</span>
                  <span className="hash">
                    {query.hash.slice(0, 10)}...{query.hash.slice(-8)}
                  </span>
                </div>
                
                <div className="result-details">
                  {query.status === 'success' && query.receipt && (
                    <div className="success-details">
                      <span>区块: {query.receipt.blockNumber.toString()}</span>
                      <span>Gas: {query.receipt.gasUsed.toString()}</span>
                      <span>状态: {query.receipt.status}</span>
                      <span>日志: {query.receipt.logs.length}</span>
                    </div>
                  )}
                  
                  {query.status === 'error' && (
                    <div className="error-details">
                      错误: {query.error}
                    </div>
                  )}
                  
                  {query.status === 'pending' && (
                    <div className="pending-details">
                      <div className="spinner"></div>
                      <span>查询中...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 收据和交易信息有什么区别？
A: 交易信息是发送时的参数，收据是执行后的结果，包含实际 Gas 使用、事件日志等。

### Q: 为什么有些交易没有收据？
A: 只有已确认的交易才有收据，待确认的交易需要等待打包。

### Q: 如何解析事件日志？
A: 使用合约 ABI 和 `decodeEventLog` 函数来解析日志数据。

### Q: Gas 使用效率多少算正常？
A: 通常 80-95% 是比较理想的范围，过低浪费费用，过高可能导致失败。

## 下一步

- [useTransaction](/wagmi/hooks/transactions/use-transaction) - 学习获取交易详情
- [useContractEvent](/wagmi/hooks/contracts/use-contract-event) - 学习监听合约事件
- [useBlockNumber](/wagmi/hooks/network/use-block-number) - 学习获取区块信息