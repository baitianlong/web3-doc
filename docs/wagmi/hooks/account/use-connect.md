---
title: useConnect
description: 连接钱包的 React Hook
keywords: [wagmi, useConnect, 钱包连接, MetaMask, WalletConnect, React Hook, Web3]
---

# useConnect

`useConnect` 是 Wagmi 中用于连接钱包的核心 Hook。它提供了连接不同钱包、管理连接状态、处理连接错误等功能。

## 基本用法

```tsx
import { useConnect } from 'wagmi'

function ConnectWallet() {
  const { connect, connectors, isLoading, pendingConnector } = useConnect()

  return (
    <div>
      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {!connector.ready && ' (不支持)'}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            ' (连接中)'}
        </button>
      ))}
    </div>
  )
}
```

## 返回值

### 连接函数
- `connect` - 连接钱包的函数
- `connectAsync` - 异步连接钱包的函数

### 连接器信息
- `connectors` - 可用的连接器数组
- `pendingConnector` - 当前正在连接的连接器

### 状态信息
- `isLoading` - 是否正在连接
- `isIdle` - 是否处于空闲状态
- `isSuccess` - 是否连接成功
- `isError` - 是否连接失败

### 错误信息
- `error` - 连接错误信息
- `reset` - 重置连接状态

## 详细示例

### 基础连接组件

```tsx
import { useConnect, useAccount } from 'wagmi'

function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <p>已连接: {address}</p>
      </div>
    )
  }

  return (
    <div className="wallet-connection">
      <h3>选择钱包</h3>
      
      <div className="connector-list">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={!connector.ready || isLoading}
            className={`connector-button ${
              isLoading && pendingConnector?.id === connector.id 
                ? 'connecting' 
                : ''
            }`}
          >
            <div className="connector-info">
              <span className="connector-name">{connector.name}</span>
              {!connector.ready && (
                <span className="connector-status">不支持</span>
              )}
              {isLoading && pendingConnector?.id === connector.id && (
                <span className="connector-status">连接中...</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <p>连接失败: {error.message}</p>
        </div>
      )}
    </div>
  )
}
```

### 异步连接处理

```tsx
import { useConnect } from 'wagmi'
import { useState } from 'react'

function AsyncConnectExample() {
  const { connectAsync, connectors } = useConnect()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const handleConnect = async (connector: any) => {
    try {
      setIsConnecting(true)
      setConnectionError(null)
      
      const result = await connectAsync({ connector })
      console.log('连接成功:', result)
      
      // 连接成功后的处理
      localStorage.setItem('lastConnector', connector.id)
      
    } catch (error: any) {
      console.error('连接失败:', error)
      setConnectionError(error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={!connector.ready || isConnecting}
        >
          {isConnecting ? '连接中...' : `连接 ${connector.name}`}
        </button>
      ))}
      
      {connectionError && (
        <div className="error">
          错误: {connectionError}
        </div>
      )}
    </div>
  )
}
```

### 连接器详细信息

```tsx
import { useConnect } from 'wagmi'

function ConnectorDetails() {
  const { connect, connectors, isLoading, pendingConnector } = useConnect()

  return (
    <div className="connector-details">
      <h3>可用钱包 ({connectors.length})</h3>
      
      {connectors.map((connector) => (
        <div key={connector.id} className="connector-card">
          <div className="connector-header">
            <h4>{connector.name}</h4>
            <span className={`status ${connector.ready ? 'ready' : 'not-ready'}`}>
              {connector.ready ? '可用' : '不可用'}
            </span>
          </div>
          
          <div className="connector-info">
            <p><strong>ID:</strong> {connector.id}</p>
            <p><strong>类型:</strong> {connector.type || '未知'}</p>
            <p><strong>就绪状态:</strong> {connector.ready ? '是' : '否'}</p>
          </div>
          
          <button
            onClick={() => connect({ connector })}
            disabled={!connector.ready || isLoading}
            className="connect-button"
          >
            {isLoading && pendingConnector?.id === connector.id ? (
              <span>
                <span className="spinner"></span>
                连接中...
              </span>
            ) : (
              `连接 ${connector.name}`
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
```

## 连接器配置

### MetaMask 连接器

```tsx
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(
  [mainnet, polygon],
  [publicProvider()]
)

const metaMaskConnector = new MetaMaskConnector({
  chains,
  options: {
    shimDisconnect: true,
    UNSTABLE_shimOnConnectSelectAccount: true,
  },
})

const config = createConfig({
  connectors: [metaMaskConnector],
  publicClient,
})
```

### WalletConnect 连接器

```tsx
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const walletConnectConnector = new WalletConnectConnector({
  chains,
  options: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    metadata: {
      name: 'My DApp',
      description: 'My DApp Description',
      url: 'https://mydapp.com',
      icons: ['https://mydapp.com/icon.png'],
    },
  },
})
```

### Coinbase Wallet 连接器

```tsx
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

const coinbaseConnector = new CoinbaseWalletConnector({
  chains,
  options: {
    appName: 'My DApp',
    appLogoUrl: 'https://mydapp.com/logo.png',
  },
})
```

## 高级用法

### 自动重连

```tsx
import { useConnect, useAccount } from 'wagmi'
import { useEffect } from 'react'

function AutoReconnect() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  useEffect(() => {
    // 尝试自动重连上次使用的连接器
    const lastConnectorId = localStorage.getItem('lastConnector')
    
    if (!isConnected && lastConnectorId) {
      const lastConnector = connectors.find(c => c.id === lastConnectorId)
      if (lastConnector && lastConnector.ready) {
        connect({ connector: lastConnector })
      }
    }
  }, [isConnected, connect, connectors])

  return null // 这是一个后台组件
}
```

### 连接状态管理

```tsx
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'

function ConnectionManager() {
  const { isConnected, address } = useAccount()
  const { connect, connectors, isLoading, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [connectionHistory, setConnectionHistory] = useState<string[]>([])

  useEffect(() => {
    if (isConnected && address) {
      setConnectionHistory(prev => [...prev, `连接: ${address} at ${new Date().toLocaleString()}`])
    }
  }, [isConnected, address])

  const handleConnect = (connector: any) => {
    connect({ connector })
    localStorage.setItem('preferredConnector', connector.id)
  }

  const handleDisconnect = () => {
    disconnect()
    setConnectionHistory(prev => [...prev, `断开连接 at ${new Date().toLocaleString()}`])
  }

  return (
    <div className="connection-manager">
      <div className="connection-status">
        <h3>连接状态</h3>
        <p>状态: {isConnected ? '已连接' : '未连接'}</p>
        {address && <p>地址: {address}</p>}
      </div>

      {!isConnected ? (
        <div className="connector-selection">
          <h4>选择钱包</h4>
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={!connector.ready || isLoading}
              className="connector-btn"
            >
              {connector.name}
              {!connector.ready && ' (不可用)'}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={handleDisconnect} className="disconnect-btn">
          断开连接
        </button>
      )}

      {error && (
        <div className="error-display">
          <h4>连接错误</h4>
          <p>{error.message}</p>
        </div>
      )}

      <div className="connection-history">
        <h4>连接历史</h4>
        <ul>
          {connectionHistory.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### 多链连接

```tsx
import { useConnect, useNetwork, useSwitchNetwork } from 'wagmi'
import { mainnet, polygon, arbitrum } from 'wagmi/chains'

function MultiChainConnect() {
  const { connect, connectors } = useConnect()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()

  const supportedChains = [mainnet, polygon, arbitrum]

  const handleConnectWithChain = async (connector: any, targetChain: any) => {
    try {
      // 先连接钱包
      await connect({ connector })
      
      // 然后切换到目标链
      if (chain?.id !== targetChain.id) {
        switchNetwork?.(targetChain.id)
      }
    } catch (error) {
      console.error('连接失败:', error)
    }
  }

  return (
    <div className="multi-chain-connect">
      <h3>多链连接</h3>
      
      {connectors.map((connector) => (
        <div key={connector.id} className="connector-section">
          <h4>{connector.name}</h4>
          <div className="chain-buttons">
            {supportedChains.map((targetChain) => (
              <button
                key={targetChain.id}
                onClick={() => handleConnectWithChain(connector, targetChain)}
                disabled={!connector.ready}
                className="chain-connect-btn"
              >
                连接到 {targetChain.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

## 错误处理

### 常见错误类型

```tsx
import { useConnect } from 'wagmi'
import { useState } from 'react'

function ErrorHandling() {
  const { connect, connectors, error, reset } = useConnect()
  const [customError, setCustomError] = useState<string | null>(null)

  const handleConnect = async (connector: any) => {
    try {
      setCustomError(null)
      reset() // 重置之前的错误
      
      await connect({ connector })
    } catch (err: any) {
      // 处理特定错误类型
      if (err.code === 4001) {
        setCustomError('用户拒绝了连接请求')
      } else if (err.code === -32002) {
        setCustomError('请检查钱包是否已打开连接请求')
      } else if (err.message.includes('No provider')) {
        setCustomError('未检测到钱包，请安装相应的钱包扩展')
      } else {
        setCustomError(`连接失败: ${err.message}`)
      }
    }
  }

  const getErrorMessage = () => {
    if (customError) return customError
    if (error) {
      switch (error.name) {
        case 'ConnectorNotFoundError':
          return '未找到连接器，请安装相应的钱包'
        case 'UserRejectedRequestError':
          return '用户拒绝了连接请求'
        case 'ResourceUnavailableError':
          return '钱包资源不可用，请重试'
        default:
          return error.message
      }
    }
    return null
  }

  return (
    <div className="error-handling">
      <div className="connectors">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            disabled={!connector.ready}
          >
            连接 {connector.name}
          </button>
        ))}
      </div>

      {getErrorMessage() && (
        <div className="error-message">
          <p>{getErrorMessage()}</p>
          <button onClick={() => { reset(); setCustomError(null); }}>
            重试
          </button>
        </div>
      )}
    </div>
  )
}
```

### 连接超时处理

```tsx
import { useConnect } from 'wagmi'
import { useState, useRef } from 'react'

function ConnectionTimeout() {
  const { connect, connectors } = useConnect()
  const [isConnecting, setIsConnecting] = useState(false)
  const [timeoutError, setTimeoutError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleConnectWithTimeout = async (connector: any, timeoutMs = 30000) => {
    setIsConnecting(true)
    setTimeoutError(null)

    // 设置超时
    timeoutRef.current = setTimeout(() => {
      setTimeoutError('连接超时，请重试')
      setIsConnecting(false)
    }, timeoutMs)

    try {
      await connect({ connector })
      clearTimeout(timeoutRef.current)
    } catch (error) {
      clearTimeout(timeoutRef.current)
      console.error('连接失败:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="connection-timeout">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnectWithTimeout(connector)}
          disabled={!connector.ready || isConnecting}
        >
          {isConnecting ? '连接中...' : `连接 ${connector.name}`}
        </button>
      ))}

      {timeoutError && (
        <div className="timeout-error">
          <p>{timeoutError}</p>
        </div>
      )}
    </div>
  )
}
```

## 自定义连接器

### 创建自定义连接器

```tsx
import { Connector } from 'wagmi'
import { Chain } from 'wagmi/chains'

class CustomWalletConnector extends Connector {
  readonly id = 'customWallet'
  readonly name = 'Custom Wallet'
  readonly ready = typeof window !== 'undefined' && !!window.customWallet

  constructor(config: { chains?: Chain[] }) {
    super(config)
  }

  async connect() {
    try {
      const provider = await this.getProvider()
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      const chainId = await provider.request({ method: 'eth_chainId' })

      return {
        account,
        chain: { id: parseInt(chainId, 16), unsupported: false },
        provider,
      }
    } catch (error) {
      throw new Error('连接自定义钱包失败')
    }
  }

  async disconnect() {
    // 实现断开连接逻辑
  }

  async getAccount() {
    const provider = await this.getProvider()
    const accounts = await provider.request({ method: 'eth_accounts' })
    return accounts[0]
  }

  async getChainId() {
    const provider = await this.getProvider()
    const chainId = await provider.request({ method: 'eth_chainId' })
    return parseInt(chainId, 16)
  }

  async getProvider() {
    if (typeof window !== 'undefined' && window.customWallet) {
      return window.customWallet
    }
    throw new Error('Custom wallet not found')
  }

  async isAuthorized() {
    try {
      const account = await this.getAccount()
      return !!account
    } catch {
      return false
    }
  }
}

// 使用自定义连接器
function CustomConnectorExample() {
  const customConnector = new CustomWalletConnector({ chains: [mainnet] })
  const { connect } = useConnect()

  return (
    <button onClick={() => connect({ connector: customConnector })}>
      连接自定义钱包
    </button>
  )
}
```

## 性能优化

### 连接器懒加载

```tsx
import { useConnect } from 'wagmi'
import { lazy, Suspense } from 'react'

// 懒加载连接器组件
const MetaMaskConnector = lazy(() => import('./connectors/MetaMaskConnector'))
const WalletConnectConnector = lazy(() => import('./connectors/WalletConnectConnector'))

function LazyConnectors() {
  const { connectors } = useConnect()

  return (
    <div className="lazy-connectors">
      <Suspense fallback={<div>加载连接器...</div>}>
        {connectors.map((connector) => {
          switch (connector.id) {
            case 'metaMask':
              return <MetaMaskConnector key={connector.id} connector={connector} />
            case 'walletConnect':
              return <WalletConnectConnector key={connector.id} connector={connector} />
            default:
              return (
                <button key={connector.id} onClick={() => connect({ connector })}>
                  {connector.name}
                </button>
              )
          }
        })}
      </Suspense>
    </div>
  )
}
```

### 连接状态缓存

```tsx
import { useConnect, useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

function ConnectionCache() {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const [cachedConnections, setCachedConnections] = useState<string[]>([])

  useEffect(() => {
    // 从本地存储加载缓存的连接
    const cached = localStorage.getItem('connectionCache')
    if (cached) {
      setCachedConnections(JSON.parse(cached))
    }
  }, [])

  useEffect(() => {
    // 缓存成功的连接
    if (isConnected && address) {
      const newCache = [...cachedConnections, address].slice(-5) // 只保留最近5个
      setCachedConnections(newCache)
      localStorage.setItem('connectionCache', JSON.stringify(newCache))
    }
  }, [isConnected, address])

  return (
    <div className="connection-cache">
      <div className="recent-connections">
        <h4>最近连接</h4>
        {cachedConnections.map((addr, index) => (
          <div key={index} className="cached-address">
            {addr.slice(0, 6)}...{addr.slice(-4)}
          </div>
        ))}
      </div>
      
      <div className="connectors">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
          >
            {connector.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

## 测试

### 单元测试

```tsx
import { renderHook, act } from '@testing-library/react'
import { useConnect } from 'wagmi'
import { createConfig, WagmiConfig } from 'wagmi'
import { MockConnector } from 'wagmi/connectors/mock'

// 测试工具
function createWrapper() {
  const config = createConfig({
    connectors: [new MockConnector()],
    publicClient: mockPublicClient,
  })

  return ({ children }: { children: React.ReactNode }) => (
    <WagmiConfig config={config}>{children}</WagmiConfig>
  )
}

describe('useConnect', () => {
  it('应该返回可用的连接器', () => {
    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(),
    })

    expect(result.current.connectors).toHaveLength(1)
    expect(result.current.connectors[0].name).toBe('Mock')
  })

  it('应该能够连接钱包', async () => {
    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.connect({ connector: result.current.connectors[0] })
    })

    expect(result.current.isSuccess).toBe(true)
  })

  it('应该处理连接错误', async () => {
    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(),
    })

    // 模拟连接失败
    const mockConnector = {
      ...result.current.connectors[0],
      connect: jest.fn().mockRejectedValue(new Error('连接失败')),
    }

    await act(async () => {
      try {
        await result.current.connect({ connector: mockConnector })
      } catch (error) {
        // 预期的错误
      }
    })

    expect(result.current.isError).toBe(true)
  })
})
```

## API 参考

### useConnect 参数

```typescript
interface UseConnectConfig {
  connector?: Connector
  onConnect?: (data: ConnectResult) => void
  onError?: (error: Error) => void
  onMutate?: (args: ConnectArgs) => void
  onSettled?: (data?: ConnectResult, error?: Error) => void
  onSuccess?: (data: ConnectResult) => void
}
```

### 返回值类型

```typescript
interface UseConnectResult {
  connect: (args: ConnectArgs) => void
  connectAsync: (args: ConnectArgs) => Promise<ConnectResult>
  connectors: Connector[]
  data?: ConnectResult
  error?: Error
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  pendingConnector?: Connector
  reset: () => void
  status: 'idle' | 'loading' | 'success' | 'error'
  variables?: ConnectArgs
}
```

### 连接器接口

```typescript
interface Connector {
  id: string
  name: string
  type: string
  ready: boolean
  icon?: string
  connect(config?: { chainId?: number }): Promise<ConnectResult>
  disconnect(): Promise<void>
  getAccount(): Promise<string>
  getChainId(): Promise<number>
  getProvider(): Promise<any>
  isAuthorized(): Promise<boolean>
  switchChain?(chainId: number): Promise<void>
}
```

## 最佳实践

### 1. 用户体验优化

```tsx
function OptimizedConnectButton() {
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="connect-trigger"
      >
        连接钱包
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>选择钱包</h3>
            <div className="connector-grid">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector })
                    setShowModal(false)
                  }}
                  disabled={!connector.ready || isLoading}
                  className="connector-card"
                >
                  <img src={connector.icon} alt={connector.name} />
                  <span>{connector.name}</span>
                  {isLoading && pendingConnector?.id === connector.id && (
                    <div className="loading-spinner" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### 2. 错误恢复

```tsx
function RobustConnection() {
  const { connect, connectors, error, reset } = useConnect()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector })
      setRetryCount(0) // 重置重试计数
    } catch (err) {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          handleConnect(connector)
        }, 1000 * (retryCount + 1)) // 递增延迟
      }
    }
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => handleConnect(connector)}
          disabled={!connector.ready}
        >
          {connector.name}
          {retryCount > 0 && ` (重试 ${retryCount}/${maxRetries})`}
        </button>
      ))}
      
      {error && retryCount >= maxRetries && (
        <div className="error-final">
          <p>连接失败，已达到最大重试次数</p>
          <button onClick={() => { reset(); setRetryCount(0); }}>
            重新开始
          </button>
        </div>
      )}
    </div>
  )
}
```

### 3. 安全考虑

```tsx
function SecureConnection() {
  const { connect, connectors } = useConnect()
  const [trustedConnectors] = useState(['metaMask', 'walletConnect', 'coinbaseWallet'])

  const handleSecureConnect = (connector: any) => {
    // 验证连接器是否在信任列表中
    if (!trustedConnectors.includes(connector.id)) {
      console.warn('不受信任的连接器:', connector.id)
      return
    }

    // 检查连接器是否准备就绪
    if (!connector.ready) {
      console.warn('连接器未准备就绪:', connector.id)
      return
    }

    connect({ connector })
  }

  return (
    <div className="secure-connection">
      <div className="security-notice">
        <p>⚠️ 只连接您信任的钱包</p>
      </div>
      
      {connectors
        .filter(connector => trustedConnectors.includes(connector.id))
        .map((connector) => (
          <button
            key={connector.id}
            onClick={() => handleSecureConnect(connector)}
            className="trusted-connector"
          >
            ✅ {connector.name}
          </button>
        ))}
    </div>
  )
}
```

## 常见问题

### Q: 为什么某些连接器显示为不可用？
A: 连接器的 `ready` 状态取决于用户是否安装了相应的钱包扩展。例如，MetaMask 连接器只有在安装了 MetaMask 扩展时才会显示为可用。

### Q: 如何处理用户拒绝连接的情况？
A: 监听 `error` 状态，检查错误代码 4001（用户拒绝）并提供相应的用户提示。

### Q: 可以同时连接多个钱包吗？
A: Wagmi 一次只支持一个活跃连接。如果需要多钱包支持，需要自定义实现。

### Q: 如何实现自动重连？
A: 使用 `autoConnect` 配置选项，或在应用启动时检查之前的连接状态。

## 下一步

- [useAccount](/wagmi/hooks/account/use-account) - 学习如何获取账户信息
- [useDisconnect](/wagmi/hooks/account/use-disconnect) - 学习如何断开连接
- [useBalance](/wagmi/hooks/account/use-balance) - 学习如何获取账户余额
- [钱包连接器示例](/wagmi/examples/wallet-connector) - 查看完整的连接器实现
