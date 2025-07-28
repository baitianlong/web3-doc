---
title: useBlockNumber
description: 获取当前区块号的 React Hook
keywords: [wagmi, useBlockNumber, 区块号, 区块链, 实时监听, React Hook, Web3]
---

# useBlockNumber

`useBlockNumber` 用于获取当前区块链网络的最新区块号，支持实时监听新区块的产生。

## 基本用法

```tsx
import { useBlockNumber } from 'wagmi'

function BlockNumberDisplay() {
  const { data: blockNumber, isLoading } = useBlockNumber()

  if (isLoading) return <div>加载中...</div>

  return (
    <div>
      <p>当前区块号: {blockNumber?.toString()}</p>
    </div>
  )
}
```

## 参数配置

- `chainId` - 指定链 ID
- `watch` - 是否实时监听新区块
- `enabled` - 是否启用查询
- `cacheTime` - 缓存时间
- `staleTime` - 数据过期时间

## 返回值

- `data` - 当前区块号 (bigint)
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isSuccess` - 是否成功获取
- `refetch` - 手动刷新函数

## 详细示例

### 实时区块监听器

```tsx
import { useBlockNumber, useNetwork } from 'wagmi'
import { useState, useEffect } from 'react'

function RealTimeBlockMonitor() {
  const { chain } = useNetwork()
  const { data: blockNumber } = useBlockNumber({
    watch: true, // 启用实时监听
  })

  const [blockHistory, setBlockHistory] = useState<Array<{
    number: bigint
    timestamp: number
    timeDiff?: number
  }>>([])

  useEffect(() => {
    if (blockNumber) {
      const now = Date.now()
      
      setBlockHistory(prev => {
        const newEntry = { number: blockNumber, timestamp: now }
        
        // 计算与上一个区块的时间差
        if (prev.length > 0) {
          const lastEntry = prev[prev.length - 1]
          newEntry.timeDiff = now - lastEntry.timestamp
        }
        
        // 只保留最近20个区块
        return [...prev, newEntry].slice(-20)
      })
    }
  }, [blockNumber])

  const averageBlockTime = blockHistory.length > 1
    ? blockHistory
        .slice(1) // 跳过第一个（没有时间差）
        .reduce((sum, block) => sum + (block.timeDiff || 0), 0) / (blockHistory.length - 1)
    : 0

  const getExpectedBlockTime = (chainId?: number) => {
    switch (chainId) {
      case 1: return 12000 // Ethereum: ~12s
      case 137: return 2000 // Polygon: ~2s
      case 42161: return 1000 // Arbitrum: ~1s
      case 10: return 2000 // Optimism: ~2s
      default: return 12000
    }
  }

  const
  expectedBlockTime = getExpectedBlockTime(chain.id)

  const getHealthStatus = () => {
    if (averageBlockTime === 0) return 'unknown'
    if (averageBlockTime > expectedBlockTime * 2) return 'slow'
    if (averageBlockTime > expectedBlockTime * 1.5) return 'delayed'
    return 'normal'
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="real-time-block-monitor">
      <h3>实时区块监听器</h3>
      
      <div className="current-status">
        <div className="status-card">
          <div className="status-header">
            <div className="network-info">
              <span className="network-name">{chain?.name || '未知网络'}</span>
              <span className="chain-id">#{chain?.id}</span>
            </div>
            <div className={`health-indicator ${healthStatus}`}>
              <span className="health-dot"></span>
              <span className="health-text">
                {healthStatus === 'normal' && '正常'}
                {healthStatus === 'delayed' && '延迟'}
                {healthStatus === 'slow' && '缓慢'}
                {healthStatus === 'unknown' && '未知'}
              </span>
            </div>
          </div>

          <div className="current-block">
            <div className="block-number">
              <span className="label">当前区块:</span>
              <span className="value">{blockNumber?.toString() || '加载中...'}</span>
            </div>
            <div className="block-time">
              <span className="label">平均出块时间:</span>
              <span className="value">
                {averageBlockTime > 0 
                  ? `${(averageBlockTime / 1000).toFixed(1)}s`
                  : '计算中...'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="block-timeline">
        <h4>区块时间线</h4>
        <div className="timeline-container">
          {blockHistory.slice(-10).map((block, index) => (
            <div key={index} className="timeline-item">
              <div className="block-info">
                <div className="block-num">#{block.number.toString()}</div>
                <div className="block-timestamp">
                  {new Date(block.timestamp).toLocaleTimeString()}
                </div>
                {block.timeDiff && (
                  <div className={`time-diff ${
                    block.timeDiff > expectedBlockTime * 1.5 ? 'slow' : 'normal'
                  }`}>
                    +{(block.timeDiff / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="statistics">
        <h4>统计信息</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">监听区块数</div>
            <div className="stat-value">{blockHistory.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">预期出块时间</div>
            <div className="stat-value">{expectedBlockTime / 1000}s</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">最快出块</div>
            <div className="stat-value">
              {blockHistory.length > 1
                ? `${Math.min(...blockHistory.slice(1).map(b => b.timeDiff || 0)) / 1000}s`
                : 'N/A'
              }
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">最慢出块</div>
            <div className="stat-value">
              {blockHistory.length > 1
                ? `${Math.max(...blockHistory.slice(1).map(b => b.timeDiff || 0)) / 1000}s`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 区块号比较器

```tsx
import { useBlockNumber } from 'wagmi'
import { useState, useEffect } from 'react'

function BlockNumberComparator() {
  const { data: mainnetBlock } = useBlockNumber({ chainId: 1 })
  const { data: polygonBlock } = useBlockNumber({ chainId: 137 })
  const { data: arbitrumBlock } = useBlockNumber({ chainId: 42161 })
  const { data: optimismBlock } = useBlockNumber({ chainId: 10 })

  const [blockData, setBlockData] = useState<Record<string, {
    current: bigint | undefined
    previous: bigint | undefined
    timestamp: number
    speed: number
  }>>({})

  const networks = [
    { name: 'Ethereum', chainId: 1, block: mainnetBlock, color: '#627EEA' },
    { name: 'Polygon', chainId: 137, block: polygonBlock, color: '#8247E5' },
    { name: 'Arbitrum', chainId: 42161, block: arbitrumBlock, color: '#28A0F0' },
    { name: 'Optimism', chainId: 10, block: optimismBlock, color: '#FF0420' }
  ]

  useEffect(() => {
    networks.forEach(({ name, block }) => {
      if (block) {
        setBlockData(prev => {
          const current = prev[name]
          const now = Date.now()
          
          return {
            ...prev,
            [name]: {
              current: block,
              previous: current?.current,
              timestamp: now,
              speed: current?.current && current.timestamp
                ? Number(block - current.current) / ((now - current.timestamp) / 1000)
                : 0
            }
          }
        })
      }
    })
  }, [mainnetBlock, polygonBlock, arbitrumBlock, optimismBlock])

  const getRelativePosition = (block: bigint | undefined, maxBlock: bigint) => {
    if (!block) return 0
    return Number(block) / Number(maxBlock) * 100
  }

  const maxBlock = Math.max(
    ...networks.map(n => Number(n.block || 0))
  )

  return (
    <div className="block-number-comparator">
      <h3>多链区块号比较</h3>
      
      <div className="networks-comparison">
        {networks.map(({ name, chainId, block, color }) => {
          const data = blockData[name]
          const position = getRelativePosition(block, BigInt(maxBlock))
          
          return (
            <div key={chainId} className="network-row">
              <div className="network-info">
                <div className="network-header">
                  <div 
                    className="network-indicator"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="network-details">
                    <div className="network-name">{name}</div>
                    <div className="chain-id">Chain ID: {chainId}</div>
                  </div>
                </div>
                
                <div className="block-stats">
                  <div className="current-block">
                    <span className="label">当前区块:</span>
                    <span className="value">
                      {block?.toString() || '加载中...'}
                    </span>
                  </div>
                  
                  {data?.previous && data.current && (
                    <div className="block-progress">
                      <span className="label">新增区块:</span>
                      <span className="value">
                        +{(data.current - data.previous).toString()}
                      </span>
                    </div>
                  )}
                  
                  {data?.speed > 0 && (
                    <div className="block-speed">
                      <span className="label">出块速度:</span>
                      <span className="value">
                        {data.speed.toFixed(2)} blocks/s
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${position}%`,
                    backgroundColor: color
                  }}
                ></div>
                <div className="progress-text">
                  {position.toFixed(1)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="comparison-summary">
        <h4>对比摘要</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">最高区块</div>
            <div className="summary-value">
              {networks.find(n => Number(n.block || 0) === maxBlock)?.name || 'N/A'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">区块差异</div>
            <div className="summary-value">
              {maxBlock - Math.min(...networks.map(n => Number(n.block || maxBlock)))}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">活跃网络</div>
            <div className="summary-value">
              {networks.filter(n => n.block).length}/{networks.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 区块号触发器

```tsx
import { useBlockNumber } from 'wagmi'
import { useState, useEffect } from 'react'

interface BlockTrigger {
  id: string
  targetBlock: bigint
  description: string
  callback: () => void
  triggered: boolean
  createdAt: number
}

function BlockNumberTriggers() {
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const [triggers, setTriggers] = useState<BlockTrigger[]>([])
  const [newTriggerBlock, setNewTriggerBlock] = useState('')
  const [newTriggerDescription, setNewTriggerDescription] = useState('')

  useEffect(() => {
    if (!blockNumber) return

    setTriggers(prev => prev.map(trigger => {
      if (!trigger.triggered && blockNumber >= trigger.targetBlock) {
        // 触发回调
        trigger.callback()
        
        return {
          ...trigger,
          triggered: true
        }
      }
      return trigger
    }))
  }, [blockNumber])

  const addTrigger = () => {
    if (!newTriggerBlock || !newTriggerDescription) return

    const targetBlock = BigInt(newTriggerBlock)
    
    if (blockNumber && targetBlock <= blockNumber) {
      alert('目标区块必须大于当前区块')
      return
    }

    const newTrigger: BlockTrigger
