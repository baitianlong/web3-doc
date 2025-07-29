---
title: useFeeData
description: 获取网络费用数据的 React Hook
keywords: [wagmi, useFeeData, Gas费用, 网络费用, EIP-1559, React Hook, Web3]
---

# useFeeData

`useFeeData` 用于获取当前网络的费用数据，包括 Gas 价格、EIP-1559 费用等信息，帮助优化交易费用。

## 基本用法

```tsx
import { useFeeData } from 'wagmi'

function FeeDataDisplay() {
  const { data: feeData, isLoading, error } = useFeeData()

  if (isLoading) return <div>获取费用数据中...</div>
  if (error) return <div>获取失败: {error.message}</div>

  return (
    <div>
      <h3>当前网络费用</h3>
      <p>Gas 价格: {feeData?.gasPrice ? 
        `${(Number(feeData.gasPrice) / 1e9).toFixed(2)} Gwei` : 
        '不可用'
      }</p>
      <p>最大费用: {feeData?.maxFeePerGas ? 
        `${(Number(feeData.maxFeePerGas) / 1e9).toFixed(2)} Gwei` : 
        '不可用'
      }</p>
      <p>优先费用: {feeData?.maxPriorityFeePerGas ? 
        `${(Number(feeData.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei` : 
        '不可用'
      }</p>
    </div>
  )
}
```

## 参数配置

```tsx
import { useFeeData } from 'wagmi'

function ConfiguredFeeData() {
  const { data: feeData } = useFeeData({
    chainId: 1, // 指定链 ID
    watch: true, // 实时监听费用变化
    cacheTime: 30_000, // 缓存 30 秒
    staleTime: 10_000, // 10 秒内数据不过期
    enabled: true, // 是否启用查询
    onSuccess: (data) => {
      console.log('费用数据更新:', data)
    },
    onError: (error) => {
      console.error('获取费用数据失败:', error)
    }
  })

  return (
    <div>
      {/* 显示费用数据 */}
    </div>
  )
}
```

## 返回值

- `data` - 费用数据对象
  - `gasPrice` - Legacy Gas 价格 (bigint)
  - `maxFeePerGas` - EIP-1559 最大费用 (bigint)
  - `maxPriorityFeePerGas` - EIP-1559 优先费用 (bigint)
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isSuccess` - 是否成功获取
- `isError` - 是否发生错误
- `refetch` - 手动刷新函数

## 详细示例

### 实时费用监控

```tsx
import { useFeeData, useNetwork } from 'wagmi'
import { useState, useEffect } from 'react'

function RealTimeFeeMonitor() {
  const { chain } = useNetwork()
  const [feeHistory, setFeeHistory] = useState<number[]>([])
  
  const { data: feeData, isLoading } = useFeeData({
    watch: true, // 实时监听
    refetchInterval: 5000, // 每5秒刷新
  })

  // 记录费用历史
  useEffect(() => {
    if (feeData?.gasPrice) {
      const gasPriceGwei = Number(feeData.gasPrice) / 1e9
      setFeeHistory(prev => [...prev.slice(-20), gasPriceGwei]) // 保留最近20个数据点
    }
  }, [feeData])

  const averageFee = feeHistory.length > 0 
    ? feeHistory.reduce((sum, fee) => sum + fee, 0) / feeHistory.length
    : 0

  const currentFee = feeData?.gasPrice ? Number(feeData.gasPrice) / 1e9 : 0
  const feeStatus = currentFee > averageFee * 1.2 ? 'high' : 
                   currentFee < averageFee * 0.8 ? 'low' : 'normal'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return '#ef4444'
      case 'low': return '#10b981'
      case 'normal': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'high': return '费用较高'
      case 'low': return '费用较低'
      case 'normal': return '费用正常'
      default: return '检测中...'
    }
  }

  return (
    <div className="fee-monitor">
      <h3>实时费用监控</h3>
      
      <div className="network-info">
        <span>网络: {chain?.name || '未连接'}</span>
        <span className="status-indicator" style={{ color: getStatusColor(feeStatus) }}>
          {getStatusText(feeStatus)}
        </span>
      </div>

      {isLoading ? (
        <div className="loading">获取费用数据中...</div>
      ) : (
        <div className="fee-details">
          <div className="fee-item">
            <label>当前 Gas 价格:</label>
            <span className="fee-value">
              {currentFee.toFixed(2)} Gwei
            </span>
          </div>

          {feeData?.maxFeePerGas && (
            <div className="fee-item">
              <label>最大费用 (EIP-1559):</label>
              <span className="fee-value">
                {(Number(feeData.maxFeePerGas) / 1e9).toFixed(2)} Gwei
              </span>
            </div>
          )}

          {feeData?.maxPriorityFeePerGas && (
            <div className="fee-item">
              <label>优先费用 (EIP-1559):</label>
              <span className="fee-value">
                {(Number(feeData.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei
              </span>
            </div>
          )}

          <div className="fee-item">
            <label>平均费用 (20次):</label>
            <span className="fee-value">
              {averageFee.toFixed(2)} Gwei
            </span>
          </div>
        </div>
      )}

      <div className="fee-chart">
        <h4>费用趋势</h4>
        <div className="chart-container">
          {feeHistory.map((fee, index) => (
            <div
              key={index}
              className="chart-bar"
              style={{
                height: `${(fee / Math.max(...feeHistory)) * 100}%`,
                backgroundColor: fee > averageFee ? '#ef4444' : '#10b981'
              }}
              title={`${fee.toFixed(2)} Gwei`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 智能费用建议

```tsx
import { useFeeData } from 'wagmi'
import { useMemo } from 'react'

function SmartFeeRecommendation() {
  const { data: feeData, isLoading } = useFeeData({
    watch: true,
  })

  const feeRecommendations = useMemo(() => {
    if (!feeData?.maxFeePerGas || !feeData?.maxPriorityFeePerGas) {
      return null
    }

    const baseFee = Number(feeData.maxFeePerGas - feeData.maxPriorityFeePerGas)
    const priorityFee = Number(feeData.maxPriorityFeePerGas)

    return {
      slow: {
        maxFeePerGas: BigInt(Math.floor(baseFee * 1.1 + priorityFee * 0.8)),
        maxPriorityFeePerGas: BigInt(Math.floor(priorityFee * 0.8)),
        estimatedTime: '5-10 分钟',
        confidence: 'low'
      },
      standard: {
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        estimatedTime: '1-3 分钟',
        confidence: 'medium'
      },
      fast: {
        maxFeePerGas: BigInt(Math.floor(baseFee * 1.2 + priorityFee * 1.5)),
        maxPriorityFeePerGas: BigInt(Math.floor(priorityFee * 1.5)),
        estimatedTime: '< 1 分钟',
        confidence: 'high'
      }
    }
  }, [feeData])

  const calculateTransactionCost = (gasLimit: number, feePerGas: bigint) => {
    const totalCost = BigInt(gasLimit) * feePerGas
    return {
      wei: totalCost,
      eth: Number(totalCost) / 1e18,
      usd: (Number(totalCost) / 1e18) * 2000 // 假设 ETH 价格为 $2000
    }
  }

  if (isLoading) {
    return <div>计算费用建议中...</div>
  }

  if (!feeRecommendations) {
    return <div>无法获取费用建议</div>
  }

  return (
    <div className="fee-recommendations">
      <h3>智能费用建议</h3>
      
      <div className="recommendations-grid">
        {Object.entries(feeRecommendations).map(([speed, recommendation]) => {
          const gasLimit = 21000 // 标准转账 Gas 限制
          const cost = calculateTransactionCost(gasLimit, recommendation.maxFeePerGas)
          
          return (
            <div key={speed} className={`recommendation-card ${speed}`}>
              <div className="speed-label">
                {speed === 'slow' ? '慢速' : 
                 speed === 'standard' ? '标准' : '快速'}
              </div>
              
              <div className="time-estimate">
                {recommendation.estimatedTime}
              </div>
              
              <div className="fee-details">
                <div className="fee-row">
                  <span>最大费用:</span>
                  <span>{(Number(recommendation.maxFeePerGas) / 1e9).toFixed(2)} Gwei</span>
                </div>
                <div className="fee-row">
                  <span>优先费用:</span>
                  <span>{(Number(recommendation.maxPriorityFeePerGas) / 1e9).toFixed(2)} Gwei</span>
                </div>
              </div>
              
              <div className="cost-estimate">
                <div className="cost-eth">
                  {cost.eth.toFixed(6)} ETH
                </div>
                <div className="cost-usd">
                  ≈ ${cost.usd.toFixed(2)}
                </div>
              </div>
              
              <div className={`confidence confidence-${recommendation.confidence}`}>
                确认概率: {recommendation.confidence === 'low' ? '低' :
                         recommendation.confidence === 'medium' ? '中' : '高'}
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="fee-explanation">
        <h4>费用说明</h4>
        <ul>
          <li><strong>慢速</strong>: 费用最低，但可能需要等待较长时间</li>
          <li><strong>标准</strong>: 平衡费用和速度，推荐选择</li>
          <li><strong>快速</strong>: 费用较高，但能快速确认</li>
        </ul>
      </div>
    </div>
  )
}
```

### 多链费用对比

```tsx
import { useFeeData } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

function MultiChainFeeComparison() {
  const { data: mainnetFee } = useFeeData({ chainId: mainnet.id })
  const { data: polygonFee } = useFeeData({ chainId: polygon.id })
  const { data: arbitrumFee } = useFeeData({ chainId: arbitrum.id })
  const { data: optimismFee } = useFeeData({ chainId: optimism.id })

  const chains = [
    { 
      name: 'Ethereum', 
      chainId: mainnet.id, 
      feeData: mainnetFee, 
      color: '#627EEA',
      gasLimit: 21000
    },
    { 
      name: 'Polygon', 
      chainId: polygon.id, 
      feeData: polygonFee, 
      color: '#8247E5',
      gasLimit: 21000
    },
    { 
      name: 'Arbitrum', 
      chainId: arbitrum.id, 
      feeData: arbitrumFee, 
      color: '#28A0F0',
      gasLimit: 21000
    },
    { 
      name: 'Optimism', 
      chainId: optimism.id, 
      feeData: optimismFee, 
      color: '#FF0420',
      gasLimit: 21000
    }
  ]

  const calculateCost = (feeData: any, gasLimit: number) => {
    if (!feeData?.gasPrice) return null
    
    const totalCost = BigInt(gasLimit) * feeData.gasPrice
    return {
      wei: totalCost,
      eth: Number(totalCost) / 1e18,
      gwei: Number(feeData.gasPrice) / 1e9
    }
  }

  const getCheapestChain = () => {
    const costs = chains
      .map(chain => ({
        name: chain.name,
        cost: calculateCost(chain.feeData, chain.gasLimit)
      }))
      .filter(item => item.cost !== null)
      .sort((a, b) => a.cost!.eth - b.cost!.eth)
    
    return costs[0]?.name || null
  }

  const cheapestChain = getCheapestChain()

  return (
    <div className="multi-chain-fee-comparison">
      <h3>多链费用对比</h3>
      
      <div className="comparison-grid">
        {chains.map(chain => {
          const cost = calculateCost(chain.feeData, chain.gasLimit)
          const isCheapest = chain.name === cheapestChain
          
          return (
            <div 
              key={chain.chainId} 
              className={`chain-card ${isCheapest ? 'cheapest' : ''}`}
              style={{ borderColor: chain.color }}
            >
              <div className="chain-header">
                <div 
                  className="chain-indicator"
                  style={{ backgroundColor: chain.color }}
                />
                <span className="chain-name">{chain.name}</span>
                {isCheapest && <span className="cheapest-badge">最便宜</span>}
              </div>
              
              {cost ? (
                <div className="fee-info">
                  <div className="gas-price">
                    {cost.gwei.toFixed(2)} Gwei
                  </div>
                  <div className="transaction-cost">
                    转账费用: {cost.eth.toFixed(6)} ETH
                  </div>
                  <div className="cost-comparison">
                    {cheapestChain && chain.name !== cheapestChain && (
                      <span className="cost-multiplier">
                        比 {cheapestChain} 贵 {
                          (cost.eth / calculateCost(
                            chains.find(c => c.name === cheapestChain)?.feeData,
                            chain.gasLimit
                          )!.eth).toFixed(1)
                        }x
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  费用数据不可用
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="comparison-summary">
        <h4>费用对比总结</h4>
        <div className="summary-stats">
          {cheapestChain && (
            <div className="stat">
              <span className="stat-label">最便宜网络:</span>
              <span className="stat-value">{cheapestChain}</span>
            </div>
          )}
          <div className="stat">
            <span className="stat-label">对比基准:</span>
            <span className="stat-value">标准转账 (21,000 Gas)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 费用历史分析

```tsx
import { useFeeData } from 'wagmi'
import { useState, useEffect } from 'react'

function FeeHistoryAnalysis() {
  const [feeHistory, setFeeHistory] = useState<{
    timestamp: number
    gasPrice: number
    maxFeePerGas?: number
    maxPriorityFeePerGas?: number
  }[]>([])

  const { data: feeData } = useFeeData({
    watch: true,
    refetchInterval: 30000, // 每30秒更新
  })

  // 记录费用历史
  useEffect(() => {
    if (feeData?.gasPrice) {
      const newEntry = {
        timestamp: Date.now(),
        gasPrice: Number(feeData.gasPrice) / 1e9,
        maxFeePerGas: feeData.maxFeePerGas ? Number(feeData.maxFeePerGas) / 1e9 : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? Number(feeData.maxPriorityFeePerGas) / 1e9 : undefined
      }
      
      setFeeHistory(prev => {
        const updated = [...prev, newEntry]
        // 保留最近24小时的数据
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        return updated.filter(entry => entry.timestamp > oneDayAgo)
      })
    }
  }, [feeData])

  const getStatistics = () => {
    if (feeHistory.length === 0) return null

    const gasPrices = feeHistory.map(entry => entry.gasPrice)
    const min = Math.min(...gasPrices)
    const max = Math.max(...gasPrices)
    const avg = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length
    const current = gasPrices[gasPrices.length - 1]

    return { min, max, avg, current }
  }

  const getBestTimeToTransact = () => {
    if (feeHistory.length < 10) return null

    // 按小时分组计算平均费用
    const hourlyAverages = new Map<number, number[]>()
    
    feeHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours()
      if (!hourlyAverages.has(hour)) {
        hourlyAverages.set(hour, [])
      }
      hourlyAverages.get(hour)!.push(entry.gasPrice)
    })

    const hourlyStats = Array.from(hourlyAverages.entries()).map(([hour, prices]) => ({
      hour,
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      sampleCount: prices.length
    })).filter(stat => stat.sampleCount >= 3) // 至少3个样本

    if (hourlyStats.length === 0) return null

    const cheapestHour = hourlyStats.reduce((min, current) => 
      current.avgPrice < min.avgPrice ? current : min
    )

    return cheapestHour
  }

  const stats = getStatistics()
  const bestTime = getBestTimeToTransact()

  return (
    <div className="fee-history-analysis">
      <h3>费用历史分析</h3>
      
      {stats && (
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-label">当前费用</div>
            <div className="stat-value">{stats.current.toFixed(2)} Gwei</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">24小时平均</div>
            <div className="stat-value">{stats.avg.toFixed(2)} Gwei</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">24小时最低</div>
            <div className="stat-value">{stats.min.toFixed(2)} Gwei</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">24小时最高</div>
            <div className="stat-value">{stats.max.toFixed(2)} Gwei</div>
          </div>
        </div>
      )}

      {bestTime && (
        <div className="best-time-recommendation">
          <h4>最佳交易时间</h4>
          <div className="recommendation">
            <span className="time">{bestTime.hour}:00 - {bestTime.hour + 1}:00</span>
            <span className="price">平均 {bestTime.avgPrice.toFixed(2)} Gwei</span>
            <span className="savings">
              比当前便宜 {((stats!.current - bestTime.avgPrice) / stats!.current * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="fee-trend-chart">
        <h4>费用趋势 (最近24小时)</h4>
        <div className="chart">
          {feeHistory.slice(-48).map((entry, index) => {
            const height = stats ? (entry.gasPrice / stats.max) * 100 : 0
            const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })
            
            return (
              <div
                key={index}
                className="chart-point"
                style={{ height: `${height}%` }}
                title={`${time}: ${entry.gasPrice.toFixed(2)} Gwei`}
              />
            )
          })}
        </div>
        <div className="chart-labels">
          <span>24小时前</span>
          <span>现在</span>
        </div>
      </div>

      <div className="data-summary">
        <p>数据点: {feeHistory.length}</p>
        <p>更新频率: 每30秒</p>
        <p>数据保留: 24小时</p>
      </div>
    </div>
  )
}
```

## 常见问题

### Q: EIP-1559 和 Legacy Gas 的区别？
A: EIP-1559 使用 `maxFeePerGas` 和 `maxPriorityFeePerGas`，Legacy 使用固定的 `gasPrice`。

### Q: 如何选择合适的 Gas 价格？
A: 根据交易紧急程度选择：不急用标准价格，急用可适当提高优先费用。

### Q: 费用数据多久更新一次？
A: 默认情况下会缓存，可以设置 `watch: true` 实时监听。

### Q: 如何处理费用数据获取失败？
A: 使用错误处理和重试机制，提供备用的费用估算方案。

## 下一步

- [useNetwork](/wagmi/hooks/network/use-network) - 学习获取网络信息
- [useSendTransaction](/wagmi/hooks/transactions/use-send-transaction) - 学习发送交易
- [usePrepareSendTransaction](/wagmi/hooks/transactions/use-prepare-send-transaction) - 学习准备交易