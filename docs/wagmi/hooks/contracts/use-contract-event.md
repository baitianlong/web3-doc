---
title: useContractEvent
description: 监听智能合约事件的 React Hook
keywords: [wagmi, useContractEvent, 合约事件, 事件监听, 智能合约, React Hook, Web3]
---

# useContractEvent

`useContractEvent` 用于监听智能合约事件，提供实时的事件数据和状态更新功能。

## 基本用法

```tsx
import { useContractEvent } from 'wagmi'

const contractConfig = {
  address: '0x...',
  abi: [
    {
      name: 'Transfer',
      type: 'event',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ],
} as const

function TransferListener() {
  useContractEvent({
    ...contractConfig,
    eventName: 'Transfer',
    listener: (logs) => {
      console.log('新的转账事件:', logs)
    },
  })

  return <div>正在监听转账事件...</div>
}
```

## 参数配置

### 合约配置
- `address` - 合约地址
- `abi` - 合约 ABI
- `eventName` - 事件名称
- `listener` - 事件处理函数

### 过滤选项
- `args` - 事件参数过滤
- `chainId` - 指定链 ID
- `enabled` - 是否启用监听

## 详细示例

### ERC-20 转账监听

```tsx
import { useContractEvent } from 'wagmi'
import { useState } from 'react'
import { formatUnits } from 'viem'

interface TransferEvent {
  from: string
  to: string
  value: bigint
  blockNumber: number
  transactionHash: string
  timestamp: number
}

function ERC20TransferListener({ tokenAddress, userAddress }: {
  tokenAddress: string
  userAddress?: string
}) {
  const [transfers, setTransfers] = useState<TransferEvent[]>([])

  // 监听所有转账事件
  useContractEvent({
    address: tokenAddress,
    abi: ERC20_ABI,
    eventName: 'Transfer',
    listener: (logs) => {
      const newTransfers = logs.map(log => ({
        from: log.args.from,
        to: log.args.to,
        value: log.args.value,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setTransfers(prev => [...newTransfers, ...prev].slice(0, 50)) // 保留最新50条
    },
  })

  // 监听用户相关的转账
  useContractEvent({
    address: tokenAddress,
    abi: ERC20_ABI,
    eventName: 'Transfer',
    args: {
      from: userAddress,
    },
    listener: (logs) => {
      console.log('用户发出的转账:', logs)
    },
    enabled: !!userAddress,
  })

  useContractEvent({
    address: tokenAddress,
    abi: ERC20_ABI,
    eventName: 'Transfer',
    args: {
      to: userAddress,
    },
    listener: (logs) => {
      console.log('用户接收的转账:', logs)
    },
    enabled: !!userAddress,
  })

  return (
    <div className="transfer-listener">
      <h3>实时转账监听</h3>
      
      <div className="transfers-list">
        {transfers.map((transfer, index) => (
          <div key={`${transfer.transactionHash}-${index}`} className="transfer-item">
            <div className="transfer-info">
              <div className="addresses">
                <span className="from">从: {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</span>
                <span className="arrow">→</span>
                <span className="to">到: {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}</span>
              </div>
              
              <div className="amount">
                金额: {formatUnits(transfer.value, 18)} 代币
              </div>
              
              <div className="meta">
                <span className="block">区块: {transfer.blockNumber}</span>
                <span className="time">{new Date(transfer.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="transaction-link">
              <a 
                href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                查看交易
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {transfers.length === 0 && (
        <div className="no-transfers">
          暂无转账记录
        </div>
      )}
    </div>
  )
}
```

### NFT 交易监听

```tsx
import { useContractEvent } from 'wagmi'
import { useState } from 'react'

const ERC721_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'approved', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const

function NFTEventListener({ contractAddress }: { contractAddress: string }) {
  const [nftEvents, setNftEvents] = useState<any[]>([])

  // 监听 NFT 转移
  useContractEvent({
    address: contractAddress,
    abi: ERC721_ABI,
    eventName: 'Transfer',
    listener: (logs) => {
      const transferEvents = logs.map(log => ({
        type: 'Transfer',
        from: log.args.from,
        to: log.args.to,
        tokenId: log.args.tokenId.toString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setNftEvents(prev => [...transferEvents, ...prev].slice(0, 100))
    },
  })

  // 监听 NFT 授权
  useContractEvent({
    address: contractAddress,
    abi: ERC721_ABI,
    eventName: 'Approval',
    listener: (logs) => {
      const approvalEvents = logs.map(log => ({
        type: 'Approval',
        owner: log.args.owner,
        approved: log.args.approved,
        tokenId: log.args.tokenId.toString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setNftEvents(prev => [...approvalEvents, ...prev].slice(0, 100))
    },
  })

  const formatAddress = (address: string) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return '铸造'
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="nft-event-listener">
      <h3>NFT 事件监听</h3>
      
      <div className="events-stats">
        <div className="stat-item">
          <span className="label">总事件数:</span>
          <span className="value">{nftEvents.length}</span>
        </div>
        <div className="stat-item">
          <span className="label">转移事件:</span>
          <span className="value">
            {nftEvents.filter(e => e.type === 'Transfer').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="label">授权事件:</span>
          <span className="value">
            {nftEvents.filter(e => e.type === 'Approval').length}
          </span>
        </div>
      </div>

      <div className="events-list">
        {nftEvents.map((event, index) => (
          <div key={`${event.transactionHash}-${index}`} className={`event-item ${event.type.toLowerCase()}`}>
            <div className="event-header">
              <span className="event-type">{event.type}</span>
              <span className="token-id">#{event.tokenId}</span>
              <span className="timestamp">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="event-details">
              {event.type === 'Transfer' ? (
                <div className="transfer-details">
                  <span className="from">{formatAddress(event.from)}</span>
                  <span className="arrow">→</span>
                  <span className="to">{formatAddress(event.to)}</span>
                </div>
              ) : (
                <div className="approval-details">
                  <span className="owner">所有者: {formatAddress(event.owner)}</span>
                  <span className="approved">授权给: {formatAddress(event.approved)}</span>
                </div>
              )}
            </div>
            
            <div className="event-meta">
              <span className="block">区块 {event.blockNumber}</span>
              <a 
                href={`https://etherscan.io/tx/${event.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                查看交易
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### DeFi 协议事件监听

```tsx
import { useContractEvent } from 'wagmi'
import { useState, useMemo } from 'react'

function DeFiEventListener({ protocolAddress }: { protocolAddress: string }) {
  const [defiEvents, setDefiEvents] = useState<any[]>([])

  // 监听存款事件
  useContractEvent({
    address: protocolAddress,
    abi: [
      {
        name: 'Deposit',
        type: 'event',
        inputs: [
          { name: 'user', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'shares', type: 'uint256', indexed: false },
        ],
      },
    ],
    eventName: 'Deposit',
    listener: (logs) => {
      const deposits = logs.map(log => ({
        type: 'Deposit',
        user: log.args.user,
        amount: log.args.amount,
        shares: log.args.shares,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setDefiEvents(prev => [...deposits, ...prev])
    },
  })

  // 监听提取事件
  useContractEvent({
    address: protocolAddress,
    abi: [
      {
        name: 'Withdraw',
        type: 'event',
        inputs: [
          { name: 'user', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'shares', type: 'uint256', indexed: false },
        ],
      },
    ],
    eventName: 'Withdraw',
    listener: (logs) => {
      const withdrawals = logs.map(log => ({
        type: 'Withdraw',
        user: log.args.user,
        amount: log.args.amount,
        shares: log.args.shares,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setDefiEvents(prev => [...withdrawals, ...prev])
    },
  })

  // 统计数据
  const stats = useMemo(() => {
    const deposits = defiEvents.filter(e => e.type === 'Deposit')
    const withdrawals = defiEvents.filter(e => e.type === 'Withdraw')
    
    const totalDeposited = deposits.reduce((sum, d) => sum + Number(formatUnits(d.amount, 18)), 0)
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(formatUnits(w.amount, 18)), 0)
    
    return {
      totalDeposits: deposits.length,
      totalWithdrawals: withdrawals.length,
      totalDeposited: totalDeposited.toFixed(2),
      totalWithdrawn: totalWithdrawn.toFixed(2),
      netFlow: (totalDeposited - totalWithdrawn).toFixed(2),
    }
  }, [defiEvents])

  return (
    <div className="defi-event-listener">
      <h3>DeFi 协议事件监听</h3>
      
      <div className="defi-stats">
        <div className="stats-grid">
          <div className="stat-card deposit">
            <h4>存款统计</h4>
            <p className="stat-number">{stats.totalDeposits}</p>
            <p className="stat-label">总存款次数</p>
            <p className="stat-amount">{stats.totalDeposited} 代币</p>
          </div>
          
          <div className="stat-card withdraw">
            <h4>提取统计</h4>
            <p className="stat-number">{stats.totalWithdrawals}</p>
            <p className="stat-label">总提取次数</p>
            <p className="stat-amount">{stats.totalWithdrawn} 代币</p>
          </div>
          
          <div className="stat-card net-flow">
            <h4>净流入</h4>
            <p className={`stat-number ${parseFloat(stats.netFlow) >= 0 ? 'positive' : 'negative'}`}>
              {stats.netFlow}
            </p>
            <p className="stat-label">代币</p>
          </div>
        </div>
      </div>

      <div className="events-timeline">
        <h4>事件时间线</h4>
        {defiEvents.slice(0, 20).map((event, index) => (
          <div key={`${event.transactionHash}-${index}`} className={`timeline-item ${event.type.toLowerCase()}`}>
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <div className="event-header">
                <span className="event-type">{event.type}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="event-details">
                <p>用户: {event.user.slice(0, 6)}...{event.user.slice(-4)}</p>
                <p>金额: {formatUnits(event.amount, 18)} 代币</p>
                <p>份额: {formatUnits(event.shares, 18)}</p>
              </div>
              
              <div className="event-link">
                <a 
                  href={`https://etherscan.io/tx/${event.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看交易
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

## 高级用法

### 事件过滤和搜索

```tsx
import { useContractEvent } from 'wagmi'
import { useState, useMemo } from 'react'

function EventFilter() {
  const [events, setEvents] = useState<any[]>([])
  const [filterAddress, setFilterAddress] = useState('')
  const [filterAmount, setFilterAmount] = useState('')

  useContractEvent({
    address: '0x...',
    abi: ERC20_ABI,
    eventName: 'Transfer',
    listener: (logs) => {
      const newEvents = logs.map(log => ({
        from: log.args.from,
        to: log.args.to,
        value: log.args.value,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setEvents(prev => [...newEvents, ...prev])
    },
  })

  // 过滤事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const addressMatch = !filterAddress || 
        event.from.toLowerCase().includes(filterAddress.toLowerCase()) ||
        event.to.toLowerCase().includes(filterAddress.toLowerCase())
      
      const amountMatch = !filterAmount || 
        Number(formatUnits(event.value, 18)) >= parseFloat(filterAmount)
      
      return addressMatch && amountMatch
    })
  }, [events, filterAddress, filterAmount])

  return (
    <div className="event-filter">
      <div className="filter-controls">
        <input
          type="text"
          value={filterAddress}
          onChange={(e) => setFilterAddress(e.target.value)}
          placeholder="过滤地址"
        />
        <input
          type="number"
          value={filterAmount}
          onChange={(e) => setFilterAmount(e.target.value)}
          placeholder="最小金额"
        />
      </div>
      
      <div className="filtered-events">
        {filteredEvents.map((event, index) => (
          <div key={index} className="event-item">
            {/* 事件显示 */}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 事件通知系统

```tsx
import { useContractEvent } from 'wagmi'
import { useState, useEffect } from 'react'

function EventNotificationSystem({ userAddress }: { userAddress: string }) {
  const [notifications, setNotifications] = useState<any[]>([])

  // 监听用户相关事件
  useContractEvent({
    address: '0x...',
    abi: ERC20_ABI,
    eventName: 'Transfer',
    args: {
      to: userAddress, // 只监听发送给用户的转账
    },
    listener: (logs) => {
      logs.forEach(log => {
        const notification = {
          id: `${log.transactionHash}-${log.logIndex}`,
          type: 'incoming_transfer',
          title: '收到转账',
          message: `您收到了 ${formatUnits(log.args.value, 18)} 代币`,
          from: log.args.from,
          amount: log.args.value,
          timestamp: Date.now(),
          read: false,
        }
        
        setNotifications(prev => [notification, ...prev])
        
        // 显示浏览器通知
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/token-icon.png',
          })
        }
      })
    },
    enabled: !!userAddress,
  })

  // 请求通知权限
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notification-system">
      <div className="notification-header">
        <h3>事件通知 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h3>
        <button onClick={clearAll}>清空全部</button>
      </div>
      
      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="notification-time">
                {new Date(notification.timestamp).toLocaleString()}
              </span>
            </div>
            
            {!notification.read && <div className="unread-indicator"></div>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 最佳实践

### 1. 性能优化

```tsx
function OptimizedEventListener() {
  const [events, setEvents] = useState<any[]>([])

  useContractEvent({
    address: '0x...',
    abi: contractABI,
    eventName: 'Transfer',
    listener: useCallback((logs) => {
      // 批量处理事件，避免频繁更新状态
      const newEvents = logs.map(log => ({
        // 处理事件数据
      }))
      
      setEvents(prev => {
        // 限制事件数量，避免内存泄漏
        const combined = [...newEvents, ...prev]
        return combined.slice(0, 1000) // 只保留最新1000条
      })
    }, []),
  })

  return <div>优化的事件监听</div>
}
```

### 2. 错误处理

```tsx
function RobustEventListener() {
  const [error, setError] = useState<string>()

  useContractEvent({
    address: '0x...',
    abi: contractABI,
    eventName: 'Transfer',
    listener: (logs) => {
      try {
        // 处理事件
        setError(undefined)
      } catch (err) {
        setError(err.message)
        console.error('事件处理失败:', err)
      }
    },
  })

  if (error) {
    return <div>事件监听出错: {error}</div>
  }

  return <div>正常监听中...</div>
}
```

## 常见问题

### Q: 如何监听历史事件？
A: `useContractEvent` 只监听新事件，历史事件需要使用 `getLogs` 或其他方法。

### Q: 事件监听会消耗很多资源吗？
A: 合理使用，限制事件数量，及时清理不需要的监听器。

### Q: 如何处理网络重连？
A: Wagmi 会自动处理重连，但可能会丢失部分事件，需要考虑补偿机制。

## 下一步

- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习合约数据读取
- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习合约写入操作
- [useBlockNumber](/wagmi/hooks/network/use-block-number) - 学习区块监听