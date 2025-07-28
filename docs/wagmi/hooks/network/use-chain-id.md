---
title: useChainId
description: 获取当前链 ID 的 React Hook
keywords: [wagmi, useChainId, 链ID, 网络ID, 区块链, React Hook, Web3]
---

# useChainId

`useChainId` 是一个轻量级的 Hook，用于快速获取当前连接的区块链网络的链 ID。

## 基本用法

```tsx
import { useChainId } from 'wagmi'

function ChainIdDisplay() {
  const chainId = useChainId()

  return (
    <div>
      <p>当前链 ID: {chainId}</p>
    </div>
  )
}
```

## 返回值

- `chainId` - 当前连接的链 ID (number)

## 详细示例

### 链 ID 识别器

```tsx
import { useChainId } from 'wagmi'

function ChainIdIdentifier() {
  const chainId = useChainId()

  const getChainInfo = (id: number) => {
    const chainMap: Record<number, {
      name: string
      symbol: string
      type: 'mainnet' | 'testnet' | 'layer2'
      description: string
      color: string
    }> = {
      1: {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        type: 'mainnet',
        description: '以太坊主网络',
        color: '#627EEA'
      },
      5: {
        name: 'Goerli Testnet',
        symbol: 'GoerliETH',
        type: 'testnet',
        description: '以太坊测试网络',
        color: '#f6851b'
      },
      137: {
        name: 'Polygon Mainnet',
        symbol: 'MATIC',
        type: 'layer2',
        description: 'Polygon 主网络',
        color: '#8247E5'
      },
      80001: {
        name: 'Polygon Mumbai',
        symbol: 'MATIC',
        type: 'testnet',
        description: 'Polygon 测试网络',
        color: '#8247E5'
      },
      42161: {
        name: 'Arbitrum One',
        symbol: 'ETH',
        type: 'layer2',
        description: 'Arbitrum Layer 2',
        color: '#28A0F0'
      },
      421613: {
        name: 'Arbitrum Goerli',
        symbol: 'AGOR',
        type: 'testnet',
        description: 'Arbitrum 测试网络',
        color: '#28A0F0'
      },
      10: {
        name: 'Optimism',
        symbol: 'ETH',
        type: 'layer2',
        description: 'Optimism Layer 2',
        color: '#FF0420'
      },
      420: {
        name: 'Optimism Goerli',
        symbol: 'ETH',
        type: 'testnet',
        description: 'Optimism 测试网络',
        color: '#FF0420'
      }
    }

    return chainMap[id] || {
      name: 'Unknown Network',
      symbol: 'UNKNOWN',
      type: 'mainnet' as const,
      description: '未知网络',
      color: '#6b7280'
    }
  }

  const chainInfo = getChainInfo(chainId)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mainnet': return '🌐'
      case 'testnet': return '🧪'
      case 'layer2': return '⚡'
      default: return '❓'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'mainnet': return '主网'
      case 'testnet': return '测试网'
      case 'layer2': return 'Layer 2'
      default: return '未知'
    }
  }

  return (
    <div className="chain-id-identifier">
      <h3>链 ID 识别器</h3>
      
      <div className="chain-card" style={{ borderColor: chainInfo.color }}>
        <div className="chain-header">
          <div className="chain-icon" style={{ backgroundColor: chainInfo.color }}>
            {getTypeIcon(chainInfo.type)}
          </div>
          <div className="chain-basic-info">
            <div className="chain-name">{chainInfo.name}</div>
            <div className="chain-id">链 ID: {chainId}</div>
          </div>
          <div className="chain-type-badge" style={{ backgroundColor: chainInfo.color }}>
            {getTypeBadge(chainInfo.type)}
          </div>
        </div>

        <div className="chain-details">
          <div className="detail-row">
            <span className="label">网络描述:</span>
            <span className="value">{chainInfo.description}</span>
          </div>
          <div className="detail-row">
            <span className="label">原生代币:</span>
            <span className="value">{chainInfo.symbol}</span>
          </div>
          <div className="detail-row">
            <span className="label">网络类型:</span>
            <span className="value">{getTypeBadge(chainInfo.type)}</span>
          </div>
        </div>

        <div className="chain-features">
          {chainInfo.type === 'mainnet' && (
            <div className="feature-tag mainnet">
              <span className="icon">🔒</span>
              <span>生产环境</span>
            </div>
          )}
          {chainInfo.type === 'testnet' && (
            <div className="feature-tag testnet">
              <span className="icon">🧪</span>
              <span>测试环境</span>
            </div>
          )}
          {chainInfo.type === 'layer2' && (
            <div className="feature-tag layer2">
              <span className="icon">⚡</span>
              <span>低费用快速</span>
            </div>
          )}
        </div>
      </div>

      <div className="chain-id-raw">
        <h4>原始数据</h4>
        <div className="raw-data">
          <div className="data-item">
            <span className="key">十进制:</span>
            <span className="value">{chainId}</span>
          </div>
          <div className="data-item">
            <span className="key">十六进制:</span>
            <span className="value">0x{chainId.toString(16)}</span>
          </div>
          <div className="data-item">
            <span className="key">二进制:</span>
            <span className="value">{chainId.toString(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 链 ID 监听器

```tsx
import { useChainId } from 'wagmi'
import { useState, useEffect } from 'react'

function ChainIdMonitor() {
  const chainId = useChainId()
  const [chainHistory, setChainHistory] = useState<Array<{
    chainId: number
    timestamp: number
    duration?: number
  }>>([])

  useEffect(() => {
    setChainHistory(prev => {
      const newEntry = {
        chainId,
        timestamp: Date.now()
      }

      // 计算上一个网络的使用时长
      const updatedHistory = prev.map((entry, index) => {
        if (index === prev.length - 1) {
          return {
            ...entry,
            duration: Date.now() - entry.timestamp
          }
        }
        return entry
      })

      return [...updatedHistory, newEntry]
    })
  }, [chainId])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}小时${minutes % 60}分钟`
    if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
    return `${seconds}秒`
  }

  const getChainName = (id: number) => {
    const names: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      421613: 'Arbitrum Goerli',
      10: 'Optimism',
      420: 'Optimism Goerli'
    }
    return names[id] || `Chain ${id}`
  }

  const totalSwitches = chainHistory.length - 1
  const currentSessionStart = chainHistory[chainHistory.length - 1]?.timestamp || Date.now()
  const currentSessionDuration = Date.now() - currentSessionStart

  return (
    <div className="chain-id-monitor">
      <h3>链 ID 监听器</h3>
      
      <div className="current-status">
        <div className="status-card">
          <div className="status-header">
            <span className="status-icon">🔗</span>
            <div className="status-info">
              <div className="current-chain">
                当前链: {getChainName(chainId)} (#{chainId})
              </div>
              <div className="session-duration">
                本次会话: {formatDuration(currentSessionDuration)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="session-stats">
        <h4>会话统计</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{totalSwitches}</div>
            <div className="stat-label">网络切换次数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {new Set(chainHistory.map(h => h.chainId)).size}
            </div>
            <div className="stat-label">使用过的网络</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {chainHistory.length > 0 ? 
                formatDuration(Date.now() - chainHistory[0].timestamp) : 
                '0秒'
              }
            </div>
            <div className="stat-label">总会话时长</div>
          </div>
        </div>
      </div>

      <div className="chain-history">
        <h4>切换历史</h4>
        {chainHistory.length === 0 ? (
          <div className="no-history">暂无切换记录</div>
        ) : (
          <div className="history-timeline">
            {chainHistory.slice().reverse().map((entry, index) => {
              const isCurrentChain = index === 0
              const actualIndex = chainHistory.length - 1 - index

              return (
                <div 
                  key={actualIndex}
                  className={`history-item ${isCurrentChain ? 'current' : ''}`}
                >
                  <div className="history-marker">
                    {isCurrentChain ? '🟢' : '🔵'}
                  </div>
                  
                  <div className="history-content">
                    <div className="history-header">
                      <span className="chain-name">
                        {getChainName(entry.chainId)}
                      </span>
                      <span className="chain-id">#{entry.chainId}</span>
                      {isCurrentChain && (
                        <span className="current-badge">当前</span>
                      )}
                    </div>
                    
                    <div className="history-meta">
                      <div className="timestamp">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {entry.duration && (
                        <div className="duration">
                          使用时长: {formatDuration(entry.duration)}
                        </div>
                      )}
                      {isCurrentChain && (
                        <div className="current-duration">
                          当前使用: {formatDuration(currentSessionDuration)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="monitor-actions">
        <button 
          onClick={() => setChainHistory([])}
          className="clear-history-button"
        >
          清空历史记录
        </button>
        <button 
          onClick={() => {
            const data = {
              currentChainId: chainId,
              history: chainHistory,
              exportTime: new Date().toISOString()
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: 'application/json'
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `chain-history-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="export-button"
        >
          导出历史数据
        </button>
      </div>
    </div>
  )
}
```

### 链 ID 验证器

```tsx
import { useChainId } from 'wagmi'
import { useState } from 'react'

function ChainIdValidator() {
  const currentChainId = useChainId()
  const [requiredChainIds, setRequiredChainIds] = useState<number[]>([1, 137, 42161])
  const [customChainId, setCustomChainId] = useState('')

  const isValidChain = requiredChainIds.includes(currentChainId)

  const addCustomChainId = () => {
    const chainId = parseInt(customChainId)
    if (!isNaN(chainId) && !requiredChainIds.includes(chainId)) {
      setRequiredChainIds(prev => [...prev, chainId])
      setCustomChainId('')
    }
  }

  const removeChainId = (chainId: number) => {
    setRequiredChainIds(prev => prev.filter(id => id !== chainId))
  }

  const getValidationStatus = () => {
    if (requiredChainIds.length === 0) return 'no-requirements'
    if (isValidChain) return 'valid'
    return 'invalid'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return '✅'
      case 'invalid': return '❌'
      case 'no-requirements': return 'ℹ️'
      default: return '❓'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'valid': return '当前网络符合要求'
      case 'invalid': return '当前网络不符合要求'
      case 'no-requirements': return '未设置网络要求'
      default: return '状态未知'
    }
  }

  const getChainName = (chainId: number) => {
    const names: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      42161: 'Arbitrum One',
      421613: 'Arbitrum Goerli',
      10: 'Optimism',
      420: 'Optimism Goerli'
    }
    return names[chainId] || `Chain ${chainId}`
  }

  const status = getValidationStatus()

  return (
    <div className="chain-id-validator">
      <h3>链 ID 验证器</h3>
      
      <div className="validation-status">
        <div className={`status-card ${status}`}>
          <div className="status-header">
            <span className="status-icon">{getStatusIcon(status)}</span>
            <div className="status-info">
              <div className="status-message">{getStatusMessage(status)}</div>
              <div className="current-chain">
                当前链: {getChainName(currentChainId)} (#{currentChainId})
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="required-chains">
        <h4>允许的网络</h4>
        
        <div className="add-chain-form">
          <input
            type="number"
            placeholder="输入链 ID"
            value={customChainId}
            onChange={(e) => setCustomChainId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomChainId()}
          />
          <button onClick={addCustomChainId} disabled={!customChainId}>
            添加
          </button>
        </div>

        {requiredChainIds.length === 0 ? (
          <div className="no-requirements">
            <div className="empty-message">
              未设置网络要求，所有网络都被允许
            </div>
          </div>
        ) : (
          <div className="chains-list">
            {requiredChainIds.map((chainId) => (
              <div 
                key={chainId}
                className={`chain-item ${
                  chainId === currentChainId ? 'current' : ''
                }`}
              >
                <div className="chain-info">
                  <div className="chain-name">{getChainName(chainId)}</div>
                  <div className="chain-id">#{chainId}</div>
                </div>
                
                <div className="chain-actions">
                  {chainId === currentChainId && (
                    <span className="current-indicator">当前</span>
                  )}
                  <button
                    onClick={() => removeChainId(chainId)}
                    className="remove-button"
                    title="移除此网络"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="validation-rules">
        <h4>验证规则</h4>
        <div className="rules-list">
          <div className="rule-item">
            <span className="rule-icon">🔍</span>
            <span className="rule-text">
              实时检查当前连接的网络
            </span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">📋</span>
            <span className="rule-text">
              支持自定义允许的网络列表
            </span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">⚡</span>
            <span className="rule-text">
              网络切换时自动重新验证
            </span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">🎯</span>
            <span className="rule-text">
              可用于条件渲染和功能控制
            </span>
          </div>
        </div>
      </div>

      <div className="validation-example">
        <h4>使用示例</h4>
        <div className="code-example">
          <pre>
{`// 条件渲染示例
{isValidChain ? (
  <DAppFeatures />
) : (
  <NetworkSwitchPrompt />
)}

// 功能控制示例
const canExecuteTransaction = isValidChain && isConnected`}
          </pre>
        </div>
      </div>
    </div>
  )
}
```

## 使用场景

### 1. 条件渲染

```tsx
import { useChainId } from 'wagmi'

function ConditionalFeatures() {
  const chainId = useChainId()

  // 只在主网显示某些功能
  if (chainId === 1) {
    return <MainnetOnlyFeatures />
  }

  // 测试网显示不同内容
  if ([5, 80001, 421613, 420].includes(chainId)) {
    return <TestnetFeatures />
  }

  return <UnsupportedNetworkMessage />
}
```

### 2. 网络特定配置

```tsx
import { useChainId } from 'wagmi'

function NetworkSpecificConfig() {
  const chainId = useChainId()

  const getNetworkConfig = (id: number) => {
    switch (id) {
      case 1:
        return { gasLimit: 21000, confirmations: 12 }
      case 137:
        return { gasLimit: 21000, confirmations: 3 }
      case 42161:
        return { gasLimit: 21000, confirmations: 1 }
      default:
        return { gasLimit: 21000, confirmations: 6 }
    }
  }

  const config = getNetworkConfig(chainId)

  return (
    <div>
      <p>Gas 限制: {config.gasLimit}</p>
      <p>确认数: {config.confirmations}</p>
    </div>
  )
}
```

## 常见问题

### Q: useChainId 和 useNetwork 有什么区别？
A: `useChainId` 只返回链 ID，更轻量；`useNetwork` 返回完整的网络信息。

### Q: 链 ID 什么时候会变化？
A: 当用户切换网络时，链 ID 会自动更新。

### Q: 如何处理未知的链 ID？
A: 可以维护一个已知链 ID 的映射表，对未知 ID 提供默认处理。

## 下一步

- [useNetwork](/wagmi/hooks/network/use-network) - 学习获取完整网络信息
- [useSwitchNetwork](/wagmi/hooks/network/use-switch-network) - 学习切换网络
- [useBlockNumber](/wagmi/hooks/network/use-block-number) - 学习获取区块号