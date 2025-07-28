# Wagmi 简介

Wagmi 是一个用于以太坊的 React Hooks 库，它提供了一套完整的 hooks 来简化 Web3 前端开发。Wagmi 基于 Ethers.js 构建，但提供了更加 React 友好的 API。

## 什么是 Wagmi

Wagmi 是 "We're All Gonna Make It" 的缩写，它是一个现代化的 React hooks 库，专门为以太坊 DApp 开发而设计：

- **React 优先**：专为 React 应用设计的 hooks
- **TypeScript 支持**：完整的 TypeScript 类型定义
- **缓存和状态管理**：内置智能缓存和状态管理
- **多钱包支持**：支持多种钱包连接器
- **多链支持**：轻松支持多个区块链网络

## 核心特性

### 1. React Hooks 设计

```tsx
import { useAccount, useBalance, useConnect } from 'wagmi'

function WalletInfo() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { connect, connectors } = useConnect()

  if (!isConnected) {
    return (
      <div>
        {connectors.map((connector) => (
          <button key={connector.id} onClick={() => connect({ connector })}>
            连接 {connector.name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p>地址: {address}</p>
      <p>余额: {balance?.formatted} {balance?.symbol}</p>
    </div>
  )
}
```

### 2. 自动缓存和重新验证

```tsx
import { useContractRead } from 'wagmi'

function TokenBalance({ address }: { address: string }) {
  const { data: balance, isLoading, error } = useContractRead({
    address: '0x...', // 代币合约地址
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true, // 自动监听变化
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return <div>余额: {balance?.toString()}</div>
}
```

### 3. 类型安全

```tsx
import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'

const contractConfig = {
  address: '0x...' as const,
  abi: [
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
  ] as const,
}

function TransferToken() {
  const { config } = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'transfer',
    args: ['0x...', parseEther('1')],
  })

  const { write, isLoading } = useContractWrite(config)

  return (
    <button disabled={!write || isLoading} onClick={() => write?.()}>
      {isLoading ? '发送中...' : '发送代币'}
    </button>
  )
}
```

## 与 Ethers.js 的对比

### 连接钱包

**Ethers.js 方式：**
```typescript
// Ethers.js
import { ethers } from 'ethers'

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      return { provider, signer, address }
    } catch (error) {
      console.error('连接失败:', error)
    }
  }
}
```

**Wagmi 方式：**
```tsx
// Wagmi
import { useAccount, useConnect } from 'wagmi'

function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading } = useConnect()

  if (isConnected) {
    return <div>已连接: {address}</div>
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isLoading}
        >
          连接 {connector.name}
        </button>
      ))}
    </div>
  )
}
```

### 读取合约数据

**Ethers.js 方式：**
```typescript
// Ethers.js
import { ethers } from 'ethers'

async function getTokenBalance(userAddress: string) {
  const provider = new ethers.JsonRpcProvider('...')
  const contract = new ethers.Contract(tokenAddress, abi, provider)
  
  try {
    const balance = await contract.balanceOf(userAddress)
    return ethers.formatUnits(balance, 18)
  } catch (error) {
    console.error('获取余额失败:', error)
  }
}

// 需要手动管理状态和错误
function TokenBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function fetchBalance() {
      setLoading(true)
      try {
        const bal = await getTokenBalance(address)
        setBalance(bal || '')
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [address])

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>
  return <div>余额: {balance}</div>
}
```

**Wagmi 方式：**
```tsx
// Wagmi
import { useContractRead } from 'wagmi'

function TokenBalance({ address }: { address: string }) {
  const { data: balance, isLoading, error } = useContractRead({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true, // 自动监听变化
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>
  return <div>余额: {balance?.toString()}</div>
}
```

### 发送交易

**Ethers.js 方式：**
```typescript
// Ethers.js
async function sendTransaction() {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    
    const tx = await signer.sendTransaction({
      to: '0x...',
      value: ethers.parseEther('1.0')
    })
    
    console.log('交易哈希:', tx.hash)
    const receipt = await tx.wait()
    console.log('交易确认:', receipt)
  } catch (error) {
    console.error('交易失败:', error)
  }
}
```

**Wagmi 方式：**
```tsx
// Wagmi
import { useSendTransaction, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'

function SendTransaction() {
  const { data, sendTransaction, isLoading } = useSendTransaction({
    to: '0x...',
    value: parseEther('1'),
  })

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
  })

  return (
    <div>
      <button 
        onClick={() => sendTransaction?.()} 
        disabled={isLoading}
      >
        {isLoading ? '发送中...' : '发送交易'}
      </button>
      {isConfirming && <div>等待确认...</div>}
      {data && <div>交易哈希: {data.hash}</div>}
    </div>
  )
}
```

## 主要优势

### 1. 简化的状态管理

```tsx
// 无需手动管理加载状态、错误状态和数据缓存
const { data, isLoading, error } = useContractRead({
  address: '0x...',
  abi: contractABI,
  functionName: 'getData',
})
```

### 2. 自动重新验证

```tsx
// 自动监听区块变化并重新获取数据
const { data } = useContractRead({
  address: '0x...',
  abi: contractABI,
  functionName: 'balanceOf',
  args: [userAddress],
  watch: true, // 启用自动监听
})
```

### 3. 智能缓存

```tsx
// 相同的查询会被缓存，避免重复请求
function Component1() {
  const { data } = useBalance({ address: '0x...' }) // 首次请求
}

function Component2() {
  const { data } = useBalance({ address: '0x...' }) // 使用缓存
}
```

### 4. 类型安全

```tsx
// 完整的 TypeScript 支持
const { data } = useContractRead({
  address: '0x...',
  abi: contractABI, // 类型化的 ABI
  functionName: 'balanceOf', // 自动补全函数名
  args: ['0x...'], // 自动验证参数类型
})
```

## 核心概念

### 1. Connectors（连接器）

连接器负责与不同的钱包进行通信：

```tsx
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const connectors = [
  new MetaMaskConnector(),
  new WalletConnectConnector({
    options: {
      projectId: 'your-project-id',
    },
  }),
]
```

### 2. Providers（提供者）

提供者负责与区块链网络通信：

```tsx
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'

const providers = [
  alchemyProvider({ apiKey: 'your-api-key' }),
  publicProvider(),
]
```

### 3. Chains（链）

定义支持的区块链网络：

```tsx
import { mainnet, polygon, arbitrum } from 'wagmi/chains'

const chains = [mainnet, polygon, arbitrum]
```

## 使用场景

### 1. DeFi 应用

```tsx
function DeFiDashboard() {
  const { address } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
  })

  return (
    <div>
      <h2>我的资产</h2>
      <p>ETH: {ethBalance?.formatted}</p>
      <p>USDC: {usdcBalance?.toString()}</p>
    </div>
  )
}
```

### 2. NFT 市场

```tsx
function NFTCollection() {
  const { address } = useAccount()
  const { data: nftBalance } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: nftABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
  })

  return (
    <div>
      <h2>我的 NFT</h2>
      <p>拥有数量: {nftBalance?.toString()}</p>
    </div>
  )
}
```

### 3. DAO 治理

```tsx
function GovernanceVoting() {
  const { address } = useAccount()
  const { data: votingPower } = useContractRead({
    address: GOVERNANCE_TOKEN_ADDRESS,
    abi: governanceABI,
    functionName: 'getVotes',
    args: [address!],
    enabled: !!address,
  })

  return (
    <div>
      <h2>治理投票</h2>
      <p>投票权重: {votingPower?.toString()}</p>
    </div>
  )
}
```

## 开发环境设置

### 1. 基本设置

```bash
npm install wagmi viem @tanstack/react-query
```

### 2. 配置 Wagmi

```tsx
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

const { chains, publicClient } = configureChains(
  [mainnet, polygon],
  [publicProvider()]
)

const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  publicClient,
})

function App() {
  return (
    <WagmiConfig config={config}>
      <YourApp />
    </WagmiConfig>
  )
}
```

## 下一步

- [安装和配置](/wagmi/basics/installation) - 详细的安装和配置指南
- [核心概念](/wagmi/basics/core-concepts) - 深入了解 Wagmi 的核心概念
- [与 Ethers.js 对比](/wagmi/basics/ethers-comparison) - 详细的对比分析
- [账户管理](/wagmi/hooks/account/use-account) - 开始使用账户相关的 hooks