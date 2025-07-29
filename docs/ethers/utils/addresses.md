---
title: 地址处理
description: Ethers.js 中以太坊地址处理的完整指南
keywords: [ethers.js, 地址处理, 地址验证, 校验和, ENS, 地址格式化, 以太坊地址]
---

# 地址处理

在以太坊开发中，正确处理地址是至关重要的。Ethers.js 提供了完整的地址处理工具，包括验证、格式化、校验和计算等功能。

## 基础概念

### 1. 以太坊地址格式

```typescript
// 以太坊地址的不同表示形式
const addresses = {
  // 原始十六进制格式（小写）
  lowercase: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',
  
  // 校验和格式（混合大小写）
  checksum: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
  
  // 全大写格式
  uppercase: '0X742D35CC6634C0532925A3B8D4C9DB96C4B4D8B',
  
  // 无效格式示例
  invalid: [
    '742d35cc6634c0532925a3b8d4c9db96c4b4d8b',    // 缺少 0x 前缀
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8',   // 长度不足
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8bg', // 包含非十六进制字符
  ]
};

console.log('地址格式示例:', addresses);
```

### 2. 校验和算法（EIP-55）

```typescript
import { ethers } from 'ethers';

// EIP-55 校验和算法实现原理
function explainChecksumAlgorithm() {
  const address = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b';
  
  // 1. 移除 0x 前缀并转为小写
  const cleanAddress = address.slice(2).toLowerCase();
  console.log('清理后地址:', cleanAddress);
  
  // 2. 计算 keccak256 哈希
  const hash = ethers.keccak256(ethers.toUtf8Bytes(cleanAddress));
  console.log('地址哈希:', hash);
  
  // 3. 根据哈希值确定大小写
  let checksumAddress = '0x';
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress[i];
    const hashChar = hash[2 + i]; // 跳过 0x 前缀
    
    if (parseInt(hashChar, 16) >= 8) {
      checksumAddress += char.toUpperCase();
    } else {
      checksumAddress += char.toLowerCase();
    }
  }
  
  console.log('校验和地址:', checksumAddress);
  console.log('Ethers.js 结果:', ethers.getAddress(address));
  
  return checksumAddress;
}

explainChecksumAlgorithm();
```

## 基础地址操作

### 1. 地址验证

```typescript
import { ethers } from 'ethers';

// 基础地址验证
function validateAddresses() {
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',  // 有效
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',  // 有效（小写）
    '0X742D35CC6634C0532925A3B8D4C9DB96C4B4D8B',  // 有效（大写）
    '742d35cc6634c0532925a3b8d4c9db96c4b4d8b',    // 无效（无前缀）
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8',   // 无效（长度不足）
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8bg', // 无效（非十六进制）
    '0x0000000000000000000000000000000000000000', // 零地址（有效但特殊）
  ];

  testAddresses.forEach(address => {
    const isValid = ethers.isAddress(address);
    console.log(`地址: ${address}`);
    console.log(`有效性: ${isValid}`);
    
    if (isValid) {
      try {
        const checksummed = ethers.getAddress(address);
        console.log(`校验和格式: ${checksummed}`);
        console.log(`是否为零地址: ${checksummed === ethers.ZeroAddress}`);
      } catch (error) {
        console.log(`格式化失败: ${error.message}`);
      }
    }
    console.log('---');
  });
}

validateAddresses();
```

### 2. 地址格式化和比较

```typescript
// 地址格式化工具类
class AddressFormatter {
  // 标准化地址格式
  static normalize(address: string): string {
    if (!ethers.isAddress(address)) {
      throw new Error(`无效地址: ${address}`);
    }
    return ethers.getAddress(address);
  }

  // 地址比较（忽略大小写）
  static isEqual(addr1: string, addr2: string): boolean {
    try {
      return ethers.getAddress(addr1) === ethers.getAddress(addr2);
    } catch {
      return false;
    }
  }

  // 批量格式化
  static normalizeMultiple(addresses: string[]): {
    valid: string[];
    invalid: string[];
    normalized: string[];
  } {
    const result = {
      valid: [] as string[],
      invalid: [] as string[],
      normalized: [] as string[]
    };

    addresses.forEach(addr => {
      if (ethers.isAddress(addr)) {
        result.valid.push(addr);
        result.normalized.push(ethers.getAddress(addr));
      } else {
        result.invalid.push(addr);
      }
    });

    return result;
  }

  // 地址缩写显示
  static truncate(
    address: string, 
    options: {
      start?: number;
      end?: number;
      separator?: string;
    } = {}
  ): string {
    if (!ethers.isAddress(address)) {
      throw new Error(`无效地址: ${address}`);
    }

    const normalized = ethers.getAddress(address);
    const { start = 6, end = 4, separator = '...' } = options;
    
    if (start + end >= normalized.length - 2) {
      return normalized;
    }

    return `${normalized.slice(0, start)}${separator}${normalized.slice(-end)}`;
  }
}

// 使用示例
const addresses = [
  '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',
  '0X742D35CC6634C0532925A3B8D4C9DB96C4B4D8B',
  'invalid-address'
];

const result = AddressFormatter.normalizeMultiple(addresses);
console.log('批量处理结果:', result);

const addr1 = '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b';
const addr2 = '0X742D35CC6634C0532925A3B8D4C9DB96C4B4D8B';
console.log('地址相等:', AddressFormatter.isEqual(addr1, addr2));

const truncated = AddressFormatter.truncate(addr1);
console.log('缩写显示:', truncated);
```

## 高级地址处理

### 1. 地址类型检测

```typescript
// 地址类型检测器
class AddressTypeDetector {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 检测是否为合约地址
  async isContract(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  }

  // 检测是否为 EOA（外部拥有账户）
  async isEOA(address: string): Promise<boolean> {
    return !(await this.isContract(address));
  }

  // 获取地址详细信息
  async getAddressInfo(address: string): Promise<{
    address: string;
    isValid: boolean;
    isContract: boolean;
    balance: string;
    nonce: number;
    codeSize: number;
  }> {
    if (!ethers.isAddress(address)) {
      throw new Error(`无效地址: ${address}`);
    }

    const normalizedAddress = ethers.getAddress(address);
    const [balance, nonce, code] = await Promise.all([
      this.provider.getBalance(normalizedAddress),
      this.provider.getTransactionCount(normalizedAddress),
      this.provider.getCode(normalizedAddress)
    ]);

    return {
      address: normalizedAddress,
      isValid: true,
      isContract: code !== '0x',
      balance: ethers.formatEther(balance),
      nonce,
      codeSize: code.length > 2 ? (code.length - 2) / 2 : 0
    };
  }

  // 批量检测地址类型
  async batchDetectType(addresses: string[]): Promise<Array<{
    address: string;
    isValid: boolean;
    isContract?: boolean;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      addresses.map(async (addr) => {
        if (!ethers.isAddress(addr)) {
          return {
            address: addr,
            isValid: false,
            error: '无效地址格式'
          };
        }

        const normalizedAddr = ethers.getAddress(addr);
        const isContract = await this.isContract(normalizedAddr);
        
        return {
          address: normalizedAddr,
          isValid: true,
          isContract
        };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          address: addresses[index],
          isValid: false,
          error: result.reason.message
        };
      }
    });
  }
}

// 使用示例
async function demonstrateAddressDetection() {
  const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  const detector = new AddressTypeDetector(provider);

  // 测试地址
  const testAddresses = [
    '0xA0b86a33E6417aAb8C6B2C4b4b4b4b4b4b4b4b4b', // EOA
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH 合约
    '0x0000000000000000000000000000000000000000', // 零地址
  ];

  for (const address of testAddresses) {
    try {
      const info = await detector.getAddressInfo(address);
      console.log(`地址信息 ${address}:`, info);
    } catch (error) {
      console.log(`检测失败 ${address}:`, error.message);
    }
  }

  // 批量检测
  const batchResults = await detector.batchDetectType(testAddresses);
  console.log('批量检测结果:', batchResults);
}
```

### 2. ENS 集成

```typescript
// ENS 地址解析器
class ENSAddressResolver {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  // 解析 ENS 域名到地址
  async resolveENS(ensName: string): Promise<string | null> {
    try {
      return await this.provider.resolveName(ensName);
    } catch {
      return null;
    }
  }

  // 反向解析地址到 ENS 域名
  async reverseResolve(address: string): Promise<string | null> {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('无效地址');
      }
      return await this.provider.lookupAddress(address);
    } catch {
      return null;
    }
  }

  // 检测是否为 ENS 域名
  isENSName(name: string): boolean {
    return name.includes('.') && !ethers.isAddress(name);
  }

  // 智能地址解析（支持地址和 ENS）
  async smartResolve(input: string): Promise<{
    input: string;
    type: 'address' | 'ens' | 'invalid';
    resolved?: string;
    ensName?: string;
  }> {
    // 如果是有效地址
    if (ethers.isAddress(input)) {
      const ensName = await this.reverseResolve(input);
      return {
        input,
        type: 'address',
        resolved: ethers.getAddress(input),
        ensName: ensName || undefined
      };
    }

    // 如果可能是 ENS 域名
    if (this.isENSName(input)) {
      const resolved = await this.resolveENS(input);
      if (resolved) {
        return {
          input,
          type: 'ens',
          resolved: ethers.getAddress(resolved)
        };
      }
    }

    return {
      input,
      type: 'invalid'
    };
  }

  // 批量智能解析
  async batchSmartResolve(inputs: string[]): Promise<Array<{
    input: string;
    type: 'address' | 'ens' | 'invalid';
    resolved?: string;
    ensName?: string;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      inputs.map(input => this.smartResolve(input))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          input: inputs[index],
          type: 'invalid' as const,
          error: result.reason.message
        };
      }
    });
  }
}

// 使用示例
async function demonstrateENSResolution() {
  const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  const resolver = new ENSAddressResolver(provider);

  const testInputs = [
    'vitalik.eth',
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    'invalid.domain',
    'not-an-address'
  ];

  const results = await resolver.batchSmartResolve(testInputs);
  results.forEach(result => {
    console.log(`输入: ${result.input}`);
    console.log(`类型: ${result.type}`);
    if (result.resolved) {
      console.log(`解析地址: ${result.resolved}`);
    }
    if (result.ensName) {
      console.log(`ENS 域名: ${result.ensName}`);
    }
    if (result.error) {
      console.log(`错误: ${result.error}`);
    }
    console.log('---');
  });
}
```

## 地址生成和派生

### 1. 地址生成

```typescript
// 地址生成工具
class AddressGenerator {
  // 从私钥生成地址
  static fromPrivateKey(privateKey: string): string {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }

  // 从助记词生成地址
  static fromMnemonic(mnemonic: string, index: number = 0): {
    address: string;
    privateKey: string;
    path: string;
  } {
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = ethers.Wallet.fromPhrase(mnemonic, undefined, path);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      path
    };
  }

  // 生成随机地址
  static random(): {
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  // 计算合约地址（CREATE）
  static computeContractAddress(deployerAddress: string, nonce: number): string {
    return ethers.getCreateAddress({
      from: deployerAddress,
      nonce
    });
  }

  // 计算合约地址（CREATE2）
  static computeCreate2Address(
    deployerAddress: string,
    salt: string,
    bytecodeHash: string
  ): string {
    return ethers.getCreate2Address(deployerAddress, salt, bytecodeHash);
  }

  // 批量生成地址
  static generateBatch(count: number): Array<{
    index: number;
    address: string;
    privateKey: string;
  }> {
    return Array.from({ length: count }, (_, index) => {
      const wallet = ethers.Wallet.createRandom();
      return {
        index,
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    });
  }
}

// 使用示例
function demonstrateAddressGeneration() {
  console.log('=== 地址生成示例 ===');

  // 随机生成
  const randomWallet = AddressGenerator.random();
  console.log('随机钱包:', randomWallet);

  // 从助记词生成
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const derived = AddressGenerator.fromMnemonic(mnemonic, 0);
  console.log('派生地址:', derived);

  // 合约地址计算
  const deployerAddr = '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b';
  const contractAddr = AddressGenerator.computeContractAddress(deployerAddr, 0);
  console.log('合约地址:', contractAddr);

  // 批量生成
  const batch = AddressGenerator.generateBatch(3);
  console.log('批量生成:', batch);
}

demonstrateAddressGeneration();
```

### 2. 地址验证器

```typescript
// 高级地址验证器
class AdvancedAddressValidator {
  private static readonly ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  private static readonly BURN_ADDRESSES = new Set([
    '0x000000000000000000000000000000000000dEaD',
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000000'
  ]);

  // 基础验证
  static isValid(address: string): boolean {
    return ethers.isAddress(address);
  }

  // 检查是否为零地址
  static isZeroAddress(address: string): boolean {
    if (!this.isValid(address)) return false;
    return ethers.getAddress(address) === this.ZERO_ADDRESS;
  }

  // 检查是否为销毁地址
  static isBurnAddress(address: string): boolean {
    if (!this.isValid(address)) return false;
    return this.BURN_ADDRESSES.has(ethers.getAddress(address));
  }

  // 检查校验和是否正确
  static hasValidChecksum(address: string): boolean {
    if (!this.isValid(address)) return false;
    
    try {
      const normalized = ethers.getAddress(address);
      return address === normalized;
    } catch {
      return false;
    }
  }

  // 综合验证
  static validate(address: string): {
    isValid: boolean;
    isChecksum: boolean;
    isZero: boolean;
    isBurn: boolean;
    normalized?: string;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!address) {
      errors.push('地址不能为空');
      return {
        isValid: false,
        isChecksum: false,
        isZero: false,
        isBurn: false,
        errors
      };
    }

    const isValid = this.isValid(address);
    if (!isValid) {
      errors.push('无效的地址格式');
      return {
        isValid: false,
        isChecksum: false,
        isZero: false,
        isBurn: false,
        errors
      };
    }

    const normalized = ethers.getAddress(address);
    const isChecksum = this.hasValidChecksum(address);
    const isZero = this.isZeroAddress(address);
    const isBurn = this.isBurnAddress(address);

    if (!isChecksum) {
      errors.push('校验和格式不正确');
    }
    if (isZero) {
      errors.push('不能使用零地址');
    }
    if (isBurn) {
      errors.push('不能使用销毁地址');
    }

    return {
      isValid: true,
      isChecksum,
      isZero,
      isBurn,
      normalized,
      errors
    };
  }

  // 批量验证
  static validateBatch(addresses: string[]): Array<{
    address: string;
    validation: ReturnType<typeof AdvancedAddressValidator.validate>;
  }> {
    return addresses.map(address => ({
      address,
      validation: this.validate(address)
    }));
  }
}

// 使用示例
function demonstrateAdvancedValidation() {
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',  // 有效校验和
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',  // 有效但无校验和
    '0x0000000000000000000000000000000000000000', // 零地址
    '0x000000000000000000000000000000000000dEaD', // 销毁地址
    'invalid-address'                               // 无效地址
  ];

  const results = AdvancedAddressValidator.validateBatch(testAddresses);
  
  results.forEach(({ address, validation }) => {
    console.log(`地址: ${address}`);
    console.log(`验证结果:`, validation);
    console.log('---');
  });
}

demonstrateAdvancedValidation();
```

## 实用工具函数

### 1. 地址工具集

```typescript
// 地址工具集合
class AddressUtils {
  // 地址排序
  static sort(addresses: string[]): string[] {
    return addresses
      .filter(addr => ethers.isAddress(addr))
      .map(addr => ethers.getAddress(addr))
      .sort();
  }

  // 地址去重
  static unique(addresses: string[]): string[] {
    const normalized = addresses
      .filter(addr => ethers.isAddress(addr))
      .map(addr => ethers.getAddress(addr));
    
    return [...new Set(normalized)];
  }

  // 地址分组
  static groupByPrefix(addresses: string[], prefixLength: number = 4): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    addresses.forEach(addr => {
      if (ethers.isAddress(addr)) {
        const normalized = ethers.getAddress(addr);
        const prefix = normalized.slice(0, prefixLength);
        
        if (!groups[prefix]) {
          groups[prefix] = [];
        }
        groups[prefix].push(normalized);
      }
    });
    
    return groups;
  }

  // 查找相似地址
  static findSimilar(target: string, candidates: string[], threshold: number = 6): string[] {
    if (!ethers.isAddress(target)) {
      throw new Error('目标地址无效');
    }

    const normalizedTarget = ethers.getAddress(target).toLowerCase();
    
    return candidates
      .filter(addr => ethers.isAddress(addr))
      .map(addr => ethers.getAddress(addr))
      .filter(addr => {
        const normalized = addr.toLowerCase();
        let matches = 0;
        
        for (let i = 0; i < Math.min(normalizedTarget.length, normalized.length); i++) {
          if (normalizedTarget[i] === normalized[i]) {
            matches++;
          }
        }
        
        return matches >= threshold;
      });
  }

  // 生成地址二维码数据
  static generateQRData(address: string, amount?: string, message?: string): string {
    if (!ethers.isAddress(address)) {
      throw new Error('无效地址');
    }

    const normalized = ethers.getAddress(address);
    let qrData = `ethereum:${normalized}`;
    
    const params: string[] = [];
    if (amount) {
      params.push(`value=${ethers.parseEther(amount).toString()}`);
    }
    if (message) {
      params.push(`message=${encodeURIComponent(message)}`);
    }
    
    if (params.length > 0) {
      qrData += `?${params.join('&')}`;
    }
    
    return qrData;
  }
}

// 使用示例
function demonstrateAddressUtils() {
  const addresses = [
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',
    '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b', // 重复
    '0xA0b86a33E6417aAb8C6B2C4b4b4b4b4b4b4b4b4b',
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8c', // 相似
  ];

  console.log('原始地址:', addresses);
  console.log('去重后:', AddressUtils.unique(addresses));
  console.log('排序后:', AddressUtils.sort(addresses));
  
  const grouped = AddressUtils.groupByPrefix(addresses, 6);
  console.log('按前缀分组:', grouped);
  
  const similar = AddressUtils.findSimilar(addresses[0], addresses, 38);
  console.log('相似地址:', similar);
  
  const qrData = AddressUtils.generateQRData(addresses[0], '1.5', 'Payment for services');
  console.log('二维码数据:', qrData);
}

demonstrateAddressUtils();
```

## 最佳实践

### 1. 地址处理最佳实践

```typescript
// 地址处理最佳实践指南
class AddressBestPractices {
  // 安全的地址验证
  static safeValidate(address: unknown): address is string {
    return typeof address === 'string' && ethers.isAddress(address);
  }

  // 安全的地址格式化
  static safeFormat(address: unknown): string | null {
    if (!this.safeValidate(address)) {
      return null;
    }
    
    try {
      return ethers.getAddress(address);
    } catch {
      return null;
    }
  }

  // 安全的地址比较
  static safeCompare(addr1: unknown, addr2: unknown): boolean {
    const formatted1 = this.safeFormat(addr1);
    const formatted2 = this.safeFormat(addr2);
    
    return formatted1 !== null && formatted2 !== null && formatted1 === formatted2;
  }

  // 地址白名单检查
  static checkWhitelist(address: string, whitelist: string[]): boolean {
    if (!this.safeValidate(address)) {
      return false;
    }

    const normalized = ethers.getAddress(address);
    return whitelist.some(whiteAddr => {
      try {
        return ethers.getAddress(whiteAddr) === normalized;
      } catch {
        return false;
      }
    });
  }

  // 地址黑名单检查
  static checkBlacklist(address: string, blacklist: string[]): boolean {
    return this.checkWhitelist(address, blacklist);
  }

  // 生成地址验证报告
  static generateValidationReport(addresses: string[]): {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    zeroAddresses: number;
    burnAddresses: number;
    details: Array<{
      address: string;
      status: 'valid' | 'invalid' | 'zero' | 'burn';
      normalized?: string;
    }>;
  } {
    const details: Array<{
      address: string;
      status: 'valid' | 'invalid' | 'zero' | 'burn';
      normalized?: string;
    }> = [];

    const seen = new Set<string>();
    let duplicates = 0;

    addresses.forEach(addr => {
      if (!this.safeValidate(addr)) {
        details.push({ address: addr, status: 'invalid' });
        return;
      }

      const normalized = ethers.getAddress(addr);
      
      if (seen.has(normalized)) {
        duplicates++;
      } else {
        seen.add(normalized);
      }

      if (AdvancedAddressValidator.isZeroAddress(addr)) {
        details.push({ address: addr, status: 'zero', normalized });
      } else if (AdvancedAddressValidator.isBurnAddress(addr)) {
        details.push({ address: addr, status: 'burn', normalized });
      } else {
        details.push({ address: addr, status: 'valid', normalized });
      }
    });

    const valid = details.filter(d => d.status === 'valid').length;
    const invalid = details.filter(d => d.status === 'invalid').length;
    const zeroAddresses = details.filter(d => d.status === 'zero').length;
    const burnAddresses = details.filter(d => d.status === 'burn').length;

    return {
      total: addresses.length,
      valid,
      invalid,
      duplicates,
      zeroAddresses,
      burnAddresses,
      details
    };
  }
}

// 使用示例
function demonstrateBestPractices() {
  const testAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b', // 重复
    '0x0000000000000000000000000000000000000000', // 零地址
    '0x000000000000000000000000000000000000dEaD', // 销毁地址
    'invalid-address',
    null as any,
    undefined as any
  ];

  const report = AddressBestPractices.generateValidationReport(testAddresses);
  console.log('地址验证报告:', report);

  // 白名单检查
  const whitelist = ['0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b'];
  const isWhitelisted = AddressBestPractices.checkWhitelist(
    '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b',
    whitelist
  );
  console.log('白名单检查:', isWhitelisted);
}

demonstrateBestPractices();
```

## 常见问题

### Q: 如何处理大小写不同的相同地址？
A: 使用 `ethers.getAddress()` 将地址标准化为校验和格式，然后进行比较。

### Q: 什么是地址校验和，为什么重要？
A: 校验和是 EIP-55 标准，通过混合大小写来检测地址输入错误，提高安全性。

### Q: 如何检测地址是合约还是 EOA？
A: 使用 `provider.getCode()` 检查地址是否有合约代码。

### Q: ENS 域名解析失败怎么办？
A: 检查网络连接、域名是否存在、是否设置了地址记录。

## 下一步

- [哈希函数](/ethers/utils/hashing) - 学习哈希计算
- [编码解码](/ethers/utils/encoding) - 掌握数据编码
- [合约交互](/ethers/contracts/basics) - 应用到合约开发
- [ENS 域名服务](/ethers/advanced/ens) - 深入 ENS 功能