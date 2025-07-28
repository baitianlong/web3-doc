---
title: useEnsAddress
description: 解析 ENS 域名到地址的 React Hook
keywords: [wagmi, useEnsAddress, ENS解析, 域名到地址, 以太坊域名, React Hook, Web3]
---

# useEnsAddress

`useEnsAddress` 是 Wagmi 中用于将 ENS 域名解析为以太坊地址的 Hook。它支持正向解析，将可读的域名转换为地址。

## 基本用法

```tsx
import { useEnsAddress } from 'wagmi'

function EnsAddress() {
  const { data, isError, isLoading } = useEnsAddress({
    name: 'vitalik.eth',
  })

  if (isLoading) return <div>解析中...</div>
  if (isError) return <div>解析失败</div>

  return <div>地址: {data}</div>
}
```

## 参数配置

### 基础参数
- `name` - 要解析的 ENS 域名
- `chainId` - 指定链 ID（默认主网）

### 查询配置
- `enabled` - 是否启用查询
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### 地址数据
- `data` - 解析出的以太坊地址

### 状态信息
- `isLoading` - 是否正在加载
- `isError` - 是否出错
- `isSuccess` - 是否成功
- `isFetching` - 是否正在获取

## 详细示例

### 基础 ENS 解析

```tsx
import { useEnsAddress } from 'wagmi'

function EnsResolver({ ensName }: { ensName?: string }) {
  const { data: address, isLoading, error } = useEnsAddress({
    name: ensName,
    enabled: !!ensName,
  })

  if (!ensName) return <div>请输入 ENS 域名</div>
  
  if (isLoading) {
    return (
      <div className="ens-loading">
        <span className="spinner"></span>
        解析 {ensName} 中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="ens-error">
        ❌ 解析 {ensName} 失败: {error.message}
      </div>
    )
  }

  if (!address) {
    return (
      <div className="ens-not-found">
        ⚠️ 未找到 {ensName} 对应的地址
      </div>
    )
  }

  return (
    <div className="ens-success">
      <div className="ens-name">{ensName}</div>
      <div className="resolved-address">
        ➜ {address}
      </div>
    </div>
  )
}
```

### ENS 搜索组件

```tsx
import { useEnsAddress } from 'wagmi'
import { useState, useEffect } from 'react'

function EnsSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: address, isLoading, error } = useEnsAddress({
    name: debouncedTerm,
    enabled: !!debouncedTerm && debouncedTerm.includes('.'),
  })

  const isValidEnsName = (name: string) => {
    return name.includes('.') && name.length > 3
  }

  return (
    <div className="ens-search">
      <div className="search-input">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入 ENS 域名 (例如: vitalik.eth)"
          className="ens-input"
        />
        
        {searchTerm && !isValidEnsName(searchTerm) && (
          <div className="input-hint">
            请输入有效的 ENS 域名
          </div>
        )}
      </div>

      {debouncedTerm && isValidEnsName(debouncedTerm) && (
        <div className="search-result">
          {isLoading ? (
            <div className="loading-result">
              <span className="spinner"></span>
              正在解析 {debouncedTerm}...
            </div>
          ) : error ? (
            <div className="error-result">
              ❌ 解析失败: {error.message}
            </div>
          ) : address ? (
            <div className="success-result">
              <div className="ens-name">{debouncedTerm}</div>
              <div className="resolved-address">
                <span className="label">地址:</span>
                <span className="address" title={address}>
                  {address}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="copy-btn"
                  title="复制地址"
                >
                  📋
                </button>
              </div>
            </div>
          ) : (
            <div className="not-found-result">
              ⚠️ 未找到 {debouncedTerm} 对应的地址
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 批量 ENS 解析

```tsx
import { useEnsAddress } from 'wagmi'

function BatchEnsResolver() {
  const [ensNames] = useState([
    'vitalik.eth',
    'nick.eth',
    'brantly.eth',
    'invalid-name.eth'
  ])

  return (
    <div className="batch-ens-resolver">
      <h3>批量 ENS 解析</h3>
      <div className="ens-list">
        {ensNames.map((name) => (
          <EnsResolverItem key={name} ensName={name} />
        ))}
      </div>
    </div>
  )
}

function EnsResolverItem({ ensName }: { ensName: string }) {
  const { data: address, isLoading, error } = useEnsAddress({
    name: ensName,
    staleTime: 300_000, // 5分钟缓存
  })

  return (
    <div className="ens-resolver-item">
      <div className="ens-name-section">
        <span className="ens-name">{ensName}</span>
      </div>
      
      <div className="resolution-section">
        {isLoading ? (
          <span className="loading">解析中...</span>
        ) : error ? (
          <span className="error" title={error.message}>
            解析失败
          </span>
        ) : address ? (
          <span className="address" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        ) : (
          <span className="not-found">未找到</span>
        )}
      </div>
      
      <div className="status-section">
        {address && (
          <span className="status-badge success">✓</span>
        )}
        {error && (
          <span className="status-badge error">✗</span>
        )}
      </div>
    </div>
  )
}
```

## 高级用法

### ENS 地址簿

```tsx
import { useEnsAddress } from 'wagmi'
import { useState, useEffect } from 'react'

interface Contact {
  id: string
  ensName: string
  label?: string
  address?: string
}

function EnsAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', ensName: 'vitalik.eth', label: 'Vitalik Buterin' },
    { id: '2', ensName: 'nick.eth', label: 'Nick Johnson' },
  ])

  const [newEnsName, setNewEnsName] = useState('')

  const addContact = () => {
    if (newEnsName && !contacts.find(c => c.ensName === newEnsName)) {
      setContacts(prev => [...prev, {
        id: Date.now().toString(),
        ensName: newEnsName,
      }])
      setNewEnsName('')
    }
  }

  return (
    <div className="ens-address-book">
      <div className="add-contact">
        <h3>添加联系人</h3>
        <div className="input-group">
          <input
            type="text"
            value={newEnsName}
            onChange={(e) => setNewEnsName(e.target.value)}
            placeholder="输入 ENS 域名"
          />
          <button onClick={addContact} disabled={!newEnsName}>
            添加
          </button>
        </div>
      </div>

      <div className="contacts-list">
        <h3>联系人列表</h3>
        {contacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            onUpdate={(updatedContact) => {
              setContacts(prev =>
                prev.map(c => c.id === contact.id ? updatedContact : c)
              )
            }}
            onDelete={() => {
              setContacts(prev => prev.filter(c => c.id !== contact.id))
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ContactItem({ contact, onUpdate, onDelete }: {
  contact: Contact
  onUpdate: (contact: Contact) => void
  onDelete: () => void
}) {
  const { data: address, isLoading, error } = useEnsAddress({
    name: contact.ensName,
  })

  useEffect(() => {
    if (address && address !== contact.address) {
      onUpdate({ ...contact, address })
    }
  }, [address, contact, onUpdate])

  return (
    <div className="contact-item">
      <div className="contact-header">
        <div className="contact-name">
          {contact.label || contact.ensName}
        </div>
        <button onClick={onDelete} className="delete-btn">
          ✕
        </button>
      </div>
      
      <div className="contact-details">
        <div className="ens-name">
          ENS: {contact.ensName}
        </div>
        <div className="address-section">
          地址: {isLoading ? (
            <span className="loading">解析中...</span>
          ) : error ? (
            <span className="error">解析失败</span>
          ) : address ? (
            <span className="address" title={address}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          ) : (
            <span className="not-found">未找到</span>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 智能表单验证

```tsx
import { useEnsAddress } from 'wagmi'
import { useState, useEffect } from 'react'

function EnsAddressForm() {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const isEnsName = recipient.includes('.eth') || recipient.includes('.')
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient)

  const { data: resolvedAddress, isLoading, error } = useEnsAddress({
    name: isEnsName ? recipient : undefined,
    enabled: isEnsName,
  })

  const finalAddress = isAddress ? recipient : resolvedAddress

  useEffect(() => {
    setIsValidating(isLoading)
  }, [isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!finalAddress) {
      alert('请输入有效的地址或 ENS 域名')
      return
    }

    console.log('发送交易:', {
      to: finalAddress,
      amount: amount,
      originalInput: recipient
    })
  }

  return (
    <form onSubmit={handleSubmit} className="ens-address-form">
      <div className="form-group">
        <label htmlFor="recipient">收款地址</label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="输入地址或 ENS 域名 (如: vitalik.eth)"
          className={`form-input ${
            recipient && !finalAddress && !isValidating ? 'error' : ''
          }`}
        />
        
        {recipient && (
          <div className="address-validation">
            {isValidating ? (
              <div className="validating">
                <span className="spinner"></span>
                验证 ENS 域名...
              </div>
            ) : error ? (
              <div className="validation-error">
                ❌ 无法解析 ENS 域名
              </div>
            ) : finalAddress ? (
              <div className="validation-success">
                ✅ 解析成功: {finalAddress.slice(0, 6)}...{finalAddress.slice(-4)}
                {isEnsName && (
                  <span className="ens-badge">ENS</span>
                )}
              </div>
            ) : (
              <div className="validation-pending">
                请输入有效的地址或 ENS 域名
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="amount">金额 (ETH)</label>
        <input
          id="amount"
          type="number"
          step="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="form-input"
        />
      </div>

      <button
        type="submit"
        disabled={!finalAddress || !amount || isValidating}
        className="submit-btn"
      >
        {isValidating ? '验证中...' : '发送交易'}
      </button>
    </form>
  )
}
```

## 错误处理

```tsx
import { useEnsAddress } from 'wagmi'
import { useState } from 'react'

function RobustEnsResolver({ ensName }: { ensName: string }) {
  const [retryCount, setRetryCount] = useState(0)
  
  const {
    data: address,
    error,
    isLoading,
    refetch
  } = useEnsAddress({
    name: ensName,
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        setRetryCount(failureCount + 1)
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const handleManualRetry = () => {
    setRetryCount(0)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="ens-loading">
        <div className="spinner"></div>
        <span>解析 {ensName}...</span>
        {retryCount > 0 && <span>(重试 {retryCount}/3)</span>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="ens-error">
        <p>❌ 解析失败: {error.message}</p>
        <button onClick={handleManualRetry} className="retry-button">
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="ens-success">
      <p>✅ 解析成功</p>
      <p>ENS: {ensName}</p>
      <p>地址: {address}</p>
    </div>
  )
}
```

## 性能优化

```tsx
import { useEnsAddress } from 'wagmi'
import { useMemo } from 'react'

function OptimizedEnsResolver({ ensNames }: { ensNames: string[] }) {
  // 使用 useMemo 优化查询配置
  const queries = useMemo(() => 
    ensNames.map(name => ({
      name,
      enabled: !!name && name.includes('.'),
      staleTime: 300_000, // 5分钟缓存
    })), [ensNames]
  )

  return (
    <div className="optimized-ens-resolver">
      {queries.map((query, index) => (
        <EnsResolverItem
          key={ensNames[index]}
          query={query}
        />
      ))}
    </div>
  )
}

function EnsResolverItem({ query }: { query: any }) {
  const { data: address, isLoading } = useEnsAddress(query)

  return (
    <div className="ens-item">
      <span className="ens-name">{query.name}</span>
      <span className="address">
        {isLoading ? '...' : (address || '未找到')}
      </span>
    </div>
  )
}
```

## 最佳实践

### 1. 输入验证

```tsx
function ValidatedEnsInput({ onAddressChange }: {
  onAddressChange: (address: string | null) => void
}) {
  const [input, setInput] = useState('')
  
  const isValidEnsFormat = (name: string) => {
    return /^[a-zA-Z0-9-]+\.eth$/.test(name) || 
           /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(name)
  }

  const { data: address } = useEnsAddress({
    name: input,
    enabled: isValidEnsFormat(input),
  })

  useEffect(() => {
    onAddressChange(address || null)
  }, [address, onAddressChange])

  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="输入 ENS 域名"
      className={`ens-input ${
        input && !isValidEnsFormat(input) ? 'invalid' : ''
      }`}
    />
  )
}
```

### 2. 缓存策略

```tsx
function CachedEnsResolver({ ensName }: { ensName: string }) {
  const { data: address } = useEnsAddress({
    name: ensName,
    staleTime: 600_000, // 10分钟内不重新获取
    cacheTime: 1800_000, // 缓存30分钟
    // 在后台自动更新
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  return (
    <div>
      {ensName} → {address || '解析中...'}
    </div>
  )
}
```

## 常见问题

### Q: ENS 解析失败的常见原因？
A: 1) 域名不存在 2) 网络连接问题 3) 域名未设置地址记录 4) 域名已过期

### Q: 如何提高解析性能？
A: 使用适当的缓存策略，避免重复查询，使用防抖处理用户输入。

### Q: 支持子域名解析吗？
A: 是的，支持如 `subdomain.example.eth` 格式的子域名。

### Q: 如何处理国际化域名？
A: ENS 支持国际化域名，但需要确保正确的编码格式。

## 下一步

- [useEnsName](/wagmi/hooks/account/use-ens-name) - 学习反向 ENS 解析
- [useEnsAvatar](/wagmi/hooks/account/use-ens-avatar) - 学习获取 ENS 头像
- [useEnsResolver](/wagmi/hooks/account/use-ens-resolver) - 学习 ENS 解析器功能
