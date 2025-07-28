---
title: useNetwork
description: 获取当前网络信息的 React Hook
keywords: [wagmi, useNetwork, 网络信息, 链信息, 区块链网络, React Hook, Web3]
---

# useNetwork

`useNetwork` 用于获取当前连接的网络信息，包括链 ID、链名称、原生代币等详细信息。

## 基本用法

```tsx
import { useNetwork } from 'wagmi'

function NetworkInfo() {
  const { chain, chains } = useNetwork()

  if (!chain) return <div>未连接到任何网络</div>

  return (
    <div>
      <h3>当前网络</h3>
      <p>网络名称: {chain.name}</p>
      <p>链 ID: {chain.id}</p>
      <p>原生代币: {chain.nativeCurrency.symbol}</p>
      <p>区块浏览器: {chain.blockExplorers?.default.url}</p>
    </div>
  )
}
```

## 返回值

- `chain` - 当前连接的链信息
- `chains` - 所有支持的链列表

## 详细示例

### 网络状态显示器

```tsx
import { useNetwork, useAccount } from 'wagmi'

function NetworkStatusDisplay() {
  const { chain, chains } = useNetwork()
  const { isConnected } = useAccount()

  const getNetworkStatus = () => {
    if (!isConnected) return 'disconnected'
    if (!chain) return 'unknown'
    if (chain.testnet) return 'testnet'
    return 'mainnet'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mainnet': return '#10b981'
      case 'testnet': return '#f59e0b'
      case 'unknown': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const status = getNetworkStatus()

  return (
    <div className="network-status">
      <div 
        className="status-indicator"
        style={{ backgroundColor: getStatusColor(status) }}
      >
        <div className="status-dot"></div>
        <span className="status-text">
          {status === 'disconnected' ? '未连接' :
           status === 'unknown' ? '未知网络' :
           status === 'testnet' ? '测试网络' :
           '主网络'}
        </span>
      </div>

      {chain && (
        <div className="network-details">
          <div className="network-name">{chain.name}</div>
          <div className="network-id">ID: {chain.id}</div>
          {chain.testnet && (
            <div className="testnet-badge">测试网</div>
          )}
        </div>
      )}

      <div className="supported-networks">
        <h4>支持的网络 ({chains.length})</h4>
        <div className="networks-grid">
          {chains.map((supportedChain) => (
            <div 
              key={supportedChain.id}
              className={`network-item ${
                chain?.id === supportedChain.id ? 'active' : ''
              }`}
            >
              <div className="network-info">
                <span className="name">{supportedChain.name}</span>
                <span className="id">#{supportedChain.id}</span>
              </div>
              {supportedChain.testnet && (
                <span className="testnet-label">测试</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 网络兼容性检查

```tsx
import { useNetwork } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

function NetworkCompatibilityChecker() {
  const { chain } = useNetwork()

  const supportedChains = [mainnet, polygon, arbitrum, optimism]
  const isSupported = chain && supportedChains.some(c => c.id === chain.id)

  const getChainFeatures = (chainId: number) => {
    const features = []
    
    switch (chainId) {
      case mainnet.id:
        features.push('最高安全性', '最大流动性', 'DeFi 生态完整')
        break
      case polygon.id:
        features.push('低 Gas 费用', '快速确认', 'EVM 兼容')
        break
      case arbitrum.id:
        features.push('Layer 2 扩容', '低费用', '以太坊安全性')
        break
      case optimism.id:
        features.push('Optimistic Rollup', '低延迟', '以太坊兼容')
        break
    }
    
    return features
  }

  return (
    <div className="network-compatibility">
      <h3>网络兼容性检查</h3>
      
      {!chain ? (
        <div className="no-network">
          <div className="warning-icon">⚠️</div>
          <div className="message">请先连接钱包</div>
        </div>
      ) : !isSupported ? (
        <div className="unsupported-network">
          <div className="error-icon">❌</div>
          <div className="message">
            <div className="title">不支持的网络</div>
            <div className="description">
              当前网络 "{chain.name}" (ID: {chain.id}) 不被支持
            </div>
            <div className="suggestion">
              请切换到以下支持的网络之一
            </div>
          </div>
        </div>
      ) : (
        <div className="supported-network">
          <div className="success-icon">✅</div>
          <div className="message">
            <div className="title">网络已支持</div>
            <div className="description">
              当前连接到 {chain.name} 网络
            </div>
          </div>
        </div>
      )}

      <div className="supported-chains-list">
        <h4>支持的网络</h4>
        {supportedChains.map((supportedChain) => (
          <div 
            key={supportedChain.id}
            className={`chain-card ${
              chain?.id === supportedChain.id ? 'current' : ''
            }`}
          >
            <div className="chain-header">
              <div className="chain-name">{supportedChain.name}</div>
              <div className="chain-id">#{supportedChain.id}</div>
              {chain?.id === supportedChain.id && (
                <div className="current-badge">当前</div>
              )}
            </div>
            
            <div className="chain-features">
              {getChainFeatures(supportedChain.id).map((feature, index) => (
                <span key={index} className="feature-tag">
                  {feature}
                </span>
              ))}
            </div>
            
            <div className="chain-details">
              <div className="detail">
                <span>原生代币:</span>
                <span>{supportedChain.nativeCurrency.symbol}</span>
              </div>
              <div className="detail">
                <span>区块浏览器:</span>
                <a 
                  href={supportedChain.blockExplorers?.default.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {supportedChain.blockExplorers?.default.name}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 网络性能监控

```tsx
import { useNetwork, useBlockNumber, useFeeData } from 'wagmi'
import { useState, useEffect } from 'react'

function NetworkPerformanceMonitor() {
  const { chain } = useNetwork()
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const { data: feeData } = useFeeData({ watch: true })
  
  const [blockTimes, setBlockTimes] = useState<number[]>([])
  const [lastBlockTime, setLastBlockTime] = useState<number>(Date.now())

  useEffect(() => {
    if (blockNumber) {
      const now = Date.now()
      const timeDiff = now - lastBlockTime
      
      setBlockTimes(prev => {
        const newTimes = [...prev, timeDiff].slice(-10) // 保留最近10个区块时间
        return newTimes
      })
      
      setLastBlockTime(now)
    }
  }, [blockNumber, lastBlockTime])

  const averageBlockTime = blockTimes.length > 1 
    ? blockTimes.slice(1).reduce((a, b) => a + b, 0) / (blockTimes.length - 1)
    : 0

  const getNetworkHealth = () => {
    if (!chain || !feeData) return 'unknown'
    
    const gasPrice = Number(feeData.gasPrice || 0) / 1e9 // 转换为 Gwei
    const expectedBlockTime = getExpectedBlockTime(chain.id)
    
    if (gasPrice > 100 || averageBlockTime > expectedBlockTime * 2) return 'congested'
    if (gasPrice > 50 || averageBlockTime > expectedBlockTime * 1.5) return 'busy'
    return 'healthy'
  }

  const getExpectedBlockTime = (chainId: number) => {
    switch (chainId) {
      case 1: return 12000 // Ethereum: ~12s
      case 137: return 2000 // Polygon: ~2s
      case 42161: return 1000 // Arbitrum: ~1s
      case 10: return 2000 // Optimism: ~2s
      default: return 12000
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#10b981'
      case 'busy': return '#f59e0b'
      case 'congested': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getHealthText = (health: string) => {
    switch (health) {
      case 'healthy': return '网络健康'
      case 'busy': return '网络繁忙'
      case 'congested': return '网络拥堵'
      default: return '状态未知'
    }
  }

  const health = getNetworkHealth()

  return (
    <div className="network-performance">
      <h3>网络性能监控</h3>
      
      {!chain ? (
        <div className="no-data">请连接到网络以查看性能数据</div>
      ) : (
        <>
          <div className="performance-overview">
            <div 
              className="health-indicator"
              style={{ backgroundColor: getHealthColor(health) }}
            >
              <div className="health-status">{getHealthText(health)}</div>
              <div className="network-name">{chain.name}</div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">当前区块</div>
              <div className="metric-value">
                {blockNumber?.toString() || '加载中...'}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">平均出块时间</div>
              <div className="metric-value">
                {averageBlockTime > 0 
                  ? `${(averageBlockTime / 1000).toFixed(1)}s`
                  : '计算中...'
                }
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Gas 价格</div>
              <div className="metric-value">
                {feeData?.gasPrice 
                  ? `${(Number(feeData.gasPrice) / 1e9).toFixed(1)} Gwei`
                  : '获取中...'
                }
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">网络类型</div>
              <div className="metric-value">
                {chain.testnet ? '测试网' : '主网'}
              </div>
            </div>
          </div>

          <div className="block-time-chart">
            <h4>最近区块时间 (秒)</h4>
            <div className="chart-container">
              {blockTimes.slice(1).map((time, index) => (
                <div 
                  key={index}
                  className="chart-bar"
                  style={{ 
                    height: `${Math.min((time / 1000) * 10, 100)}px`,
                    backgroundColor: time > getExpectedBlockTime(chain.id) * 1.5 
                      ? '#ef4444' 
                      : '#10b981'
                  }}
                  title={`${(time / 1000).toFixed(1)}s`}
                />
              ))}
            </div>
          </div>

          <div className="network-info">
            <h4>网络详情</h4>
            <div className="info-grid">
              <div className="info-item">
                <span>链 ID:</span>
                <span>{chain.id}</span>
              </div>
              <div className="info-item">
                <span>原生代币:</span>
                <span>{chain.nativeCurrency.symbol}</span>
              </div>
              <div className="info-item">
                <span>RPC 端点:</span>
                <span>{chain.rpcUrls.default.http[0]}</span>
              </div>
              <div className="info-item">
                <span>区块浏览器:</span>
                <a 
                  href={chain.blockExplorers?.default.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chain.blockExplorers?.default.name}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 如何检测网络是否为测试网？
A: 使用 `chain.testnet` 属性检查。

### Q: 如何获取所有支持的网络？
A: 使用 `chains` 数组获取配置中的所有网络。

### Q: 网络信息什么时候会更新？
A: 当用户切换网络时会自动更新。

## 下一步

- [useSwitchNetwork](/wagmi/hooks/network/use-switch-network) - 学习切换网络
- [useChainId](/wagmi/hooks/network/use-chain-id) - 学习获取链 ID
- [useBlockNumber](/wagmi/hooks/network/use-block-number) - 学习获取区块号