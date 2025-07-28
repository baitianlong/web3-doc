---
title: usePrepareContractWrite
description: 准备智能合约写入操作的 React Hook
keywords: [wagmi, usePrepareContractWrite, 合约准备, 智能合约, 交易准备, React Hook, Web3]
---

# usePrepareContractWrite

`usePrepareContractWrite` 用于准备智能合约写入操作，提供 Gas 估算、参数验证和交易模拟功能，确保交易在实际执行前的可行性。

## 基本用法

```tsx
import { usePrepareContractWrite, useContractWrite } from 'wagmi'
import { parseEther } from 'viem'

function PreparedTransfer() {
  const { config, error } = usePrepareContractWrite({
    address: '0x...',
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
    ],
    functionName: 'transfer',
    args: ['0x...', parseEther('1')],
  })

  const { write, isLoading } = useContractWrite(config)

  return (
    <div>
      <button disabled={!write || isLoading} onClick={() => write?.()}>
        {isLoading ? '发送中...' : '转账'}
      </button>
      {error && <div>准备失败: {error.message}</div>}
    </div>
  )
}
```

## 参数配置

### 合约配置
- `address` - 合约地址
- `abi` - 合约 ABI
- `functionName` - 函数名称
- `args` - 函数参数

### 交易选项
- `value` - 发送的 ETH 数量
- `gasLimit` - Gas 限制
- `gasPrice` - Gas 价格
- `maxFeePerGas` - EIP-1559 最大费用
- `maxPriorityFeePerGas` - EIP-1559 优先费用

### 查询选项
- `enabled` - 是否启用准备
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### 配置数据
- `config` - 准备好的交易配置
- `error` - 准备过程中的错误
- `isLoading` - 是否正在准备
- `isError` - 是否出错
- `isSuccess` - 是否成功
- `refetch` - 重新准备

## 详细示例

### 动态参数准备

```tsx
import { usePrepareContractWrite, useContractWrite } from 'wagmi'
import { parseUnits } from 'viem'
import { useState, useEffect } from 'react'

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
] as const

function DynamicTransfer({ tokenAddress }: { tokenAddress: string }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [decimals] = useState(18)

  // 动态准备交易
  const {
    config,
    error: prepareError,
    isLoading: isPreparing,
    isSuccess: isPrepared,
  } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [
      recipient as `0x${string}`,
      amount ? parseUnits(amount, decimals) : 0n,
    ],
    enabled: !!recipient && !!amount && parseFloat(amount) > 0,
  })

  const { write, isLoading: isWriting } = useContractWrite(config)

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)
  const isValidAmount = (amt: string) => parseFloat(amt) > 0

  return (
    <div className="dynamic-transfer">
      <h3>动态转账准备</h3>
      
      <div className="form-group">
        <label>收款地址:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className={recipient && !isValidAddress(recipient) ? 'invalid' : ''}
        />
        {recipient && !isValidAddress(recipient) && (
          <span className="error-hint">无效的地址格式</span>
        )}
      </div>

      <div className="form-group">
        <label>转账数量:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.01"
          className={amount && !isValidAmount(amount) ? 'invalid' : ''}
        />
        {amount && !isValidAmount(amount) && (
          <span className="error-hint">数量必须大于 0</span>
        )}
      </div>

      <div className="preparation-status">
        {isPreparing && (
          <div className="preparing">
            🔄 准备交易中...
          </div>
        )}
        
        {prepareError && (
          <div className="prepare-error">
            ❌ 准备失败: {prepareError.message}
          </div>
        )}
        
        {isPrepared && (
          <div className="prepared">
            ✅ 交易已准备就绪
          </div>
        )}
      </div>

      <button
        onClick={() => write?.()}
        disabled={!write || isWriting || !isPrepared}
        className="transfer-button"
      >
        {isWriting ? '发送中...' : 
         !isPrepared ? '准备中...' : 
         '发送转账'}
      </button>
    </div>
  )
}
```

### Gas 估算和优化

```tsx
import { usePrepareContractWrite, useFeeData } from 'wagmi'
import { useState, useMemo } from 'react'
import { parseUnits, formatUnits } from 'viem'

function GasOptimizedPrepare() {
  const [gasMultiplier, setGasMultiplier] = useState(1.1) // 10% 缓冲
  const [priorityFee, setPriorityFee] = useState('2') // 2 Gwei

  const { data: feeData } = useFeeData()

  // 计算优化的 Gas 设置
  const gasConfig = useMemo(() => {
    if (!feeData) return {}

    return {
      maxFeePerGas: feeData.maxFeePerGas ? 
        BigInt(Math.floor(Number(feeData.maxFeePerGas) * gasMultiplier)) : 
        undefined,
      maxPriorityFeePerGas: parseUnits(priorityFee, 'gwei'),
    }
  }, [feeData, gasMultiplier, priorityFee])

  const {
    config,
    error,
    isLoading,
  } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'complexOperation',
    args: [1000n, '0x...'],
    ...gasConfig,
  })

  const estimatedCost = useMemo(() => {
    if (!config?.request?.gas || !gasConfig.maxFeePerGas) return null
    
    const gasCost = config.request.gas * gasConfig.maxFeePerGas
    return formatUnits(gasCost, 18)
  }, [config, gasConfig])

  return (
    <div className="gas-optimized">
      <h3>Gas 优化准备</h3>
      
      <div className="gas-controls">
        <div className="control-group">
          <label>Gas 倍数:</label>
          <input
            type="range"
            min="1"
            max="2"
            step="0.1"
            value={gasMultiplier}
            onChange={(e) => setGasMultiplier(parseFloat(e.target.value))}
          />
          <span>{gasMultiplier}x</span>
        </div>

        <div className="control-group">
          <label>优先费用 (Gwei):</label>
          <input
            type="number"
            value={priorityFee}
            onChange={(e) => setPriorityFee(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="gas-estimation">
        <h4>Gas 估算</h4>
        <p>预估 Gas: {config?.request?.gas?.toString() || '计算中...'}</p>
        <p>最大费用: {gasConfig.maxFeePerGas ? 
          formatUnits(gasConfig.maxFeePerGas, 'gwei') + ' Gwei' : '...'}</p>
        <p>预估成本: {estimatedCost ? estimatedCost + ' ETH' : '...'}</p>
      </div>

      <div className="network-info">
        <h4>网络信息</h4>
        <p>基础费用: {feeData?.gasPrice ? 
          formatUnits(feeData.gasPrice, 'gwei') + ' Gwei' : '...'}</p>
        <p>建议优先费用: {feeData?.maxPriorityFeePerGas ? 
          formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' Gwei' : '...'}</p>
      </div>

      {error && (
        <div className="error">
          准备失败: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="loading">
          正在准备交易...
        </div>
      )}
    </div>
  )
}
```

### 条件准备和验证

```tsx
import { usePrepareContractWrite, useContractRead } from 'wagmi'
import { useState, useMemo } from 'react'

function ConditionalPrepare({ userAddress }: { userAddress: string }) {
  const [spender, setSpender] = useState('')
  const [amount, setAmount] = useState('')

  // 检查当前授权额度
  const { data: currentAllowance } = useContractRead({
    address: '0x...', // ERC20 代币地址
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, spender],
    enabled: !!userAddress && !!spender,
  })

  // 检查用户余额
  const { data: userBalance } = useContractRead({
    address: '0x...',
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    enabled: !!userAddress,
  })

  const amountBigInt = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  // 检查是否需要授权
  const needsApproval = useMemo(() => {
    if (!currentAllowance || !amountBigInt) return false
    return currentAllowance < amountBigInt
  }, [currentAllowance, amountBigInt])

  // 检查余额是否足够
  const hasSufficientBalance = useMemo(() => {
    if (!userBalance || !amountBigInt) return false
    return userBalance >= amountBigInt
  }, [userBalance, amountBigInt])

  // 准备授权交易
  const { 
    config: approveConfig, 
    error: approveError,
    isLoading: isPreparingApprove 
  } = usePrepareContractWrite({
    address: '0x...',
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender as `0x${string}`, amountBigInt],
    enabled: needsApproval && !!spender && amountBigInt > 0,
  })

  // 准备转账交易
  const { 
    config: transferConfig, 
    error: transferError,
    isLoading: isPreparingTransfer 
  } = usePrepareContractWrite({
    address: '0x...',
    abi: ERC20_ABI,
    functionName: 'transferFrom',
    args: [userAddress, spender as `0x${string}`, amountBigInt],
    enabled: !needsApproval && hasSufficientBalance && !!spender && amountBigInt > 0,
  })

  return (
    <div className="conditional-prepare">
      <h3>条件准备示例</h3>
      
      <div className="form-section">
        <div className="form-group">
          <label>接收地址:</label>
          <input
            type="text"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="form-group">
          <label>转账金额:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
          />
        </div>
      </div>

      <div className="status-section">
        <h4>状态检查</h4>
        <div className="status-item">
          <span className="label">用户余额:</span>
          <span className="value">
            {userBalance ? formatUnits(userBalance, 18) : '...'} 代币
          </span>
        </div>

        <div className="status-item">
          <span className="label">当前授权:</span>
          <span className="value">
            {currentAllowance ? formatUnits(currentAllowance, 18) : '...'} 代币
          </span>
        </div>

        <div className="status-item">
          <span className="label">余额充足:</span>
          <span className={`value ${hasSufficientBalance ? 'success' : 'error'}`}>
            {hasSufficientBalance ? '✅ 是' : '❌ 否'}
          </span>
        </div>

        <div className="status-item">
          <span className="label">需要授权:</span>
          <span className={`value ${needsApproval ? 'warning' : 'success'}`}>
            {needsApproval ? '⚠️ 是' : '✅ 否'}
          </span>
        </div>
      </div>

      <div className="preparation-section">
        {needsApproval ? (
          <div className="prepare-approve">
            <h4>准备授权交易</h4>
            {isPreparingApprove && <div>准备授权中...</div>}
            {approveError && (
              <div className="error">授权准备失败: {approveError.message}</div>
            )}
            {approveConfig && (
              <div className="success">✅ 授权交易已准备就绪</div>
            )}
          </div>
        ) : (
          <div className="prepare-transfer">
            <h4>准备转账交易</h4>
            {isPreparingTransfer && <div>准备转账中...</div>}
            {transferError && (
              <div className="error">转账准备失败: {transferError.message}</div>
            )}
            {transferConfig && (
              <div className="success">✅ 转账交易已准备就绪</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 批量操作准备

```tsx
import { usePrepareContractWrite } from 'wagmi'
import { useState, useMemo } from 'react'

interface BatchTransfer {
  to: string
  amount: string
}

function BatchTransferPrepare() {
  const [transfers, setTransfers] = useState<BatchTransfer[]>([
    { to: '', amount: '' }
  ])

  // 处理批量转账数据
  const batchData = useMemo(() => {
    const validTransfers = transfers.filter(t => t.to && t.amount)
    
    if (validTransfers.length === 0) return null

    const recipients = validTransfers.map(t => t.to as `0x${string}`)
    const amounts = validTransfers.map(t => parseUnits(t.amount, 18))

    return { recipients, amounts }
  }, [transfers])

  const {
    config,
    error,
    isLoading,
    isSuccess
  } = usePrepareContractWrite({
    address: '0x...', // 批量转账合约
    abi: [
      {
        name: 'batchTransfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'recipients', type: 'address[]' },
          { name: 'amounts', type: 'uint256[]' },
        ],
        outputs: [],
      },
    ],
    functionName: 'batchTransfer',
    args: batchData ? [batchData.recipients, batchData.amounts] : undefined,
    enabled: !!batchData,
  })

  const addTransfer = () => {
    setTransfers(prev => [...prev, { to: '', amount: '' }])
  }

  const removeTransfer = (index: number) => {
    setTransfers(prev => prev.filter((_, i) => i !== index))
  }

  const updateTransfer = (index: number, field: keyof BatchTransfer, value: string) => {
    setTransfers(prev => prev.map((transfer, i) => 
      i === index ? { ...transfer, [field]: value } : transfer
    ))
  }

  const totalAmount = useMemo(() => {
    return transfers.reduce((sum, transfer) => {
      const amount = parseFloat(transfer.amount) || 0
      return sum + amount
    }, 0)
  }, [transfers])

  return (
    <div className="batch-transfer-prepare">
      <h3>批量转账准备</h3>
      
      <div className="transfers-list">
        {transfers.map((transfer, index) => (
          <div key={index} className="transfer-item">
            <div className="transfer-inputs">
              <input
                type="text"
                value={transfer.to}
                onChange={(e) => updateTransfer(index, 'to', e.target.value)}
                placeholder="接收地址"
              />
              <input
                type="number"
                value={transfer.amount}
                onChange={(e) => updateTransfer(index, 'amount', e.target.value)}
                placeholder="金额"
                step="0.01"
              />
            </div>
            
            {transfers.length > 1 && (
              <button 
                onClick={() => removeTransfer(index)}
                className="remove-button"
              >
                移除
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="batch-controls">
        <button onClick={addTransfer} className="add-button">
          添加转账
        </button>
        
        <div className="batch-summary">
          <p>转账数量: {transfers.filter(t => t.to && t.amount).length}</p>
          <p>总金额: {totalAmount.toFixed(4)} 代币</p>
        </div>
      </div>

      <div className="preparation-status">
        {isLoading && (
          <div className="preparing">
            🔄 准备批量转账中...
          </div>
        )}
        
        {error && (
          <div className="prepare-error">
            ❌ 准备失败: {error.message}
          </div>
        )}
        
        {isSuccess && (
          <div className="prepared">
            ✅ 批量转账已准备就绪
          </div>
        )}
      </div>
    </div>
  )
}
```

## 高级用法

### 智能重试机制

```tsx
import { usePrepareContractWrite } from 'wagmi'
import { useState, useEffect } from 'react'

function SmartRetryPrepare() {
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string>()

  const {
    config,
    error,
    isLoading,
    refetch
  } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'volatileFunction',
    args: ['0x...', 1000n],
    retry: (failureCount, error) => {
      setRetryCount(failureCount)
      
      // 根据错误类型决定是否重试
      if (error.message.includes('insufficient funds')) {
        return false // 余额不足不重试
      }
      
      if (error.message.includes('network')) {
        return failureCount < 5 // 网络错误最多重试5次
      }
      
      return failureCount < 3 // 其他错误重试3次
    },
    retryDelay: (attemptIndex) => {
      // 指数退避策略
      return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
    },
    onError: (error) => {
      setLastError(error.message)
    },
    onSuccess: () => {
      setRetryCount(0)
      setLastError(undefined)
    },
  })

  const handleManualRetry = () => {
    setRetryCount(0)
    refetch()
  }

  return (
    <div className="smart-retry">
      <h3>智能重试准备</h3>
      
      <div className="retry-status">
        {isLoading && (
          <div className="loading">
            准备中... {retryCount > 0 && `(重试 ${retryCount})`}
          </div>
        )}
        
        {error && (
          <div className="error-section">
            <div className="error-message">
              准备失败: {error.message}
            </div>
            
            <div className="retry-info">
              <p>重试次数: {retryCount}</p>
              <p>最后错误: {lastError}</p>
            </div>
            
            <button onClick={handleManualRetry} className="manual-retry">
              手动重试
            </button>
          </div>
        )}
        
        {config && (
          <div className="success">
            ✅ 准备成功！
          </div>
        )}
      </div>
    </div>
  )
}
```

### 性能监控

```tsx
import { usePrepareContractWrite } from 'wagmi'
import { useState, useEffect } from 'react'

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    prepareTime: 0,
    gasEstimate: 0n,
    retryCount: 0,
    errorCount: 0,
  })

  const startTime = useRef<number>()

  const {
    config,
    error,
    isLoading,
    isSuccess
  } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'monitoredFunction',
    args: ['0x...'],
    onMutate: () => {
      startTime.current = Date.now()
    },
    onSuccess: (data) => {
      const endTime = Date.now()
      const prepareTime = startTime.current ? endTime - startTime.current : 0
      
      setMetrics(prev => ({
        ...prev,
        prepareTime,
        gasEstimate: data.request?.gas || 0n,
      }))
    },
    onError: () => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }))
    },
    retry: (failureCount) => {
      setMetrics(prev => ({
        ...prev,
        retryCount: failureCount,
      }))
      return failureCount < 3
    },
  })

  return (
    <div className="performance-monitor">
      <h3>性能监控</h3>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">准备时间:</span>
          <span className="metric-value">{metrics.prepareTime}ms</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Gas 估算:</span>
          <span className="metric-value">{metrics.gasEstimate.toString()}</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">重试次数:</span>
          <span className="metric-value">{metrics.retryCount}</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">错误次数:</span>
          <span className="metric-value">{metrics.errorCount}</span>
        </div>
      </div>

      <div className="status-indicators">
        <div className={`indicator ${isLoading ? 'active' : ''}`}>
          准备中
        </div>
        <div className={`indicator ${isSuccess ? 'active' : ''}`}>
          准备成功
        </div>
        <div className={`indicator ${error ? 'active' : ''}`}>
          准备失败
        </div>
      </div>
    </div>
  )
}
```

## 最佳实践

### 1. 参数验证

```tsx
function ValidatedPrepare() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')

  // 参数验证
  const isValidRecipient = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(recipient)
  }, [recipient])

  const isValidAmount = useMemo(() => {
    const num = parseFloat(amount)
    return !isNaN(num) && num > 0
  }, [amount])

  const { config, error } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    args: [recipient as `0x${string}`, parseUnits(amount || '0', 18)],
    enabled: isValidRecipient && isValidAmount,
  })

  return (
    <div className="validated-prepare">
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className={recipient && !isValidRecipient ? 'invalid' : ''}
        placeholder="接收地址"
      />
      
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={amount && !isValidAmount ? 'invalid' : ''}
        placeholder="转账金额"
      />
      
      {config && <div>✅ 参数验证通过</div>}
      {error && <div>❌ 验证失败: {error.message}</div>}
    </div>
  )
}
```

### 2. 缓存优化

```tsx
function CachedPrepare() {
  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'staticFunction',
    args: ['constant-value'],
    // 静态参数可以长时间缓存
    staleTime: 300_000, // 5分钟
    cacheTime: 600_000, // 10分钟
    // 减少不必要的重新准备
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return <div>缓存优化的准备</div>
}
```

## 常见问题

### Q: 准备失败的常见原因？
A: 1) 参数错误 2) 合约不存在 3) 函数不存在 4) Gas 估算失败 5) 网络问题

### Q: 如何优化准备性能？
A: 使用合适的缓存策略，避免频繁重新准备，使用条件启用。

### Q: 如何处理动态参数？
A: 使用 `enabled` 参数控制何时准备，结合防抖处理用户输入。

### Q: Gas 估算不准确怎么办？
A: 手动设置 Gas 限制，或使用 Gas 倍数增加缓冲。

## 下一步

- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习执行准备好的交易
- [useWaitForTransaction](/wagmi/hooks/transactions/use-wait-for-transaction) - 学习等待交易确认
- [useFeeData](/wagmi/hooks/network/use-fee-data) - 学习获取 Gas 费用信息
