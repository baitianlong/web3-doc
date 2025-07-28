---
title: useAccount
description: 获取当前连接的账户信息的 React Hook
keywords: [wagmi, useAccount, 账户, 钱包, 地址, React Hook, Web3]
---

# useAccount

`useAccount` 是 Wagmi 中用于获取当前连接账户信息的核心 Hook。它提供了账户地址、连接状态、连接器信息等重要数据。

## 基本用法

```tsx
import { useAccount } from 'wagmi'

function Profile() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()

  if (isConnecting) return <div>连接中...</div>
  if (isDisconnected) return <div>未连接钱包</div>

  return (
    <div>
      <p>账户地址: {address}</p>
      <p>连接状态: {isConnected ? '已连接' : '未连接'}</p>
    </div>
  )
}
```

## 返回值

### 账户信息
- `address` - 当前账户地址
- `addresses` - 所有可用账户地址数组
- `chain` - 当前链信息
- `chainId` - 当前链 ID
- `connector` - 当前使用的连接器

### 连接状态
- `isConnected` - 是否已连接
- `isConnecting` - 是否正在连接
- `isDisconnected` - 是否已断开连接
- `isReconnecting` - 是否正在重新连接

### 连接器信息
- `status` - 连接状态字符串

## 完整示例

```tsx
import { useAccount, useEnsName } from 'wagmi'

function AccountInfo() {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isDisconnected,
    connector,
    chain 
  } = useAccount()

  const { data: ensName } = useEnsName({ address })

  if (isConnecting) {
    return (
      <div className="account-status">
        <div className="spinner"></div>
        <span>连接钱包中...</span>
      </div>
    )
  }

  if (isDisconnected) {
    return (
      <div className="account-status">
        <span>请连接您的钱包</span>
      </div>
    )
  }

  return (
    <div className="account-info">
      <div className="account-header">
        <h3>账户信息</h3>
        <span className="status-badge connected">已连接</span>
      </div>
      
      <div className="account-details">
        <div className="detail-item">
          <label>地址:</label>
          <span className="address">
            {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </span>
        </div>
        
        <div className="detail-item">
          <label>完整地址:</label>
          <code className="full-address">{address}</code>
        </div>
        
        <div className="detail-item">
          <label>连接器:</label>
          <span>{connector?.name}</span>
        </div>
        
        <div className="detail-item">
          <label>网络:</label>
          <span>{chain?.name} (ID: {chain?.id})</span>
        </div>
      </div>
    </div>
  )
}
```

## 监听账户变化

```tsx
import { useAccount } from 'wagmi'
import { useEffect } from 'react'

function AccountWatcher() {
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (isConnected && address) {
      console.log('账户已连接:', address)
      // 执行账户连接后的逻辑
      fetchUserData(address)
    } else {
      console.log('账户已断开')
      // 执行账户断开后的逻辑
      clearUserData()
    }
  }, [address, isConnected])

  const fetchUserData = async (userAddress: string) => {
    // 获取用户数据的逻辑
  }

  const clearUserData = () => {
    // 清除用户数据的逻辑
  }

  return <div>监听账户变化中...</div>
}
```

## 与其他 Hook 结合使用

```tsx
import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi'

function UserProfile() {
  const { address, isConnected } = useAccount()
  
  const { data: balance } = useBalance({
    address,
    enabled: isConnected,
  })
  
  const { data: ensName } = useEnsName({
    address,
    enabled: isConnected,
  })
  
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    enabled: Boolean(ensName),
  })

  if (!isConnected) {
    return <div>请先连接钱包</div>
  }

  return (
    <div className="user-profile">
      {ensAvatar && (
        <img 
          src={ensAvatar} 
          alt="ENS Avatar" 
          className="avatar"
        />
      )}
      
      <h2>{ensName || '匿名用户'}</h2>
      <p className="address">{address}</p>
      
      {balance && (
        <div className="balance">
          <span>余额: {balance.formatted} {balance.symbol}</span>
        </div>
      )}
    </div>
  )
}
```

## 最佳实践

### 1. 条件渲染

```tsx
function ConditionalContent() {
  const { isConnected, isConnecting } = useAccount()

  // 根据连接状态渲染不同内容
  if (isConnecting) return <LoadingSpinner />
  if (!isConnected) return <ConnectWalletPrompt />
  
  return <AuthenticatedContent />
}
```

### 2. 错误处理

```tsx
function SafeAccountInfo() {
  const { address, isConnected, connector } = useAccount()

  try {
    if (!isConnected || !address) {
      throw new Error('钱包未连接')
    }

    return (
      <div>
        <p>地址: {address}</p>
        <p>连接器: {connector?.name}</p>
      </div>
    )
  } catch (error) {
    return <div>错误: {error.message}</div>
  }
}
```

### 3. 性能优化

```tsx
import { useAccount } from 'wagmi'
import { useMemo } from 'react'

function OptimizedAccountDisplay() {
  const { address, isConnected } = useAccount()

  // 使用 useMemo 优化地址格式化
  const formattedAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])

  const accountStatus = useMemo(() => {
    return isConnected ? '已连接' : '未连接'
  }, [isConnected])

  return (
    <div>
      <span>{formattedAddress}</span>
      <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {accountStatus}
      </span>
    </div>
  )
}
```

## 类型定义

```typescript
interface UseAccountReturnType {
  address?: `0x${string}`
  addresses?: `0x${string}`[]
  chain?: Chain
  chainId?: number
  connector?: Connector
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  isReconnecting: boolean
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}
```

## 常见问题

### Q: 为什么 address 有时候是 undefined？
A: 当钱包未连接或正在连接时，`address` 会是 `undefined`。始终检查 `isConnected` 状态。

### Q: 如何检测账户切换？
A: 监听 `address` 的变化，当用户在钱包中切换账户时，这个值会自动更新。

### Q: 支持多账户吗？
A: 是的，`addresses` 数组包含所有可用的账户地址。

## 下一步

- [useConnect](/wagmi/hooks/account/use-connect) - 学习如何连接钱包
- [useDisconnect](/wagmi/hooks/account/use-disconnect) - 学习如何断开连接
- [useBalance](/wagmi/hooks/account/use-balance) - 学习如何获取账户余额
- [useEnsName](/wagmi/hooks/account/use-ens-name) - 学习如何获取 ENS 名称

