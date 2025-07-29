---
title: NFT 市场开发
description: 使用 Wagmi 构建完整的 NFT 交易市场
keywords: [wagmi, NFT, 市场, ERC-721, ERC-1155, React, Web3, 拍卖, 交易]
---

# NFT 市场开发

本章将详细介绍如何使用 Wagmi 构建一个功能完整的 NFT 交易市场，包括 NFT 展示、买卖、拍卖、铸造等核心功能。

## 项目架构

### 1. 技术栈

```typescript
// 核心技术栈
const techStack = {
  frontend: {
    framework: 'React + TypeScript',
    hooks: 'Wagmi',
    ui: 'Tailwind CSS + Headless UI',
    state: 'Zustand',
    routing: 'React Router',
    media: 'IPFS'
  },
  blockchain: {
    standards: ['ERC-721', 'ERC-1155'],
    marketplace: 'Custom Contract',
    storage: 'IPFS + Pinata',
    networks: ['Ethereum', 'Polygon']
  }
}
```

### 2. 智能合约接口

```typescript
// types/contracts.ts
export interface NFTMarketplace {
  // 基础交易
  listItem: (tokenContract: string, tokenId: bigint, price: bigint) => void
  buyItem: (tokenContract: string, tokenId: bigint) => void
  cancelListing: (tokenContract: string, tokenId: bigint) => void
  
  // 拍卖功能
  createAuction: (tokenContract: string, tokenId: bigint, startPrice: bigint, duration: bigint) => void
  placeBid: (tokenContract: string, tokenId: bigint, bidAmount: bigint) => void
  endAuction: (tokenContract: string, tokenId: bigint) => void
  
  // 查询功能
  getListing: (tokenContract: string, tokenId: bigint) => Promise<Listing>
  getAuction: (tokenContract: string, tokenId: bigint) => Promise<Auction>
}

export interface Listing {
  seller: string
  price: bigint
  isActive: boolean
}

export interface Auction {
  seller: string
  startPrice: bigint
  currentBid: bigint
  highestBidder: string
  endTime: bigint
  isActive: boolean
}
```

## 核心功能实现

### 1. NFT 展示组件

```tsx
// components/nft/NFTCard.tsx
import { useState } from 'react'
import { useContractRead, useAccount } from 'wagmi'
import { formatEther } from 'viem'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

interface NFTCardProps {
  contractAddress: string
  tokenId: string
  metadata: NFTMetadata
  listing?: Listing
  auction?: Auction
}

export function NFTCard({ 
  contractAddress, 
  tokenId, 
  metadata, 
  listing, 
  auction 
}: NFTCardProps) {
  const { address } = useAccount()
  const [imageLoaded, setImageLoaded] = useState(false)

  // 获取 NFT 所有者
  const { data: owner } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }]
      }
    ],
    functionName: 'ownerOf',
    args: [BigInt(tokenId)]
  })

  const isOwner = owner === address
  const isListed = listing?.isActive
  const isInAuction = auction?.isActive

  const getStatusBadge = () => {
    if (isInAuction) {
      return <div className="status-badge auction">拍卖中</div>
    }
    if (isListed) {
      return <div className="status-badge listed">在售</div>
    }
    return null
  }

  const getPriceDisplay = () => {
    if (isInAuction && auction) {
      return (
        <div className="price-info auction">
          <div className="current-bid">
            当前出价: {formatEther(auction.currentBid)} ETH
          </div>
          <div className="time-left">
            剩余时间: {getTimeLeft(auction.endTime)}
          </div>
        </div>
      )
    }
    
    if (isListed && listing) {
      return (
        <div className="price-info listed">
          <div className="price">
            价格: {formatEther(listing.price)} ETH
          </div>
        </div>
      )
    }
    
    return null
  }

  const getTimeLeft = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = Number(endTime) - now
    
    if (timeLeft <= 0) return '已结束'
    
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="nft-card">
      <div className="nft-image-container">
        {!imageLoaded && (
          <div className="image-placeholder">
            <div className="loading-spinner" />
          </div>
        )}
        <img
          src={metadata.image}
          alt={metadata.name}
          onLoad={() => setImageLoaded(true)}
          className={`nft-image ${imageLoaded ? 'loaded' : 'loading'}`}
        />
        {getStatusBadge()}
      </div>

      <div className="nft-info">
        <div className="nft-header">
          <h3 className="nft-name">{metadata.name}</h3>
          <div className="nft-id">#{tokenId}</div>
        </div>

        <p className="nft-description">{metadata.description}</p>

        {metadata.attributes && metadata.attributes.length > 0 && (
          <div className="nft-attributes">
            {metadata.attributes.slice(0, 3).map((attr, index) => (
              <div key={index} className="attribute">
                <span className="trait-type">{attr.trait_type}</span>
                <span className="trait-value">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="nft-owner">
          <span className="owner-label">所有者:</span>
          <span className="owner-address">
            {isOwner ? '你' : `${owner?.slice(0, 6)}...${owner?.slice(-4)}`}
          </span>
        </div>

        {getPriceDisplay()}

        <div className="nft-actions">
          {isOwner && !isListed && !isInAuction && (
            <>
              <button className="action-button primary">
                出售
              </button>
              <button className="action-button secondary">
                拍卖
              </button>
            </>
          )}
          
          {isOwner && isListed && (
            <button className="action-button danger">
              取消出售
            </button>
          )}
          
          {!isOwner && isListed && (
            <button className="action-button primary">
              立即购买
            </button>
          )}
          
          {!isOwner && isInAuction && (
            <button className="action-button primary">
              出价
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 2. NFT 列表页面

```tsx
// components/nft/NFTMarketplace.tsx
import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { NFTCard } from './NFTCard'

interface MarketplaceFilters {
  category: string
  priceRange: [number, number]
  sortBy: 'price' | 'recent' | 'ending'
  status: 'all' | 'listed' | 'auction'
}

export function NFTMarketplace() {
  const [nfts, setNfts] = useState<any[]>([])
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    priceRange: [0, 1000],
    sortBy: 'recent',
    status: 'all'
  })
  const [loading, setLoading] = useState(true)

  const MARKETPLACE_CONTRACT = '0x...' // 市场合约地址

  // 获取市场中的 NFT 列表
  const { data: marketItems } = useContractRead({
    address: MARKETPLACE_CONTRACT,
    abi: [
      {
        name: 'getActiveListings',
        type: 'function',
        inputs: [
          { name: 'offset', type: 'uint256' },
          { name: 'limit', type: 'uint256' }
        ],
        outputs: [
          {
            name: '',
            type: 'tuple[]',
            components: [
              { name: 'tokenContract', type: 'address' },
              { name: 'tokenId', type: 'uint256' },
              { name: 'seller', type: 'address' },
              { name: 'price', type: 'uint256' },
              { name: 'isActive', type: 'bool' }
            ]
          }
        ]
      }
    ],
    functionName: 'getActiveListings',
    args: [0n, 50n] // 获取前50个
  })

  // 加载 NFT 元数据
  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!marketItems) return

      setLoading(true)
      const nftData = []

      for (const item of marketItems) {
        try {
          // 获取 tokenURI
          const tokenURI = await getTokenURI(item.tokenContract, item.tokenId)
          
          // 获取元数据
          const metadata = await fetchMetadata(tokenURI)
          
          nftData.push({
            ...item,
            metadata,
            listing: {
              seller: item.seller,
              price: item.price,
              isActive: item.isActive
            }
          })
        } catch (error) {
          console.error('Failed to load NFT metadata:', error)
        }
      }

      setNfts(nftData)
      setLoading(false)
    }

    loadNFTMetadata()
  }, [marketItems])

  const getTokenURI = async (contractAddress: string, tokenId: bigint) => {
    // 实现获取 tokenURI 的逻辑
    // 这里需要调用 NFT 合约的 tokenURI 方法
    return `https://api.example.com/metadata/${contractAddress}/${tokenId}`
  }

  const fetchMetadata = async (tokenURI: string) => {
    const response = await fetch(tokenURI)
    return response.json()
  }

  const filteredNFTs = nfts.filter(nft => {
    // 应用过滤器逻辑
    if (filters.status !== 'all') {
      if (filters.status === 'listed' && !nft.listing?.isActive) return false
      if (filters.status === 'auction' && !nft.auction?.isActive) return false
    }

    const priceInEth = Number(nft.listing?.price || 0) / 1e18
    if (priceInEth < filters.priceRange[0] || priceInEth > filters.priceRange[1]) {
      return false
    }

    return true
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price':
        return Number(a.listing?.price || 0) - Number(b.listing?.price || 0)
      case 'recent':
        return b.tokenId - a.tokenId // 假设 tokenId 越大越新
      case 'ending':
        if (a.auction && b.auction) {
          return Number(a.auction.endTime) - Number(b.auction.endTime)
        }
        return 0
      default:
        return 0
    }
  })

  return (
    <div className="nft-marketplace">
      <div className="marketplace-header">
        <h1>NFT 市场</h1>
        <div className="marketplace-stats">
          <div className="stat">
            <span className="stat-value">{nfts.length}</span>
            <span className="stat-label">NFTs</span>
          </div>
          <div className="stat">
            <span className="stat-value">{nfts.filter(n => n.listing?.isActive).length}</span>
            <span className="stat-label">在售</span>
          </div>
          <div className="stat">
            <span className="stat-value">{nfts.filter(n => n.auction?.isActive).length}</span>
            <span className="stat-label">拍卖中</span>
          </div>
        </div>
      </div>

      <div className="marketplace-content">
        <div className="marketplace-filters">
          <div className="filter-section">
            <h3>状态</h3>
            <div className="filter-options">
              {[
                { value: 'all', label: '全部' },
                { value: 'listed', label: '在售' },
                { value: 'auction', label: '拍卖' }
              ].map(option => (
                <label key={option.value} className="filter-option">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      status: e.target.value as any
                    }))}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>价格范围 (ETH)</h3>
            <div className="price-range">
              <input
                type="number"
                value={filters.priceRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [Number(e.target.value), prev.priceRange[1]]
                }))}
                placeholder="最低价"
              />
              <span>-</span>
              <input
                type="number"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], Number(e.target.value)]
                }))}
                placeholder="最高价"
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>排序</h3>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                sortBy: e.target.value as any
              }))}
            >
              <option value="recent">最新</option>
              <option value="price">价格</option>
              <option value="ending">即将结束</option>
            </select>
          </div>
        </div>

        <div className="marketplace-grid">
          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="nft-card-skeleton" />
              ))}
            </div>
          ) : (
            <div className="nft-grid">
              {sortedNFTs.map(nft => (
                <NFTCard
                  key={`${nft.tokenContract}-${nft.tokenId}`}
                  contractAddress={nft.tokenContract}
                  tokenId={nft.tokenId.toString()}
                  metadata={nft.metadata}
                  listing={nft.listing}
                  auction={nft.auction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. NFT 交易功能

```tsx
// components/nft/NFTTrading.tsx
import { useState } from 'react'
import { 
  useAccount, 
  useContractWrite, 
  usePrepareContractWrite,
  useWaitForTransaction 
} from 'wagmi'
import { parseEther } from 'viem'

interface TradingModalProps {
  nft: {
    contractAddress: string
    tokenId: string
    metadata: any
    listing?: Listing
    auction?: Auction
  }
  isOpen: boolean
  onClose: () => void
  mode: 'buy' | 'sell' | 'bid' | 'auction'
}

export function TradingModal({ nft, isOpen, onClose, mode }: TradingModalProps) {
  const { address } = useAccount()
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('24') // 拍卖持续时间（小时）

  const MARKETPLACE_CONTRACT = '0x...'

  // 购买 NFT
  const { config: buyConfig } = usePrepareContractWrite({
    address: MARKETPLACE_CONTRACT,
    abi: [
      {
        name: 'buyItem',
        type: 'function',
        inputs: [
          { name: 'tokenContract', type: 'address' },
          { name: 'token