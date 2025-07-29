---
title: useSignTypedData
description: 签名结构化数据的 React Hook
keywords: [wagmi, useSignTypedData, EIP-712, 结构化数据签名, React Hook, Web3]
---

# useSignTypedData

`useSignTypedData` 用于签名结构化数据（EIP-712），提供更安全和用户友好的签名体验，常用于 DeFi 协议、NFT 交易等场景。

## 基本用法

```tsx
import { useSignTypedData } from 'wagmi'

function SignTypedData() {
  const domain = {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  }

  const types = {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' }
    ]
  }

  const value = {
    from: {
      name: 'Alice',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
    },
    to: {
      name: 'Bob',
      wallet: '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57'
    },
    contents: 'Hello, Bob!'
  }

  const { data, isLoading, isSuccess, signTypedData } = useSignTypedData({
    domain,
    types,
    value,
    primaryType: 'Mail'
  })

  return (
    <div>
      <button 
        disabled={isLoading} 
        onClick={() => signTypedData()}
      >
        {isLoading ? '签名中...' : '签名邮件'}
      </button>
      
      {isSuccess && (
        <div>
          <p>签名成功!</p>
          <p>签名: {data}</p>
        </div>
      )}
    </div>
  )
}
```

## 参数配置

```tsx
import { useSignTypedData } from 'wagmi'

function ConfiguredSignTypedData() {
  const { signTypedData } = useSignTypedData({
    domain: {
      name: 'MyDApp',
      version: '1',
      chainId: 1,
      verifyingContract: '0x...'
    },
    types: {
      Order: [
        { name: 'trader', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ]
    },
    value: {
      trader: '0x...',
      amount: '1000000000000000000',
      nonce: 1
    },
    primaryType: 'Order',
    onSuccess: (signature) => {
      console.log('签名成功:', signature)
    },
    onError: (error) => {
      console.error('签名失败:', error)
    },
    onMutate: () => {
      console.log('开始签名...')
    },
    onSettled: (data, error) => {
      console.log('签名完成:', { data, error })
    }
  })

  return (
    <button onClick={() => signTypedData()}>
      签名订单
    </button>
  )
}
```

## 返回值

- `data` - 签名结果 (string)
- `error` - 错误信息
- `isLoading` - 是否正在签名
- `isSuccess` - 是否签名成功
- `isError` - 是否发生错误
- `signTypedData` - 执行签名的函数
- `reset` - 重置状态

## 详细示例

### ERC-20 Permit 签名

```tsx
import { useSignTypedData, useAccount, useContractRead } from 'wagmi'
import { useState } from 'react'

function ERC20PermitSigner() {
  const { address } = useAccount()
  const [spender, setSpender] = useState('')
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  const tokenAddress = '0x...' // ERC-20 代币地址

  // 获取代币信息
  const { data: tokenName } = useContractRead({
    address: tokenAddress,
    abi: [{ name: 'name', type: 'function', outputs: [{ type: 'string' }] }],
    functionName: 'name'
  })

  const { data: nonce } = useContractRead({
    address: tokenAddress,
    abi: [{ 
      name: 'nonces', 
      type: 'function', 
      inputs: [{ type: 'address' }],
      outputs: [{ type: 'uint256' }] 
    }],
    functionName: 'nonces',
    args: address ? [address] : undefined,
    enabled: !!address
  })

  const domain = {
    name: tokenName || 'Token',
    version: '1',
    chainId: 1,
    verifyingContract: tokenAddress
  }

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  }

  const value = {
    owner: address || '',
    spender,
    value: amount,
    nonce: nonce?.toString() || '0',
    deadline
  }

  const { 
    data: signature, 
    isLoading, 
    isSuccess, 
    signTypedData,
    reset 
  } = useSignTypedData({
    domain,
    types,
    value,
    primaryType: 'Permit',
    onSuccess: (signature) => {
      console.log('Permit 签名成功:', signature)
      // 这里可以将签名发送给需要使用 permit 的合约
    }
  })

  const handleSign = () => {
    if (!spender || !amount || !deadline) {
      alert('请填写完整信息')
      return
    }
    signTypedData()
  }

  return (
    <div className="permit-signer">
      <h3>ERC-20 Permit 签名</h3>
      
      <div className="form-section">
        <div className="input-group">
          <label>授权地址 (Spender):</label>
          <input
            type="text"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="input-group">
          <label>授权数量:</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000000000000000000"
          />
        </div>

        <div className="input-group">
          <label>截止时间 (Unix 时间戳):</label>
          <input
            type="number"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder={Math.floor(Date.now() / 1000 + 3600).toString()}
          />
        </div>
      </div>

      <div className="action-section">
        <button 
          onClick={handleSign}
          disabled={isLoading || !address}
        >
          {isLoading ? '签名中...' : '签名 Permit'}
        </button>

        {isSuccess && (
          <button onClick={reset}>
            重置
          </button>
        )}
      </div>

      {signature && (
        <div className="result-section">
          <h4>Permit 签名结果</h4>
          <div className="signature-info">
            <div className="info-row">
              <label>代币:</label>
              <span>{tokenName}</span>
            </div>
            <div className="info-row">
              <label>授权者:</label>
              <span>{address}</span>
            </div>
            <div className="info-row">
              <label>被授权者:</label>
              <span>{spender}</span>
            </div>
            <div className="info-row">
              <label>数量:</label>
              <span>{amount}</span>
            </div>
            <div className="info-row">
              <label>Nonce:</label>
              <span>{nonce?.toString()}</span>
            </div>
          </div>
          
          <div className="signature-display">
            <label>签名:</label>
            <textarea 
              value={signature} 
              readOnly 
              rows={4}
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### DEX 订单签名

```tsx
import { useSignTypedData, useAccount } from 'wagmi'
import { useState } from 'react'

interface OrderData {
  maker: string
  taker: string
  makerToken: string
  takerToken: string
  makerAmount: string
  takerAmount: string
  expiry: number
  nonce: number
}

function DEXOrderSigner() {
  const { address } = useAccount()
  const [orderData, setOrderData] = useState<Partial<OrderData>>({
    maker: address,
    taker: '0x0000000000000000000000000000000000000000', // 任何人都可以接受
    expiry: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
    nonce: Date.now()
  })

  const exchangeAddress = '0x...' // DEX 合约地址

  const domain = {
    name: 'DEX Exchange',
    version: '1',
    chainId: 1,
    verifyingContract: exchangeAddress
  }

  const types = {
    Order: [
      { name: 'maker', type: 'address' },
      { name: 'taker', type: 'address' },
      { name: 'makerToken', type: 'address' },
      { name: 'takerToken', type: 'address' },
      { name: 'makerAmount', type: 'uint256' },
      { name: 'takerAmount', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ]
  }

  const { 
    data: signature, 
    isLoading, 
    isSuccess, 
    signTypedData,
    reset 
  } = useSignTypedData({
    domain,
    types,
    value: orderData as OrderData,
    primaryType: 'Order',
    onSuccess: async (signature) => {
      // 将签名的订单提交到订单簿
      await submitOrderToOrderbook({
        ...orderData,
        signature
      })
    }
  })

  const submitOrderToOrderbook = async (signedOrder: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedOrder)
      })
      
      if (response.ok) {
        console.log('订单已提交到订单簿')
      }
    } catch (error) {
      console.error('提交订单失败:', error)
    }
  }

  const updateOrderData = (field: keyof OrderData, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isOrderValid = () => {
    return orderData.makerToken && 
           orderData.takerToken && 
           orderData.makerAmount && 
           orderData.takerAmount &&
           orderData.makerToken !== orderData.takerToken
  }

  const calculatePrice = () => {
    if (!orderData.makerAmount || !orderData.takerAmount) return null
    
    const price = Number(orderData.takerAmount) / Number(orderData.makerAmount)
    return price.toFixed(6)
  }

  return (
    <div className="dex-order-signer">
      <h3>DEX 订单签名</h3>
      
      <div className="order-form">
        <div className="token-pair-section">
          <h4>交易对设置</h4>
          
          <div className="token-input">
            <label>卖出代币地址:</label>
            <input
              type="text"
              value={orderData.makerToken || ''}
              onChange={(e) => updateOrderData('makerToken', e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="token-input">
            <label>卖出数量:</label>
            <input
              type="text"
              value={orderData.makerAmount || ''}
              onChange={(e) => updateOrderData('makerAmount', e.target.value)}
              placeholder="1000000000000000000"
            />
          </div>

          <div className="token-input">
            <label>买入代币地址:</label>
            <input
              type="text"
              value={orderData.takerToken || ''}
              onChange={(e) => updateOrderData('takerToken', e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="token-input">
            <label>买入数量:</label>
            <input
              type="text"
              value={orderData.takerAmount || ''}
              onChange={(e) => updateOrderData('takerAmount', e.target.value)}
              placeholder="2000000000000000000"
            />
          </div>
        </div>

        <div className="order-settings">
          <h4>订单设置</h4>
          
          <div className="setting-input">
            <label>指定接受者 (可选):</label>
            <input
              type="text"
              value={orderData.taker || ''}
              onChange={(e) => updateOrderData('taker', e.target.value)}
              placeholder="0x0000000000000000000000000000000000000000"
            />
          </div>

          <div className="setting-input">
            <label>过期时间:</label>
            <input
              type="datetime-local"
              value={new Date(orderData.expiry! * 1000).toISOString().slice(0, 16)}
              onChange={(e) => updateOrderData('expiry', Math.floor(new Date(e.target.value).getTime() / 1000))}
            />
          </div>
        </div>

        {calculatePrice() && (
          <div className="price-display">
            <h4>订单价格</h4>
            <p>价格: {calculatePrice()} (买入代币/卖出代币)</p>
          </div>
        )}
      </div>

      <div className="action-section">
        <button 
          onClick={() => signTypedData()}
          disabled={isLoading || !isOrderValid() || !address}
        >
          {isLoading ? '签名中...' : '签名订单'}
        </button>

        {isSuccess && (
          <button onClick={reset}>
            创建新订单
          </button>
        )}
      </div>

      {signature && (
        <div className="order-result">
          <h4>✅ 订单签名成功</h4>
          <div className="order-summary">
            <p>卖出: {orderData.makerAmount} (Token: {orderData.makerToken})</p>
            <p>买入: {orderData.takerAmount} (Token: {orderData.takerToken})</p>
            <p>价格: {calculatePrice()}</p>
            <p>过期时间: {new Date(orderData.expiry! * 1000).toLocaleString()}</p>
          </div>
          
          <div className="signature-display">
            <label>订单签名:</label>
            <textarea 
              value={signature} 
              readOnly 
              rows={4}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### NFT 拍卖出价签名

```tsx
import { useSignTypedData, useAccount } from 'wagmi'
import { useState } from 'react'

function NFTAuctionBidder() {
  const { address } = useAccount()
  const [bidData, setBidData] = useState({
    nftContract: '',
    tokenId: '',
    bidAmount: '',
    bidder: address || '',
    expiry: Math.floor(Date.now() / 1000) + 3600
  })

  const auctionHouseAddress = '0x...' // 拍卖行合约地址

  const domain = {
    name: 'NFT Auction House',
    version: '1',
    chainId: 1,
    verifyingContract: auctionHouseAddress
  }

  const types = {
    Bid: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'bidder', type: 'address' },
      { name: 'bidAmount', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ]
  }

  const value = {
    ...bidData,
    nonce: Date.now()
  }

  const { 
    data: signature, 
    isLoading, 
    isSuccess, 
    signTypedData,
    reset 
  } = useSignTypedData({
    domain,
    types,
    value,
    primaryType: 'Bid',
    onSuccess: async (signature) => {
      // 提交出价到拍卖系统
      await submitBid({
        ...value,
        signature
      })
    }
  })

  const submitBid = async (signedBid: any) => {
    try {
      const response = await fetch('/api/auction/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedBid)
      })
      
      if (response.ok) {
        console.log('出价已提交')
      }
    } catch (error) {
      console.error('提交出价失败:', error)
    }
  }

  const updateBidData = (field: string, value: string | number) => {
    setBidData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isBidValid = () => {
    return bidData.nftContract && 
           bidData.tokenId && 
           bidData.bidAmount &&
           Number(bidData.bidAmount) > 0
  }

  return (
    <div className="nft-auction-bidder">
      <h3>NFT 拍卖出价</h3>
      
      <div className="bid-form">
        <div className="nft-info">
          <h4>NFT 信息</h4>
          
          <div className="input-group">
            <label>NFT 合约地址:</label>
            <input
              type="text"
              value={bidData.nftContract}
              onChange={(e) => updateBidData('nftContract', e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="input-group">
            <label>Token ID:</label>
            <input
              type="text"
              value={bidData.tokenId}
              onChange={(e) => updateBidData('tokenId', e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        <div className="bid-info">
          <h4>出价信息</h4>
          
          <div className="input-group">
            <label>出价金额 (Wei):</label>
            <input
              type="text"
              value={bidData.bidAmount}
              onChange={(e) => updateBidData('bidAmount', e.target.value)}
              placeholder="1000000000000000000"
            />
            <small>
              {bidData.bidAmount && 
                `≈ ${(Number(bidData.bidAmount) / 1e18).toFixed(4)} ETH`
              }
            </small>
          </div>

          <div className="input-group">
            <label>出价有效期:</label>
            <input
              type="datetime-local"
              value={new Date(bidData.expiry * 1000).toISOString().slice(0, 16)}
              onChange={(e) => updateBidData('expiry', Math.floor(new Date(e.target.value).getTime() / 1000))}
            />
          </div>
        </div>
      </div>

      <div className="action-section">
        <button 
          onClick={() => signTypedData()}
          disabled={isLoading || !isBidValid() || !address}
        >
          {isLoading ? '签名中...' : '签名出价'}
        </button>

        {isSuccess && (
          <button onClick={reset}>
            新的出价
          </button>
        )}
      </div>

      {signature && (
        <div className="bid-result">
          <h4>✅ 出价签名成功</h4>
          <div className="bid-summary">
            <p>NFT: {bidData.nftContract} #{bidData.tokenId}</p>
            <p>出价: {(Number(bidData.bidAmount) / 1e18).toFixed(4)} ETH</p>
            <p>出价者: {bidData.bidder}</p>
            <p>有效期: {new Date(bidData.expiry * 1000).toLocaleString()}</p>
          </div>
          
          <div className="signature-display">
            <label>出价签名:</label>
            <textarea 
              value={signature} 
              readOnly 
              rows={4}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

## 错误处理

```tsx
import { useSignTypedData } from 'wagmi'
import { useState } from 'react'

function SignTypedDataWithErrorHandling() {
  const [errorMessage, setErrorMessage] = useState('')

  const { signTypedData, isLoading, error } = useSignTypedData({
    domain: {
      name: 'Test',
      version: '1',
      chainId: 1,
      verifyingContract: '0x...'
    },
    types: {
      Message: [{ name: 'content', type: 'string' }]
    },
    value: { content: 'Hello' },
    primaryType: 'Message',
    onError: (error) => {
      console.error('签名错误:', error)
      
      // 处理不同类型的错误
      if (error.message.includes('User rejected')) {
        setErrorMessage('用户拒绝了签名请求')
      } else if (error.message.includes('Not connected')) {
        setErrorMessage('请先连接钱包')
      } else if (error.message.includes('Unsupported')) {
        setErrorMessage('钱包不支持 EIP-712 签名')
      } else {
        setErrorMessage('签名失败，请重试')
      }
    },
    onSuccess: () => {
      setErrorMessage('')
    }
  })

  return (
    <div>
      <button 
        onClick={() => signTypedData()}
        disabled={isLoading}
      >
        签名结构化数据
      </button>
      
      {(error || errorMessage) && (
        <div className="error-message">
          {errorMessage || error?.message}
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: EIP-712 和普通消息签名有什么区别？
A: EIP-712 提供结构化数据签名，在钱包中显示可读内容，更安全且用户体验更好。

### Q: 如何验证 EIP-712 签名？
A: 使用 `ethers.verifyTypedData()` 或对应的验证 Hook。

### Q: domain 参数有什么作用？
A: domain 用于防止签名在不同应用间重放，确保签名只在指定的合约和链上有效。

### Q: 如何处理钱包不支持 EIP-712 的情况？
A: 检测错误类型，提供降级方案或提示用户更换钱包。

## 下一步

- [useVerifyTypedData](/wagmi/hooks/signing/use-verify-typed-data) - 学习验证结构化数据签名
- [useSignMessage](/wagmi/hooks/signing/use-sign-message) - 学习普通消息签名
- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习合约交互