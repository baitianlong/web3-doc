---
title: useContractInfiniteReads
description: 无限滚动合约数据读取的 React Hook
keywords: [wagmi, useContractInfiniteReads, 无限滚动, 分页读取, 智能合约, React Hook, Web3]
---

# useContractInfiniteReads

`useContractInfiniteReads` 提供无限滚动功能的合约数据读取，适用于需要分页加载大量数据的场景。

## 基本用法

```tsx
import { useContractInfiniteReads } from 'wagmi'

function InfiniteTokenList() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useContractInfiniteReads({
    cacheKey: 'tokenList',
    contracts: (param = 0) => [
      {
        address: '0x...',
        abi: contractABI,
        functionName: 'getTokens',
        args: [param, 10], // 从 param 开始，获取 10 个
      },
    ],
    getNextPageParam: (lastPage, allPages) => {
      const lastResult = lastPage[0]?.result
      if (!lastResult || lastResult.length < 10) return undefined
      return allPages.length * 10 // 下一页的起始索引
    },
  })

  return (
    <div className="infinite-token-list">
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page[0]?.result?.map((token: any, index: number) => (
            <div key={index} className="token-item">
              {token.name} - {token.symbol}
            </div>
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  )
}
```

## 参数配置

### 基础配置
- `cacheKey` - 缓存键名
- `contracts` - 合约调用函数，接收页面参数
- `getNextPageParam` - 获取下一页参数的函数

### 查询选项
- `enabled` - 是否启用查询
- `staleTime` - 数据过期时间
- `cacheTime` - 缓存时间

## 返回值

### 数据和状态
- `data` - 分页数据
- `error` - 错误信息
- `isLoading` - 是否正在加载
- `isFetching` - 是否正在获取
- `isFetchingNextPage` - 是否正在获取下一页

### 操作函数
- `fetchNextPage` - 获取下一页
- `hasNextPage` - 是否有下一页
- `refetch` - 重新获取所有页面

## 详细示例

### NFT 集合无限滚动

```tsx
import { useContractInfiniteReads } from 'wagmi'
import { useState, useEffect } from 'react'

const NFT_ABI = [
  {
    name: 'tokenByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

function NFTInfiniteList({ contractAddress }: { contractAddress: string }) {
  const [nftMetadata, setNftMetadata] = useState<Map<string, any>>(new Map())
  const pageSize = 12

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useContractInfiniteReads({
    cacheKey: `nft-list-${contractAddress}`,
    contracts: (pageParam = 0) => {
      const contracts = []
      
      // 为每页生成合约调用
      for (let i = 0; i < pageSize; i++) {
        const index = pageParam + i
        contracts.push(
          // 获取 tokenId
          {
            address: contractAddress,
            abi: NFT_ABI,
            functionName: 'tokenByIndex',
            args: [BigInt(index)],
          },
          // 获取 tokenURI
          {
            address: contractAddress,
            abi: NFT_ABI,
            functionName: 'tokenURI',
            args: [BigInt(index)],
          },
          // 获取所有者
          {
            address: contractAddress,
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(index)],
          }
        )
      }
      
      return contracts
    },
    getNextPageParam: (lastPage, allPages) => {
      // 检查是否还有更多数据
      const hasValidResults = lastPage.some(result => result.status === 'success')
      if (!hasValidResults) return undefined
      
      return allPages.length * pageSize
    },
  })

  // 处理 NFT 数据
  const processedNFTs = useMemo(() => {
    if (!data?.pages) return []
    
    const nfts = []
    
    data.pages.forEach(page => {
      // 每页的数据按 3 个一组处理（tokenId, tokenURI, owner）
      for (let i = 0; i < page.length; i += 3) {
        const tokenIdResult = page[i]
        const tokenURIResult = page[i + 1]
        const ownerResult = page[i + 2]
        
        if (tokenIdResult?.status === 'success') {
          nfts.push({
            tokenId: tokenIdResult.result.toString(),
            tokenURI: tokenURIResult?.result || '',
            owner: ownerResult?.result || '',
          })
        }
      }
    })
    
    return nfts
  }, [data])

  // 获取 NFT 元数据
  useEffect(() => {
    processedNFTs.forEach(async (nft) => {
      if (nft.tokenURI && !nftMetadata.has(nft.tokenId)) {
        try {
          const response = await fetch(nft.tokenURI)
          const metadata = await response.json()
          setNftMetadata(prev => new Map(prev.set(nft.tokenId, metadata)))
        } catch (error) {
          console.error(`获取 NFT ${nft.tokenId} 元数据失败:`, error)
        }
      }
    })
  }, [processedNFTs, nftMetadata])

  // 自动加载更多（滚动到底部时）
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="nft-loading">
        <div className="loading-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="nft-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="nft-error">
        <h3>加载失败</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>重试</button>
      </div>
    )
  }

  return (
    <div className="nft-infinite-list">
      <div className="nft-header">
        <h2>NFT 集合</h2>
        <div className="nft-stats">
          <span>已加载: {processedNFTs.length} 个</span>
          {isFetching && <span className="loading-indicator">🔄</span>}
        </div>
      </div>

      <div className="nft-grid">
        {processedNFTs.map((nft, index) => {
          const metadata = nftMetadata.get(nft.tokenId)
          
          return (
            <div key={`${nft.tokenId}-${index}`} className="nft-card">
              <div className="nft-image">
                {metadata?.image ? (
                  <img 
                    src={metadata.image} 
                    alt={metadata.name || `NFT #${nft.tokenId}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="nft-placeholder">
                    <span>#{nft.tokenId}</span>
                  </div>
                )}
              </div>
              
              <div className="nft-info">
                <h3 className="nft-name">
                  {metadata?.name || `NFT #${nft.tokenId}`}
                </h3>
                
                <p className="nft-description">
                  {metadata?.description || '暂无描述'}
                </p>
                
                <div className="nft-details">
                  <div className="nft-owner">
                    <span className="label">所有者:</span>
                    <span className="address">
                      {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </span>
                  </div>
                  
                  {metadata?.attributes && (
                    <div className="nft-attributes">
                      {metadata.attributes.slice(0, 3).map((attr: any, i: number) => (
                        <span key={i} className="attribute">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isFetchingNextPage && (
        <div className="loading-more">
          <div className="loading-spinner"></div>
          <span>加载更多 NFT...</span>
        </div>
      )}

      {!hasNextPage && processedNFTs.length > 0 && (
        <div className="end-message">
          <span>已加载全部 NFT</span>
        </div>
      )}
    </div>
  )
}
```

### 交易历史无限滚动

```tsx
import { useContractInfiniteReads } from 'wagmi'
import { useState, useMemo } from 'react'
import { formatUnits, formatEther } from 'viem'

function TransactionHistory({ userAddress }: { userAddress: string }) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
  const pageSize = 20

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useContractInfiniteReads({
    cacheKey: `tx-history-${userAddress}-${filter}`,
    contracts: (pageParam = 0) => {
      // 模拟获取交易历史的合约调用
      const contracts = []
      
      for (let i = 0; i < pageSize; i++) {
        const index = pageParam + i
        contracts.push({
          address: '0x...', // 历史记录合约
          abi: [
            {
              name: 'getTransaction',
              type: 'function',
              stateMutability: 'view',
              inputs: [
                { name: 'user', type: 'address' },
                { name: 'index', type: 'uint256' },
              ],
              outputs: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'timestamp', type: 'uint256' },
                { name: 'txHash', type: 'bytes32' },
              ],
            },
          ],
          functionName: 'getTransaction',
          args: [userAddress, BigInt(index)],
        })
      }
      
      return contracts
    },
    getNextPageParam: (lastPage, allPages) => {
      const validResults = lastPage.filter(result => 
        result.status === 'success' && result.result
      )
      
      if (validResults.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    enabled: !!userAddress,
  })

  // 处理和过滤交易数据
  const filteredTransactions = useMemo(() => {
    if (!data?.pages) return []
    
    const allTransactions = data.pages.flatMap(page => 
      page
        .filter(result => result.status === 'success' && result.result)
        .map(result => {
          const [from, to, amount, timestamp, txHash] = result.result as any[]
          return {
            from,
            to,
            amount,
            timestamp: Number(timestamp),
            txHash,
            type: from.toLowerCase() === userAddress.toLowerCase() ? 'sent' : 'received',
          }
        })
    )

    if (filter === 'all') return allTransactions
    return allTransactions.filter(tx => tx.type === filter)
  }, [data, filter, userAddress])

  const stats = useMemo(() => {
    const sent = filteredTransactions.filter(tx => tx.type === 'sent')
    const received = filteredTransactions.filter(tx => tx.type === 'received')
    
    const totalSent = sent.reduce((sum, tx) => sum + Number(formatEther(tx.amount)), 0)
    const totalReceived = received.reduce((sum, tx) => sum + Number(formatEther(tx.amount)), 0)
    
    return {
      totalTransactions: filteredTransactions.length,
      sentCount: sent.length,
      receivedCount: received.length,
      totalSent: totalSent.toFixed(4),
      totalReceived: totalReceived.toFixed(4),
      netFlow: (totalReceived - totalSent).toFixed(4),
    }
  }, [filteredTransactions])

  if (isLoading) {
    return (
      <div className="tx-history-loading">
        <div className="loading-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-stats"></div>
        </div>
        <div className="loading-list">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="tx-skeleton">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <div className="skeleton-amount"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h2>交易历史</h2>
        
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-label">总交易</span>
            <span className="stat-value">{stats.totalTransactions}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">发送</span>
            <span className="stat-value">{stats.sentCount}</span>
            <span className="stat-amount">-{stats.totalSent} ETH</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">接收</span>
            <span className="stat-value">{stats.receivedCount}</span>
            <span className="stat-amount">+{stats.totalReceived} ETH</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">净流入</span>
            <span className={`stat-amount ${parseFloat(stats.netFlow) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(stats.netFlow) >= 0 ? '+' : ''}{stats.netFlow} ETH
            </span>
          </div>
        </div>
      </div>

      <div className="history-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button 
          className={filter === 'sent' ? 'active' : ''}
          onClick={() => setFilter('sent')}
        >
          发送
        </button>
        <button 
          className={filter === 'received' ? 'active' : ''}
          onClick={() => setFilter('received')}
        >
          接收
        </button>
      </div>

      <div className="transactions-list">
        {filteredTransactions.map((tx, index) => (
          <div key={`${tx.txHash}-${index}`} className={`transaction-item ${tx.type}`}>
            <div className="tx-icon">
              {tx.type === 'sent' ? '📤' : '📥'}
            </div>
            
            <div className="tx-details">
              <div className="tx-addresses">
                <span className="tx-from">
                  从: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                </span>
                <span className="tx-arrow">→</span>
                <span className="tx-to">
                  到: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                </span>
              </div>
              
              <div className="tx-meta">
                <span className="tx-time">
                  {new Date(tx.timestamp * 1000).toLocaleString()}
                </span>
                <a 
                  href={`https://etherscan.io/tx/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  查看详情
                </a>
              </div>
            </div>
            
            <div className="tx-amount">
              <span className={`amount ${tx.type}`}>
                {tx.type === 'sent' ? '-' : '+'}
                {formatEther(tx.amount)} ETH
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="load-more-section">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="load-more-button"
          >
            {isFetchingNextPage ? (
              <>
                <div className="loading-spinner"></div>
                加载中...
              </>
            ) : (
              '加载更多交易'
            )}
          </button>
        </div>
      )}

      {!hasNextPage && filteredTransactions.length > 0 && (
        <div className="end-message">
          已显示全部交易记录
        </div>
      )}

      {error && (
        <div className="error-message">
          加载失败: {error.message}
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      )}
    </div>
  )
}
```

### 代币持仓无限滚动

```tsx
import { useContractInfiniteReads } from 'wagmi'
import { useState, useMemo } from 'react'

function TokenPortfolio({ userAddress }: { userAddress: string }) {
  const [sortBy, setSortBy] = useState<'balance' | 'value' | 'name'>('value')
  const [searchTerm, setSearchTerm] = useState('')
  const pageSize = 50

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useContractInfiniteReads({
    cacheKey: `portfolio-${userAddress}`,
    contracts: (pageParam = 0) => {
      const contracts = []
      
      // 获取代币列表和余额
      for (let i = 0; i < pageSize; i++) {
        const tokenIndex = pageParam + i
        contracts.push(
          // 获取代币地址
          {
            address: '0x...', // 代币注册表合约
            abi: [
              {
                name: 'getTokenByIndex',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'index', type: 'uint256' }],
                outputs: [{ name: '', type: 'address' }],
              },
            ],
            functionName: 'getTokenByIndex',
            args: [BigInt(tokenIndex)],
          }
        )
      }
      
      return contracts
    },
    getNextPageParam: (lastPage, allPages) => {
      const validTokens = lastPage.filter(result => 
        result.status === 'success' && 
        result.result !== '0x0000000000000000000000000000000000000000'
      )
      
      if (validTokens.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    enabled: !!userAddress,
  })

  // 获取代币详细信息
  const tokenAddresses = useMemo(() => {
    if (!data?.pages) return []
    
    return data.pages.flatMap(page => 
      page
        .filter(result => 
          result.status === 'success' && 
          result.result !== '0x0000000000000000000000000000000000000000'
        )
        .map(result => result.result as string)
    )
  }, [data])

  const {
    data: tokenDetails,
    isLoading: isLoadingDetails,
  } = useContractInfiniteReads({
    cacheKey: `token-details-${userAddress}`,
    contracts: () => {
      const contracts = []
      
      tokenAddresses.forEach(tokenAddress => {
        contracts.push(
          // 代币名称
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'name',
          },
          // 代币符号
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
          },
          // 代币精度
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
          },
          // 用户余额
          {
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
          }
        )
      })
      
      return contracts
    },
    getNextPageParam: () => undefined, // 不需要分页
    enabled: tokenAddresses.length > 0,
  })

  // 处理代币数据
  const processedTokens = useMemo(() => {
    if (!tokenDetails?.pages?.[0] || !tokenAddresses.length) return []
    
    const results = tokenDetails.pages[0]
    const tokens = []
    
    for (let i = 0; i < tokenAddresses.length; i++) {
      const baseIndex = i * 4
      const nameResult = results[baseIndex]
      const symbolResult = results[baseIndex + 1]
      const decimalsResult = results[baseIndex + 2]
      const balanceResult = results[baseIndex + 3]
      
      if (
        nameResult?.status === 'success' &&
        symbolResult?.status === 'success' &&
        decimalsResult?.status === 'success' &&
        balanceResult?.status === 'success' &&
        balanceResult.result > 0n
      ) {
        tokens.push({
          address: tokenAddresses[i],
          name: nameResult.result,
          symbol: symbolResult.result,
          decimals: decimalsResult.result,
          balance: balanceResult.result,
          formattedBalance: formatUnits(balanceResult.result, decimalsResult.result),
        })
      }
    }
    
    return tokens
  }, [tokenDetails, tokenAddresses])

  // 过滤和排序
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = processedTokens
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'balance':
          return parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance)
        case 'value':
        default:
          // 这里可以集成价格 API 来计算价值
          return parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance)
      }
    })
    
    return filtered
  }, [processedTokens, searchTerm, sortBy])

  if (isLoading || isLoadingDetails) {
    return (
      <div className="portfolio-loading">
        <div className="loading-header">
          <div className="skeleton-search"></div>
          <div className="skeleton-filters"></div>
        </div>
        <div className="loading-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="token-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <div className="skeleton-balance"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="token-portfolio">
      <div className="portfolio-header">
        <h2>代币持仓</h2>
        <div className="portfolio-stats">
          <span>持有代币: {filteredAndSortedTokens.length}</span>
          <span>总价值: 计算中...</span>
        </div>
      </div>

      <div className="portfolio-controls">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索代币名称、符号或地址"
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <label>排序方式:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="value">按价值</option>
            <option value="balance">按余额</option>
            <option value="name">按名称</option>
          </select>
        </div>
      </div>

      <div className="tokens-grid">
        {filteredAndSortedTokens.map((token, index) => (
          <div key={`${token.address}-${index}`} className="token-card">
            <div className="token-icon">
              <img 
                src={`https://tokens.1inch.io/${token.address}.png`}
                alt={token.symbol}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="token-placeholder" style={{ display: 'none' }}>
                {token.symbol.slice(0, 2)}
              </div>
            </div>
            
            <div className="token-info">
              <h3 className="token-name">{token.name}</h3>
              <p className="token-symbol">{token.symbol}</p>
              <p className="token-address">
                {token.address.slice(0, 6)}...{token.address.slice(-4)}
              </p>
            </div>
            
            <div className="token-balance">
              <span className="balance-amount">
                {parseFloat(token.formattedBalance).toLocaleString(undefined, {
                  maximumFractionDigits: 6
                })}
              </span>
              <span className="balance-symbol">{token.symbol}</span>
              <span className="balance-value">
                ≈ $0.00 {/* 这里可以集成价格 API */}
              </span>
            </div>
            
            <div className="token-actions">
              <button className="action-button">发送</button>
              <button className="action-button">交换</button>
            </div>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="load-more-section">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="load-more-button"
          >
            {isFetchingNextPage ? '加载中...' : '加载更多代币'}
          </button>
        </div>
      )}

      {filteredAndSortedTokens.length === 0 && !isLoading && (
        <div className="empty-state">
          <h3>暂无代币持仓</h3>
          <p>您的钱包中没有找到任何代币余额</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h3>加载失败</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      )}
    </div>
  )
}
```

## 高级用法

### 虚拟滚动优化

```tsx
import { useContractInfiniteReads } from 'wagmi'
import { FixedSizeList as List } from 'react-window'
import { useState, useMemo } from 'react'

function VirtualizedInfiniteList() {
  const [listHeight] = useState(600)
  const [itemHeight] = useState(80)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContractInfiniteReads({
    cacheKey: 'virtualized-list',
    contracts: (pageParam = 0) => {
      const contracts = []
      for (let i = 0; i < 100; i++) { // 每页100项
        contracts.push({
          address: '0x...',
          abi: contractABI,
          functionName: 'getItem',
          args: [BigInt(pageParam + i)],
        })
      }
      return contracts
    },
    getNextPageParam: (lastPage, allPages) => {
      const validResults = lastPage.filter(r => r.status === 'success')
      if (validResults.length < 100) return undefined
      return allPages.length * 100
    },
  })

  const items = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => 
      page.filter(result => result.status === 'success')
    )
  }, [data])

  const Row = ({ index, style }: { index: number; style: any }) => {
    const item = items[index]
    
    // 当接近列表末尾时加载更多
    if (index === items.length - 10 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }

    if (!item) {
      return (
        <div style={style} className="loading-item">
          加载中...
        </div>
      )
    }

    return (
      <div style={style} className="list-item">
        <div className="item-content">
          {/* 渲染项目内容 */}
          项目 #{index}: {JSON.stringify(item.result)}
        </div>
      </div>
    )
  }

  return (
    <div className="virtualized-infinite-list">
      <h3>虚拟化无限列表</h3>
      <List
        height={listHeight}
        itemCount={items.length + (hasNextPage ? 1 : 0)}
        itemSize={itemHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  )
}
```

### 智能预加载

```tsx
import { useContractInfiniteReads } from 'wagmi'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'

function SmartPreloadList() {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // 提前200px开始加载
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContractInfiniteReads({
    cacheKey: 'smart-preload',
    contracts: (pageParam = 0) => [
      {
        address: '0x...',
        abi: contractABI,
        functionName: 'getData',
        args: [pageParam, 20],
      },
    ],
    getNextPageParam: (lastPage, allPages) => {
      const result = lastPage[0]?.result
      if (!result || result.length < 20) return undefined
      return allPages.length * 20
    },
  })

  // 智能预加载
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = data?.pages.flatMap(page => page[0]?.result || []) || []

  return (
    <div className="smart-preload-list">
      <div className="items-container">
        {items.map((item, index) => (
          <div key={index} className="item">
            {/* 渲染项目 */}
          </div>
        ))}
      </div>
      
      {/* 触发器元素 */}
      <div ref={ref} className="load-trigger">
        {isFetchingNextPage && <div>加载中...</div>}
        {!hasNextPage && <div>已加载全部</div>}
      </div>
    </div>
  )
}
```

## 性能优化

### 1. 缓存策略

```tsx
function OptimizedInfiniteReads() {
  const { data } = useContractInfiniteReads({
    cacheKey: 'optimized-data',
    contracts: (pageParam = 0) => [...],
    getNextPageParam: (lastPage, allPages) => {...},
    // 优化缓存设置
    staleTime: 60_000, // 1分钟内不重新获取
    cacheTime: 300_000, // 缓存5分钟
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return <div>优化的无限读取</div>
}
```

### 2. 内存管理

```tsx
function MemoryOptimizedList() {
  const [maxItems] = useState(1000) // 限制最大项目数

  const { data, ...rest } = useContractInfiniteReads({
    cacheKey: 'memory-optimized',
    contracts: (pageParam = 0) => [...],
    getNextPageParam: (lastPage, allPages) => {
      // 限制页面数量
      if (allPages.length >= 10) return undefined
      return lastPage.length > 0 ? allPages.length * 20 : undefined
    },
  })

  // 限制渲染的项目数量
  const limitedItems = useMemo(() => {
    const allItems = data?.pages.flatMap(page => page) || []
    return allItems.slice(-maxItems) // 只保留最新的项目
  }, [data, maxItems])

  return (
    <div className="memory-optimized-list">
      {limitedItems.map((item, index) => (
        <div key={index}>{/* 渲染项目 */}</div>
      ))}
    </div>
  )
}
```

## 最佳实践

### 1. 错误边界

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="error-fallback">
      <h2>出现错误</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

function SafeInfiniteReads() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <InfiniteTokenList />
    </ErrorBoundary>
  )
}
```

### 2. 加载状态管理

```tsx
function LoadingStateManager() {
  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  } = useContractInfiniteReads({...})

  if (isLoading) {
    return <InitialLoadingComponent />
  }

  if (error) {
    return <ErrorComponent error={error} />
  }

  return (
    <div>
      <DataComponent data={data} />
      {isFetching && !isFetchingNextPage && <RefreshingIndicator />}
      {isFetchingNextPage && <LoadingMoreIndicator />}
      {!hasNextPage && <EndOfListIndicator />}
    </div>
  )
}
```

## 常见问题

### Q: 如何处理大量数据的性能问题？
A: 使用虚拟滚动、限制渲染项目数量、合理设置缓存策略。

### Q: 如何实现双向无限滚动？
A: 需要自定义实现，`useContractInfiniteReads` 主要支持向前滚动。

### Q: 如何处理网络错误和重试？
A: 设置合适的重试策略，使用错误边界组件。

### Q: 如何优化首屏加载速度？
A: 减少首页数据量，使用骨架屏，预加载关键数据。

## 下一步

- [useContractReads](/wagmi/hooks/contracts/use-contract-reads) - 学习批量合约读取
- [useContractRead](/wagmi/hooks/contracts/use-contract-read) - 学习单个合约读取
- [useContractEvent](/wagmi/hooks/contracts/use-contract-event) - 学习事件监听
