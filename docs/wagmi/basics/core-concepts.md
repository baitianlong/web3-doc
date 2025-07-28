# 核心概念

本章将深入介绍 Wagmi 的核心概念，帮助您理解 Wagmi 的架构和设计理念。

## 1. Wagmi 架构概览

Wagmi 基于以下核心组件构建：

```
┌─────────────────┐
│   React App     │
├─────────────────┤
│   Wagmi Hooks   │
├─────────────────┤
│  React Query    │
├─────────────────┤
│   Connectors    │
├─────────────────┤
│   Providers     │
├─────────────────┤
│   Blockchain    │
└─────────────────┘
```

### 架构层次说明

- **React App**: 您的应用层
- **Wagmi Hooks**: 提供 React hooks API
- **React Query**: 处理数据缓存和状态管理
- **Connectors**: 连接不同的钱包
- **Providers**: 与区块链网络通信
- **Blockchain**: 底层区块链网络

## 2. 配置系统 (Config)

### 基本配置

```tsx
import { createConfig, configureChains } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

// 配置链和提供者
const { chains, publicClient } = configureChains(
  [mainnet, polygon],
  [publicProvider()]
)

// 创建配置
const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  publicClient,
})
```

### 配置选项详解

```tsx
const config = createConfig({
  // 自动连接上次使用的钱包
  autoConnect: true,
  
  // 钱包连接器
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'your-project-id',
      },
    }),
  ],
  
  // 公共客户端（用于读取数据）
  publicClient,
  
  // WebSocket 客户端（用于实时数据）
  webSocketPublicClient,
  
  // 存储配置
  storage: createStorage({
    storage: window.localStorage,
    key: 'wagmi',
  }),
  
  // 日志级别
  logger: {
    warn: console.warn,
    error: console.error,
  },
})
```

## 3. 连接器 (Connectors)

连接器是 Wagmi 与不同钱包通信的桥梁。

### 内置连接器

```tsx
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'

const connectors = [
  // MetaMask
  new MetaMaskConnector({
    chains,
    options: {
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
    },
  }),
  
  // WalletConnect
  new WalletConnectConnector({
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
  }),
  
  // Coinbase Wallet
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'My DApp',
      appLogoUrl: 'https://mydapp.com/logo.png',
    },
  }),
  
  // 通用注入式钱包
  new InjectedConnector({
    chains,
    options: {
      name: 'Injected',
      shimDisconnect: true,
    },
  }),
]
```

### 自定义连接器

```tsx
import { Connector } from 'wagmi'

class CustomConnector extends Connector {
  readonly id = 'custom'
  readonly name = 'Custom Wallet'
  readonly ready = true

  constructor(config: { chains?: Chain[] } = {}) {
    super({ chains: config.chains, options: {} })
  }

  async connect() {
    // 实现连接逻辑
    const provider = await this.getProvider()
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    })
    
    return {
      account: accounts[0],
      chain: { id: 1, unsupported: false },
      provider,
    }
  }

  async disconnect() {
    // 实现断开连接逻辑
  }

  async getAccount() {
    // 获取当前账户
  }

  async getChainId() {
    // 获取当前链 ID
  }

  async getProvider() {
    // 获取提供者实例
  }

  async getSigner() {
    // 获取签名者
  }

  async isAuthorized() {
    // 检查是否已授权
  }

  async switchChain(chainId: number) {
    // 切换网络
  }

  protected onAccountsChanged(accounts: string[]) {
    // 处理账户变化
  }

  protected onChainChanged(chainId: string | number) {
    // 处理链变化
  }

  protected onDisconnect() {
    // 处理断开连接
  }
}
```

## 4. 提供者 (Providers)

提供者负责与区块链网络通信。

### 内置提供者

```tsx
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

const { publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon],
  [
    // Alchemy（推荐用于生产环境）
    alchemyProvider({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID!,
      priority: 0,
    }),
    
    // Infura
    infuraProvider({ 
      apiKey: process.env.NEXT_PUBLIC_INFURA_ID!,
      priority: 1,
    }),
    
    // 自定义 JSON-RPC
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://rpc.ankr.com/${chain.network}`,
        webSocket: `wss://rpc.ankr.com/${chain.network}/ws`,
      }),
      priority: 2,
    }),
    
    // 公共提供者（备用）
    publicProvider({ priority: 3 }),
  ]
)
```

### 提供者优先级

```tsx
// 提供者按优先级排序，数字越小优先级越高
const providers = [
  alchemyProvider({ apiKey: 'key', priority: 0 }),    // 最高优先级
  infuraProvider({ apiKey: 'key', priority: 1 }),     // 次优先级
  publicProvider({ priority: 2 }),                    // 最低优先级
]
```

### 自定义提供者

```tsx
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

const customProvider = jsonRpcProvider({
  rpc: (chain) => {
    // 根据链返回不同的 RPC 端点
    switch (chain.id) {
      case 1: // Mainnet
        return { http: 'https://eth-mainnet.g.alchemy.com/v2/your-key' }
      case 137: // Polygon
        return { http: 'https://polygon-mainnet.g.alchemy.com/v2/your-key' }
      default:
        return { http: chain.rpcUrls.default.http[0] }
    }
  },
})
```

## 5. 链配置 (Chains)

### 内置链

```tsx
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum,
  goerli,
  sepolia 
} from 'wagmi/chains'

const chains = [
  mainnet,    // 以太坊主网
  polygon,    // Polygon
  optimism,   // Optimism
  arbitrum,   // Arbitrum
  goerli,     // Goerli 测试网
  sepolia,    // Sepolia 测试网
]
```

### 自定义链

```tsx
import { Chain } from 'wagmi'

const avalanche: Chain = {
  id: 43_114,
  name: 'Avalanche',
  network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    etherscan: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
}

// 本地开发链
const localhost: Chain = {
  id: 31_337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
}
```

## 6. React Query 集成

Wagmi 基于 React Query 构建，提供强大的缓存和状态管理。

### 查询配置

```tsx
import { useContractRead } from 'wagmi'

function TokenBalance() {
  const { data, isLoading, error, refetch } = useContractRead({
    address: '0x...',
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: ['0x...'],
    
    // React Query 选项
    enabled: true,                    // 是否启用查询
    staleTime: 1000 * 60 * 5,        // 数据过期时间（5分钟）
    cacheTime: 1000 * 60 * 10,       // 缓存时间（10分钟）
    refetchInterval: 1000 * 30,      // 自动刷新间隔（30秒）
    refetchOnWindowFocus: true,      // 窗口聚焦时刷新
    retry: 3,                        // 重试次数
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Wagmi 特定选项
    watch: true,                     // 监听区块变化
    chainId: 1,                      // 指定链 ID
    
    // 回调函数
    onSuccess: (data) => {
      console.log('查询成功:', data)
    },
    onError: (error) => {
      console.error('查询失败:', error)
    },
  })

  return (
    <div>
      {isLoading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {data && <div>余额: {data.toString()}</div>}
      <button onClick={() => refetch()}>刷新</button>
    </div>
  )
}
```

### 全局查询配置

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5分钟
      cacheTime: 1000 * 60 * 10,     // 10分钟
      retry: (failureCount, error) => {
        // 自定义重试逻辑
        if (error.message.includes('User rejected')) {
          return false // 用户拒绝时不重试
        }
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // 变更操作不重试
    },
  },
})

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

## 7. 类型安全

Wagmi 提供完整的 TypeScript 支持。

### ABI 类型化

```tsx
// 定义类型化的 ABI
const erc20ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const // 重要：使用 as const

// 使用类型化的合约
function TypedContract() {
  const { data: balance } = useContractRead({
    address: '0x...',
    abi: erc20ABI,
    functionName: 'balanceOf', // 自动补全
    args: ['0x...'],           // 类型检查
  })

  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: erc20ABI,
    functionName: 'transfer',  // 自动补全
    args: ['0x...', 100n],     // 类型检查
  })

  return <div>余额: {balance?.toString()}</div>
}
```

### 自定义类型

```tsx
import { Address, Hash } from 'wagmi'

interface TokenInfo {
  address: Address
  name: string
  symbol: string
  decimals: number
}

interface TransactionResult {
  hash: Hash
  blockNumber: number
  gasUsed: bigint
}

function useTokenInfo(tokenAddress: Address): TokenInfo | undefined {
  const { data: name } = useContractRead({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'name',
  })

  const { data: symbol } = useContractRead({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'symbol',
  })

  const { data: decimals } = useContractRead({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'decimals',
  })

  if (!name || !symbol || decimals === undefined) return undefined

  return {
    address: tokenAddress,
    name,
    symbol,
    decimals,
  }
}
```

## 8. 错误处理

### 错误类型

```tsx
import { useContractWrite } from 'wagmi'
import { UserRejectedRequestError, ContractFunctionExecutionError } from 'viem'

function ErrorHandling() {
  const { write, error, isError } = useContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    args: ['0x...', 100n],
    onError: (error) => {
      if (error instanceof UserRejectedRequestError) {
        console.log('用户拒绝了交易')
      } else if (error instanceof ContractFunctionExecutionError) {
        console.log('合约执行失败:', error.shortMessage)
      } else {
        console.error('未知错误:', error)
      }
    },
  })

  return (
    <div>
      <button onClick={() => write?.()}>发送交易</button>
      {isError && (
        <div className="error">
          错误: {error?.message}
        </div>
      )}
    </div>
  )
}
```

### 全局错误处理

```tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="error-boundary">
      <h2>出现了错误</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

function App() {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={reset}
    >
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <YourApp />
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  )
}
```

## 9. 性能优化

### 条件查询

```tsx
function ConditionalQuery({ enabled }: { enabled: boolean }) {
  const { data } = useContractRead({
    address: '0x...',
    abi: contractABI,
    functionName: 'getData',
    enabled, // 只在需要时查询
  })

  return <div>{data?.toString()}</div>
}
```

### 查询去重

```tsx
// 相同的查询会自动去重和缓存
function Component1() {
  const { data } = useBalance({ address: '0x...' }) // 首次查询
}

function Component2() {
  const { data } = useBalance({ address: '0x...' }) // 使用缓存
}
```

### 预取数据

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { fetchBalance } from 'wagmi/actions'

function PrefetchExample() {
  const queryClient = useQueryClient()

  const prefetchBalance = async (address: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['balance', { address }],
      queryFn: () => fetchBalance({ address }),
      staleTime: 1000 * 60 * 5, // 5分钟
    })
  }

  return (
    <button 
      onMouseEnter={() => prefetchBalance('0x...')}
    >
      悬停预取余额
    </button>
  )
}
```

## 10. 测试

### 模拟配置

```tsx
// test-utils.tsx
import { createConfig } from 'wagmi'
import { MockConnector } from 'wagmi/connectors/mock'

export const mockConfig = createConfig({
  connectors: [
    new MockConnector({
      options: {
        walletClient: createWalletClient({
          account: '0x...',
          chain: mainnet,
          transport: http(),
        }),
      },
    }),
  ],
  publicClient: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
})

export function renderWithWagmi(ui: React.ReactElement) {
  return render(
    <WagmiConfig config={mockConfig}>
      <QueryClientProvider client={new QueryClient()}>
        {ui}
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

### 测试示例

```tsx
// Component.test.tsx
import { renderWithWagmi } from './test-utils'
import { screen } from '@testing-library/react'

test('显示账户地址', async () => {
  renderWithWagmi(<AccountComponent />)
  
  expect(await screen.findByText(/0x.../)).toBeInTheDocument()
})
```

## 下一步

- [与 Ethers.js 对比](/wagmi/basics/ethers-comparison) - 详细对比两种方案
- [useAccount](/wagmi/hooks/account/use-account) - 开始使用账户管理
- [useConnect](/wagmi/hooks/account/use-connect) - 学习钱包连接
- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习合约读取
