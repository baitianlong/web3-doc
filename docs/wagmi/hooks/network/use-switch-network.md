---
title: useSwitchNetwork
description: 切换网络的 React Hook
keywords: [wagmi, useSwitchNetwork, 网络切换, 链切换, 多链, React Hook, Web3]
---

# useSwitchNetwork

`useSwitchNetwork` 用于切换到不同的区块链网络，支持用户在多个网络之间无缝切换。

## 基本用法

```tsx
import { useSwitchNetwork } from 'wagmi'

function NetworkSwitcher() {
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()

  return (
    <div>
      {chains.map((chain) => (
        <button
          disabled={!switchNetwork || chain.id === pendingChainId}
          key={chain.id}
          onClick={() => switchNetwork?.(chain.id)}
        >
          {chain.name}
          {isLoading && pendingChainId === chain.id && ' (切换中)'}
        </button>
      ))}
      {error && <div>切换失败: {error.message}</div>}
    </div>
  )
}
```

## 返回值

- `chains` - 可切换的网络列表
- `error` - 切换错误信息
- `isLoading` - 是否正在切换
- `pendingChainId` - 正在切换到的链 ID
- `switchNetwork` - 切换网络函数
- `switchNetworkAsync` - 异步切换网络函数

## 详细示例

### 智能网络切换器

```tsx
import { useSwitchNetwork, useNetwork, useAccount } from 'wagmi'
import { useState } from 'react'

function SmartNetworkSwitcher() {
  const { chain: currentChain } = useNetwork()
  const { isConnected } = useAccount()
  const { 
    chains, 
    error, 
    isLoading, 
    pendingChainId, 
    switchNetwork,
    switchNetworkAsync 
  } = useSwitchNetwork()

  const [switchHistory, setSwitchHistory] = useState<Array<{
    from: string
    to: string
    timestamp: number
    success: boolean
  }>>([])

  const handleSwitchNetwork = async (chainId: number) => {
    if (!switchNetworkAsync || !currentChain) return

    const targetChain = chains.find(c => c.id === chainId)
    if (!targetChain) return

    try {
      await switchNetworkAsync(chainId)
      
      setSwitchHistory(prev => [...prev, {
        from: currentChain.name,
        to: targetChain.name,
        timestamp: Date.now(),
        success: true
      }])
    } catch (error) {
      setSwitchHistory(prev => [...prev, {
        from: currentChain.name,
        to: targetChain.name,
        timestamp: Date.now(),
        success: false
      }])
    }
  }

  const getChainIcon = (chainId: number) => {
    switch (chainId) {
      case 1: return '🔷' // Ethereum
      case 137: return '🟣' // Polygon
      case 42161: return '🔵' // Arbitrum
      case 10: return '🔴' // Optimism
      default: return '⚪'
    }
  }

  const getChainDescription = (chainId: number) => {
    switch (chainId) {
      case 1: return '以太坊主网 - 最安全的网络'
      case 137: return 'Polygon - 低费用快速交易'
      case 42161: return 'Arbitrum - Layer 2 扩容解决方案'
      case 10: return 'Optimism - Optimistic Rollup'
      default: return '区块链网络'
    }
  }

  if (!isConnected) {
    return (
      <div className="network-switcher-disabled">
        <div className="message">请先连接钱包以切换网络</div>
      </div>
    )
  }

  return (
    <div className="smart-network-switcher">
      <h3>网络切换器</h3>
      
      <div className="current-network">
        <h4>当前网络</h4>
        {currentChain ? (
          <div className="current-chain-info">
            <span className="chain-icon">{getChainIcon(currentChain.id)}</span>
            <div className="chain-details">
              <div className="chain-name">{currentChain.name}</div>
              <div className="chain-id">链 ID: {currentChain.id}</div>
              {currentChain.testnet && (
                <span className="testnet-badge">测试网</span>
              )}
            </div>
          </div>
        ) : (
          <div className="no-chain">未连接到任何网络</div>
        )}
      </div>

      <div className="available-networks">
        <h4>可用网络</h4>
        <div className="networks-grid">
          {chains.map((chain) => {
            const isCurrent = currentChain?.id === chain.id
            const isPending = pendingChainId === chain.id
            const isDisabled = !switchNetwork || isCurrent || isLoading

            return (
              <div 
                key={chain.id}
                className={`network-card ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
              >
                <div className="network-header">
                  <span className="network-icon">{getChainIcon(chain.id)}</span>
                  <div className="network-info">
                    <div className="network-name">{chain.name}</div>
                    <div className="network-description">
                      {getChainDescription(chain.id)}
                    </div>
                  </div>
                </div>

                <div className="network-details">
                  <div className="detail-item">
                    <span>链 ID:</span>
                    <span>{chain.id}</span>
                  </div>
                  <div className="detail-item">
                    <span>代币:</span>
                    <span>{chain.nativeCurrency.symbol}</span>
                  </div>
                  {chain.testnet && (
                    <div className="testnet-indicator">测试网络</div>
                  )}
                </div>

                <button
                  className={`switch-button ${isCurrent ? 'current' : ''}`}
                  disabled={isDisabled}
                  onClick={() => handleSwitchNetwork(chain.id)}
                >
                  {isCurrent ? '当前网络' :
                   isPending ? '切换中...' :
                   '切换到此网络'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="switch-error">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <div className="error-title">网络切换失败</div>
            <div className="error-message">{error.message}</div>
            <div className="error-suggestion">
              请检查钱包设置或稍后重试
            </div>
          </div>
        </div>
      )}

      {switchHistory.length > 0 && (
        <div className="switch-history">
          <h4>切换历史</h4>
          <div className="history-list">
            {switchHistory.slice(-5).reverse().map((entry, index) => (
              <div key={index} className={`history-item ${entry.success ? 'success' : 'failed'}`}>
                <div className="history-content">
                  <span className="from">{entry.from}</span>
                  <span className="arrow">→</span>
                  <span className="to">{entry.to}</span>
                </div>
                <div className="history-meta">
                  <span className="status">
                    {entry.success ? '✅' : '❌'}
                  </span>
                  <span className="time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
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

### 条件网络切换

```tsx
import { useSwitchNetwork, useNetwork } from 'wagmi'
import { mainnet, polygon, arbitrum } from 'wagmi/chains'

interface ConditionalNetworkSwitcherProps {
  requiredChainId?: number
  onNetworkSwitched?: (chainId: number) => void
}

function ConditionalNetworkSwitcher({ 
  requiredChainId, 
  onNetworkSwitched 
}: ConditionalNetworkSwitcherProps) {
  const { chain } = useNetwork()
  const { switchNetworkAsync, isLoading } = useSwitchNetwork()

  const isCorrectNetwork = !requiredChainId || chain?.id === requiredChainId
  const requiredChain = requiredChainId 
    ? [mainnet, polygon, arbitrum].find(c => c.id === requiredChainId)
    : null

  const handleSwitchToRequired = async () => {
    if (!switchNetworkAsync || !requiredChainId) return

    try {
      await switchNetworkAsync(requiredChainId)
      onNetworkSwitched?.(requiredChainId)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  if (isCorrectNetwork) {
    return (
      <div className="network-correct">
        <div className="success-indicator">
          <span className="icon">✅</span>
          <span className="message">
            已连接到正确的网络 {chain?.name}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="network-switch-required">
      <div className="warning-header">
        <span className="warning-icon">⚠️</span>
        <div className="warning-content">
          <div className="warning-title">需要切换网络</div>
          <div className="warning-message">
            此功能需要连接到 {requiredChain?.name} 网络
          </div>
        </div>
      </div>

      <div className="current-vs-required">
        <div className="network-comparison">
          <div className="current-network">
            <div className="label">当前网络</div>
            <div className="network-info">
              {chain ? (
                <>
                  <span className="name">{chain.name}</span>
                  <span className="id">#{chain.id}</span>
                </>
              ) : (
                <span className="no-network">未连接</span>
              )}
            </div>
          </div>

          <div className="arrow">→</div>

          <div className="required-network">
            <div className="label">需要网络</div>
            <div className="network-info">
              {requiredChain && (
                <>
                  <span className="name">{requiredChain.name}</span>
                  <span className="id">#{requiredChain.id}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        className="switch-network-button"
        onClick={handleSwitchToRequired}
        disabled={isLoading || !switchNetworkAsync}
      >
        {isLoading ? '切换中...' : `切换到 ${requiredChain?.name}`}
      </button>

      <div className="switch-info">
        <div className="info-item">
          <span className="icon">ℹ️</span>
          <span className="text">
            切换网络需要在钱包中确认
          </span>
        </div>
        <div className="info-item">
          <span className="icon">🔒</span>
          <span className="text">
            您的资产将在对应网络中显示
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 批量网络操作

```tsx
import { useSwitchNetwork, useNetwork } from 'wagmi'
import { useState } from 'react'

function BatchNetworkOperations() {
  const { chain: currentChain } = useNetwork()
  const { chains, switchNetworkAsync } = useSwitchNetwork()
  
  const [operations, setOperations] = useState<Array<{
    chainId: number
    action: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    result?: any
    error?: string
  }>>([])

  const [isRunning, setIsRunning] = useState(false)

  const addOperation = (chainId: number, action: string) => {
    setOperations(prev => [...prev, {
      chainId,
      action,
      status: 'pending'
    }])
  }

  const executeOperations = async () => {
    if (isRunning || operations.length === 0) return

    setIsRunning(true)

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i]
      
      // 更新状态为运行中
      setOperations(prev => prev.map((op, index) => 
        index === i ? { ...op, status: 'running' } : op
      ))

      try {
        // 切换网络
        if (currentChain?.id !== operation.chainId) {
          await switchNetworkAsync?.(operation.chainId)
        }

        // 模拟执行操作
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 更新状态为完成
        setOperations(prev => prev.map((op, index) => 
          index === i ? { 
            ...op, 
            status: 'completed',
            result: `操作在 ${chains.find(c => c.id === operation.chainId)?.name} 上完成`
          } : op
        ))

      } catch (error) {
        // 更新状态为失败
        setOperations(prev => prev.map((op, index) => 
          index === i ? { 
            ...op, 
            status: 'failed',
            error: error instanceof Error ? error.message : '未知错误'
          } : op
        ))
      }
    }

    setIsRunning(false)
  }

  const clearOperations = () => {
    setOperations([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="batch-network-operations">
      <h3>批量网络操作</h3>
      
      <div className="operation-builder">
        <h4>添加操作</h4>
        <div className="add-operation-form">
          {chains.map((chain) => (
            <div key={chain.id} className="chain-operations">
              <div className="chain-info">
                <span className="chain-name">{chain.name}</span>
                <span className="chain-id">#{chain.id}</span>
              </div>
              <div className="operation-buttons">
                <button
                  onClick={() => addOperation(chain.id, '检查余额')}
                  disabled={isRunning}
                >
                  检查余额
                </button>
                <button
                  onClick={() => addOperation(chain.id, '获取交易历史')}
                  disabled={isRunning}
                >
                  获取历史
                </button>
                <button
                  onClick={() => addOperation(chain.id, '同步数据')}
                  disabled={isRunning}
                >
                  同步数据
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="operations-queue">
        <h4>操作队列 ({operations.length})</h4>
        
        {operations.length === 0 ? (
          <div className="empty-queue">
            <div className="empty-message">暂无操作，请添加操作到队列</div>
          </div>
        ) : (
          <>
            <div className="queue-controls">
              <button
                className="execute-button"
                onClick={executeOperations}
                disabled={isRunning}
              >
                {isRunning ? '执行中...' : '执行所有操作'}
              </button>
              <button
                className="clear-button"
                onClick={clearOperations}
                disabled={isRunning}
              >
                清空队列
              </button>
            </div>

            <div className="operations-list">
              {operations.map((operation, index) => (
                <div 
                  key={index}
                  className={`operation-item ${operation.status}`}
                >
                  <div className="operation-header">
                    <span className="status-icon">
                      {getStatusIcon(operation.status)}
                    </span>
                    <div className="operation-info">
                      <div className="operation-title">
                        {operation.action}
                      </div>
                      <div className="operation-network">
                        {chains.find(c => c.id === operation.chainId)?.name}
                      </div>
                    </div>
                    <div className="operation-status">
                      {operation.status === 'pending' && '等待中'}
                      {operation.status === 'running' && '执行中'}
                      {operation.status === 'completed' && '已完成'}
                      {operation.status === 'failed' && '失败'}
                    </div>
                  </div>

                  {operation.result && (
                    <div className="operation-result">
                      <div className="result-label">结果:</div>
                      <div className="result-content">{operation.result}</div>
                    </div>
                  )}

                  {operation.error && (
                    <div className="operation-error">
                      <div className="error-label">错误:</div>
                      <div className="error-content">{operation.error}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="execution-summary">
        <h4>执行摘要</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="label">总操作:</span>
            <span className="value">{operations.length}</span>
          </div>
          <div className="stat">
            <span className="label">已完成:</span>
            <span className="value">
              {operations.filter(op => op.status === 'completed').length}
            </span>
          </div>
          <div className="stat">
            <span className="label">失败:</span>
            <span className="value">
              {operations.filter(op => op.status === 'failed').length}
            </span>
          </div>
          <div className="stat">
            <span className="label">进行中:</span>
            <span className="value">
              {operations.filter(op => op.status === 'running').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 常见问题

### Q: 为什么切换网络失败？
A: 可能是钱包不支持该网络，或用户拒绝了切换请求。

### Q: 如何添加新的网络？
A: 需要在 Wagmi 配置中添加新的链配置。

### Q: 切换网络需要用户确认吗？
A: 是的，大多数钱包都需要用户手动确认网络切换。

## 下一步

- [useNetwork](/wagmi/hooks/network/use-network) - 学习获取网络信息
- [useChainId](/wagmi/hooks/network/use-chain-id) - 学习获取链 ID
- [useFeeData](/wagmi/hooks/network/use-fee-data) - 学习获取费用数据