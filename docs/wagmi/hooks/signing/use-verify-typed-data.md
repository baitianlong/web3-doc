---
title: useVerifyTypedData
description: 验证结构化数据签名的 React Hook
keywords: [wagmi, useVerifyTypedData, EIP-712, 结构化数据验证, 签名验证, React Hook, Web3]
---

# useVerifyTypedData

`useVerifyTypedData` 用于验证 EIP-712 结构化数据签名的有效性，确保签名来自指定地址且数据未被篡改。

## 基本用法

```tsx
import { useVerifyTypedData } from 'wagmi'

function VerifyTypedData() {
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

  const { data, isLoading, isSuccess, verifyTypedData } = useVerifyTypedData({
    domain,
    types,
    value,
    primaryType: 'Mail',
    signature: '0x...',
    address: '0x...'
  })

  return (
    <div>
      <button 
        disabled={isLoading} 
        onClick={() => verifyTypedData()}
      >
        {isLoading ? '验证中...' : '验证签名'}
      </button>
      
      {isSuccess && (
        <div>
          <p>验证结果: {data ? '✅ 签名有效' : '❌ 签名无效'}</p>
        </div>
      )}
    </div>
  )
}
```

## 参数配置

```tsx
import { useVerifyTypedData } from 'wagmi'

function ConfiguredVerifyTypedData() {
  const { verifyTypedData, data } = useVerifyTypedData({
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
    signature: '0x...',
    address: '0x...',
    onSuccess: (isValid) => {
      console.log('验证完成:', isValid ? '有效' : '无效')
    },
    onError: (error) => {
      console.error('验证失败:', error)
    }
  })

  return (
    <div>
      <button onClick={() => verifyTypedData()}>
        验证订单签名
      </button>
      {data !== undefined && (
        <p>结果: {data ? '有效' : '无效'}</p>
      )}
    </div>
  )
}
```

## 返回值

- `data` - 验证结果 (boolean | undefined)
- `error` - 错误信息
- `isLoading` - 是否正在验证
- `isSuccess` - 是否验证完成
- `isError` - 是否发生错误
- `verifyTypedData` - 执行验证的函数
- `reset` - 重置状态

## 详细示例

### ERC-20 Permit 验证

```tsx
import { useVerifyTypedData } from 'wagmi'
import { useState } from 'react'

interface PermitData {
  owner: string
  spender: string
  value: string
  nonce: string
  deadline: string
}

function ERC20PermitVerifier() {
  const [permitData, setPermitData] = useState<PermitData>({
    owner: '',
    spender: '',
    value: '',
    nonce: '',
    deadline: ''
  })
  const [signature, setSignature] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenName, setTokenName] = useState('Token')

  const domain = {
    name: tokenName,
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

  const { 
    data: isValid, 
    isLoading, 
    isSuccess,
    error,
    verifyTypedData,
    reset 
  } = useVerifyTypedData({
    domain,
    types,
    value: permitData,
    primaryType: 'Permit',
    signature,
    address: permitData.owner,
    onSuccess: (result) => {
      console.log('Permit 验证结果:', result)
    }
  })

  const updatePermitData = (field: keyof PermitData, value: string) => {
    setPermitData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVerify = () => {
    if (!tokenAddress || !signature || !permitData.owner) {
      alert('请填写完整信息')
      return
    }
    verifyTypedData()
  }

  const isFormValid = () => {
    return tokenAddress && 
           signature && 
           permitData.owner && 
           permitData.spender && 
           permitData.value && 
           permitData.nonce && 
           permitData.deadline
  }

  return (
    <div className="permit-verifier">
      <h3>ERC-20 Permit 验证</h3>
      
      <div className="form-section">
        <div className="token-info">
          <h4>代币信息</h4>
          
          <div className="input-group">
            <label>代币合约地址:</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="input-group">
            <label>代币名称:</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token"
            />
          </div>
        </div>

        <div className="permit-info">
          <h4>Permit 数据</h4>
          
          <div className="input-group">
            <label>授权者 (Owner):</label>
            <input
              type="text"
              value={permitData.owner}
              onChange={(e) => updatePermitData('owner', e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="input-group">
            <label>被授权者 (Spender):</label>
            <input
              type="text"
              value={permitData.spender}
              onChange={(e) => updatePermitData('spender', e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="input-group">
            <label>授权数量:</label>
            <input
              type="text"
              value={permitData.value}
              onChange={(e) => updatePermitData('value', e.target.value)}
              placeholder="1000000000000000000"
            />
          </div>

          <div className="input-group">
            <label>Nonce:</label>
            <input
              type="text"
              value={permitData.nonce}
              onChange={(e) => updatePermitData('nonce', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="input-group">
            <label>截止时间:</label>
            <input
              type="text"
              value={permitData.deadline}
              onChange={(e) => updatePermitData('deadline', e.target.value)}
              placeholder={Math.floor(Date.now() / 1000 + 3600).toString()}
            />
          </div>
        </div>

        <div className="signature-info">
          <h4>签名信息</h4>
          
          <div className="input-group">
            <label>签名:</label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="0x..."
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="action-section">
        <button 
          onClick={handleVerify}
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? '验证中...' : '验证 Permit'}
        </button>

        <button onClick={reset}>
          重置
        </button>
      </div>

      {isSuccess && (
        <div className={`result-section ${isValid ? 'valid' : 'invalid'}`}>
          <div className="result-header">
            <span className="result-icon">
              {isValid ? '✅' : '❌'}
            </span>
            <span className="result-text">
              {isValid ? 'Permit 签名有效' : 'Permit 签名无效'}
            </span>
          </div>
          
          {isValid && (
            <div className="permit-summary">
              <h5>验证通过的 Permit 信息:</h5>
              <div className="permit-details">
                <p><strong>代币:</strong> {tokenName} ({tokenAddress})</p>
                <p><strong>授权者:</strong> {permitData.owner}</p>
                <p><strong>被授权者:</strong> {permitData.spender}</p>
                <p><strong>数量:</strong> {permitData.value}</p>
                <p><strong>Nonce:</strong> {permitData.nonce}</p>
                <p><strong>截止时间:</strong> {new Date(Number(permitData.deadline) * 1000).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-section">
          <p>验证失败: {error.message}</p>
        </div>
      )}
    </div>
  )
}
```

### DEX 订单验证

```tsx
import { useVerifyTypedData } from 'wagmi'
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

function DEXOrderVerifier() {
  const [orderData, setOrderData] = useState<Partial<OrderData>>({})
  const [signature, setSignature] = useState('')
  const [exchangeAddress, setExchangeAddress] = useState('')

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
    data: isValid, 
    isLoading, 
    isSuccess,
    verifyTypedData,
    reset 
  } = useVerifyTypedData({
    domain,
    types,
    value: orderData as OrderData,
    primaryType: 'Order',
    signature,
    address: orderData.maker || '',
    onSuccess: async (result) => {
      if (result) {
        console.log('订单签名有效，可以执行交易')
        // 这里可以调用智能合约执行订单
      }
    }
  })

  const updateOrderData = (field: keyof OrderData, value: string | number) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isFormValid = () => {
    return exchangeAddress && 
           signature && 
           orderData.maker && 
           orderData.makerToken && 
           orderData.takerToken && 
           orderData.makerAmount && 
           orderData.takerAmount
  }

  const calculatePrice = () => {
    if (!orderData.makerAmount || !orderData.takerAmount) return null
    
    const price = Number(orderData.takerAmount) / Number(orderData.makerAmount)
    return price.toFixed(6)
  }

  const isOrderExpired = () => {
    if (!orderData.expiry) return false
    return orderData.expiry < Math.floor(Date.now() / 1000)
  }

  return (
    <div className="dex-order-verifier">
      <h3>DEX 订单验证</h3>
      
      <div className="form-section">
        <div className="exchange-info">
          <h4>交易所信息</h4>
          
          <div className="input-group">
            <label>交易所合约地址:</label>
            <input
              type="text"
              value={exchangeAddress}
              onChange={(e) => setExchangeAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
        </div>

        <div className="order-info">
          <h4>订单信息</h4>
          
          <div className="input-row">
            <div className="input-group">
              <label>制造者 (Maker):</label>
              <input
                type="text"
                value={orderData.maker || ''}
                onChange={(e) => updateOrderData('maker', e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="input-group">
              <label>接受者 (Taker):</label>
              <input
                type="text"
                value={orderData.taker || ''}
                onChange={(e) => updateOrderData('taker', e.target.value)}
                placeholder="0x... (可选)"
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>卖出代币:</label>
              <input
                type="text"
                value={orderData.makerToken || ''}
                onChange={(e) => updateOrderData('makerToken', e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="input-group">
              <label>卖出数量:</label>
              <input
                type="text"
                value={orderData.makerAmount || ''}
                onChange={(e) => updateOrderData('makerAmount', e.target.value)}
                placeholder="1000000000000000000"
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>买入代币:</label>
              <input
                type="text"
                value={orderData.takerToken || ''}
                onChange={(e) => updateOrderData('takerToken', e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="input-group">
              <label>买入数量:</label>
              <input
                type="text"
                value={orderData.takerAmount || ''}
                onChange={(e) => updateOrderData('takerAmount', e.target.value)}
                placeholder="2000000000000000000"
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>过期时间:</label>
              <input
                type="number"
                value={orderData.expiry || ''}
                onChange={(e) => updateOrderData('expiry', Number(e.target.value))}
                placeholder={Math.floor(Date.now() / 1000 + 3600).toString()}
              />
            </div>

            <div className="input-group">
              <label>Nonce:</label>
              <input
                type="number"
                value={orderData.nonce || ''}
                onChange={(e) => updateOrderData('nonce', Number(e.target.value))}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        <div className="signature-info">
          <h4>签名</h4>
          
          <div className="input-group">
            <label>订单签名:</label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="0x..."
              rows={4}
            />
          </div>
        </div>

        {calculatePrice() && (
          <div className="order-summary">
            <h4>订单摘要</h4>
            <div className="summary-details">
              <p><strong>价格:</strong> {calculatePrice()} (买入代币/卖出代币)</p>
              {orderData.expiry && (
                <p className={isOrderExpired() ? 'expired' : ''}>
                  <strong>过期时间:</strong> {new Date(orderData.expiry * 1000).toLocaleString()}
                  {isOrderExpired() && ' (已过期)'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="action-section">
        <button 
          onClick={() => verifyTypedData()}
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? '验证中...' : '验证订单'}
        </button>

        <button onClick={reset}>
          重置
        </button>
      </div>

      {isSuccess && (
        <div className={`result-section ${isValid ? 'valid' : 'invalid'}`}>
          <div className="result-header">
            <span className="result-icon">
              {isValid ? '✅' : '❌'}
            </span>
            <span className="result-text">
              {isValid ? '订单签名有效' : '订单签名无效'}
            </span>
          </div>
          
          {isValid && (
            <div className="order-validation-details">
              <h5>验证通过的订单:</h5>
              <div className="validation-details">
                <p><strong>制造者:</strong> {orderData.maker}</p>
                <p><strong>卖出:</strong> {orderData.makerAmount} (Token: {orderData.makerToken})</p>
                <p><strong>买入:</strong> {orderData.takerAmount} (Token: {orderData.takerToken})</p>
                <p><strong>价格:</strong> {calculatePrice()}</p>
                <p><strong>状态:</strong> {isOrderExpired() ? '已过期' : '有效'}</p>
              </div>
              
              {!isOrderExpired() && (
                <div className="execution-ready">
                  <p>✅ 订单可以执行</p>
                  <button className="execute-button">
                    执行订单
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 批量类型化数据验证

```tsx
import { useVerifyTypedData } from 'wagmi'
import { useState } from 'react'

interface TypedDataItem {
  id: string
  domain: any
  types: any
  value: any
  primaryType: string
  signature: string
  address: string
  isValid?: boolean
  isVerifying?: boolean
  name?: string
}

function BatchTypedDataVerifier() {
  const [typedDataItems, setTypedDataItems] = useState<TypedDataItem[]>([])
  const [currentVerifying, setCurrentVerifying] = useState<string | null>(null)

  const { verifyTypedData, isLoading } = useVerifyTypedData({
    onSuccess: (isValid) => {
      if (currentVerifying) {
        setTypedDataItems(prev => prev.map(item => 
          item.id === currentVerifying 
            ? { ...item, isValid, isVerifying: false }
            : item
        ))
        setCurrentVerifying(null)
      }
    },
    onError: () => {
      if (currentVerifying) {
        setTypedDataItems(prev => prev.map(item => 
          item.id === currentVerifying 
            ? { ...item, isValid: false, isVerifying: false }
            : item
        ))
        setCurrentVerifying(null)
      }
    }
  })

  const addSamplePermit = () => {
    const permitItem: TypedDataItem = {
      id: Date.now().toString(),
      name: 'ERC-20 Permit',
      domain: {
        name: 'USD Coin',
        version: '1',
        chainId: 1,
        verifyingContract: '0xA0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8'
      },
      types: {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      value: {
        owner: '0x...',
        spender: '0x...',
        value: '1000000000000000000',
        nonce: '0',
        deadline: Math.floor(Date.now() / 1000 + 3600).toString()
      },
      primaryType: 'Permit',
      signature: '',
      address: '0x...'
    }
    setTypedDataItems(prev => [...prev, permitItem])
  }

  const addSampleOrder = () => {
    const orderItem: TypedDataItem = {
      id: Date.now().toString(),
      name: 'DEX Order',
      domain: {
        name: 'DEX Exchange',
        version: '1',
        chainId: 1,
        verifyingContract: '0xB0b86a33E6441b8C4505E2c4c8b8b8B8B8B8B8B8'
      },
      types: {
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
      },
      value: {
        maker: '0x...',
        taker: '0x0000000000000000000000000000000000000000',
        makerToken: '0x...',
        takerToken: '0x...',
        makerAmount: '1000000000000000000',
        takerAmount: '2000000000000000000',
        expiry: Math.floor(Date.now() / 1000 + 3600),
        nonce: Date.now()
      },
      primaryType: 'Order',
      signature: '',
      address: '0x...'
    }
    setTypedDataItems(prev => [...prev, orderItem])
  }

  const updateItem = (id: string, field: keyof TypedDataItem, value: any) => {
    setTypedDataItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setTypedDataItems(prev => prev.filter(item => item.id !== id))
  }

  const verifySingleItem = async (item: TypedDataItem) => {
    if (!item.signature || !item.address) {
      alert('请填写签名和地址')
      return
    }

    setCurrentVerifying(item.id)
    setTypedDataItems(prev => prev.map(i => 
      i.id === item.id 
        ? { ...i, isVerifying: true }
        : i
    ))

    verifyTypedData({
      domain: item.domain,
      types: item.types,
      value: item.value,
      primaryType: item.primaryType,
      signature: item.signature,
      address: item.address
    })
  }

  const verifyAllItems = async () => {
    const validItems = typedDataItems.filter(item => 
      item.signature && item.address
    )

    for (const item of validItems) {
      await verifySingleItem(item)
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStats = () => {
    const total = typedDataItems.length
    const valid = typedDataItems.filter(item => item.isValid === true).length
    const invalid = typedDataItems.filter(item => item.isValid === false).length
    const pending = typedDataItems.filter(item => item.isValid === undefined).length
    
    return { total, valid, invalid, pending }
  }

  const stats = getStats()

  return (
    <div className="batch-typed-data-verifier">
      <h3>批量类型化数据验证</h3>
      
      <div className="controls-section">
        <div className="add-buttons">
          <button onClick={addSamplePermit}>
            添加 Permit 示例
          </button>
          
          <button onClick={addSampleOrder}>
            添加订单示例
          </button>
        </div>
        
        <button 
          onClick={verifyAllItems}
          disabled={isLoading || typedDataItems.length === 0}
        >
          {isLoading ? '验证中...' : '验证全部'}
        </button>
        
        <div className="stats">
          <span>总计: {stats.total}</span>
          <span>有效: {stats.valid}</span>
          <span>无效: {stats.invalid}</span>
          <span>待验证: {stats.pending}</span>
        </div>
      </div>

      <div className="items-list">
        {typedDataItems.map((item) => (
          <div key={item.id} className="typed-data-item">
            <div className="item-header">
              <h4>{item.name || `类型化数据 ${item.id}`}</h4>
              <button onClick={() => removeItem(item.id)}>
                删除
              </button>
            </div>

            <div className="item-form">
              <div className="form-row">
                <label>签名:</label>
                <textarea
                  value={item.signature}
                  onChange={(e) => updateItem(item.id, 'signature', e.target.value)}
                  placeholder="0x..."
                  rows={2}
                />
              </div>
              
              <div className="form-row">
                <label>签名者地址:</label>
                <input
                  type="text"
                  value={item.address}
                  onChange={(e) => updateItem(item.id, 'address', e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="item-data-preview">
              <h5>数据预览:</h5>
              <div className="data-summary">
                <p><strong>Domain:</strong> {item.domain.name} v{item.domain.version}</p>
                <p><strong>Primary Type:</strong> {item.primaryType}</p>
                <p><strong>Contract:</strong> {item.domain.verifyingContract}</p>
              </div>
            </div>

            <div className="item-actions">
              <button 
                onClick={() => verifySingleItem(item)}
                disabled={item.isVerifying || !item.signature || !item.address}
              >
                {item.isVerifying ? '验证中...' : '验证'}
              </button>
            </div>

            <div className="item-result">
              {item.isValid !== undefined && (
                <div className={`result-badge ${item.isValid ? 'valid' : 'invalid'}`}>
                  {item.isValid ? '✅ 有效' : '❌ 无效'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {typedDataItems.length === 0 && (
        <div className="empty-state">
          <p>暂无类型化数据，点击上方按钮添加示例</p>
        </div>
      )}
    </div>
  )
}
```

## 错误处理

```tsx
import { useVerifyTypedData } from 'wagmi'
import { useState } from 'react'

function VerifyTypedDataWithErrorHandling() {
  const [errorMessage, setErrorMessage] = useState('')

  const { verifyTypedData, isLoading, error } = useVerifyTypedData({
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
    signature: '0x...',
    address: '0x...',
    onError: (error) => {
      console.error('验证错误:', error)
      
      // 处理不同类型的错误
      if (error.message.includes('Invalid signature')) {
        setErrorMessage('签名格式无效')
      } else if (error.message.includes('Invalid domain')) {
        setErrorMessage('Domain 参数无效')
      } else if (error.message.includes('Invalid types')) {
        setErrorMessage('Types 定义无效')
      } else {
        setErrorMessage('验证失败，请检查输入')
      }
    },
    onSuccess: () => {
      setErrorMessage('')
    }
  })

  return (
    <div>
      <button 
        onClick={() => verifyTypedData()}
        disabled={isLoading}
      >
        验证类型化数据
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

### Q: EIP-712 验证和普通消息验证有什么区别？
A: EIP-712 验证需要完整的 domain、types 和 value 参数，提供更强的安全性和防重放保护。

### Q: 如何确保 domain 参数正确？
A: domain 必须与签名时使用的完全一致，包括 name、version、chainId 和 verifyingContract。

### Q: 验证失败的常见原因？
A: 1) domain 参数不匹配 2) types 定义错误 3) value 数据被修改 4) 签名格式错误

### Q: 如何处理跨链验证？
A: 确保 domain.chainId 与签名时的链 ID 一致，不同链的签名无法互相验证。

## 下一步

- [useSignTypedData](/wagmi/hooks/signing/use-sign-typed-data) - 学习结构化数据签名
- [useVerifyMessage](/wagmi/hooks/signing/use-verify-message) - 学习普通消息验证
- [useContractWrite](/wagmi/hooks/contracts/use-contract-write) - 学习合约交互