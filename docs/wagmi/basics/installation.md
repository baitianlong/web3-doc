# 安装和配置

本章将详细介绍如何在 React 项目中安装和配置 Wagmi，以及如何设置不同的开发环境。

## 安装依赖

### 1. 核心依赖

```bash
# 使用 npm
npm install wagmi viem @tanstack/react-query

# 使用 yarn
yarn add wagmi viem @tanstack/react-query

# 使用 pnpm
pnpm add wagmi viem @tanstack/react-query
```

### 2. 可选依赖

```bash
# 钱包连接器
npm install @wagmi/connectors

# 额外的链配置
npm install @wagmi/chains

# 开发工具
npm install --save-dev @types/react @types/react-dom
```

## 基本配置

### 1. 创建 Wagmi 配置

```tsx
// src/wagmi.ts
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'

// 配置支持的链
const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID! }),
    publicProvider()
  ]
)

// 配置钱包连接器
const { connectors } = getDefaultWallets({
  appName: 'My DApp',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains
})

// 创建 Wagmi 配置
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

export { chains }
```

### 2. 设置 React Query

```tsx
// src/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { config } from './wagmi'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

### 3. 在应用中使用

```tsx
// src/App.tsx
import { Providers } from './providers'
import { WalletConnection } from './components/WalletConnection'

function App() {
  return (
    <Providers>
      <div className="App">
        <h1>我的 DApp</h1>
        <WalletConnection />
      </div>
    </Providers>
  )
}

export default App
```

## 不同框架的配置

### 1. Next.js 配置

**安装依赖：**
```bash
npx create-next-app@latest my-dapp --typescript --tailwind --eslint
cd my-dapp
npm install wagmi viem @tanstack/react-query
```

**配置文件：**
```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { config } from '../wagmi'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

**环境变量：**
```bash
# .env.local
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 2. Vite + React 配置

**创建项目：**
```bash
npm create vite@latest my-dapp -- --template react-ts
cd my-dapp
npm install
npm install wagmi viem @tanstack/react-query
```

**配置文件：**
```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Providers } from './providers.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
)
```

**环境变量：**
```bash
# .env
VITE_ALCHEMY_ID=your_alchemy_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 3. Create React App 配置

**创建项目：**
```bash
npx create-react-app my-dapp --template typescript
cd my-dapp
npm install wagmi viem @tanstack/react-query
```

**配置文件：**
```tsx
// src/index.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { Providers } from './providers'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)
```

**环境变量：**
```bash
# .env
REACT_APP_ALCHEMY_ID=your_alchemy_api_key
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 高级配置

### 1. 自定义连接器

```tsx
// src/connectors.ts
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

export const connectors = [
  new MetaMaskConnector({
    chains,
    options: {
      shimDisconnect: true,
    },
  }),
  new WalletConnectConnector({
    chains,
    options: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    },
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'My DApp',
    },
  }),
  new InjectedConnector({
    chains,
    options: {
      name: 'Injected',
      shimDisconnect: true,
    },
  }),
]
```

### 2. 自定义提供者

```tsx
// src/providers.ts
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

export const providers = [
  alchemyProvider({ 
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID!,
    priority: 0,
  }),
  infuraProvider({ 
    apiKey: process.env.NEXT_PUBLIC_INFURA_ID!,
    priority: 1,
  }),
  jsonRpcProvider({
    rpc: (chain) => ({
      http: `https://rpc.ankr.com/eth`,
    }),
    priority: 2,
  }),
  publicProvider({ priority: 3 }),
]
```

### 3. 多链配置

```tsx
// src/chains.ts
import { Chain } from 'wagmi'

// 自定义链配置
export const avalanche: Chain = {
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

// 测试网配置
export const goerli: Chain = {
  id: 5,
  name: 'Goerli',
  network: 'goerli',
  nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    alchemy: { http: ['https://eth-goerli.g.alchemy.com/v2'] },
    infura: { http: ['https://goerli.infura.io/v3'] },
    default: { http: ['https://rpc.ankr.com/eth_goerli'] },
    public: { http: ['https://rpc.ankr.com/eth_goerli'] },
  },
  blockExplorers: {
    etherscan: { name: 'Etherscan', url: 'https://goerli.etherscan.io' },
    default: { name: 'Etherscan', url: 'https://goerli.etherscan.io' },
  },
  testnet: true,
}
```

### 4. 完整的配置示例

```tsx
// src/wagmi.config.ts
import { configureChains, createConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, goerli } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

// 根据环境选择链
const isProduction = process.env.NODE_ENV === 'production'
const chains = isProduction 
  ? [mainnet, polygon, optimism, arbitrum]
  : [goerli, mainnet]

// 配置链和提供者
const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  [
    alchemyProvider({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID!,
    }),
    publicProvider(),
  ]
)

// 配置连接器
const connectors = [
  new MetaMaskConnector({
    chains,
    options: {
      shimDisconnect: true,
    },
  }),
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
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'My DApp',
      appLogoUrl: 'https://mydapp.com/logo.png',
    },
  }),
]

// 创建配置
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }
```

## 开发工具配置

### 1. TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
```

### 2. ESLint 配置

```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 3. 开发脚本

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## 环境变量管理

### 1. 环境变量文件

```bash
# .env.local (Next.js)
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_api_key
NEXT_PUBLIC_INFURA_ID=your_infura_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# .env.development
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_CHAIN_ID=5

# .env.production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_CHAIN_ID=1
```

### 2. 环境变量验证

```tsx
// src/env.ts
const requiredEnvVars = {
  NEXT_PUBLIC_ALCHEMY_ID: process.env.NEXT_PUBLIC_ALCHEMY_ID,
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
}

// 验证必需的环境变量
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

export const env = requiredEnvVars
```

## 调试和开发工具

### 1. React Query Devtools

```tsx
// src/providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

### 2. 网络状态监控

```tsx
// src/components/NetworkStatus.tsx
import { useNetwork, useAccount } from 'wagmi'

export function NetworkStatus() {
  const { chain } = useNetwork()
  const { isConnected } = useAccount()

  if (!isConnected) return null

  return (
    <div className="network-status">
      <span>网络: {chain?.name}</span>
      <span>链 ID: {chain?.id}</span>
      {chain?.testnet && <span className="testnet">测试网</span>}
    </div>
  )
}
```

### 3. 错误边界

```tsx
// src/components/ErrorBoundary.tsx
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wagmi Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了错误</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## 性能优化

### 1. 代码分割

```tsx
// src/components/LazyWalletConnection.tsx
import { lazy, Suspense } from 'react'

const WalletConnection = lazy(() => import('./WalletConnection'))

export function LazyWalletConnection() {
  return (
    <Suspense fallback={<div>加载钱包组件...</div>}>
      <WalletConnection />
    </Suspense>
  )
}
```

### 2. 缓存配置

```tsx
// src/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      cacheTime: 1000 * 60 * 10, // 10 分钟
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

## 下一步

- [核心概念](/wagmi/basics/core-concepts) - 了解 Wagmi 的核心概念
- [与 Ethers.js 对比](/wagmi/basics/ethers-comparison) - 详细的对比分析
- [useAccount](/wagmi/hooks/account/use-account) - 开始使用第一个 hook