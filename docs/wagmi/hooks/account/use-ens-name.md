---
title: useEnsName
description: 获取 ENS 域名的 React Hook
keywords: [wagmi, useEnsName, ENS, 域名解析, 以太坊域名, React Hook, Web3]
---

# useEnsName

`useEnsName` 是 Wagmi 中用于根据以太坊地址获取对应 ENS 域名的 Hook。它支持反向解析，将地址转换为可读的域名。

## 基本用法

```tsx
import { useEnsName } from 'wagmi'

function EnsName() {
  const { data, isError, isLoading } = useEnsName({
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })

  if (isLoading) return <div>解析中...</div>
  if (isError) return <div>解析失败</div>

  return <div>ENS: {data || '无域名'}</div>
}
```

## 参数配置

### 基础参数
- `address` - 要解析的以太坊地址
- `chainId` - 指定链 ID（默认主网）

### 查询配置
- `enabled` - 是否启用查询
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### ENS 数据
- `data` - ENS 域名字符串（如 'vitalik.eth'）

### 状态信息
- `isLoading` - 是否正在加载
- `isError` - 是否出错
- `isSuccess` - 是否成功
- `isFetching` - 是否正在获取

## 详细示例

### 基础 ENS 显示

```tsx
import { useEnsName } from 'wagmi'

function EnsDisplay({ address }: { address?: string }) {
  const { data: ensName, isLoading, error } = useEnsName({
    address,
    enabled: !!address,
  })

  if (!address) return <span>无地址</span>
  
  if (isLoading) {
    return (
      <span className="ens-loading">
        <span className="spinner"></span>
        解析中...
      </span>
    )
  }

  if (error) {
    return (
      <span className="ens-error" title={error.message}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    )
  }

  return (
    <span className="ens-display" title={address}>
      {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
    </span>
  )
}
```

### 用户资料组件

```tsx
import { useEnsName, useEnsAvatar } from 'wagmi'

function UserProfile({ address }: { address?: string }) {
  const { data: ensName } = useEnsName({
    address,
    enabled: !!address,
  })
  
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    enabled: !!ensName,
  })

  if (!address) return null

  return (
    <div className="user-profile">
      <div className="avatar">
        {ensAvatar ? (
          <img src={ensAvatar} alt="ENS Avatar" />
        ) : (
          <div className="default-avatar">
            {ensName ? ensName[0].toUpperCase() : '?'}
          </div>
        )}
      </div>
      
      <div className="user-info">
        <div className="primary-name">
          {ensName || '匿名用户'}
        </div>
        <div className="address" title={address}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
      </div>
    </div>
  )
}
```

### 地址簿组件

```tsx
import { useEnsName } from 'wagmi'
import { useState, useEffect } from 'react'

interface Contact {
  address: string
  label?: string
}

function AddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik' },
    { address: '0x...' },
  ])

  return (
    <div className="address-book">
      <h3>地址簿</h3>
      <div className="contacts-list">
        {contacts.map((contact, index) => (
          <ContactItem
            key={contact.address}
            contact={contact}
            onUpdate={(updatedContact) => {
              const newContacts = [...contacts]
              newContacts[index] = updatedContact
              setContacts(newContacts)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ContactItem({ contact, onUpdate }: {
  contact: Contact
  onUpdate: (contact: Contact) => void
}) {
  const { data: ensName, isLoading } = useEnsName({
    address: contact.address,
    staleTime: 300_000, // 5分钟缓存
  })

  useEffect(() => {
    if (ensName && !contact.label) {
      onUpdate({ ...contact, label: ensName })
    }
  }, [ensName, contact, onUpdate])

  const displayName = contact.label || ensName || '未知联系人'

  return (
    <div className="contact-item">
      <div className="contact-info">
        <div className="name">
          {isLoading ? (
            <span className="loading">解析中...</span>
          ) : (
            displayName
          )}
        </div>
        <div className="address">
          {contact.address.slice(0, 6)}...{contact.address.slice(-4)}
        </div>
      </div>
      
      {ensName && (
        <div className="ens-badge">
          ENS
        </div>
      )}
    </div>
  )
}
```

## 高级用法

### 批量 ENS 解析

```tsx
import { useEnsName } from 'wagmi'

function BatchEnsResolver({ addresses }: { addresses: string[] }) {
  return (
    <div className="batch-ens-resolver">
      <h3>批量 ENS 解析</h3>
      <div className="addresses-list">
        {addresses.map((address) => (
          <EnsResolverItem key={address} address={address} />
        ))}
      </div>
    </div>
  )
}

function EnsResolverItem({ address }: { address: string }) {
  const { data: ensName, isLoading, error } = useEnsName({
    address,
    staleTime: 600_000, // 10分钟缓存
  })

  return (
    <div className="ens-resolver-item">
      <div className="address-section">
        <span className="label">地址:</span>
        <span className="address">{address}</span>
      </div>
      
      <div className="ens-section">
        <span className="label">ENS:</span>
        {isLoading ? (
          <span className="loading">解析中...</span>
        ) : error ? (
          <span className="error">解析失败</span>
        ) : ensName ? (
          <span className="ens-name">{ensName}</span>
        ) : (
          <span className="no-ens">无 ENS 域名</span>
        )}
      </div>
    </div>
  )
}
```

### ENS 缓存管理

```tsx
import { useEnsName } from 'wagmi'
import { useState, useEffect } from 'react'

interface EnsCache {
  [address: string]: {
    name: string | null
    timestamp: number
  }
}

function EnsWithCache({ address }: { address?: string }) {
  const [ensCache, setEnsCache] = useState<EnsCache>({})
  
  const { data: ensName, isSuccess } = useEnsName({
    address,
    enabled: !!address && !getCachedEns(address, ensCache),
  })

  // 更新缓存
  useEffect(() => {
    if (isSuccess && address && ensName !== undefined) {
      setEnsCache(prev => ({
        ...prev,
        [address]: {
          name: ensName,
          timestamp: Date.now()
        }
      }))
    }
  }, [isSuccess, address, ensName])

  // 从缓存或查询结果获取 ENS
  const displayName = getCachedEns(address, ensCache) || ensName

  return (
    <div className="ens-with-cache">
      {displayName || (address && `${address.slice(0, 6)}...${address.slice(-4)}`)}
    </div>
  )
}

function getCachedEns(address: string | undefined, cache: EnsCache): string | null {
  if (!address || !cache[address]) return null
  
  const cached = cache[address]
  const isExpired = Date.now() - cached.timestamp > 600_000 // 10分钟过期
  
  return isExpired ? null : cached.name
}
```

### ENS 搜索功能

```tsx
import { useEnsName, useEnsAddress } from 'wagmi'
import { useState, useMemo } from 'react'

function EnsSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    address: string
    ensName?: string
  }>>([])

  // 判断搜索词是地址还是 ENS 域名
  const isAddress = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(searchTerm)
  }, [searchTerm])

  const isEnsName = useMemo(() => {
    return searchTerm.includes('.eth') || searchTerm.includes('.')
  }, [searchTerm])

  // 根据地址查询 ENS
  const { data: ensFromAddress } = useEnsName({
    address: isAddress ? searchTerm : undefined,
    enabled: isAddress,
  })

  // 根据 ENS 查询地址
  const { data: addressFromEns } = useEnsAddress({
    name: isEnsName ? searchTerm : undefined,
    enabled: isEnsName,
  })

  const handleSearch = () => {
    if (isAddress && ensFromAddress !== undefined) {
      setSearchResults([{
        address: searchTerm,
        ensName: ensFromAddress || undefined
      }])
    } else if (isEnsName && addressFromEns) {
      setSearchResults([{
        address: addressFromEns,
        ensName: searchTerm
      }])
    }
  }

  return (
    <div className="ens-search">
      <div className="search-input">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入地址或 ENS 域名..."
        />
        <button onClick={handleSearch} disabled={!searchTerm}>
          搜索
        </button>
      </div>

      <div className="search-results">
        {searchResults.map((result, index) => (
          <div key={index} className="search-result">
            <div className="result-address">
              地址: {result.address}
            </div>
            <div className="result-ens">
              ENS: {result.ensName || '无'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 错误处理

```tsx
import { useEnsName } from 'wagmi'
import { useState } from 'react'

function RobustEnsName({ address }: { address?: string }) {
  const [retryCount, setRetryCount] = useState(0)
  
  const {
    data: ensName,
    error,
    isLoading,
    refetch
  } = useEnsName({
    address,
    enabled: !!address,
    retry: (failureCount, error) => {
      if (failureCount < 2) {
        setRetryCount(failureCount + 1)
        return true
      }
      return false
    },
    retryDelay: 1000,
  })

  const handleRetry = () => {
    setRetryCount(0)
    refetch()
  }

  if (!address) return <span>无地址</span>

  if (isLoading) {
    return (
      <span className="ens-loading">
        解析中...
        {retryCount > 0 && ` (重试 ${retryCount}/2)`}
      </span>
    )
  }

  if (error) {
    return (
      <span className="ens-error">
        <span title={error.message}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button onClick={handleRetry} className="retry-btn">
          重试
        </button>
      </span>
    )
  }

  return (
    <span className="ens-success" title={address}>
      {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
    </span>
  )
}
```

## 性能优化

```tsx
import { useEnsName } from 'wagmi'
import { memo, useMemo } from 'react'

// 使用 memo 优化重复渲染
const EnsNameDisplay = memo(function EnsNameDisplay({ 
  address, 
  showFullAddress = false 
}: {
  address?: string
  showFullAddress?: boolean
}) {
  const { data: ensName, isLoading } = useEnsName({
    address,
    enabled: !!address,
    staleTime: 300_000, // 5分钟缓存
  })

  // 使用 useMemo 优化地址格式化
  const formattedAddress = useMemo(() => {
    if (!address) return ''
    return showFullAddress 
      ? address 
      : `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address, showFullAddress])

  if (isLoading) return <span>...</span>

  return (
    <span title={address}>
      {ensName || formattedAddress}
    </span>
  )
})

export default EnsNameDisplay
```

## 最佳实践

### 1. 用户友好的显示

```tsx
function FriendlyEnsDisplay({ address }: { address?: string }) {
  const { data: ensName, isLoading } = useEnsName({
    address,
    enabled: !!address,
  })

  if (!address) return null

  return (
    <div className="friendly-ens-display">
      <div className="primary-identifier">
        {isLoading ? (
          <span className="loading-placeholder">解析中...</span>
        ) : ensName ? (
          <span className="ens-name" title={`ENS: ${ensName}`}>
            {ensName}
          </span>
        ) : (
          <span className="address-short" title={`地址: ${address}`}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
      
      {ensName && (
        <div className="secondary-identifier">
          <small>{address.slice(0, 6)}...{address.slice(-4)}</small>
        </div>
      )}
    </div>
  )
}
```

### 2. 智能缓存策略

```tsx
function SmartEnsCache() {
  const [addresses] = useState([
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    // ... 更多地址
  ])

  return (
    <div className="smart-ens-cache">
      {addresses.map((address) => (
        <EnsNameWithSmartCache key={address} address={address} />
      ))}
    </div>
  )
}

function EnsNameWithSmartCache({ address }: { address: string }) {
  const { data: ensName } = useEnsName({
    address,
    staleTime: 600_000, // 10分钟
    cacheTime: 1800_000, // 30分钟
    // 只在组件可见时查询
    enabled: true,
  })

  return (
    <div className="ens-item">
      {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
    </div>
  )
}
```

## 常见问题

### Q: ENS 解析失败怎么办？
A: 检查网络连接和地址格式，某些地址可能没有设置反向解析。

### Q: 如何提高 ENS 解析性能？
A: 使用适当的缓存策略，避免重复查询相同地址。

### Q: 支持其他域名系统吗？
A: 目前只支持 ENS，其他域名系统需要使用专门的 Hook。

### Q: 如何处理 ENS 域名过期？
A: ENS 域名过期后反向解析会失败，需要处理这种情况。

## 下一步

- [useEnsAddress](/wagmi/hooks/account/use-ens-address) - 学习如何解析 ENS 到地址
- [useEnsAvatar](/wagmi/hooks/account/use-ens-avatar) - 学习如何获取 ENS 头像
- [useEnsResolver](/wagmi/hooks/account/use-ens-resolver) - 学习 ENS 解析器功能