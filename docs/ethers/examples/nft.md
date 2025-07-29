---
title: NFT 操作
description: 使用 Ethers.js 进行 NFT 铸造、转移、查询和市场交易的完整指南
keywords: [ethers, NFT, ERC-721, ERC-1155, 非同质化代币, 铸造, 转移, OpenSea]
---

# NFT 操作

非同质化代币（NFT）是区块链上独一无二的数字资产。本文档将详细介绍如何使用 Ethers.js 进行各种 NFT 操作，包括铸造、转移、查询和市场交易。

## NFT 基础概念

### 1. NFT 标准

```typescript
// ERC-721 标准接口
interface IERC721 {
  // 基础函数
  balanceOf(owner: string): Promise<bigint>;
  ownerOf(tokenId: bigint): Promise<string>;
  transferFrom(from: string, to: string, tokenId: bigint): Promise<void>;
  safeTransferFrom(from: string, to: string, tokenId: bigint): Promise<void>;
  approve(to: string, tokenId: bigint): Promise<void>;
  getApproved(tokenId: bigint): Promise<string>;
  setApprovalForAll(operator: string, approved: boolean): Promise<void>;
  isApprovedForAll(owner: string, operator: string): Promise<boolean>;
  
  // 元数据扩展
  name(): Promise<string>;
  symbol(): Promise<string>;
  tokenURI(tokenId: bigint): Promise<string>;
}

// ERC-1155 多代币标准
interface IERC1155 {
  balanceOf(account: string, id: bigint): Promise<bigint>;
  balanceOfBatch(accounts: string[], ids: bigint[]): Promise<bigint[]>;
  setApprovalForAll(operator: string, approved: boolean): Promise<void>;
  isApprovedForAll(account: string, operator: string): Promise<boolean>;
  safeTransferFrom(from: string, to: string, id: bigint, amount: bigint, data: string): Promise<void>;
  safeBatchTransferFrom(from: string, to: string, ids: bigint[], amounts: bigint[], data: string): Promise<void>;
  uri(id: bigint): Promise<string>;
}
```

### 2. 常用 NFT 合约地址

```typescript
// 主流 NFT 项目合约地址（以太坊主网）
const NFT_CONTRACTS = {
  // 知名 NFT 项目
  cryptoPunks: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
  boredApeYachtClub: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  cryptoKitties: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
  artBlocks: '0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a',
  
  // NFT 市场
  openSeaSharedStorefront: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
  superRare: '0xb932a70A57673d89f4acfFBE830E8ed7f75Fb9e0',
  foundation: '0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405',
  
  // 测试合约
  testNFT: '0x...', // 你的测试 NFT 合约地址
};

// NFT 元数据结构
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
}
```

## ERC-721 NFT 操作

### 1. ERC-721 合约交互类

```typescript
import { ethers } from 'ethers';

// ERC-721 ABI（简化版）
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  
  // 铸造函数（如果合约支持）
  'function mint(address to, uint256 tokenId)',
  'function safeMint(address to, uint256 tokenId)',
  'function mintWithURI(address to, uint256 tokenId, string uri)',
  
  // 事件
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
];

class ERC721Manager {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      contractAddress,
      ERC721_ABI,
      signer || provider
    );
  }

  // 获取合约基本信息
  async getContractInfo() {
    try {
      const [name, symbol, totalSupply] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.totalSupply().catch(() => null) // 有些合约可能没有 totalSupply
      ]);

      return {
        name,
        symbol,
        totalSupply: totalSupply ? totalSupply.toString() : 'Unknown',
        address: await this.contract.getAddress()
      };
    } catch (error) {
      throw new Error(`获取合约信息失败: ${error.message}`);
    }
  }

  // 获取用户 NFT 余额
  async getBalance(owner: string): Promise<bigint> {
    try {
      return await this.contract.balanceOf(owner);
    } catch (error) {
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  // 获取 NFT 所有者
  async getOwner(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      throw new Error(`获取所有者失败: ${error.message}`);
    }
  }

  // 获取 NFT 元数据 URI
  async getTokenURI(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      throw new Error(`获取 tokenURI 失败: ${error.message}`);
    }
  }

  // 获取 NFT 元数据
  async getTokenMetadata(tokenId: bigint): Promise<NFTMetadata> {
    try {
      const uri = await this.getTokenURI(tokenId);
      
      // 处理不同类型的 URI
      let metadataUrl = uri;
      if (uri.startsWith('ipfs://')) {
        metadataUrl = `https://ipfs.io/ipfs/${uri.slice(7)}`;
      } else if (uri.startsWith('data:application/json;base64,')) {
        // Base64 编码的 JSON
        const base64Data = uri.slice(29);
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      }

      // 从 HTTP URL 获取元数据
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      throw new Error(`获取元数据失败: ${error.message}`);
    }
  }

  // 授权单个 NFT
  async approve(to: string, tokenId: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.approve(to, tokenId);
      console.log('授权交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`授权失败: ${error.message}`);
    }
  }

  // 授权所有 NFT
  async setApprovalForAll(operator: string, approved: boolean) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.setApprovalForAll(operator, approved);
      console.log('批量授权交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`批量授权失败: ${error.message}`);
    }
  }

  // 检查单个 NFT 授权
  async getApproved(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.getApproved(tokenId);
    } catch (error) {
      throw new Error(`检查授权失败: ${error.message}`);
    }
  }

  // 检查批量授权
  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    try {
      return await this.contract.isApprovedForAll(owner, operator);
    } catch (error) {
      throw new Error(`检查批量授权失败: ${error.message}`);
    }
  }

  // 转移 NFT
  async transferFrom(from: string, to: string, tokenId: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.transferFrom(from, to, tokenId);
      console.log('转移交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`转移失败: ${error.message}`);
    }
  }

  // 安全转移 NFT
  async safeTransferFrom(from: string, to: string, tokenId: bigint, data: string = '0x') {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = data === '0x' 
        ? await this.contract['safeTransferFrom(address,address,uint256)'](from, to, tokenId)
        : await this.contract['safeTransferFrom(address,address,uint256,bytes)'](from, to, tokenId, data);
      
      console.log('安全转移交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`安全转移失败: ${error.message}`);
    }
  }

  // 铸造 NFT（如果合约支持）
  async mint(to: string, tokenId: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.mint(to, tokenId);
      console.log('铸造交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed',
        tokenId: tokenId.toString()
      };
    } catch (error) {
      throw new Error(`铸造失败: ${error.message}`);
    }
  }

  // 获取用户拥有的所有 NFT（通过事件查询）
  async getUserTokens(owner: string, fromBlock: number = 0): Promise<bigint[]> {
    try {
      // 查询转入事件
      const transferInFilter = this.contract.filters.Transfer(null, owner);
      const transferInEvents = await this.contract.queryFilter(transferInFilter, fromBlock);

      // 查询转出事件
      const transferOutFilter = this.contract.filters.Transfer(owner, null);
      const transferOutEvents = await this.contract.queryFilter(transferOutFilter, fromBlock);

      // 计算当前拥有的代币
      const tokenIds = new Set<string>();

      // 添加转入的代币
      for (const event of transferInEvents) {
        if (event.args) {
          tokenIds.add(event.args.tokenId.toString());
        }
      }

      // 移除转出的代币
      for (const event of transferOutEvents) {
        if (event.args) {
          tokenIds.delete(event.args.tokenId.toString());
        }
      }

      // 验证当前所有权（防止数据不一致）
      const ownedTokens: bigint[] = [];
      for (const tokenIdStr of tokenIds) {
        const tokenId = BigInt(tokenIdStr);
        try {
          const currentOwner = await this.getOwner(tokenId);
          if (currentOwner.toLowerCase() === owner.toLowerCase()) {
            ownedTokens.push(tokenId);
          }
        } catch (error) {
          // 代币可能已被销毁，忽略错误
        }
      }

      return ownedTokens.sort((a, b) => Number(a - b));
    } catch (error) {
      throw new Error(`获取用户代币失败: ${error.message}`);
    }
  }

  // 监听转移事件
  startTransferListener(callback: (from: string, to: string, tokenId: bigint) => void) {
    this.contract.on('Transfer', (from, to, tokenId, event) => {
      callback(from, to, tokenId);
    });
  }

  // 停止监听事件
  stopAllListeners() {
    this.contract.removeAllListeners();
  }
}
```

### 2. NFT 铸造合约

```typescript
// 可铸造的 NFT 合约 ABI
const MINTABLE_NFT_ABI = [
  ...ERC721_ABI,
  'function mint(address to) returns (uint256)',
  'function mintWithURI(address to, string memory uri) returns (uint256)',
  'function setBaseURI(string memory baseURI)',
  'function pause()',
  'function unpause()',
  'function setMintPrice(uint256 price)',
  'function getMintPrice() view returns (uint256)',
  'function withdraw()',
  
  // 事件
  'event Minted(address indexed to, uint256 indexed tokenId)',
  'event BaseURIChanged(string newBaseURI)',
  'event MintPriceChanged(uint256 newPrice)'
];

class MintableNFT extends ERC721Manager {
  constructor(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    super(contractAddress, provider, signer);
    // 重新创建合约实例以包含铸造功能
    this.contract = new ethers.Contract(
      contractAddress,
      MINTABLE_NFT_ABI,
      signer || provider
    );
  }

  // 获取铸造价格
  async getMintPrice(): Promise<bigint> {
    try {
      return await this.contract.getMintPrice();
    } catch (error) {
      throw new Error(`获取铸造价格失败: ${error.message}`);
    }
  }

  // 铸造 NFT（自动分配 tokenId）
  async mintNFT(to: string, value?: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const options = value ? { value } : {};
      const tx = await this.contract.mint(to, options);
      
      console.log('铸造交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      // 从事件中获取 tokenId
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress;
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = this.contract.interface.parseLog(mintEvent);
        tokenId = parsed?.args.tokenId.toString();
      }

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed',
        tokenId
      };
    } catch (error) {
      throw new Error(`铸造失败: ${error.message}`);
    }
  }

  // 带 URI 的铸造
  async mintWithURI(to: string, uri: string, value?: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const options = value ? { value } : {};
      const tx = await this.contract.mintWithURI(to, uri, options);
      
      console.log('带 URI 铸造交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`带 URI 铸造失败: ${error.message}`);
    }
  }

  // 批量铸造
  async batchMint(recipients: string[], value?: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.mintNFT(recipient, value);
        results.push({
          recipient,
          success: true,
          ...result
        });
        
        // 添加延迟以避免 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 设置基础 URI
  async setBaseURI(baseURI: string) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.setBaseURI(baseURI);
      console.log('设置基础 URI 交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`设置基础 URI 失败: ${error.message}`);
    }
  }
}
```

## ERC-1155 多代币操作

### 1. ERC-1155 合约交互

```typescript
// ERC-1155 ABI（简化版）
const ERC1155_ABI = [
  'function uri(uint256 id) view returns (string)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
  
  // 铸造函数（如果合约支持）
  'function mint(address to, uint256 id, uint256 amount, bytes data)',
  'function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data)',
  
  // 事件
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  'event URI(string value, uint256 indexed id)'
];

class ERC1155Manager {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      contractAddress,
      ERC1155_ABI,
      signer || provider
    );
  }

  // 获取代币余额
  async getBalance(account: string, tokenId: bigint): Promise<bigint> {
    try {
      return await this.contract.balanceOf(account, tokenId);
    } catch (error) {
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  // 批量获取余额
  async getBalanceBatch(accounts: string[], tokenIds: bigint[]): Promise<bigint[]> {
    try {
      if (accounts.length !== tokenIds.length) {
        throw new Error('账户和代币 ID 数组长度必须相同');
      }
      return await this.contract.balanceOfBatch(accounts, tokenIds);
    } catch (error) {
      throw new Error(`批量获取余额失败: ${error.message}`);
    }
  }

  // 获取代币 URI
  async getTokenURI(tokenId: bigint): Promise<string> {
    try {
      return await this.contract.uri(tokenId);
    } catch (error) {
      throw new Error(`获取 URI 失败: ${error.message}`);
    }
  }

  // 授权操作员
  async setApprovalForAll(operator: string, approved: boolean) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.setApprovalForAll(operator, approved);
      console.log('授权交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`授权失败: ${error.message}`);
    }
  }

  // 检查授权状态
  async isApprovedForAll(account: string, operator: string): Promise<boolean> {
    try {
      return await this.contract.isApprovedForAll(account, operator);
    } catch (error) {
      throw new Error(`检查授权失败: ${error.message}`);
    }
  }

  // 单个代币转移
  async safeTransferFrom(
    from: string, 
    to: string, 
    tokenId: bigint, 
    amount: bigint, 
    data: string = '0x'
  ) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.safeTransferFrom(from, to, tokenId, amount, data);
      console.log('转移交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`转移失败: ${error.message}`);
    }
  }

  // 批量代币转移
  async safeBatchTransferFrom(
    from: string,
    to: string,
    tokenIds: bigint[],
    amounts: bigint[],
    data: string = '0x'
  ) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      if (tokenIds.length !== amounts.length) {
        throw new Error('代币 ID 和数量数组长度必须相同');
      }

      const tx = await this.contract.safeBatchTransferFrom(from, to, tokenIds, amounts, data);
      console.log('批量转移交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`批量转移失败: ${error.message}`);
    }
  }

  // 铸造代币（如果合约支持）
  async mint(to: string, tokenId: bigint, amount: bigint, data: string = '0x') {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const tx = await this.contract.mint(to, tokenId, amount, data);
      console.log('铸造交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`铸造失败: ${error.message}`);
    }
  }

  // 批量铸造代币
  async mintBatch(to: string, tokenIds: bigint[], amounts: bigint[], data: string = '0x') {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      if (tokenIds.length !== amounts.length) {
        throw new Error('代币 ID 和数量数组长度必须相同');
      }

      const tx = await this.contract.mintBatch(to, tokenIds, amounts, data);
      console.log('批量铸造交易已发送:', tx.hash);
      
      const receipt = await tx.wait();
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      throw new Error(`批量铸造失败: ${error.message}`);
    }
  }

  // 获取用户所有代币余额
  async getUserTokens(account: string, tokenIds: bigint[]): Promise<Array<{tokenId: bigint, balance: bigint}>> {
    try {
      const accounts = new Array(tokenIds.length).fill(account);
      const balances = await this.getBalanceBatch(accounts, tokenIds);
      
      return tokenIds.map((tokenId, index) => ({
        tokenId,
        balance: balances[index]
      })).filter(item => item.balance > 0n);
    } catch (error) {
      throw new Error(`获取用户代币失败: ${error.message}`);
    }
  }
}
```

## NFT 市场交互

### 1. OpenSea API 集成

```typescript
// OpenSea API 接口
interface OpenSeaAsset {
  id: number;
  token_id: string;
  name: string;
  description: string;
  image_url: string;
  image_preview_url: string;
  image_thumbnail_url: string;
  image_original_url: string;
  animation_url: string;
  animation_original_url: string;
  background_color: string;
  asset_contract: {
    address: string;
    name: string;
    symbol: string;
    schema_name: string;
  };
  owner: {
    user: {
      username: string;
    };
    address: string;
  };
  creator: {
    user: {
      username: string;
    };
    address: string;
  };
  traits: Array<{
    trait_type: string;
    value: string | number;
    display_type: string;
    max_value: number;
    trait_count: number;
    order: number;
  }>;
  last_sale: {
    total_price: string;
    payment_token: {
      symbol: string;
      decimals: number;
    };
  };
}

interface OpenSeaCollection {
  name: string;
  description: string;
  image_url: string;
  large_image_url: string;
  featured_image_url: string;
  stats: {
    one_day_volume: number;
    one_day_change: number;
    one_day_sales: number;
    seven_day_volume: number;
    seven_day_change: number;
    seven_day_sales: number;
    thirty_day_volume: number;
    thirty_day_change: number;
    thirty_day_sales: number;
    total_volume: number;
    total_sales: number;
    total_supply: number;
    count: number;
    num_owners: number;
    average_price: number;
    num_reports: number;
    market_cap: number;
    floor_price: number;
  };
}

class OpenSeaAPI {
  private baseURL = 'https://api.opensea.io/api/v1';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    try {
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        throw new Error(`OpenSea API 错误: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`请求失败: ${error.message}`);
    }
  }

  // 获取单个 NFT 资产
  async getAsset(contractAddress: string, tokenId: string): Promise<OpenSeaAsset> {
    return await this.request(`/asset/${contractAddress}/${tokenId}/`);
  }

  // 获取资产列表
  async getAssets(params: {
    owner?: string;
    asset_contract_address?: string;
    asset_contract_addresses?: string[];
    token_ids?: string[];
    order_by?: 'sale_date' | 'sale_count' | 'sale_price';
    order_direction?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  } = {}): Promise<{ assets: OpenSeaAsset[] }> {
    return await this.request('/assets', params);
  }

  // 获取集合信息
  async getCollection(slug: string): Promise<{ collection: OpenSeaCollection }> {
    return await this.request(`/collection/${slug}`);
  }

  // 获取集合统计
  async getCollectionStats(slug: string): Promise<{ stats: OpenSeaCollection['stats'] }> {
    return await this.request(`/collection/${slug}/stats`);
  }

  // 获取用户拥有的 NFT
  async getUserAssets(owner: string, params: {
    asset_contract_addresses?: string[];
    offset?: number;
    limit?: number;
  } = {}): Promise<{ assets: OpenSeaAsset[] }> {
    return await this.request('/assets', { owner, ...params });
  }

  // 获取合约的所有 NFT
  async getContractAssets(contractAddress: string, params: {
    token_ids?: string[];
    offset?: number;
    limit?: number;
  } = {}): Promise<{ assets: OpenSeaAsset[] }> {
    return await this.request('/assets', { 
      asset_contract_address: contractAddress, 
      ...params 
    });
  }
}
```

### 2. NFT 市场合约交互

```typescript
// 简化的 NFT 市场合约 ABI
const NFT_MARKETPLACE_ABI = [
  'function listItem(address nftContract, uint256 tokenId, uint256 price)',
  'function cancelListing(address nftContract, uint256 tokenId)',
  'function buyItem(address nftContract, uint256 tokenId) payable',
  'function updateListing(address nftContract, uint256 tokenId, uint256 newPrice)',
  'function getListing(address nftContract, uint256 tokenId) view returns (uint256 price, address seller)',
  'function getProceeds(address seller) view returns (uint256)',
  'function withdrawProceeds()',
  
  // 事件
  'event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price)',
  'event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId)',
  'event ItemBought(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price)'
];

class NFTMarketplace {
  private contract: ethers.Contract;
  private nftContract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(
    marketplaceAddress: string,
    nftContractAddress: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      marketplaceAddress,
      NFT_MARKETPLACE_ABI,
      signer || provider
    );
    this.nftContract = new ethers.Contract(
      nftContractAddress,
      ERC721_ABI,
      signer || provider
    );
  }

  // 上架 NFT
  async listNFT(tokenId: bigint, priceInEth: string) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      // 检查所有权
      const owner = await this.nftContract.ownerOf(tokenId);
      const signerAddress = await this.signer.getAddress();
      
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error('只有 NFT 所有者才能上架');
      }

      // 检查授权
      const approved = await this.nftContract.getApproved(tokenId);
      const marketplaceAddress = await this.contract.getAddress();
      
      if (approved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
        const isApprovedForAll = await this.nftContract.isApprovedForAll(
          signerAddress,
          marketplaceAddress
        );
        
        if (!isApprovedForAll) {
          throw new Error('请先授权市场合约操作此 NFT');
        }
      }

      // 上架
      const price = ethers.parseEther(priceInEth);
      const listTx = await this.contract.listItem(
        await this.nftContract.getAddress(),
        tokenId,
        price
      );

      console.log('上架交易已发送:', listTx.hash);
      await listTx.wait();
      console.log('NFT 上架成功');

      return listTx;
    } catch (error) {
      throw new Error(`上架失败: ${error.message}`);
    }
  }

  // 取消上架
  async cancelListing(tokenId: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const cancelTx = await this.contract.cancelListing(
        await this.nftContract.getAddress(),
        tokenId
      );

      console.log('取消上架交易已发送:', cancelTx.hash);
      await cancelTx.wait();
      console.log('取消上架成功');

      return cancelTx;
    } catch (error) {
      throw new Error(`取消上架失败: ${error.message}`);
    }
  }

  // 购买 NFT
  async buyNFT(tokenId: bigint) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      // 获取上架信息
      const listing = await this.contract.getListing(
        await this.nftContract.getAddress(),
        tokenId
      );

      if (listing.price === 0n) {
        throw new Error('此 NFT 未上架');
      }

      // 购买
      const buyTx = await this.contract.buyItem(
        await this.nftContract.getAddress(),
        tokenId,
        { value: listing.price }
      );

      console.log('购买交易已发送:', buyTx.hash);
      await buyTx.wait();
      console.log('NFT 购买成功');

      return buyTx;
    } catch (error) {
      throw new Error(`购买失败: ${error.message}`);
    }
  }

  // 更新价格
  async updatePrice(tokenId: bigint, newPriceInEth: string) {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const newPrice = ethers.parseEther(newPriceInEth);
      const updateTx = await this.contract.updateListing(
        await this.nftContract.getAddress(),
        tokenId,
        newPrice
      );

      console.log('更新价格交易已发送:', updateTx.hash);
      await updateTx.wait();
      console.log('价格更新成功');

      return updateTx;
    } catch (error) {
      throw new Error(`更新价格失败: ${error.message}`);
    }
  }

  // 获取上架信息
  async getListingInfo(tokenId: bigint) {
    try {
      const listing = await this.contract.getListing(
        await this.nftContract.getAddress(),
        tokenId
      );

      if (listing.price === 0n) {
        return null;
      }

      return {
        price: listing.price,
        priceInEth: ethers.formatEther(listing.price),
        seller: listing.seller,
        tokenId: tokenId.toString()
      };
    } catch (error) {
      throw new Error(`获取上架信息失败: ${error.message}`);
    }
  }

  // 获取卖家收益
  async getProceeds(seller: string): Promise<bigint> {
    try {
      return await this.contract.getProceeds(seller);
    } catch (error) {
      throw new Error(`获取收益失败: ${error.message}`);
    }
  }

  // 提取收益
  async withdrawProceeds() {
    if (!this.signer) {
      throw new Error('需要 Signer 来执行交易');
    }

    try {
      const withdrawTx = await this.contract.withdrawProceeds();
      console.log('提取收益交易已发送:', withdrawTx.hash);
      await withdrawTx.wait();
      console.log('收益提取成功');

      return withdrawTx;
    } catch (error) {
      throw new Error(`提取收益失败: ${error.message}`);
    }
  }

  // 监听市场事件
  startEventListening() {
    // 监听上架事件
    this.contract.on('ItemListed', (seller, nftContract, tokenId, price, event) => {
      console.log('NFT 上架:', {
        seller,
        tokenId: tokenId.toString(),
        price: ethers.formatEther(price) + ' ETH',
        transactionHash: event.log.transactionHash
      });
    });

    // 监听购买事件
    this.contract.on('ItemBought', (buyer, nftContract, tokenId, price, event) => {
      console.log('NFT 购买:', {
        buyer,
        tokenId: tokenId.toString(),
        price: ethers.formatEther(price) + ' ETH',
        transactionHash: event.log.transactionHash
      });
    });

    // 监听取消事件
    this.contract.on('ItemCanceled', (seller, nftContract, tokenId, event) => {
      console.log('取消上架:', {
        seller,
        tokenId: tokenId.toString(),
        transactionHash: event.log.transactionHash
      });
    });
  }

  // 停止监听事件
  stopEventListening() {
    this.contract.removeAllListeners();
  }
}
```

## 实用工具和示例

### 1. NFT 批量操作工具

```typescript
class NFTBatchOperations {
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // 批量转移 ERC-721 NFT
  async batchTransferERC721(
    contractAddress: string,
    transfers: Array<{ to: string; tokenId: bigint }>
  ) {
    const nftManager = new ERC721Manager(contractAddress, this.provider, this.signer);
    const results = [];

    for (const transfer of transfers) {
      try {
        const from = await this.signer.getAddress();
        const result = await nftManager.safeTransferFrom(from, transfer.to, transfer.tokenId);
        
        results.push({
          tokenId: transfer.tokenId.toString(),
          to: transfer.to,
          success: true,
          transactionHash: result.transactionHash
        });

        // 添加延迟避免 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          tokenId: transfer.tokenId.toString(),
          to: transfer.to,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 批量获取 NFT 元数据
  async batchGetMetadata(contractAddress: string, tokenIds: bigint[]) {
    const nftManager = new ERC721Manager(contractAddress, this.provider);
    const results = [];

    // 并发获取元数据（限制并发数）
    const batchSize = 5;
    for (let i = 0; i < tokenIds.length; i += batchSize) {
      const batch = tokenIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (tokenId) => {
        try {
          const metadata = await nftManager.getTokenMetadata(tokenId);
          return {
            tokenId: tokenId.toString(),
            success: true,
            metadata
          };
        } catch (error) {
          return {
            tokenId: tokenId.toString(),
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 批次间延迟
      if (i + batchSize < tokenIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // 检查 NFT 稀有度
  async analyzeRarity(contractAddress: string, tokenIds: bigint[]) {
    const metadataResults = await this.batchGetMetadata(contractAddress, tokenIds);
    const successfulResults = metadataResults.filter(r => r.success);

    // 统计属性分布
    const traitCounts: Record<string, Record<string, number>> = {};
    const totalSupply = successfulResults.length;

    for (const result of successfulResults) {
      if (result.metadata?.attributes) {
        for (const attr of result.metadata.attributes) {
          const traitType = attr.trait_type;
          const value = attr.value.toString();

          if (!traitCounts[traitType]) {
            traitCounts[traitType] = {};
          }
          
          traitCounts[traitType][value] = (traitCounts[traitType][value] || 0) + 1;
        }
      }
    }

    // 计算稀有度分数
    const rarityScores = successfulResults.map(result => {
      let rarityScore = 0;
      let traitCount = 0;

      if (result.metadata?.attributes) {
        for (const attr of result.metadata.attributes) {
          const traitType = attr.trait_type;
          const value = attr.value.toString();
          const count = traitCounts[traitType]?.[value] || 0;
          
          if (count > 0) {
            rarityScore += 1 / (count / totalSupply);
            traitCount++;
          }
        }
      }

      return {
        tokenId: result.tokenId,
        rarityScore,
        traitCount,
        rank: 0 // 将在排序后设置
      };
    });

    // 按稀有度排序并设置排名
    rarityScores.sort((a, b) => b.rarityScore - a.rarityScore);
    rarityScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      rarityScores,
      traitCounts,
      totalAnalyzed: totalSupply
    };
  }
}
```

### 2. 完整使用示例

```typescript
// 完整的 NFT 操作示例
async function nftOperationsExample() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const signer = new ethers.Wallet('YOUR-PRIVATE-KEY', provider);
  
  try {
    // 1. ERC-721 NFT 操作
    console.log('=== ERC-721 NFT 操作 ===');
    
    const nftManager = new ERC721Manager(NFT_CONTRACTS.testNFT, provider, signer);
    
    // 获取合约信息
    const contractInfo = await nftManager.getContractInfo();
    console.log('合约信息:', contractInfo);
    
    // 获取用户余额
    const userAddress = await signer.getAddress();
    const balance = await nftManager.getBalance(userAddress);
    console.log('用户 NFT 余额:', balance.toString());
    
    // 获取用户拥有的所有 NFT
    const userTokens = await nftManager.getUserTokens(userAddress);
    console.log('用户拥有的 NFT:', userTokens.map(t => t.toString()));
    
    // 获取第一个 NFT 的元数据
    if (userTokens.length > 0) {
      const metadata = await nftManager.getTokenMetadata(userTokens[0]);
      console.log('NFT 元数据:', metadata);
    }
    
    // 2. NFT 市场操作
    console.log('\n=== NFT 市场操作 ===');
    
    const marketplace = new NFTMarketplace(
      '0x...市场合约地址',
      NFT_CONTRACTS.testNFT,
      provider,
      signer
    );
    
    if (userTokens.length > 0) {
      const tokenId = userTokens[0];
      
      // 上架 NFT
      try {
        await marketplace.listNFT(tokenId, '1.5'); // 1.5 ETH
        console.log(`NFT ${tokenId} 上架成功`);
      } catch (error) {
        console.log('上架失败:', error.message);
      }
      
      // 查询上架信息
      const listingInfo = await marketplace.getListingInfo(tokenId);
      console.log('上架信息:', listingInfo);
    }
    
    // 3. OpenSea API 查询
    console.log('\n=== OpenSea API 查询 ===');
    
    const openSea = new OpenSeaAPI('YOUR-OPENSEA-API-KEY');
    
    // 获取用户的 NFT
    const userAssets = await openSea.getUserAssets(userAddress, { limit: 10 });
    console.log('用户在 OpenSea 的 NFT 数量:', userAssets.assets.length);
    
    // 获取知名项目信息
    const boredApeCollection = await openSea.getCollection('boredapeyachtclub');
    console.log('BAYC 集合信息:', boredApeCollection.collection.stats);
    
    // 4. 批量操作
    console.log('\n=== 批量操作 ===');
    
    const batchOps = new NFTBatchOperations(provider, signer);
    
    if (userTokens.length >= 2) {
      // 批量获取元数据
      const metadataResults = await batchOps.batchGetMetadata(
        NFT_CONTRACTS.testNFT,
        userTokens.slice(0, 2)
      );
      console.log('批量元数据结果:', metadataResults);
      
      // 稀有度分析
      const rarityAnalysis = await batchOps.analyzeRarity(
        NFT_CONTRACTS.testNFT,
        userTokens
      );
      console.log('稀有度分析:', rarityAnalysis.rarityScores.slice(0, 5));
    }
    
    // 5. ERC-1155 操作
    console.log('\n=== ERC-1155 操作 ===');
    
    const erc1155Manager = new ERC1155Manager(
      '0x...ERC1155合约地址',
      provider,
      signer
    );
    
    // 获取多代币余额
    const tokenId1155 = 1n;
    const balance1155 = await erc1155Manager.getBalance(userAddress, tokenId1155);
    console.log(`ERC-1155 代币 ${tokenId1155} 余额:`, balance1155.toString());
    
    // 6. 事件监听
    console.log('\n=== 开始事件监听 ===');
    
    // 监听 NFT 转移事件
    nftManager.startTransferListener((from, to, tokenId) => {
      console.log('NFT 转移事件:', {
        from,
        to,
        tokenId: tokenId.toString()
      });
    });
    
    // 监听市场事件
    marketplace.startEventListening();
    
    console.log('事件监听已启动，程序将继续运行...');
    
    // 运行一段时间后停止监听
    setTimeout(() => {
      nftManager.stopAllListeners();
      marketplace.stopEventListening();
      console.log('事件监听已停止');
    }, 60000); // 1分钟后停止
    
  } catch (error) {
    console.error('NFT 操作示例失败:', error.message);
  }
}

// 运行示例
nftOperationsExample();
```

## 总结

本文档详细介绍了使用 Ethers.js 进行 NFT 操作的各个方面：

### 核心功能
- **ERC-721 操作**：铸造、转移、查询、授权
- **ERC-1155 操作**：多代币管理、批量操作
- **元数据处理**：IPFS、HTTP、Base64 格式支持
- **市场交互**：上架、购买、取消、价格更新

### 高级特性
- **OpenSea 集成**：API 查询、集合统计
- **批量操作**：并发处理、错误处理
- **稀有度分析**：属性统计、排名计算
- **事件监听**：实时更新、状态同步

### 最佳实践
1. **安全性**：验证所有权、检查授权
2. **效率**：批量处理、并发限制
3. **用户体验**：进度反馈、错误处理
4. **数据完整性**：元数据验证、状态同步

通过掌握这些 NFT 操作技术，可以构建功能完整的 NFT 应用和市场平台。

## 下一步

- [代币交换](/ethers/examples/token-swap) - 学习代币交换操作
- [钱包连接](/ethers/examples/wallet-connection) - 掌握钱包连接技术
- [多链应用](/ethers/examples/multi-chain) - 了解多链开发
- [实时数据](/ethers/examples/real-time-data) - 学习实时数据处理