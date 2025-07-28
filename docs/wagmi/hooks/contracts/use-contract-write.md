---
title: useContractWrite
description: 执行智能合约写入操作的 React Hook
keywords: [wagmi, useContractWrite, 合约写入, 智能合约, 交易, React Hook, Web3]
---

# useContractWrite

`useContractWrite` 是 Wagmi 中用于执行智能合约写入操作的 Hook。它提供了类型安全的合约调用、交易状态管理和错误处理功能。

## 基本用法

```tsx
import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'

const contractConfig = {
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
} as const

function TransferToken() {
  const { config } = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'transfer',
    args: ['0x...', parseEther('1')],
  })

  const { data, isLoading, isSuccess, write } = useContractWrite(config)

  return (
    <div>
      <button disabled={!write || isLoading} onClick={() => write?.()}>
        {isLoading ? '发送中...' : '转账'}
      </button>
      {isSuccess && (
        <div>
          交易成功！哈希: {data?.hash}
        </div>
      )}
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
- `nonce` - 交易 nonce

## 返回值

### 交易数据
- `data` - 交易哈希和相关信息
- `error` - 错误信息
- `isLoading` - 是否正在发送
- `isSuccess` - 是否成功
- `write` - 执行交易的函数
- `reset` - 重置状态

## 详细示例

### ERC-20 代币转账

```tsx
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseUnits } from 'viem'
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
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

function TokenTransfer({ tokenAddress }: { tokenAddress: string }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [decimals] = useState(18) // 假设 18 位精度

  // 准备转账交易
  const { config: transferConfig } = usePrepareContractWrite({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient as `0x${string}`, parseUnits(amount || '0', decimals)],
    enabled: !!recipient && !!amount,
  })

  const {
    data: transferData,
    isLoading: isTransferLoading,
    isSuccess: isTransferStarted,
    write: transfer,
    error: transferError,
  } = useContractWrite(transferConfig)

  // 等待交易确认
  const {
    isLoading: isTransferConfirming,
    isSuccess: isTransferConfirmed,
  } = useWaitForTransaction({
    hash: transferData?.hash,
  })

  const handleTransfer = () => {
    if (!recipient || !amount) {
      alert('请填写收款地址和金额')
      return
    }
    transfer?.()
  }

  return (
    <div className="token-transfer">
      <h3>代币转账</h3>
      
      <div className="form-group">
        <label>收款地址:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div className="form-group">
        <label>转账数量:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.01"
        />
      </div>

      <button
        onClick={handleTransfer}
        disabled={!transfer || isTransferLoading || isTransferConfirming}
        className="transfer-button"
      >
        {isTransferLoading ? '发起转账...' :
         isTransferConfirming ? '确认中...' :
         '转账'}
      </button>

      {transferError && (
        <div className="error">
          转账失败: {transferError.message}
        </div>
      )}

      {isTransferStarted && (
        <div className="transaction-status">
          <p>交易已发起</p>
          <p>哈希: {transferData?.hash}</p>
          {isTransferConfirming && <p>等待确认...</p>}
          {isTransferConfirmed && <p>✅ 转账成功！</p>}
        </div>
      )}
    </div>
  )
}
```

### NFT 铸造

```tsx
import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseEther } from 'viem'

const NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'quantity', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

function NFTMint({ contractAddress, mintPrice }: {
  contractAddress: string
  mintPrice: string
}) {
  const [quantity, setQuantity] = useState(1)
  const [recipient, setRecipient] = useState('')

  const totalCost = parseEther((parseFloat(mintPrice) * quantity).toString())

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: NFT_ABI,
    functionName: 'mint',
    args: [recipient as `0x${string}`, BigInt(quantity)],
    value: totalCost,
    enabled: !!recipient && quantity > 0,
  })

  const {
    data,
    isLoading,
    isSuccess,
    write: mint,
    error,
  } = useContractWrite({
    ...config,
    onSuccess: (data) => {
      console.log('铸造成功:', data)
    },
    onError: (error) => {
      console.error('铸造失败:', error)
    },
  })

  return (
    <div className="nft-mint">
      <h3>NFT 铸造</h3>
      
      <div className="mint-form">
        <div className="form-group">
          <label>接收地址:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="form-group">
          <label>数量:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
          />
        </div>

        <div className="cost-info">
          <p>单价: {mintPrice} ETH</p>
          <p>总计: {(parseFloat(mintPrice) * quantity).toFixed(4)} ETH</p>
        </div>

        <button
          onClick={() => mint?.()}
          disabled={!mint || isLoading}
          className="mint-button"
        >
          {isLoading ? '铸造中...' : `铸造 ${quantity} 个 NFT`}
        </button>
      </div>

      {error && (
        <div className="error">
          铸造失败: {error.message}
        </div>
      )}

      {isSuccess && (
        <div className="success">
          <p>✅ 铸造成功！</p>
          <p>交易哈希: {data?.hash}</p>
        </div>
      )}
    </div>
  )
}
```

### 多步骤交易流程

```tsx
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { useState, useEffect } from 'react'

enum TransactionStep {
  APPROVE = 'approve',
  DEPOSIT = 'deposit',
  COMPLETED = 'completed'
}

function MultiStepTransaction() {
  const [currentStep, setCurrentStep] = useState<TransactionStep>(TransactionStep.APPROVE)
  const [amount, setAmount] = useState('')

  // 第一步：授权
  const { config: approveConfig } = usePrepareContractWrite({
    address: '0x...', // ERC20 代币地址
    abi: ERC20_ABI,
    functionName: 'approve',
    args: ['0x...', parseUnits(amount || '0', 18)], // 授权给合约
    enabled: currentStep === TransactionStep.APPROVE && !!amount,
  })

  const {
    data: approveData,
    write: approve,
    isLoading: isApproving,
  } = useContractWrite(approveConfig)

  const { isSuccess: isApproveConfirmed } = useWaitForTransaction({
    hash: approveData?.hash,
  })

  // 第二步：存款
  const { config: depositConfig } = usePrepareContractWrite({
    address: '0x...', // DeFi 合约地址
    abi: defiABI,
    functionName: 'deposit',
    args: [parseUnits(amount || '0', 18)],
    enabled: currentStep === TransactionStep.DEPOSIT && !!amount,
  })

  const {
    data: depositData,
    write: deposit,
    isLoading: isDepositing,
  } = useContractWrite(depositConfig)

  const { isSuccess: isDepositConfirmed } = useWaitForTransaction({
    hash: depositData?.hash,
  })

  // 步骤控制
  useEffect(() => {
    if (isApproveConfirmed && currentStep === TransactionStep.APPROVE) {
      setCurrentStep(TransactionStep.DEPOSIT)
    }
  }, [isApproveConfirmed, currentStep])

  useEffect(() => {
    if (isDepositConfirmed && currentStep === TransactionStep.DEPOSIT) {
      setCurrentStep(TransactionStep.COMPLETED)
    }
  }, [isDepositConfirmed, currentStep])

  const handleApprove = () => {
    if (!amount) {
      alert('请输入金额')
      return
    }
    approve?.()
  }

  const handleDeposit = () => {
    deposit?.()
  }

  return (
    <div className="multi-step-transaction">
      <h3>多步骤交易</h3>
      
      <div className="amount-input">
        <label>存款金额:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          disabled={currentStep !== TransactionStep.APPROVE}
        />
      </div>

      <div className="steps">
        <div className={`step ${currentStep === TransactionStep.APPROVE ? 'active' : 
                                isApproveConfirmed ? 'completed' : ''}`}>
          <h4>步骤 1: 授权代币</h4>
          <p>授权合约使用您的代币</p>
          <button
            onClick={handleApprove}
            disabled={!approve || isApproving || isApproveConfirmed}
          >
            {isApproving ? '授权中...' : 
             isApproveConfirmed ? '✅ 已授权' : '授权'}
          </button>
        </div>

        <div className={`step ${currentStep === TransactionStep.DEPOSIT ? 'active' : 
                                isDepositConfirmed ? 'completed' : ''}`}>
          <h4>步骤 2: 存款</h4>
          <p>将代币存入 DeFi 协议</p>
          <button
            onClick={handleDeposit}
            disabled={!deposit || isDepositing || currentStep !== TransactionStep.DEPOSIT}
          >
            {isDepositing ? '存款中...' : 
             isDepositConfirmed ? '✅ 已存款' : '存款'}
          </button>
        </div>

        {currentStep === TransactionStep.COMPLETED && (
          <div className="step completed">
            <h4>✅ 交易完成</h4>
            <p>您的代币已成功存入协议</p>
          </div>
        )}
      </div>

      <div className="transaction-hashes">
        {approveData && (
          <p>授权交易: {approveData.hash}</p>
        )}
        {depositData && (
          <p>存款交易: {depositData.hash}</p>
        )}
      </div>
    </div>
  )
}
```

## 高级用法

### 动态 Gas 估算

```tsx
import { useContractWrite, usePrepareContractWrite, useFeeData } from 'wagmi'
import { useState, useEffect } from 'react'

function DynamicGasEstimation() {
  const [gasLimit, setGasLimit] = useState<bigint>()
  const [gasPrice, setGasPrice] = useState<bigint>()

  const { data: feeData } = useFeeData()

  const { config, error: prepareError } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'complexFunction',
    args: ['0x...', 1000n],
    gas: gasLimit,
    gasPrice: gasPrice,
  })

  const { write, isLoading } = useContractWrite(config)

  // 动态调整 Gas 设置
  useEffect(() => {
    if (feeData?.gasPrice) {
      // 使用当前网络的 Gas 价格
      setGasPrice(feeData.gasPrice)
    }
  }, [feeData])

  const handleCustomGas = () => {
    // 用户可以自定义 Gas 设置
    const customGasLimit = prompt('输入 Gas Limit:')
    if (customGasLimit) {
      setGasLimit(BigInt(customGasLimit))
    }
  }

  return (
    <div className="dynamic-gas">
      <div className="gas-info">
        <p>当前 Gas 价格: {feeData?.gasPrice?.toString()} wei</p>
        <p>预估 Gas Limit: {gasLimit?.toString() || '自动'}</p>
        <button onClick={handleCustomGas}>自定义 Gas</button>
      </div>

      <button onClick={() => write?.()} disabled={!write || isLoading}>
        {isLoading ? '执行中...' : '执行交易'}
      </button>

      {prepareError && (
        <div className="error">
          准备交易失败: {prepareError.message}
        </div>
      )}
    </div>
  )
}
```

### 错误处理和重试

```tsx
import { useContractWrite } from 'wagmi'
import { useState } from 'react'

function RobustContractWrite() {
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string>()

  const { write, isLoading, error, reset } = useContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    args: ['0x...', 1000n],
    onError: (error) => {
      setLastError(error.message)
      console.error('交易失败:', error)
    },
    onSuccess: (data) => {
      setRetryCount(0)
      setLastError(undefined)
      console.log('交易成功:', data)
    },
  })

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      reset() // 重置状态
      setTimeout(() => {
        write?.()
      }, 1000 * retryCount) // 递增延迟
    }
  }

  const isUserRejection = error?.message.includes('User rejected')
  const isInsufficientFunds = error?.message.includes('insufficient funds')

  return (
    <div className="robust-write">
      <button onClick={() => write?.()} disabled={!write || isLoading}>
        {isLoading ? '执行中...' : '执行交易'}
      </button>

      {error && (
        <div className="error-section">
          <div className="error-message">
            {isUserRejection ? '用户取消了交易' :
             isInsufficientFunds ? '余额不足' :
             `交易失败: ${error.message}`}
          </div>

          {!isUserRejection && retryCount < 3 && (
            <button onClick={handleRetry} className="retry-button">
              重试 ({retryCount}/3)
            </button>
          )}

          {retryCount >= 3 && (
            <div className="max-retries">
              已达到最大重试次数，请检查网络或参数
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## 最佳实践

### 1. 交易确认流程

```tsx
function TransactionFlow() {
  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    args: ['0x...', 1000n],
  })

  const { data, write, isLoading } = useContractWrite(config)

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransaction({
    hash: data?.hash,
    confirmations: 2, // 等待 2 个确认
  })

  return (
    <div className="transaction-flow">
      <button onClick={() => write?.()} disabled={!write || isLoading}>
        发送交易
      </button>
      
      {isLoading && <div>📤 发送交易中...</div>}
      {isConfirming && <div>⏳ 等待确认中...</div>}
      {isConfirmed && <div>✅ 交易已确认</div>}
    </div>
  )
}
```

### 2. 用户体验优化

```tsx
function OptimizedUX() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { write, isLoading, error } = useContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'transfer',
    onMutate: () => {
      setIsSubmitting(true)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  return (
    <div className="optimized-ux">
      <button 
        onClick={() => write?.()} 
        disabled={!write || isSubmitting}
        className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            处理中...
          </>
        ) : (
          '提交交易'
        )}
      </button>

      {error && (
        <div className="error-toast">
          {error.message}
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 如何处理 Gas 估算失败？
A: 使用 `usePrepareContractWrite` 预先验证，设置合理的 Gas 限制。

### Q: 交易被拒绝怎么办？
A: 检查错误类型，提供用户友好的错误信息和重试选项。

### Q: 如何优化交易速度？
A: 设置合适的 Gas 价格，使用 EIP-1559 的 `maxFeePerGas` 和 `maxPriorityFeePerGas`。

## 下一步

- [usePrepareContractWrite](/wagmi/hooks/contracts/use-prepare-contract-write) - 学习交易准备
- [useWaitForTransaction](/wagmi/hooks/transactions/use-wait-for-transaction) - 学习交易确认
- [useContractEvent](/wagmi/hooks/contracts/use-contract-event) - 学习事件监听