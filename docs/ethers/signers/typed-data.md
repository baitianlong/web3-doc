      const isValid = signer.toLowerCase() === expectedSigner.toLowerCase();
      const isExpired = value[timeField] && Date.now() > value[timeField] * 1000;

      return {
        isValid: isValid && !isExpired,
        isExpired,
        signer
      };
    } catch (error) {
      console.error('类型化数据签名验证失败:', error);
      return {
        isValid: false,
        isExpired: false
      };
    }
  }

  // 验证多重签名
  static verifyMultiSig(
    domain: any,
    types: any,
    value: any,
    signatures: string[],
    requiredSigners: string[],
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
        const signer = ethers.verifyTypedData(domain, types, value, signature);
        
        if (requiredSigners.includes(signer) && !validSigners.includes(signer)) {
          validSigners.push(signer);
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

  // 验证签名链
  static verifySignatureChain(
    signatureChain: Array<{
      domain: any;
      types: any;
      value: any;
      signature: string;
      expectedSigner: string;
    }>
  ): {
    isValid: boolean;
    validCount: number;
    invalidIndex?: number;
  } {
    for (let i = 0; i < signatureChain.length; i++) {
      const { domain, types, value, signature, expectedSigner } = signatureChain[i];
      
      if (!this.verifyTypedData(domain, types, value, signature, expectedSigner)) {
        return {
          isValid: false,
          validCount: i,
          invalidIndex: i
        };
      }
    }

    return {
      isValid: true,
      validCount: signatureChain.length
    };
  }
}
```

## 类型化数据工具

### 1. 类型定义生成器

```typescript
class TypeDefinitionGenerator {
  // 从 TypeScript 接口生成 EIP-712 类型
  static generateFromInterface(interfaceDefinition: any): any {
    const types: any = {};
    
    // 这里是简化示例，实际需要更复杂的类型解析
    for (const [typeName, fields] of Object.entries(interfaceDefinition)) {
      types[typeName] = Object.entries(fields as any).map(([name, type]) => ({
        name,
        type: this.mapTypeScriptToSolidity(type as string)
      }));
    }
    
    return types;
  }

  // TypeScript 类型到 Solidity 类型的映射
  private static mapTypeScriptToSolidity(tsType: string): string {
    const typeMap: { [key: string]: string } = {
      'string': 'string',
      'number': 'uint256',
      'boolean': 'bool',
      'Address': 'address',
      'BigNumber': 'uint256',
      'Bytes': 'bytes',
      'Bytes32': 'bytes32'
    };

    // 处理数组类型
    if (tsType.endsWith('[]')) {
      const baseType = tsType.slice(0, -2);
      return `${this.mapTypeScriptToSolidity(baseType)}[]`;
    }

    return typeMap[tsType] || tsType;
  }

  // 验证类型定义
  static validateTypes(types: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const validTypes = new Set([
      'address', 'bool', 'string', 'bytes', 'bytes32',
      'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      'int8', 'int16', 'int32', 'int64', 'int128', 'int256'
    ]);

    for (const [typeName, fields] of Object.entries(types)) {
      if (!Array.isArray(fields)) {
        errors.push(`类型 ${typeName} 的字段定义必须是数组`);
        continue;
      }

      for (const field of fields as any[]) {
        if (!field.name || !field.type) {
          errors.push(`类型 ${typeName} 中的字段缺少 name 或 type`);
          continue;
        }

        // 检查基本类型
        let fieldType = field.type;
        
        // 处理数组类型
        if (fieldType.endsWith('[]')) {
          fieldType = fieldType.slice(0, -2);
        }

        // 处理固定长度数组
        const fixedArrayMatch = fieldType.match(/^(.+)\[(\d+)\]$/);
        if (fixedArrayMatch) {
          fieldType = fixedArrayMatch[1];
        }

        // 检查是否为有效类型
        if (!validTypes.has(fieldType) && !types[fieldType]) {
          errors.push(`类型 ${typeName} 中的字段 ${field.name} 使用了无效类型 ${field.type}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### 2. 签名构建器

```typescript
class TypedDataBuilder {
  private domain: any;
  private types: any = {};
  private primaryType: string = '';

  constructor(domain: any) {
    this.domain = domain;
  }

  // 添加类型定义
  addType(typeName: string, fields: Array<{ name: string; type: string }>): this {
    this.types[typeName] = fields;
    return this;
  }

  // 设置主要类型
  setPrimaryType(typeName: string): this {
    this.primaryType = typeName;
    return this;
  }

  // 构建签名数据
  build(value: any): {
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  } {
    if (!this.primaryType) {
      throw new Error('必须设置主要类型');
    }

    if (!this.types[this.primaryType]) {
      throw new Error(`未定义的主要类型: ${this.primaryType}`);
    }

    return {
      domain: this.domain,
      types: this.types,
      primaryType: this.primaryType,
      message: value
    };
  }

  // 签名数据
  async sign(wallet: ethers.Wallet, value: any): Promise<string> {
    const data = this.build(value);
    return await wallet.signTypedData(data.domain, data.types, value);
  }

  // 验证数据
  verify(value: any, signature: string, expectedSigner: string): boolean {
    const data = this.build(value);
    return TypedDataVerifier.verifyTypedData(
      data.domain,
      data.types,
      value,
      signature,
      expectedSigner
    );
  }

  // 获取数据哈希
  getHash(value: any): string {
    const data = this.build(value);
    return ethers.TypedDataEncoder.hash(data.domain, data.types, value);
  }

  // 获取结构哈希
  getStructHash(value: any): string {
    if (!this.primaryType) {
      throw new Error('必须设置主要类型');
    }
    
    return ethers.TypedDataEncoder.hashStruct(this.primaryType, this.types, value);
  }
}

// 使用示例
const builder = new TypedDataBuilder({
  name: 'MyDApp',
  version: '1',
  chainId: 1,
  verifyingContract: '0x...'
});

builder
  .addType('Person', [
    { name: 'name', type: 'string' },
    { name: 'wallet', type: 'address' }
  ])
  .addType('Mail', [
    { name: 'from', type: 'Person' },
    { name: 'to', type: 'Person' },
    { name: 'contents', type: 'string' }
  ])
  .setPrimaryType('Mail');

const mailData = {
  from: { name: 'Alice', wallet: '0x...' },
  to: { name: 'Bob', wallet: '0x...' },
  contents: 'Hello!'
};

const wallet = new ethers.Wallet('0x...');
const signature = await builder.sign(wallet, mailData);
```

### 3. 批量签名处理

```typescript
class BatchTypedDataProcessor {
  // 批量签名
  static async signBatch(
    wallet: ethers.Wallet,
    signRequests: Array<{
      domain: any;
      types: any;
      value: any;
      id?: string;
    }>
  ): Promise<Array<{
    id?: string;
    signature: string;
    hash: string;
    success: boolean;
    error?: string;
  }>> {
    const results = [];

    for (const request of signRequests) {
      try {
        const signature = await wallet.signTypedData(
          request.domain,
          request.types,
          request.value
        );
        
        const hash = ethers.TypedDataEncoder.hash(
          request.domain,
          request.types,
          request.value
        );

        results.push({
          id: request.id,
          signature,
          hash,
          success: true
        });
      } catch (error: any) {
        results.push({
          id: request.id,
          signature: '',
          hash: '',
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // 批量验证
  static verifyBatch(
    verifyRequests: Array<{
      domain: any;
      types: any;
      value: any;
      signature: string;
      expectedSigner: string;
      id?: string;
    }>
  ): Array<{
    id?: string;
    isValid: boolean;
    signer?: string;
    error?: string;
  }> {
    return verifyRequests.map(request => {
      try {
        const signer = ethers.verifyTypedData(
          request.domain,
          request.types,
          request.value,
          request.signature
        );

        const isValid = signer.toLowerCase() === request.expectedSigner.toLowerCase();

        return {
          id: request.id,
          isValid,
          signer
        };
      } catch (error: any) {
        return {
          id: request.id,
          isValid: false,
          error: error.message
        };
      }
    });
  }

  // 并行处理
  static async processConcurrently<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    concurrency: number = 5
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      ));
    }
    
    return results;
  }
}
```

## 实用工具和助手

### 1. 类型化数据模板

```typescript
class TypedDataTemplates {
  // ERC-20 Permit 模板
  static createPermitTemplate(tokenAddress: string, chainId: number = 1) {
    return new TypedDataBuilder({
      name: 'Token', // 需要从合约获取实际名称
      version: '1',
      chainId,
      verifyingContract: tokenAddress
    }).addType('Permit', [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]).setPrimaryType('Permit');
  }

  // 投票模板
  static createVoteTemplate(governanceAddress: string, chainId: number = 1) {
    return new TypedDataBuilder({
      name: 'Governance',
      version: '1',
      chainId,
      verifyingContract: governanceAddress
    }).addType('Ballot', [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'voter', type: 'address' },
      { name: 'reason', type: 'string' }
    ]).setPrimaryType('Ballot');
  }

  // 订单模板
  static createOrderTemplate(exchangeAddress: string, chainId: number = 1) {
    return new TypedDataBuilder({
      name: 'Exchange',
      version: '1',
      chainId,
      verifyingContract: exchangeAddress
    })
    .addType('Asset', [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ])
    .addType('Order', [
      { name: 'maker', type: 'address' },
      { name: 'taker', type: 'address' },
      { name: 'makerAsset', type: 'Asset' },
      { name: 'takerAsset', type: 'Asset' },
      { name: 'expiry', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }
    ]).setPrimaryType('Order');
  }

  // 元交易模板
  static createMetaTransactionTemplate(forwarderAddress: string, chainId: number = 1) {
    return new TypedDataBuilder({
      name: 'MinimalForwarder',
      version: '0.0.1',
      chainId,
      verifyingContract: forwarderAddress
    }).addType('ForwardRequest', [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'gas', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'data', type: 'bytes' }
    ]).setPrimaryType('ForwardRequest');
  }
}
```

### 2. 调试和诊断工具

```typescript
class TypedDataDebugger {
  // 调试签名过程
  static debugSignature(
    domain: any,
    types: any,
    value: any,
    signature?: string
  ): {
    domainHash: string;
    structHash: string;
    digest: string;
    encodedData: string;
    isValidSignature?: boolean;
    recoveredAddress?: string;
  } {
    const encoder = ethers.TypedDataEncoder.from(types);
    
    const domainHash = ethers.TypedDataEncoder.hashDomain(domain);
    const structHash = encoder.hashStruct(encoder.primaryType, value);
    const digest = ethers.TypedDataEncoder.hash(domain, types, value);
    const encodedData = encoder.encodeData(encoder.primaryType, value);

    const result = {
      domainHash,
      structHash,
      digest,
      encodedData: ethers.hexlify(encodedData)
    };

    if (signature) {
      try {
        const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
        return {
          ...result,
          isValidSignature: true,
          recoveredAddress
        };
      } catch (error) {
        return {
          ...result,
          isValidSignature: false,
          recoveredAddress: undefined
        };
      }
    }

    return result;
  }

  // 比较两个类型化数据结构
  static compareStructures(
    struct1: { domain: any; types: any; value: any },
    struct2: { domain: any; types: any; value: any }
  ): {
    domainsMatch: boolean;
    typesMatch: boolean;
    valuesMatch: boolean;
    differences: string[];
  } {
    const differences: string[] = [];

    // 比较域
    const domainsMatch = JSON.stringify(struct1.domain) === JSON.stringify(struct2.domain);
    if (!domainsMatch) {
      differences.push('域配置不匹配');
    }

    // 比较类型
    const typesMatch = JSON.stringify(struct1.types) === JSON.stringify(struct2.types);
    if (!typesMatch) {
      differences.push('类型定义不匹配');
    }

    // 比较值
    const valuesMatch = JSON.stringify(struct1.value) === JSON.stringify(struct2.value);
    if (!valuesMatch) {
      differences.push('数据值不匹配');
    }

    return {
      domainsMatch,
      typesMatch,
      valuesMatch,
      differences
    };
  }

  // 验证数据完整性
  static validateDataIntegrity(
    domain: any,
    types: any,
    value: any
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证域
    const domainValidation = DomainValidator.validateDomain(domain);
    if (!domainValidation.isValid) {
      errors.push(...domainValidation.errors);
    }

    // 验证类型
    const typesValidation = TypeDefinitionGenerator.validateTypes(types);
    if (!typesValidation.isValid) {
      errors.push(...typesValidation.errors);
    }

    // 验证值与类型的匹配
    try {
      ethers.TypedDataEncoder.hash(domain, types, value);
    } catch (error: any) {
      errors.push(`数据编码失败: ${error.message}`);
    }

    // 检查潜在问题
    if (domain.chainId && domain.chainId !== 1) {
      warnings.push('使用非主网链 ID，请确认这是预期的');
    }

    if (!domain.verifyingContract) {
      warnings.push('未设置验证合约地址，可能影响安全性');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## 性能优化

### 1. 签名缓存优化

```typescript
class OptimizedSignatureCache {
  private cache = new Map<string, {
    signature: string;
    timestamp: number;
    accessCount: number;
    lastAccess: number;
  }>();

  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 1000, ttl: number = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  // 生成缓存键
  private generateKey(domain: any, types: any, value: any): string {
    const data = { domain, types, value };
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
  }

  // 获取签名
  getSignature(domain: any, types: any, value: any): string | null {
    const key = this.generateKey(domain, types, value);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问统计
    cached.accessCount++;
    cached.lastAccess = now;

    return cached.signature;
  }

  // 设置签名
  setSignature(domain: any, types: any, value: any, signature: string): void {
    const key = this.generateKey(domain, types, value);
    const now = Date.now();

    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      signature,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    });
  }

  // 删除最少使用的项
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minAccessCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, value] of this.cache) {
      if (value.accessCount < minAccessCount || 
          (value.accessCount === minAccessCount && value.lastAccess < oldestAccess)) {
        minAccessCount = value.accessCount;
        oldestAccess = value.lastAccess;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  // 清理过期项
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalAccess = 0;

    for (const value of this.cache.values()) {
      if (now - value.timestamp > this.ttl) {
        expired++;
      }
      totalAccess += value.accessCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalAccess,
      averageAccess: this.cache.size > 0 ? totalAccess / this.cache.size : 0
    };
  }
}
```

## 常见问题

### Q: EIP-712 和普通消息签名有什么区别？
A: EIP-712 提供结构化数据签名，在钱包中显示可读内容，而普通消息签名只能签名字符串。EIP-712 更安全，防止签名内容被误解。

### Q: 如何处理不同版本的 EIP-712 实现？
A: 使用域分隔符中的 `version` 字段区分版本，并在验证时检查版本兼容性。

### Q: 类型化数据签名可以跨链使用吗？
A: 可以，但需要在域分隔符中指定正确的 `chainId`，确保签名只在指定链上有效。

### Q: 如何优化大量类型化数据的签名性能？
A: 使用签名缓存、批量处理、并行签名等技术。对于重复的数据结构，可以预计算哈希值。

## 下一步

- [合约交互](/ethers/contracts/basics) - 学习智能合约交互
- [交易处理](/ethers/transactions/basics) - 掌握交易发送和处理
- [实战应用](/ethers/examples/defi) - 完整的 DeFi 应用示例
- [安全最佳实践](/best-practices/security) - 学习安全开发规范