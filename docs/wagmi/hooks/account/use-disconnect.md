---
title: useDisconnect
description: 断开钱包连接的 React Hook
keywords: [wagmi, useDisconnect, 钱包断开, 登出, React Hook, Web3]
---

# useDisconnect

`useDisconnect` 是 Wagmi 中用于断开钱包连接的 Hook。它提供了安全断开连接、清理状态、处理断开错误等功能。

## 基本用法

```tsx
import { useDisconnect } from 'wagmi'

function DisconnectButton() {
  const { disconnect } = useDisconnect()

  return (
    <button onClick={() => disconnect()}>
      断开连接
    </button>
  )
}
```

## 返回值

### 断开函数
- `disconnect` - 断开连接的函数
- `disconnectAsync` - 异步断开连接的函数

### 状态信息
- `isLoading` - 是否正在断开连接
- `isIdle` - 是否处于空闲状态
- `isSuccess` - 是否断开成功
- `isError` - 是否断开失败

### 错误信息
- `error` - 断开连接错误信息
- `reset` - 重置断开状态

## 详细示例

### 基础断开组件

```tsx
import { useDisconnect, useAccount } from 'wagmi'

function DisconnectWallet() {
  const { address, isConnected } = useAccount()
  const { disconnect, isLoading, error } = useDisconnect()

  if (!isConnected) {
    return <div>钱包未连接</div>
  }

  return (
    <div className="disconnect-wallet">
      <div className="account-info">
        <p>当前账户: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
      </div>
      
      <button
        onClick={() => disconnect()}
        disabled={isLoading}
        className="disconnect-button"
      >
        {isLoading ? '断开中...' : '断开连接'}
      </button>

      {error && (
        <div className="error-message">
          <p>断开失败: {error.message}</p>
        </div>
      )}
    </div>
  )
}
```

### 异步断开处理

```tsx
import { useDisconnect } from 'wagmi'
import { useState } from 'react'

function AsyncDisconnectExample() {
  const { disconnectAsync } = useDisconnect()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectError, setDisconnectError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      setDisconnectError(null)
      
      await disconnectAsync()
      console.log('断开连接成功')
      
      // 断开成功后的处理
      localStorage.removeItem('lastConnector')
      localStorage.removeItem('userPreferences')
      
    } catch (error: any) {
      console.error('断开连接失败:', error)
      setDisconnectError(error.message)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
      >
        {isDisconnecting ? '断开中...' : '安全断开'}
      </button>
      
      {disconnectError && (
        <div className="error">
          错误: {disconnectError}
        </div>
      )}
    </div>
  )
}
```

### 确认断开对话框

```tsx
import { useDisconnect, useAccount } from 'wagmi'
import { useState } from 'react'

function ConfirmDisconnect() {
  const { address, isConnected } = useAccount()
  const { disconnect, isLoading } = useDisconnect()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirmDisconnect = () => {
    disconnect()
    setShowConfirm(false)
  }

  if (!isConnected) return null

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="disconnect-trigger"
      >
        断开钱包
      </button>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h3>确认断开连接</h3>
            <p>您确定要断开与钱包的连接吗？</p>
            <div className="account-preview">
              <p>当前账户: {address}</p>
            </div>
            
            <div className="dialog-actions">
              <button
                onClick={() => setShowConfirm(false)}
                className="cancel-button"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDisconnect}
                disabled={isLoading}
                className="confirm-button"
              >
                {isLoading ? '断开中...' : '确认断开'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

## 高级用法

### 自动清理和日志记录

```tsx
import { useDisconnect, useAccount } from 'wagmi'
import { useEffect } from 'react'

function SmartDisconnect() {
  const { address, isConnected } = useAccount()
  const { disconnect, isSuccess, error } = useDisconnect()

  // 记录断开连接事件
  useEffect(() => {
    if (isSuccess) {
      console.log('用户主动断开连接')
      
      // 清理本地存储
      localStorage.removeItem('walletconnect')
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
      
      // 记录断开时间
      localStorage.setItem('lastDisconnectTime', Date.now().toString())
      
      // 发送分析事件
      analytics?.track('wallet_disconnected', {
        address: address,
        timestamp: new Date().toISOString()
      })
    }
  }, [isSuccess, address])

  // 处理断开错误
  useEffect(() => {
    if (error) {
      console.error('断开连接失败:', error)
      
      // 记录错误
      analytics?.track('wallet_disconnect_error', {
        error: error.message,
        address: address
      })
    }
  }, [error, address])

  const handleSmartDisconnect = () => {
    // 保存用户偏好设置
    const userPrefs = {
      theme: localStorage.getItem('theme'),
      language: localStorage.getItem('language')
    }
    localStorage.setItem('userPreferences', JSON.stringify(userPrefs))
    
    // 执行断开
    disconnect()
  }

  return (
    <button onClick={handleSmartDisconnect}>
      智能断开
    </button>
  )
}
```

### 会话管理

```tsx
import { useDisconnect, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

function SessionManager() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const [sessionTime, setSessionTime] = useState(0)
  const [autoDisconnectTime] = useState(30 * 60 * 1000) // 30分钟

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isConnected) {
      // 开始会话计时
      const startTime = Date.now()
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        setSessionTime(elapsed)
        
        // 自动断开检查
        if (elapsed >= autoDisconnectTime) {
          console.log('会话超时，自动断开连接')
          disconnect()
        }
      }, 1000)
    } else {
      setSessionTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isConnected, autoDisconnectTime, disconnect])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getRemainingTime = () => {
    const remaining = autoDisconnectTime - sessionTime
    return Math.max(0, remaining)
  }

  if (!isConnected) return null

  return (
    <div className="session-manager">
      <div className="session-info">
        <p>会话时间: {formatTime(sessionTime)}</p>
        <p>剩余时间: {formatTime(getRemainingTime())}</p>
        <div className="session-progress">
          <div 
            className="progress-bar"
            style={{ 
              width: `${(sessionTime / autoDisconnectTime) * 100}%` 
            }}
          />
        </div>
      </div>
      
      <button
        onClick={() => disconnect()}
        className="manual-disconnect"
      >
        手动断开
      </button>
    </div>
  )
}
```

## 错误处理

### 断开连接错误处理

```tsx
import { useDisconnect } from 'wagmi'
import { useState } from 'react'

function RobustDisconnect() {
  const { disconnect, error, reset } = useDisconnect()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleDisconnectWithRetry = async () => {
    try {
      reset() // 重置之前的错误
      disconnect()
      setRetryCount(0)
    } catch (err) {
      console.error('断开连接失败:', err)
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          handleDisconnectWithRetry()
        }, 1000 * (retryCount + 1))
      }
    }
  }

  const forceDisconnect = () => {
    // 强制清理本地状态
    localStorage.clear()
    sessionStorage.clear()
    
    // 刷新页面以确保完全断开
    window.location.reload()
  }

  return (
    <div className="robust-disconnect">
      <button onClick={handleDisconnectWithRetry}>
        断开连接
        {retryCount > 0 && ` (重试 ${retryCount}/${maxRetries})`}
      </button>
      
      {error && retryCount >= maxRetries && (
        <div className="error-actions">
          <p>断开连接失败: {error.message}</p>
          <button onClick={forceDisconnect} className="force-disconnect">
            强制断开
          </button>
        </div>
      )}
    </div>
  )
}
```

## 最佳实践

### 1. 用户体验优化

```tsx
function OptimizedDisconnect() {
  const { disconnect, isLoading } = useDisconnect()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDisconnect = () => {
    disconnect()
    
    // 显示成功提示
    setTimeout(() => {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }, 500)
  }

  return (
    <div className="optimized-disconnect">
      <button
        onClick={handleDisconnect}
        disabled={isLoading}
        className={`disconnect-btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            断开中...
          </>
        ) : (
          '断开连接'
        )}
      </button>

      {showSuccess && (
        <div className="success-toast">
          ✅ 已成功断开连接
        </div>
      )}
    </div>
  )
}
```

### 2. 安全断开

```tsx
function SecureDisconnect() {
  const { disconnect } = useDisconnect()
  const { address } = useAccount()

  const handleSecureDisconnect = () => {
    // 1. 记录断开事件
    console.log(`用户 ${address} 请求断开连接`)
    
    // 2. 清理敏感数据
    const sensitiveKeys = [
      'privateKey',
      'mnemonic',
      'sessionToken',
      'authToken'
    ]
    
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    
    // 3. 执行断开
    disconnect()
    
    // 4. 清理应用状态
    // 这里可以调用应用的状态重置函数
  }

  return (
    <button onClick={handleSecureDisconnect} className="secure-disconnect">
      🔒 安全断开
    </button>
  )
}
```

## 常见问题

### Q: 断开连接后如何清理应用状态？
A: 监听 `isSuccess` 状态，在断开成功后清理本地存储和应用状态。

### Q: 如何处理断开连接失败的情况？
A: 使用 `error` 状态检测失败，提供重试机制或强制清理选项。

### Q: 可以阻止用户断开连接吗？
A: 不能阻止，但可以在断开前显示确认对话框。

### Q: 断开连接会影响其他标签页吗？
A: 是的，断开连接会影响同域名下的所有标签页。

## 下一步

- [useAccount](/wagmi/hooks/account/use-account) - 学习如何获取账户信息
- [useConnect](/wagmi/hooks/account/use-connect) - 学习如何连接钱包
- [useBalance](/wagmi/hooks/account/use-balance) - 学习如何获取账户余额