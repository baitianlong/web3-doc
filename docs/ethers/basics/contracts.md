# Contract 合约

Contract 是 Ethers.js 中与智能合约交互的核心组件。它提供了调用合约函数、监听事件、估算 Gas 等功能。

## Contract 基础概念

Contract 对象代表区块链上的智能合约，提供以下功能：

- 调用合约的只读函数（view/pure）
- 发送交易调用合约函数
- 监听合约事件
- 估算函数调用的 Gas 消耗
- 编码和解码函数调用数据

```typescript
import { ethers } from 'ethers';

// 创建合约实例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const contractAddress = '0x...';
const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// 只读合约（使用 Provider）
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// 可写合约（使用 Signer）
const wallet = new ethers.Wallet('0x...privateKey', provider);
const contractWithSigner = contract.connect(wallet);
```

## 合约 ABI

### 1. ABI 格式

```typescript
// 完整的 ERC-20 ABI
const ERC20_ABI = [
  // 只读函数
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // 写入函数
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// 使用 JSON ABI（从编译器输出）
const jsonABI = [
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
```

### 2. 动态 ABI 构建

```typescript
class ABIBuilder {
  private abi: string[] = [];

  // 添加函数
  addFunction(name: string, inputs: string[], outputs: string[], stateMutability: string = 'nonpayable') {
    const inputStr = inputs.join(', ');
    const outputStr = outputs.length > 0 ? ` returns (${outputs.join(', ')})` : '';
    const stateStr = stateMutability !== 'nonpayable' ? ` ${stateMutability}` : '';
    
    this.abi.push(`function ${name}(${inputStr})${stateStr}${outputStr}`);
    return this;
  }

  // 添加事件
  addEvent(name: string, inputs: string[]) {
    const inputStr = inputs.join(', ');
    this.abi.push(`event ${name}(${inputStr})`);
    return this;
  }

  // 构建 ABI
  build(): string[] {
    return [...this.abi];
  }
}

// 使用示例
const abi = new ABIBuilder()
  .addFunction('balanceOf', ['address owner'], ['uint256'], 'view')
  .addFunction('transfer', ['address to', 'uint256 amount'], ['bool'])
  .addEvent('Transfer', ['address indexed from', 'address indexed to', 'uint256 value'])
  .build();
```

## 合约调用

### 1. 只读函数调用

```typescript
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// USDC 合约
const usdcAddress = '0xA0b86a33E6441b8C4505E2E8E3C3b8B8B8B8B8B8';
const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);

async function getTokenInfo() {
  try {
    // 并行调用多个只读函数
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      usdcContract.name(),
      usdcContract.symbol(),
      usdcContract.decimals(),
      usdcContract.totalSupply()
    ]);

    console.log('代币名称:', name);
    console.log('代币符号:', symbol);
    console.log('小数位数:', decimals);
    console.log('总供应量:', ethers.formatUnits(totalSupply, decimals));

    return { name, symbol, decimals, totalSupply };
  } catch (error) {
    console.error('获取代币信息失败:', error);
    throw error;
  }
}

// 获取用户余额
async function getUserBalance(userAddress: string) {
  const balance = await usdcContract.balanceOf(userAddress);
  const decimals = await usdcContract.decimals();
  
  return {
    raw: balance,
    formatted: ethers.formatUnits(balance, decimals)
  };
}

// 使用示例
const tokenInfo = await getTokenInfo();
const userBalance = await getUserBalance('0x...');
console.log('用户余额:', userBalance.formatted, tokenInfo.symbol);
```

### 2. 写入函数调用

```typescript
const wallet = new ethers.Wallet('0x...privateKey', provider);
const contractWithSigner = usdcContract.connect(wallet);

async function transferTokens(to: string, amount: string) {
  try {
    // 获取代币精度
    const decimals = await contractWithSigner.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);

    // 检查余额
    const senderAddress = await wallet.getAddress();
    const balance = await contractWithSigner.balanceOf(senderAddress);
    
    if (balance < amountWei) {
      throw new Error('余额不足');
    }

    // 估算 Gas
    const gasEstimate = await contractWithSigner.transfer.estimateGas(to, amountWei);
    const gasLimit = gasEstimate * 120n / 100n; // 增加 20% 缓冲

    // 发送交易
    const tx = await contractWithSigner.transfer(to, amountWei, {
      gasLimit
    });

    console.log('交易已发送:', tx.hash);

    // 等待确认
    const receipt = await tx.wait();
    console.log('交易已确认:', receipt.status === 1 ? '成功' : '失败');

    return receipt;
  } catch (error) {
    console.error('转账失败:', error);
    throw error;
  }
}

// 授权代币
async function approveTokens(spender: string, amount: string) {
  const decimals = await contractWithSigner.decimals();
  const amountWei = ethers.parseUnits(amount, decimals);

  const tx = await contractWithSigner.approve(spender, amountWei);
  await tx.wait();

  console.log('授权成功');
  return tx;
}

// 使用示例
await transferTokens('0x...接收地址', '100');
await approveTokens('0x...合约地址', '1000');
```

### 3. 批量调用

```typescript
class BatchContractCaller {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  // 批量获取余额
  async batchGetBalances(addresses: string[]): Promise<Array<{address: string, balance: string}>> {
    const promises = addresses.map(address => this.contract.balanceOf(address));
    const balances = await Promise.all(promises);
    const decimals = await this.contract.decimals();

    return addresses.map((address, index) => ({
      address,
      balance: ethers.formatUnits(balances[index], decimals)
    }));
  }

  // 批量检查授权
  async batchGetAllowances(
    owners: string[], 
    spender: string
  ): Promise<Array<{owner: string, allowance: string}>> {
    const promises = owners.map(owner => this.contract.allowance(owner, spender));
    const allowances = await Promise.all(promises);
    const decimals = await this.contract.decimals();

    return owners.map((owner, index) => ({
      owner,
      allowance: ethers.formatUnits(allowances[index], decimals)
    }));
  }
}

// 使用示例
const batchCaller = new BatchContractCaller(usdcContract);
const addresses = ['0x...', '0x...', '0x...'];
const balances = await batchCaller.batchGetBalances(addresses);
console.log('批量余额查询结果:', balances);
```

## 事件监听

### 1. 基本事件监听

```typescript
// 监听转账事件
contractWithSigner.on('Transfer', (from, to, value, event) => {
  console.log('转账事件:');
  console.log('从:', from);
  console.log('到:', to);
  console.log('金额:', ethers.formatUnits(value, 6)); // USDC 6位小数
  console.log('交易哈希:', event.log.transactionHash);
  console.log('区块号:', event.log.blockNumber);
});

// 监听授权事件
contractWithSigner.on('Approval', (owner, spender, value, event) => {
  console.log('授权事件:');
  console.log('所有者:', owner);
  console.log('被授权者:', spender);
  console.log('授权金额:', ethers.formatUnits(value, 6));
});
```

### 2. 过滤事件监听

```typescript
// 监听特定地址的转账
const userAddress = '0x...';

// 监听用户发送的转账
const sentFilter = contractWithSigner.filters.Transfer(userAddress, null);
contractWithSigner.on(sentFilter, (from, to, value, event) => {
  console.log(`${userAddress} 发送了 ${ethers.formatUnits(value, 6)} USDC 到 ${to}`);
});

// 监听用户接收的转账
const receivedFilter = contractWithSigner.filters.Transfer(null, userAddress);
contractWithSigner.on(receivedFilter, (from, to, value, event) => {
  console.log(`${userAddress} 接收了 ${ethers.formatUnits(value, 6)} USDC 来自 ${from}`);
});

// 监听用户的所有转账（发送或接收）
const allTransfersFilter = contractWithSigner.filters.Transfer(userAddress);
contractWithSigner.on(allTransfersFilter, (from, to, value, event) => {
  const isReceived = to.toLowerCase() === userAddress.toLowerCase();
  const direction = isReceived ? '接收' : '发送';
  const counterparty = isReceived ? from : to;
  
  console.log(`${direction} ${ethers.formatUnits(value, 6)} USDC ${isReceived ? '来自' : '到'} ${counterparty}`);
});
```

### 3. 历史事件查询

```typescript
async function getTransferHistory(address: string, fromBlock: number = 0) {
  // 查询发送的转账
  const sentFilter = contractWithSigner.filters.Transfer(address, null);
  const sentEvents = await contractWithSigner.queryFilter(sentFilter, fromBlock);

  // 查询接收的转账
  const receivedFilter = contractWithSigner.filters.Transfer(null, address);
  const receivedEvents = await contractWithSigner.queryFilter(receivedFilter, fromBlock);

  // 合并并排序
  const allEvents = [...sentEvents, ...receivedEvents].sort(
    (a, b) => a.blockNumber - b.blockNumber
  );

  const decimals = await contractWithSigner.decimals();

  return allEvents.map(event => {
    const isReceived = event.args[1].toLowerCase() === address.toLowerCase();
    return {
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      from: event.args[0],
      to: event.args[1],
      value: ethers.formatUnits(event.args[2], decimals),
      direction: isReceived ? 'received' : 'sent',
      timestamp: null // 需要额外查询区块信息获取时间戳
    };
  });
}

// 获取带时间戳的历史记录
async function getTransferHistoryWithTimestamp(address: string, fromBlock: number = 0) {
  const history = await getTransferHistory(address, fromBlock);
  
  // 批量获取区块信息
  const blockNumbers = [...new Set(history.map(tx => tx.blockNumber))];
  const blockPromises = blockNumbers.map(blockNumber => provider.getBlock(blockNumber));
  const blocks = await Promise.all(blockPromises);
  
  const blockTimestamps = new Map();
  blocks.forEach(block => {
    if (block) {
      blockTimestamps.set(block.number, block.timestamp);
    }
  });

  return history.map(tx => ({
    ...tx,
    timestamp: blockTimestamps.get(tx.blockNumber)
  }));
}

// 使用示例
const history = await getTransferHistoryWithTimestamp('0x...', -1000); // 最近1000个区块
console.log('转账历史:', history);
```

## 实际应用案例

### 1. DeFi 代币交换

```typescript
class TokenSwapper {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private uniswapRouter: ethers.Contract;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    
    // Uniswap V2 Router 合约
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const routerABI = [
      "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
    ];
    
    this.uniswapRouter = new ethers.Contract(routerAddress, routerABI, signer);
  }

  // 获取交换价格
  async getSwapPrice(tokenIn: string, tokenOut: string, amountIn: string) {
    const path = [tokenIn, tokenOut];
    const amounts = await this.uniswapRouter.getAmountsOut(
      ethers.parseEther(amountIn),
      path
    );
    
    return {
      amountIn: amountIn,
      amountOut: ethers.formatEther(amounts[1]),
      path
    };
  }

  // 执行代币交换
  async swapTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number = 0.5 // 0.5%
  ) {
    // 获取预期输出
    const priceInfo = await this.getSwapPrice(tokenIn, tokenOut, amountIn);
    const amountOutMin = ethers.parseEther(priceInfo.amountOut) * 
      BigInt(Math.floor((100 - slippageTolerance) * 100)) / 10000n;

    // 检查并授权代币
    const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, this.signer);
    const allowance = await tokenContract.allowance(
      await this.signer.getAddress(),
      await this.uniswapRouter.getAddress()
    );

    const amountInWei = ethers.parseEther(amountIn);
    if (allowance < amountInWei) {
      console.log('授权代币...');
      const approveTx = await tokenContract.approve(
        await this.uniswapRouter.getAddress(),
        amountInWei
      );
      await approveTx.wait();
    }

    // 执行交换
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期
    const swapTx = await this.uniswapRouter.swapExactTokensForTokens(
      amountInWei,
      amountOutMin,
      priceInfo.path,
      await this.signer.getAddress(),
      deadline
    );

    console.log('交换交易已发送:', swapTx.hash);
    const receipt = await swapTx.wait();
    console.log('交换完成');

    return receipt;
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);
const swapper = new TokenSwapper(provider, wallet);

// 查询价格
const price = await swapper.getSwapPrice(
  '0x...USDC地址',
  '0x...WETH地址',
  '1000'
);
console.log('交换价格:', price);

// 执行交换
await swapper.swapTokens(
  '0x...USDC地址',
  '0x...WETH地址',
  '1000',
  0.5
);
```

### 2. NFT 市场交互

```typescript
class NFTMarketplace {
  private contract: ethers.Contract;
  private nftContract: ethers.Contract;

  constructor(
    marketplaceAddress: string,
    nftAddress: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ) {
    const marketplaceABI = [
      "function listItem(address nftAddress, uint256 tokenId, uint256 price) external",
      "function buyItem(address nftAddress, uint256 tokenId) external payable",
      "function cancelListing(address nftAddress, uint256 tokenId) external",
      "function getListing(address nftAddress, uint256 tokenId) external view returns (uint256 price, address seller)",
      "event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price)",
      "event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price)"
    ];

    const nftABI = [
      "function ownerOf(uint256 tokenId) external view returns (address owner)",
      "function approve(address to, uint256 tokenId) external",
      "function getApproved(uint256 tokenId) external view returns (address operator)",
      "function setApprovalForAll(address operator, bool approved) external",
      "function isApprovedForAll(address owner, address operator) external view returns (bool)"
    ];

    this.contract = new ethers.Contract(
      marketplaceAddress,
      marketplaceABI,
      signer || provider
    );
    
    this.nftContract = new ethers.Contract(
      nftAddress,
      nftABI,
      signer || provider
    );
  }

  // 上架 NFT
  async listNFT(tokenId: number, priceInEth: string) {
    const signer = this.contract.runner as ethers.Signer;
    const signerAddress = await signer.getAddress();

    // 检查所有权
    const owner = await this.nftContract.ownerOf(tokenId);
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error('您不是此 NFT 的所有者');
    }

    // 检查授权
    const approved = await this.nftContract.getApproved(tokenId);
    const marketplaceAddress = await this.contract.getAddress();
    
    if (approved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
      console.log('授权 NFT 给市场合约...');
      const approveTx = await this.nftContract.approve(marketplaceAddress, tokenId);
      await approveTx.wait();
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
  }

  // 购买 NFT
  async buyNFT(tokenId: number) {
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
  }

  // 取消上架
  async cancelListing(tokenId: number) {
    const cancelTx = await this.contract.cancelListing(
      await this.nftContract.getAddress(),
      tokenId
    );

    console.log('取消上架交易已发送:', cancelTx.hash);
    await cancelTx.wait();
    console.log('已取消上架');

    return cancelTx;
  }

  // 获取上架信息
  async getListingInfo(tokenId: number) {
    const listing = await this.contract.getListing(
      await this.nftContract.getAddress(),
      tokenId
    );

    if (listing.price === 0n) {
      return null;
    }

    return {
      price: ethers.formatEther(listing.price),
      seller: listing.seller,
      tokenId
    };
  }

  // 监听市场事件
  startEventListening() {
    // 监听上架事件
    this.contract.on('ItemListed', (seller, nftAddress, tokenId, price, event) => {
      console.log('新的 NFT 上架:');
      console.log('卖家:', seller);
      console.log('Token ID:', tokenId.toString());
      console.log('价格:', ethers.formatEther(price), 'ETH');
    });

    // 监听购买事件
    this.contract.on('ItemBought', (buyer, nftAddress, tokenId, price, event) => {
      console.log('NFT 已售出:');
      console.log('买家:', buyer);
      console.log('Token ID:', tokenId.toString());
      console.log('价格:', ethers.formatEther(price), 'ETH');
    });
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);

const marketplace = new NFTMarketplace(
  '0x...市场合约地址',
  '0x...NFT合约地址',
  provider,
  wallet
);

// 上架 NFT
await marketplace.listNFT(123, '1.5'); // Token ID 123, 价格 1.5 ETH

// 查询上架信息
const listingInfo = await marketplace.getListingInfo(123);
console.log('上架信息:', listingInfo);

// 开始监听事件
marketplace.startEventListening();
```

### 3. 多签钱包交互

```typescript
class MultiSigWallet {
  private contract: ethers.Contract;
  private provider: ethers.Provider;

  constructor(contractAddress: string, provider: ethers.Provider, signer?: ethers.Signer) {
    const multiSigABI = [
      "function submitTransaction(address to, uint256 value, bytes calldata data) external returns (uint256 txIndex)",
      "function confirmTransaction(uint256 txIndex) external",
      "function revokeConfirmation(uint256 txIndex) external",
      "function executeTransaction(uint256 txIndex) external",
      "function getTransaction(uint256 txIndex) external view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations)",
      "function getTransactionCount() external view returns (uint256)",
      "function isConfirmed(uint256 txIndex, address owner) external view returns (bool)",
      "function getOwners() external view returns (address[] memory)",
      "function numConfirmationsRequired() external view returns (uint256)",
      "event SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data)",
      "event ConfirmTransaction(address indexed owner, uint256 indexed txIndex)",
      "event ExecuteTransaction(address indexed owner, uint256 indexed txIndex)"
    ];

    this.contract = new ethers.Contract(contractAddress, multiSigABI, signer || provider);
    this.provider = provider;
  }

  // 提交交易
  async submitTransaction(to: string, value: string, data: string = '0x') {
    const valueWei = ethers.parseEther(value);
    const tx = await this.contract.submitTransaction(to, valueWei, data);
    
    console.log('交易提交成功:', tx.hash);
    const receipt = await tx.wait();
    
    // 从事件中获取交易索引
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log)?.name === 'SubmitTransaction';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = this.contract.interface.parseLog(event);
      const txIndex = parsedEvent?.args[1];
      console.log('交易索引:', txIndex.toString());
      return txIndex;
    }

    throw new Error('无法获取交易索引');
  }

  // 确认交易
  async confirmTransaction(txIndex: number) {
    const tx = await this.contract.confirmTransaction(txIndex);
    console.log('确认交易已发送:', tx.hash);
    await tx.wait();
    console.log('交易确认成功');
    return tx;
  }

  // 撤销确认
  async revokeConfirmation(txIndex: number) {
    const tx = await this.contract.revokeConfirmation(txIndex);
    console.log('撤销确认已发送:', tx.hash);
    await tx.wait();
    console.log('确认已撤销');
    return tx;
  }

  // 执行交易
  async executeTransaction(txIndex: number) {
    const tx = await this.contract.executeTransaction(txIndex);
    console.log('执行交易已发送:', tx.hash);
    await tx.wait();
    console.log('交易执行成功');
    return tx;
  }

  // 获取交易信息
  async getTransactionInfo(txIndex: number) {
    const [to, value, data, executed, numConfirmations] = await this.contract.getTransaction(txIndex);
    
    return {
      to,
      value: ethers.formatEther(value),
      data,
      executed,
      numConfirmations: numConfirmations.toString(),
      txIndex
    };
  }

  // 获取所有待处理交易
  async getPendingTransactions() {
    const txCount = await this.contract.getTransactionCount();
    const pendingTxs = [];

    for (let i = 0; i < txCount; i++) {
      const txInfo = await this.getTransactionInfo(i);
      if (!txInfo.executed) {
        pendingTxs.push(txInfo);
      }
    }

    return pendingTxs;
  }

  // 检查用户是否已确认交易
  async isConfirmedByUser(txIndex: number, userAddress: string) {
    return await this.contract.isConfirmed(txIndex, userAddress);
  }

  // 获取钱包信息
  async getWalletInfo() {
    const [owners, requiredConfirmations, txCount] = await Promise.all([
      this.contract.getOwners(),
      this.contract.numConfirmationsRequired(),
      this.contract.getTransactionCount()
    ]);

    const balance = await this.provider.getBalance(await this.contract.getAddress());

    return {
      owners,
      requiredConfirmations: requiredConfirmations.toString(),
      transactionCount: txCount.toString(),
      balance: ethers.formatEther(balance)
    };
  }

  // 监听多签钱包事件
  startEventListening() {
    // 监听交易提交
    this.contract.on('SubmitTransaction', (owner, txIndex, to, value, data, event) => {
      console.log('新交易提交:');
      console.log('提交者:', owner);
      console.log('交易索引:', txIndex.toString());
      console.log('接收地址:', to);
      console.log('金额:', ethers.formatEther(value), 'ETH');
    });

    // 监听交易确认
    this.contract.on('ConfirmTransaction', (owner, txIndex, event) => {
      console.log('交易确认:');
      console.log('确认者:', owner);
      console.log('交易索引:', txIndex.toString());
    });

    // 监听交易执行
    this.contract.on('ExecuteTransaction', (owner, txIndex, event) => {
      console.log('交易执行:');
      console.log('执行者:', owner);
      console.log('交易索引:', txIndex.toString());
    });
  }
}

// 使用示例
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);

const multiSig = new MultiSigWallet(
  '0x...多签钱包地址',
  provider,
  wallet
);

// 获取钱包信息
const walletInfo = await multiSig.getWalletInfo();
console.log('多签钱包信息:', walletInfo);

// 提交转账交易
const txIndex = await multiSig.submitTransaction(
  '0x...接收地址',
  '1.0', // 1 ETH
  '0x'
);

// 确认交易
await multiSig.confirmTransaction(txIndex);

// 获取待处理交易
const pendingTxs = await multiSig.getPendingTransactions();
console.log('待处理交易:', pendingTxs);

// 开始监听事件
multiSig.startEventListening();
```

## 错误处理和调试

### 1. 常见错误处理

```typescript
async function safeContractCall<T>(
  contractCall: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await contractCall();
    } catch (error: any) {
      console.error(`调用失败 (${i + 1}/${retries}):`, error.message);

      // 处理特定错误
      if (error.code === 'CALL_EXCEPTION') {
        console.error('合约调用异常:', error.reason);
        throw error; // 不重试
      } else if (error.code === 'NETWORK_ERROR') {
        console.log('网络错误，重试中...');
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } else if (error.code === 'TIMEOUT') {
        console.log('超时，重试中...');
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('所有重试都失败了');
}

// 使用示例
const balance = await safeContractCall(() => contract.balanceOf('0x...'));
```

### 2. Gas 估算和优化

```typescript
class GasOptimizer {
  static async estimateWithBuffer(
    contract: ethers.Contract,
    functionName: string,
    args: any[],
    bufferPercent: number = 20
  ) {
    const gasEstimate = await contract[functionName].estimateGas(...args);
    const gasWithBuffer = gasEstimate * BigInt(100 + bufferPercent) / 100n;
    
    return {
      estimated: gasEstimate,
      withBuffer: gasWithBuffer,
      bufferPercent
    };
  }

  static async getOptimalGasPrice(provider: ethers.Provider) {
    const feeData = await provider.getFeeData();
    
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
  }
}

// 使用示例
const gasInfo = await GasOptimizer.estimateWithBuffer(
  contractWithSigner,
  'transfer',
  ['0x...', ethers.parseEther('100')]
);

const gasPrice = await GasOptimizer.getOptimalGasPrice(provider);
console.log('Gas 估算:', gasInfo);
console.log('Gas 价格:', gasPrice);
```

## 下一步

- [Wallet 钱包](/ethers/basics/wallets) - 深入了解钱包管理
- [连接钱包](/ethers/core/wallet-connection) - 实现钱包连接功能
- [合约交互](/ethers/core/contract-interaction) - 高级合约交互技巧