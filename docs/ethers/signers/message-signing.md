---
title: 消息签名
description: 深入了解 Ethers.js 中的消息签名功能，掌握各种签名技巧和验证方法
keywords: [ethers.js, 消息签名, 数字签名, 签名验证, 身份认证]
---

# 消息签名

消息签名是区块链应用中重要的身份验证机制，允许用户证明对特定地址的控制权而无需发送交易。Ethers.js 提供了完整的消息签名和验证功能。

## 基本概念

消息签名使用椭圆曲线数字签名算法（ECDSA）对任意消息进行签名：

```typescript
import { ethers } from 'ethers';

// 创建钱包
const wallet = new ethers.Wallet('0x...privateKey');

// 签名消息
const message = 'Hello, Ethereum!';
const signature = await wallet.signMessage(message);

console.log('原始消息:', message);
console.log('签名结果:', signature);

// 验证签名
const recoveredAddress = ethers.verifyMessage(message, signature);
console.log('恢复的地址:', recoveredAddress);
console.log('签名验证:', recoveredAddress === wallet.address);
```

## 消息签名类型

### 1. 字符串消息签名

```typescript
async function signStringMessage() {
  const wallet = new ethers.Wallet('0x...privateKey');
  
  // 简单字符串
  const message = 'Welcome to our DApp!';
  const signature = await wallet.signMessage(message);
  
  console.log('消息:', message);
  console.log('签名:', signature);
  
  // 验证签名
  const isValid = ethers.verifyMessage(message, signature) === wallet.address;
  console.log('签名有效:', isValid);
  
  return { message, signature, address: wallet.address };
}
```

### 2. 字节数组签名

```typescript
async function signBytesMessage() {
  const wallet = new ethers.Wallet('0x...privateKey');
  
  // 将字符串转换为字节数组
  const message = 'Binary message data';
  const messageBytes = ethers.toUtf8Bytes(message);
  
  // 签名字节数组
  const signature = await wallet.signMessage(messageBytes);
  
  console.log('原始消息:', message);
  console.log('字节数组:', ethers.hexlify(messageBytes));
  console.log('签名:', signature);
  
  // 验证签名（可以使用原始字符串或字节数组）
  const isValid1 = ethers.verifyMessage(message, signature) === wallet.address;
  const isValid2 = ethers.verifyMessage(messageBytes, signature) === wallet.address;
  
  console.log('字符串验证:', isValid1);
  console.log('字节数组验证:', isValid2);
  
  return signature;
}
```

### 3. 哈希消息签名

```typescript
async function signHashMessage() {
  const wallet = new ethers.Wallet('0x...privateKey');
  
  // 创建消息哈希
  const data = 'Important data to hash';
  const messageHash = ethers.keccak256(ethers.toUtf8Bytes(data));
  
  console.log('原始数据:', data);
  console.log('消息哈希:', messageHash);
  
  // 签名哈希（需要添加以太坊消息前缀）
  const messageHashBytes = ethers.getBytes(messageHash);
  const signature = await wallet.signMessage(messageHashBytes);
  
  console.log('签名:', signature);
  
  // 验证签名
  const recoveredAddress = ethers.verifyMessage(messageHashBytes, signature);
  console.log('恢复的地址:', recoveredAddress);
  console.log('签名有效:', recoveredAddress === wallet.address);
  
  return { messageHash, signature };
}
```

## 签名验证

### 1. 基本验证

```typescript
class MessageVerifier {
  // 验证消息签名
  static verifyMessage(
    message: string | Uint8Array,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('签名验证失败:', error);
      return false;
    }
  }

  // 批量验证签名
  static verifyBatchMessages(
    verifications: Array<{
      message: string | Uint8Array;
      signature: string;
      expectedAddress: string;
    }>
  ): boolean[] {
    return verifications.map(({ message, signature, expectedAddress }) =>
      this.verifyMessage(message, signature, expectedAddress)
    );
  }

  // 验证签名并返回详细信息
  static verifyMessageDetailed(
    message: string | Uint8Array,
    signature: string,
    expectedAddress?: string
  ): {
    isValid: boolean;
    recoveredAddress: string;
    matches: boolean;
    error?: string;
  } {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const matches = expectedAddress 
        ? recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
        : true;

      return {
        isValid: true,
        recoveredAddress,
        matches
      };
    } catch (error: any) {
      return {
        isValid: false,
        recoveredAddress: '',
        matches: false,
        error: error.message
      };
    }
  }
}

// 使用示例
const verification = MessageVerifier.verifyMessageDetailed(
  'Hello World',
  '0x...',
  '0x...'
);

console.log('验证结果:', verification);
```

### 2. 高级验证

```typescript
class AdvancedMessageVerifier {
  // 验证带时间戳的消息
  static verifyTimestampedMessage(
    baseMessage: string,
    timestamp: number,
    signature: string,
    expectedAddress: string,
    maxAge: number = 300000 // 5分钟
  ): {
    isValid: boolean;
    isExpired: boolean;
    age: number;
  } {
    const now = Date.now();
    const age = now - timestamp;
    const isExpired = age > maxAge;

    if (isExpired) {
      return { isValid: false, isExpired: true, age };
    }

    const message = `${baseMessage}:${timestamp}`;
    const isValid = MessageVerifier.verifyMessage(message, signature, expectedAddress);

    return { isValid, isExpired: false, age };
  }

  // 验证带随机数的消息（防重放攻击）
  static verifyNonceMessage(
    baseMessage: string,
    nonce: string,
    signature: string,
    expectedAddress: string,
    usedNonces: Set<string>
  ): {
    isValid: boolean;
    isReplay: boolean;
  } {
    // 检查是否为重放攻击
    if (usedNonces.has(nonce)) {
      return { isValid: false, isReplay: true };
    }

    const message = `${baseMessage}:${nonce}`;
    const isValid = MessageVerifier.verifyMessage(message, signature, expectedAddress);

    if (isValid) {
      usedNonces.add(nonce);
    }

    return { isValid, isReplay: false };
  }

  // 验证多重签名消息
  static verifyMultiSignMessage(
    message: string,
    signatures: string[],
    signers: string[],
    threshold: number
  ): {
    isValid: boolean;
    validSignatures: number;
    validSigners: string[];
  } {
    const validSigners: string[] = [];
    let validSignatures = 0;

    for (const signature of signatures) {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (signers.includes(recoveredAddress) && !validSigners.includes(recoveredAddress)) {
          validSigners.push(recoveredAddress);
          validSignatures++;
        }
      } catch (error) {
        console.error('签名验证失败:', error);
      }
    }

    return {
      isValid: validSignatures >= threshold,
      validSignatures,
      validSigners
    };
  }
}
```

## 实际应用场景

### 1. 用户身份验证

```typescript
class AuthenticationService {
  private usedNonces: Set<string> = new Set();

  // 生成认证挑战
  generateChallenge(address: string): {
    message: string;
    nonce: string;
    timestamp: number;
  } {
    const nonce = ethers.hexlify(ethers.randomBytes(16));
    const timestamp = Date.now();
    const message = `请签名以验证您的身份\n地址: ${address}\n时间: ${new Date(timestamp).toISOString()}\n随机数: ${nonce}`;

    return { message, nonce, timestamp };
  }

  // 验证认证响应
  verifyAuthentication(
    message: string,
    signature: string,
    expectedAddress: string,
    nonce: string,
    timestamp: number
  ): {
    success: boolean;
    error?: string;
  } {
    // 检查时间戳（5分钟有效期）
    const age = Date.now() - timestamp;
    if (age > 300000) {
      return { success: false, error: '认证已过期' };
    }

    // 检查重放攻击
    if (this.usedNonces.has(nonce)) {
      return { success: false, error: '随机数已使用' };
    }

    // 验证签名
    const isValid = MessageVerifier.verifyMessage(message, signature, expectedAddress);
    if (!isValid) {
      return { success: false, error: '签名验证失败' };
    }

    // 标记随机数为已使用
    this.usedNonces.add(nonce);

    return { success: true };
  }

  // 清理过期的随机数
  cleanupExpiredNonces(): void {
    // 实际应用中需要存储时间戳并清理过期项
    // 这里简化处理
    if (this.usedNonces.size > 10000) {
      this.usedNonces.clear();
    }
  }
}

// 使用示例
async function authenticateUser() {
  const authService = new AuthenticationService();
  const wallet = new ethers.Wallet('0x...privateKey');

  // 1. 生成挑战
  const challenge = authService.generateChallenge(wallet.address);
  console.log('认证挑战:', challenge);

  // 2. 用户签名
  const signature = await wallet.signMessage(challenge.message);
  console.log('用户签名:', signature);

  // 3. 验证认证
  const result = authService.verifyAuthentication(
    challenge.message,
    signature,
    wallet.address,
    challenge.nonce,
    challenge.timestamp
  );

  console.log('认证结果:', result);
  return result.success;
}
```

### 2. 数据完整性验证

```typescript
class DataIntegrityService {
  // 签名数据
  static async signData(
    data: any,
    wallet: ethers.Wallet,
    includeTimestamp: boolean = true
  ): Promise<{
    data: any;
    signature: string;
    timestamp?: number;
    signer: string;
  }> {
    const timestamp = includeTimestamp ? Date.now() : undefined;
    
    // 创建签名消息
    const messageData = {
      data,
      timestamp,
      signer: wallet.address
    };
    
    const message = JSON.stringify(messageData, null, 0);
    const signature = await wallet.signMessage(message);

    return {
      data,
      signature,
      timestamp,
      signer: wallet.address
    };
  }

  // 验证数据完整性
  static verifyDataIntegrity(
    signedData: {
      data: any;
      signature: string;
      timestamp?: number;
      signer: string;
    },
    maxAge?: number
  ): {
    isValid: boolean;
    isExpired: boolean;
    error?: string;
  } {
    try {
      // 检查时间戳
      if (signedData.timestamp && maxAge) {
        const age = Date.now() - signedData.timestamp;
        if (age > maxAge) {
          return { isValid: false, isExpired: true, error: '数据已过期' };
        }
      }

      // 重建消息
      const messageData = {
        data: signedData.data,
        timestamp: signedData.timestamp,
        signer: signedData.signer
      };
      
      const message = JSON.stringify(messageData, null, 0);
      
      // 验证签名
      const isValid = MessageVerifier.verifyMessage(
        message,
        signedData.signature,
        signedData.signer
      );

      return { isValid, isExpired: false };
    } catch (error: any) {
      return { isValid: false, isExpired: false, error: error.message };
    }
  }
}

// 使用示例
async function dataIntegrityExample() {
  const wallet = new ethers.Wallet('0x...privateKey');
  
  // 签名数据
  const originalData = {
    userId: 123,
    action: 'transfer',
    amount: '100.5',
    recipient: '0x...'
  };

  const signedData = await DataIntegrityService.signData(originalData, wallet);
  console.log('签名数据:', signedData);

  // 验证数据完整性
  const verification = DataIntegrityService.verifyDataIntegrity(
    signedData,
    300000 // 5分钟有效期
  );

  console.log('验证结果:', verification);
  return verification.isValid;
}
```

### 3. 投票系统

```typescript
class VotingSystem {
  private votes: Map<string, {
    voter: string;
    choice: string;
    signature: string;
    timestamp: number;
  }> = new Map();

  private eligibleVoters: Set<string> = new Set();

  constructor(eligibleVoters: string[]) {
    eligibleVoters.forEach(voter => 
      this.eligibleVoters.add(voter.toLowerCase())
    );
  }

  // 投票
  async vote(
    voterAddress: string,
    choice: string,
    signature: string,
    timestamp: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    // 检查投票者资格
    if (!this.eligibleVoters.has(voterAddress.toLowerCase())) {
      return { success: false, error: '无投票资格' };
    }

    // 检查是否已投票
    if (this.votes.has(voterAddress.toLowerCase())) {
      return { success: false, error: '已经投票' };
    }

    // 验证签名
    const message = `投票选择: ${choice}\n时间: ${timestamp}\n投票者: ${voterAddress}`;
    const isValid = MessageVerifier.verifyMessage(message, signature, voterAddress);
    
    if (!isValid) {
      return { success: false, error: '签名验证失败' };
    }

    // 记录投票
    this.votes.set(voterAddress.toLowerCase(), {
      voter: voterAddress,
      choice,
      signature,
      timestamp
    });

    return { success: true };
  }

  // 获取投票结果
  getResults(): {
    totalVotes: number;
    results: { [choice: string]: number };
    voters: string[];
  } {
    const results: { [choice: string]: number } = {};
    const voters: string[] = [];

    for (const vote of this.votes.values()) {
      results[vote.choice] = (results[vote.choice] || 0) + 1;
      voters.push(vote.voter);
    }

    return {
      totalVotes: this.votes.size,
      results,
      voters
    };
  }

  // 验证所有投票
  verifyAllVotes(): {
    validVotes: number;
    invalidVotes: number;
    details: Array<{
      voter: string;
      isValid: boolean;
      error?: string;
    }>;
  } {
    let validVotes = 0;
    let invalidVotes = 0;
    const details: Array<{
      voter: string;
      isValid: boolean;
      error?: string;
    }> = [];

    for (const vote of this.votes.values()) {
      const message = `投票选择: ${vote.choice}\n时间: ${vote.timestamp}\n投票者: ${vote.voter}`;
      const isValid = MessageVerifier.verifyMessage(message, vote.signature, vote.voter);

      if (isValid) {
        validVotes++;
      } else {
        invalidVotes++;
      }

      details.push({
        voter: vote.voter,
        isValid,
        error: isValid ? undefined : '签名验证失败'
      });
    }

    return { validVotes, invalidVotes, details };
  }
}
```

## 签名工具类

### 1. 消息格式化工具

```typescript
class MessageFormatter {
  // 格式化登录消息
  static formatLoginMessage(
    domain: string,
    address: string,
    nonce: string,
    timestamp: number,
    chainId?: number
  ): string {
    return [
      `${domain} 想要您登录`,
      '',
      `钱包地址: ${address}`,
      `随机数: ${nonce}`,
      `时间: ${new Date(timestamp).toISOString()}`,
      chainId ? `链 ID: ${chainId}` : ''
    ].filter(Boolean).join('\n');
  }

  // 格式化交易确认消息
  static formatTransactionMessage(
    to: string,
    value: string,
    data?: string,
    nonce?: number
  ): string {
    const parts = [
      '请确认此交易:',
      '',
      `接收方: ${to}`,
      `金额: ${value} ETH`
    ];

    if (data && data !== '0x') {
      parts.push(`数据: ${data}`);
    }

    if (nonce !== undefined) {
      parts.push(`Nonce: ${nonce}`);
    }

    return parts.join('\n');
  }

  // 格式化权限消息
  static formatPermissionMessage(
    dapp: string,
    permissions: string[],
    expiry?: number
  ): string {
    const parts = [
      `${dapp} 请求以下权限:`,
      '',
      ...permissions.map(p => `• ${p}`)
    ];

    if (expiry) {
      parts.push('', `有效期至: ${new Date(expiry).toISOString()}`);
    }

    return parts.join('\n');
  }
}
```

### 2. 签名缓存

```typescript
class SignatureCache {
  private cache: Map<string, {
    signature: string;
    timestamp: number;
    expiry: number;
  }> = new Map();

  // 缓存签名
  setSignature(
    messageHash: string,
    signature: string,
    ttl: number = 300000 // 5分钟
  ): void {
    const now = Date.now();
    this.cache.set(messageHash, {
      signature,
      timestamp: now,
      expiry: now + ttl
    });
  }

  // 获取缓存的签名
  getSignature(messageHash: string): string | null {
    const cached = this.cache.get(messageHash);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(messageHash);
      return null;
    }

    return cached.signature;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.cache) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let validEntries = 0;

    for (const value of this.cache.values()) {
      if (now > value.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      validEntries
    };
  }
}
```

## 安全注意事项

### 1. 防止签名重放攻击

```typescript
class AntiReplayService {
  private usedSignatures: Set<string> = new Set();
  private nonceStore: Map<string, Set<string>> = new Map();

  // 检查签名是否已使用
  isSignatureUsed(signature: string): boolean {
    return this.usedSignatures.has(signature);
  }

  // 标记签名为已使用
  markSignatureUsed(signature: string): void {
    this.usedSignatures.add(signature);
  }

  // 检查用户的 nonce 是否已使用
  isNonceUsed(userAddress: string, nonce: string): boolean {
    const userNonces = this.nonceStore.get(userAddress.toLowerCase());
    return userNonces ? userNonces.has(nonce) : false;
  }

  // 标记 nonce 为已使用
  markNonceUsed(userAddress: string, nonce: string): void {
    const key = userAddress.toLowerCase();
    
    if (!this.nonceStore.has(key)) {
      this.nonceStore.set(key, new Set());
    }
    
    this.nonceStore.get(key)!.add(nonce);
  }

  // 验证带防重放保护的消息
  verifyWithAntiReplay(
    message: string,
    signature: string,
    expectedAddress: string,
    nonce: string
  ): {
    isValid: boolean;
    isReplay: boolean;
    error?: string;
  } {
    // 检查签名重放
    if (this.isSignatureUsed(signature)) {
      return { isValid: false, isReplay: true, error: '签名已被使用' };
    }

    // 检查 nonce 重放
    if (this.isNonceUsed(expectedAddress, nonce)) {
      return { isValid: false, isReplay: true, error: 'Nonce 已被使用' };
    }

    // 验证签名
    const isValid = MessageVerifier.verifyMessage(message, signature, expectedAddress);
    
    if (!isValid) {
      return { isValid: false, isReplay: false, error: '签名验证失败' };
    }

    // 标记为已使用
    this.markSignatureUsed(signature);
    this.markNonceUsed(expectedAddress, nonce);

    return { isValid: true, isReplay: false };
  }
}
```

## 常见问题

### Q: 消息签名和交易签名有什么区别？
A: 消息签名不会改变区块链状态，主要用于身份验证；交易签名会改变区块链状态并消耗 Gas。

### Q: 如何防止签名重放攻击？
A: 使用时间戳、随机数（nonce）或一次性令牌，并在服务端记录已使用的签名。

### Q: 签名的消息可以被其他人看到吗？
A: 是的，消息内容是公开的，签名只能证明消息来自特定地址，不能加密消息内容。

### Q: 如何验证历史签名？
A: 保存原始消息和签名，使用 `ethers.verifyMessage()` 可以随时验证历史签名的有效性。

## 下一步

- [类型化数据签名](/ethers/signers/typed-data) - 学习 EIP-712 结构化数据签名
- [合约交互](/ethers/contracts/basics) - 学习智能合约交互
- [身份认证](/ethers/examples/authentication) - 完整的身份认证示例