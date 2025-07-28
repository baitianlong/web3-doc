# 与 Ethers.js 对比

本章将详细对比 Wagmi 和 Ethers.js 在各个方面的差异，帮助您选择最适合的开发方案。

## 概述对比

| 特性 | Ethers.js | Wagmi |
|------|-----------|-------|
| **设计理念** | 通用 Web3 库 | React 专用 hooks 库 |
| **状态管理** | 手动管理 | 自动管理 |
| **缓存机制** | 无内置缓存 | 基于 React Query 的智能缓存 |
| **类型安全** | 良好的 TypeScript 支持 | 更强的类型推断 |
| **学习曲线** | 中等 | 较低（对 React 开发者） |
| **包大小** | 较小 | 较大（包含 React Query） |
| **适用场景** | 任何 JavaScript 环境 | React 应用 |

## 1. 项目设置对比

### Ethers.js 设置

```typescript
// 安装
npm install ethers

// 基本设置
import { ethers } from 'ethers'

// 创建提供者
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID')

// 连接钱包
const browserProvider = new ethers.BrowserProvider(window.ethereum)
const signer = await browserProvider.getSigner()
```

### Wagmi 设置

```bash
# 安装
npm install wagmi viem @tanstack/react-query
```

```tsx
// 配置
import { createConfig, configureChains } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

const { publicClient } = configureChains([mainnet], [publicProvider()])

const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector()],
  publicClient,
})

// 应用包装
function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiConfig>
  )
}
```

## 2. 钱包连接对比

### Ethers.js 方式

```typescript
import { ethers } from 'ethers'
import { useState, useEffect } from 'react'

function EthersWalletConnection() {
  const [account, setAccount] = useState<string>('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string>('')

  // 检查连接状态
  useEffect(() => {
    checkConnection()
  }, [])

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await browserProvider.listAccounts()
        
        if (accounts.length > 0) {
          setProvider(browserProvider)
          setAccount(accounts[0].address)
          setIsConnected(true)
        }
      } catch (error) {
        console.error('检查连接失败:', error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true)
        setError('')
        
        // 请求连接
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        
        const browserProvider = new ethers.BrowserProvider(window.ethereum)
        const signer = await browserProvider.getSigner()
        const address = await signer.getAddress()
        
        setProvider(browserProvider)
        setAccount(address)
        setIsConnected(true)
      } catch (error: any) {
        setError(error.message)
        console.error('连接失败:', error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      setError('请安装 MetaMask!')
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setAccount('')
    setIsConnected(false)
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0])
    } else {
      disconnectWallet()
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  return (
    <div>
      {isConnected ? (
        <div>
          <p>已连接: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <button onClick={disconnectWallet}>断开连接</button>
        </div>
      ) : (
        <div>
          <button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? '连接中...' : '连接 MetaMask'}
          </button>
          {error && <p style={{ color: 'red' }}>错误: {error}</p>}
        </div>
      )}
    </div>
  )
}
```

### Wagmi 方式

```tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi'

function WagmiWalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading, error } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div>
        <p>已连接: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <button onClick={() => disconnect()}>断开连接</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isLoading}
        >
          {isLoading ? '连接中...' : `连接 ${connector.name}`}
        </button>
      ))}
      {error && <p style={{ color: 'red' }}>错误: {error.message}</p>}
    </div>
  )
}
```

**对比总结：**
- **代码量**: Wagmi 减少了 80% 的代码
- **状态管理**: Wagmi 自动处理所有状态
- **错误处理**: Wagmi 内置错误处理
- **事件监听**: Wagmi 自动处理账户和网络变化

## 3. 读取合约数据对比

### Ethers.js 方式

```typescript
import { ethers } from 'ethers'
import { useState, useEffect } from 'react'

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
]

function EthersTokenBalance({ tokenAddress, userAddress }: {
  tokenAddress: string
  userAddress: string
}) {
  const [balance, setBalance] = useState<string>('')
  const [symbol, setSymbol] = useState<string>('')
  const [decimals, setDecimals] = useState<number>(18)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchTokenData()
  }, [tokenAddress, userAddress])

  const fetchTokenData = async () => {
    if (!tokenAddress || !userAddress) return

    try {
      setLoading(true)
      setError('')

      const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL)
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

      // 并行获取数据
      const [balanceResult, symbolResult, decimalsResult] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.symbol(),
        contract.decimals()
      ])

      setBalance(ethers.formatUnits(balanceResult, decimalsResult))
      setSymbol(symbolResult)
      setDecimals(decimalsResult)
    } catch (error: any) {
      setError(error.message)
      console.error('获取代币数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchTokenData()
  }

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return (
    <div>
      <p>余额: {balance} {symbol}</p>
      <button onClick={refreshData}>刷新</button>
    </div>
  )
}
```

### Wagmi 方式

```tsx
import { useContractReads } from 'wagmi'
import { formatUnits } from 'viem'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

function WagmiTokenBalance({ tokenAddress, userAddress }: {
  tokenAddress: `0x${string}`
  userAddress: `0x${string}`
}) {
  const { data, isLoading, error, refetch } = useContractReads({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
    ],
    watch: true, // 自动监听区块变化
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  const [balance, symbol, decimals] = data || []
  const formattedBalance = balance?.result && decimals?.result
    ? formatUnits(balance.result, decimals.result)
    : '0'

  return (
    <div>
      <p>余额: {formattedBalance} {symbol?.result}</p>
      <button onClick={() => refetch()}>刷新</button>
    </div>
  )
}
```

**对比总结：**
- **自动缓存**: Wagmi 自动缓存查询结果
- **实时更新**: Wagmi 可以监听区块变化自动更新
- **批量查询**: Wagmi 的 `useContractReads` 自动优化批量查询
- **错误重试**: Wagmi 内置重试机制

## 4. 发送交易对比

### Ethers.js 方式

```typescript
import { ethers } from 'ethers'
import { useState } from 'react'

function EthersSendTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [receipt, setReceipt] = useState<ethers.TransactionReceipt | null>(null)

  const sendTransaction = async () => {
    try {
      setIsLoading(true)
      setError('')
      setTxHash('')
      setReceipt(null)

      // 检查 MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装 MetaMask!')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // 发送交易
      const tx = await signer.sendTransaction({
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        value: ethers.parseEther('0.01'),
        gasLimit: 21000,
      })

      setTxHash(tx.hash)
      console.log('交易已发送:', tx.hash)

      // 等待确认
      const receipt = await tx.wait()
      setReceipt(receipt)
      console.log('交易已确认:', receipt)

    } catch (error: any) {
      setError(error.message)
      console.error('交易失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button onClick={sendTransaction} disabled={isLoading}>
        {isLoading ? '发送中...' : '发送 0.01 ETH'}
      </button>

      {error && (
        <div style={{ color: 'red' }}>
          错误: {error}
        </div>
      )}

      {txHash && (
        <div>
          <p>交易哈希: {txHash}</p>
          {!receipt && <p>等待确认...</p>}
        </div>
      )}

      {receipt && (
        <div style={{ color: 'green' }}>
          <p>交易已确认!</p>
          <p>区块号: {receipt.blockNumber}</p>
          <p>Gas 使用: {receipt.gasUsed.toString()}</p>
        </div>
      )}
    </div>
  )
}
```

### Wagmi 方式

```tsx
import { useSendTransaction, useWaitForTransaction } from 'wagmi'
import { parseEther } from 'viem'

function WagmiSendTransaction() {
  const {
    data: txData,
    sendTransaction,
    isLoading: isSending,
    error: sendError,
  } = useSendTransaction({
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
    value: parseEther('0.01'),
  })

  const {
    data: receipt,
    isLoading: isConfirming,
    error: confirmError,
  } = useWaitForTransaction({
    hash: txData?.hash,
  })

  const error = sendError || confirmError

  return (
    <div>
      <button 
        onClick={() => sendTransaction?.()} 
        disabled={isSending || isConfirming}
      >
        {isSending ? '发送中...' : isConfirming ? '确认中...' : '发送 0.01 ETH'}
      </button>

      {error && (
        <div style={{ color: 'red' }}>
          错误: {error.message}
        </div>
      )}

      {txData && (
        <div>
          <p>交易哈希: {txData.hash}</p>
          {isConfirming && <p>等待确认...</p>}
        </div>
      )}

      {receipt && (
        <div style={{ color: 'green' }}>
          <p>交易已确认!</p>
          <p>区块号: {receipt.blockNumber}</p>
          <p>Gas 使用: {receipt.gasUsed.toString()}</p>
        </div>
      )}
    </div>
  )
}
```

**对比总结：**
- **状态管理**: Wagmi 自动管理发送和确认状态
- **错误处理**: Wagmi 分别处理发送和确认错误
- **代码简洁**: Wagmi 减少了 60% 的代码量

## 5. 合约交互对比

### Ethers.js 方式

```typescript
import { ethers } from 'ethers'
import { useState } from 'react'

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]

function EthersTokenTransfer({ tokenAddress }: { tokenAddress: string }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')

  const transferTokens = async () => {
    try {
      setIsLoading(true)
      setError('')
      setTxHash('')

      if (!recipient || !amount) {
        throw new Error('请填写收件人地址和金额')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      // 检查余额
      const userAddress = await signer.getAddress()
      const balance = await contract.balanceOf(userAddress)
      const transferAmount = ethers.parseEther(amount)

      if (balance < transferAmount) {
        throw new Error('余额不足')
      }

      // 估算 Gas
      const gasEstimate = await contract.transfer.estimateGas(recipient, transferAmount)
      const gasLimit = gasEstimate * 120n / 100n // 增加 20% 缓冲

      // 发送交易
      const tx = await contract.transfer(recipient, transferAmount, {
        gasLimit,
      })

      setTxHash(tx.hash)

      // 等待确认
      const receipt = await tx.wait()
      console.log('转账成功:', receipt)

    } catch (error: any) {
      setError(error.message)
      console.error('转账失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="收件人地址"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="转账金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button onClick={transferTokens} disabled={isLoading}>
        {isLoading ? '转账中...' : '转账'}
      </button>

      {error && <div style={{ color: 'red' }}>错误: {error}</div>}
      {txHash && <div>交易哈希: {txHash}</div>}
    </div>
  )
}
```

### Wagmi 方式

```tsx
import { 
  useContractWrite, 
  usePrepareContractWrite, 
  useWaitForTransaction,
  useContractRead 
} from 'wagmi'
import { parseEther } from 'viem'
import { useState } from 'react'

const ERC20_ABI = [
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
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

function WagmiTokenTransfer({ 
  tokenAddress, 
  userAddress 
}: { 
  tokenAddress: `0x${string}`
  userAddress: `0x${string}`
}) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  // 检查余额
  const { data: balance } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    watch: true,
  })

  // 准备交易
  const { config, error: prepareError } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: recipient && amount ? [recipient as `0x${string}`, parseEther(amount)] : undefined,
    enabled: Boolean(recipient && amount),
  })

  // 执行交易
  const { 
    data: txData, 
    write, 
    isLoading: isWriteLoading,
    error: writeError 
  } = useContractWrite(config)

  // 等待确认
  const { 
    isLoading: isConfirming, 
    error: confirmError 
  } = useWaitForTransaction({
    hash: txData?.hash,
  })

  const isLoading = isWriteLoading || isConfirming
  const error = prepareError || writeError || confirmError

  // 检查是否可以转账
  const canTransfer = write && 
    recipient && 
    amount && 
    balance && 
    parseEther(amount) <= balance

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="收件人地址"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="转账金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      
      {balance && (
        <div>余额: {balance.toString()} tokens</div>
      )}

      <button 
        onClick={() => write?.()} 
        disabled={!canTransfer || isLoading}
      >
        {isWriteLoading ? '发送中...' : 
         isConfirming ? '确认中...' : 
         '转账'}
      </button>

      {error && <div style={{ color: 'red' }}>错误: {error.message}</div>}
      {txData && <div>交易哈希: {txData.hash}</div>}
    </div>
  )
}
```

**对比总结：**
- **交易准备**: Wagmi 的 `usePrepareContractWrite` 自动处理 Gas 估算和验证
- **状态管理**: Wagmi 自动管理准备、发送、确认三个阶段
- **错误处理**: Wagmi 分别处理不同阶段的错误
- **实时数据**: Wagmi 可以实时监听余额变化

## 6. 事件监听对比

### Ethers.js 方式

```typescript
import { ethers } from 'ethers'
import { useState, useEffect } from 'react'

function EthersEventListener({ contractAddress }: { contractAddress: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    let contract: ethers.Contract

    const startListening = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL)
        contract = new ethers.Contract(contractAddress, [
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ], provider)

        setIsListening(true)

        // 监听新事件
        contract.on('Transfer', (from, to, value, event) => {
          const newEvent = {
            from,
            to,
            value: value.toString(),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now(),
          }
          
          setEvents(prev => [newEvent, ...prev].slice(0, 10)) // 只保留最新 10 个
        })

        // 获取历史事件
        const filter = contract.filters.Transfer()
        const historicalEvents = await contract.queryFilter(filter, -100) // 最近 100 个区块
        
        const formattedEvents = historicalEvents.map(event => ({
          from: event.args?.from,
          to: event.args?.to,
          value: event.args?.value.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: Date.now(),
        }))

        setEvents(formattedEvents.slice(0, 10))

      } catch (error) {
        console.error('监听事件失败:', error)
        setIsListening(false)
      }
    }

    startListening()

    return () => {
      if (contract) {
        contract.removeAllListeners()
        setIsListening(false)
      }
    }
  }, [contractAddress])

  return (
    <div>
      <h3>Transfer 事件 {isListening && '(实时监听中)'}</h3>
      {events.length === 0 ? (
        <p>暂无事件</p>
      ) : (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              <div>从: {event.from}</div>
              <div>到: {event.to}</div>
              <div>金额: {event.value}</div>
              <div>区块: {event.blockNumber}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Wagmi 方式

```tsx
import { useContractEvent } from 'wagmi'
import { useState } from 'react'

const ERC20_ABI = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

function WagmiEventListener({ contractAddress }: { contractAddress: `0x${string}` }) {
  const [events, setEvents] = useState<any[]>([])

  useContractEvent({
    address: contractAddress,
    abi: ERC20_ABI,
    eventName: 'Transfer',
    listener: (logs) => {
      const newEvents = logs.map(log => ({
        from: log.args.from,
        to: log.args.to,
        value: log.args.value?.toString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now(),
      }))
      
      setEvents(prev => [...newEvents, ...prev].slice(0, 10))
    },
  })

  return (
    <div>
      <h3>Transfer 事件 (实时监听中)</h3>
      {events.length === 0 ? (
        <p>暂无事件</p>
      ) : (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              <div>从: {event.from}</div>
              <div>到: {event.to}</div>
              <div>金额: {event.value}</div>
              <div>区块: {event.blockNumber}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**对比总结：**
- **自动管理**: Wagmi 自动处理监听器的创建和清理
- **代码简洁**: Wagmi 减少了 70% 的代码
- **错误处理**: Wagmi 内置错误处理和重连机制

## 7. 性能对比

### 缓存机制

**Ethers.js:**
```typescript
// 每次都需要重新请求
const getBalance = async (address: string) => {
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  return await provider.getBalance(address)
}

// 手动实现缓存
const cache = new Map()
const getCachedBalance = async (address: string) => {
  if (cache.has(address)) {
    return cache.get(address)
  }
  const balance = await getBalance(address)
  cache.set(address, balance)
  return balance
}
```

**Wagmi:**
```tsx
// 自动缓存，相同查询会复用结果
function Component1() {
  const { data } = useBalance({ address: '0x...' }) // 首次请求
}

function Component2() {
  const { data } = useBalance({ address: '0x...' }) // 使用缓存
}
```

### 批量请求

**Ethers.js:**
```typescript
// 手动实现批量请求
const getBatchData = async (addresses: string[]) => {
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const promises = addresses.map(addr => provider.getBalance(addr))
  return await Promise.all(promises)
}
```

**Wagmi:**
```tsx
// 自动批量优化
const { data } = useContractReads({
  contracts: addresses.map(address => ({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address],
  })),
})
```

## 8. 错误处理对比

### Ethers.js 错误处理

```typescript
const handleTransaction = async () => {
  try {
    const tx = await contract.transfer(to, amount)
    await tx.wait()
  } catch (error: any) {
    // 需要手动解析错误类型
    if (error.code === 'ACTION_REJECTED') {
      console.log('用户拒绝了交易')
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('余额不足')
    } else if (error.reason) {
      console.log('合约错误:', error.reason)
    } else {
      console.log('未知错误:', error.message)
    }
  }
}
```

### Wagmi 错误处理

```tsx
const { write, error } = useContractWrite({
  // ... 配置
  onError: (error) => {
    // Wagmi 自动解析错误类型
    if (error instanceof UserRejectedRequestError) {
      console.log('用户拒绝了交易')
    } else if (error instanceof ContractFunctionExecutionError) {
      console.log('合约执行失败:', error.shortMessage)
    } else {
      console.log('其他错误:', error.message)
    }
  },
})
```

## 9. 测试对比

### Ethers.js 测试

```typescript
// 需要大量模拟代码
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x123'),
        sendTransaction: jest.fn().mockResolvedValue({
          hash: '0xabc',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      }),
    })),
  },
}))
```

### Wagmi 测试

```tsx
// 使用内置的测试工具
import { renderHook } from '@testing-library/react'
import { createConfig } from 'wagmi'
import { MockConnector } from 'wagmi/connectors/mock'

const config = createConfig({
  connectors: [new MockConnector({ /* 模拟数据 */ })],
})

test('useBalance hook', async () => {
  const { result } = renderHook(() => useBalance({ address: '0x123' }), {
    wrapper: ({ children }) => (
      <WagmiConfig config={config}>{children}</WagmiConfig>
    ),
  })
  
  // 测试逻辑
})
```

## 10. 选择建议

### 选择 Ethers.js 的场景

1. **非 React 项目**: Vue、Angular 或原生 JavaScript
2. **服务端应用**: Node.js 后端服务
3. **轻量级需求**: 只需要基本的区块链交互
4. **自定义需求**: 需要完全控制状态管理
5. **包大小敏感**: 对打包体积有严格要求

### 选择 Wagmi 的场景

1. **React 项目**: 特别是现代 React 应用
2. **复杂 DApp**: 需要大量区块链交互的应用
3. **快速开发**: 希望减少样板代码
4. **团队协作**: 需要统一的开发模式
5. **用户体验**: 需要良好的加载状态和错误处理

## 11. 迁移指南

### 从 Ethers.js 迁移到 Wagmi

```typescript
// 之前的 Ethers.js 代码
const [balance, setBalance] = useState<string>('')
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchBalance = async () => {
    setLoading(true)
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const balance = await provider.getBalance(address)
      setBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  if (address) fetchBalance()
}, [address])
```

```tsx
// 迁移后的 Wagmi 代码
const { data: balance, isLoading } = useBalance({
  address,
  formatUnits: 'ether',
})
```

### 迁移步骤

1. **安装 Wagmi**: `npm install wagmi viem @tanstack/react-query`
2. **设置配置**: 创建 Wagmi 配置文件
3. **包装应用**: 用 `WagmiConfig` 和 `QueryClientProvider` 包装
4. **逐步替换**: 一个组件一个组件地替换 Ethers.js 代码
5. **测试验证**: 确保功能正常工作

## 总结

| 方面 | Ethers.js | Wagmi |
|------|-----------|-------|
| **适用性** | 通用性强 | React 专用 |
| **开发效率** | 中等 | 高 |
| **代码量** | 较多 | 较少 |
| **学习曲线** | 中等 | 较低（React 开发者） |
| **性能** | 需要手动优化 | 自动优化 |
| **类型安全** | 良好 | 更强 |
| **社区支持** | 成熟 | 快速增长 |
| **维护成本** | 较高 | 较低 |

选择哪个方案主要取决于您的项目需求和团队技术栈。对于 React 项目，Wagmi 通常是更好的选择；对于其他场景，Ethers.js 仍然是可靠的选择。

## 下一步

- [useAccount](/wagmi/hooks/account/use-account) - 开始使用 Wagmi 的账户管理
- [useConnect](/wagmi/hooks/account/use-connect) - 学习钱包连接
- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习合约读取
- [实战项目](/wagmi/examples/defi-app) - 通过实际项目学习 Wagmi