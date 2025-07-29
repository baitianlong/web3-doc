---
title: 多签钱包
description: 使用 Ethers.js 开发和交互多重签名钱包的完整指南
keywords: [ethers.js, 多签钱包, 多重签名, Gnosis Safe, 智能合约钱包, 安全]
---

# 多签钱包

多重签名钱包（Multisig Wallet）是一种需要多个私钥签名才能执行交易的智能合约钱包。它提供了更高的安全性，广泛应用于团队资金管理、DAO 治理和企业级应用中。

## 多签钱包基础

### 1. 多签钱包概念

```typescript
import { ethers, Contract, Wallet } from 'ethers';

// 多签钱包的基本概念
interface MultisigWallet {
  owners: string[];           // 所有者地址列表
  threshold: number;          // 执行交易所需的最少签名数
  nonce: number;             // 防重放攻击的计数器
  transactions: Transaction[]; // 待执行的交易列表
}

interface Transaction {
  to: string;                // 目标地址
  value: bigint;             // 转账金额
  data: string;              // 交易数据
  executed: boolean;         // 是否已执行
  confirmations: string[];   // 确认签名的地址列表
}

// 多签钱包事件
interface MultisigEvents {
  OwnerAdded: (owner: string) => void;
  OwnerRemoved: (owner: string) => void;
  ThresholdChanged: (threshold: number) => void;
  TransactionSubmitted: (txId: number, to: string, value: bigint, data: string) => void;
  TransactionConfirmed: (txId: number, owner: string) => void;
  TransactionExecuted: (txId: number) => void;
  TransactionRevoked: (txId: number, owner: string) => void;
}

class MultisigWalletManager {
  private provider: ethers.Provider;
  private contract: Contract;
  private signers: Wallet[];

  constructor(
    contractAddress: string,
    provider: ethers.Provider,
    signers: Wallet[]
  ) {
    this.provider = provider;
    this.signers = signers;
    
    // 多签钱包 ABI（简化版）
    const multisigABI = [
      "function owners(uint256) view returns (address)",
      "function threshold() view returns (uint256)",
      "function getTransactionCount() view returns (uint256)",
      "function transactions(uint256) view returns (address to, uint256 value, bytes data, bool executed)",
      "function confirmations(uint256, address) view returns (bool)",
      "function submitTransaction(address to, uint256 value, bytes data) returns (uint256)",
      "function confirmTransaction(uint256 transactionId)",
      "function revokeConfirmation(uint256 transactionId)",
      "function executeTransaction(uint256 transactionId)",
      "function addOwner(address owner)",
      "function removeOwner(address owner)",
      "function changeThreshold(uint256 threshold)",
      "event TransactionSubmitted(uint256 indexed transactionId, address indexed to, uint256 value, bytes data)",
      "event TransactionConfirmed(uint256 indexed transactionId, address indexed owner)",
      "event TransactionExecuted(uint256 indexed transactionId)",
      "event TransactionRevoked(uint256 indexed transactionId, address indexed owner)"
    ];

    this.contract = new Contract(contractAddress, multisigABI, provider);
  }

  // 获取钱包信息
  async getWalletInfo(): Promise<{
    owners: string[];
    threshold: number;
    balance: bigint;
    transactionCount: number;
  }> {
    const [threshold, transactionCount, balance] = await Promise.all([
      this.contract.threshold(),
      this.contract.getTransactionCount(),
      this.provider.getBalance(await this.contract.getAddress())
    ]);

    // 获取所有所有者
    const owners: string[] = [];
    let index = 0;
    try {
      while (true) {
        const owner = await this.contract.owners(index);
        if (owner === ethers.ZeroAddress) break;
        owners.push(owner);
        index++;
      }
    } catch (error) {
      // 到达数组末尾
    }

    return {
      owners,
      threshold: Number(threshold),
      balance,
      transactionCount: Number(transactionCount)
    };
  }

  // 提交交易
  async submitTransaction(
    to: string,
    value: bigint,
    data: string = '0x',
    signerIndex: number = 0
  ): Promise<{
    transactionId: number;
    txHash: string;
  }> {
    const signer = this.signers[signerIndex];
    const contractWithSigner = this.contract.connect(signer);

    const tx = await contractWithSigner.submitTransaction(to, value, data);
    const receipt = await tx.wait();

    // 从事件中获取交易ID
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.contract.interface.parseLog(log);
        return parsed?.name === 'TransactionSubmitted';
      } catch {
        return false;
      }
    });

    const transactionId = event ? 
      Number(this.contract.interface.parseLog(event)?.args[0]) : 
      await this.contract.getTransactionCount() - 1n;

    return {
      transactionId: Number(transactionId),
      txHash: tx.hash
    };
  }

  // 确认交易
  async confirmTransaction(
    transactionId: number,
    signerIndex: number
  ): Promise<string> {
    const signer = this.signers[signerIndex];
    const contractWithSigner = this.contract.connect(signer);

    const tx = await contractWithSigner.confirmTransaction(transactionId);
    await tx.wait();

    return tx.hash;
  }

  // 撤销确认
  async revokeConfirmation(
    transactionId: number,
    signerIndex: number
  ): Promise<string> {
    const signer = this.signers[signerIndex];
    const contractWithSigner = this.contract.connect(signer);

    const tx = await contractWithSigner.revokeConfirmation(transactionId);
    await tx.wait();

    return tx.hash;
  }

  // 执行交易
  async executeTransaction(
    transactionId: number,
    signerIndex: number = 0
  ): Promise<string> {
    const signer = this.signers[signerIndex];
    const contractWithSigner = this.contract.connect(signer);

    const tx = await contractWithSigner.executeTransaction(transactionId);
    await tx.wait();

    return tx.hash;
  }

  // 获取交易详情
  async getTransaction(transactionId: number): Promise<{
    to: string;
    value: bigint;
    data: string;
    executed: boolean;
    confirmations: string[];
    confirmationCount: number;
  }> {
    const [to, value, data, executed] = await this.contract.transactions(transactionId);
    
    // 获取确认列表
    const walletInfo = await this.getWalletInfo();
    const confirmations: string[] = [];
    
    for (const owner of walletInfo.owners) {
      const isConfirmed = await this.contract.confirmations(transactionId, owner);
      if (isConfirmed) {
        confirmations.push(owner);
      }
    }

    return {
      to,
      value,
      data,
      executed,
      confirmations,
      confirmationCount: confirmations.length
    };
  }

  // 获取待处理的交易
  async getPendingTransactions(): Promise<Array<{
    id: number;
    to: string;
    value: bigint;
    data: string;
    confirmations: string[];
    confirmationCount: number;
    canExecute: boolean;
  }>> {
    const walletInfo = await this.getWalletInfo();
    const pendingTransactions = [];

    for (let i = 0; i < walletInfo.transactionCount; i++) {
      const tx = await this.getTransaction(i);
      
      if (!tx.executed) {
        const canExecute = tx.confirmationCount >= walletInfo.threshold;
        
        pendingTransactions.push({
          id: i,
          to: tx.to,
          value