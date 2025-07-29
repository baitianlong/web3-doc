---
title: 随机数生成
description: Ethers.js 中安全随机数生成的完整指南
keywords: [ethers.js, 随机数生成, 加密安全, 随机字节, 随机种子, 区块链随机性]
---

# 随机数生成

在区块链开发中，安全的随机数生成至关重要。Ethers.js 提供了多种随机数生成工具，用于创建私钥、生成随机种子、创建随机标识符等场景。

## 基础随机数生成

### 1. 随机字节生成

```typescript
import { randomBytes, hexlify } from 'ethers';

// 生成随机字节
const random16 = randomBytes(16);
console.log('16字节随机数:', hexlify(random16));

const random32 = randomBytes(32);
console.log('32字节随机数:', hexlify(random32));

// 生成不同长度的随机字节
const lengths = [8, 16, 20, 32, 64];
lengths.forEach(length => {
  const randomData = randomBytes(length);
  console.log(`${length}字节:`, hexlify(randomData));
});

// 用于私钥生成的32字节随机数
const privateKeyBytes = randomBytes(32);
console.log('私钥随机数:', hexlify(privateKeyBytes));
```

### 2. 随机数值生成

```typescript
import { randomBytes, toBigInt } from 'ethers';

class RandomNumberGenerator {
  // 生成指定范围内的随机整数
  static randomInt(min: number, max: number): number {
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    
    const range = max - min;
    const randomBytes32 = randomBytes(4);
    const randomValue = toBigInt(randomBytes32);
    
    return Number(randomValue % BigInt(range)) + min;
  }

  // 生成随机大整数
  static randomBigInt(bits: number): bigint {
    const bytes = Math.ceil(bits / 8);
    const randomData = randomBytes(bytes);
    return toBigInt(randomData);
  }

  // 生成随机浮点数 (0-1)
  static randomFloat(): number {
    const randomData = randomBytes(8);
    const randomBigInt = toBigInt(randomData);
    const maxValue = BigInt(2) ** BigInt(64) - BigInt(1);
    return Number(randomBigInt) / Number(maxValue);
  }

  // 生成指定精度的随机小数
  static randomDecimal(min: number, max: number, precision: number = 2): number {
    const randomFloat = this.randomFloat();
    const value = min + randomFloat * (max - min);
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  // 生成随机百分比
  static randomPercentage(): number {
    return this.randomDecimal(0, 100, 2);
  }
}

// 使用示例
console.log('随机整数 (1-100):', RandomNumberGenerator.randomInt(1, 100));
console.log('随机大整数 (256位):', RandomNumberGenerator.randomBigInt(256));
console.log('随机浮点数:', RandomNumberGenerator.randomFloat());
console.log('随机小数 (1.00-10.00):', RandomNumberGenerator.randomDecimal(1, 10, 2));
console.log('随机百分比:', RandomNumberGenerator.randomPercentage() + '%');
```

### 3. 随机字符串生成

```typescript
class RandomStringGenerator {
  private static readonly CHARSET_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  private static readonly CHARSET_HEX = '0123456789abcdef';
  private static readonly CHARSET_NUMERIC = '0123456789';
  private static readonly CHARSET_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  // 生成随机字符串
  static randomString(length: number, charset?: string): string {
    const chars = charset || this.CHARSET_ALPHANUMERIC;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = RandomNumberGenerator.randomInt(0, chars.length);
      result += chars[randomIndex];
    }
    
    return result;
  }

  // 生成随机十六进制字符串
  static randomHex(length: number): string {
    return this.randomString(length, this.CHARSET_HEX);
  }

  // 生成随机数字字符串
  static randomNumeric(length: number): string {
    return this.randomString(length, this.CHARSET_NUMERIC);
  }

  // 生成随机字母字符串
  static randomAlpha(length: number): string {
    return this.randomString(length, this.CHARSET_ALPHA);
  }

  // 生成随机ID
  static randomId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = this.randomString(8);
    return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
  }

  // 生成UUID风格的随机字符串
  static randomUUID(): string {
    const hex = this.randomHex(32);
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  // 生成随机密码
  static randomPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // 确保包含每种类型的字符
    password += lowercase[RandomNumberGenerator.randomInt(0, lowercase.length)];
    password += uppercase[RandomNumberGenerator.randomInt(0, uppercase.length)];
    password += numbers[RandomNumberGenerator.randomInt(0, numbers.length)];
    password += symbols[RandomNumberGenerator.randomInt(0, symbols.length)];
    
    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      password += allChars[RandomNumberGenerator.randomInt(0, allChars.length)];
    }
    
    // 打乱字符顺序
    return this.shuffleString(password);
  }

  // 打乱字符串
  private static shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = RandomNumberGenerator.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
}

// 使用示例
console.log('随机字符串:', RandomStringGenerator.randomString(16));
console.log('随机十六进制:', RandomStringGenerator.randomHex(32));
console.log('随机ID:', RandomStringGenerator.randomId('user'));
console.log('随机UUID:', RandomStringGenerator.randomUUID());
console.log('随机密码:', RandomStringGenerator.randomPassword(16));
```

## 加密安全随机数

### 1. 安全随机数生成器

```typescript
class SecureRandomGenerator {
  // 生成加密安全的随机种子
  static generateSeed(length: number = 32): string {
    const randomData = randomBytes(length);
    return hexlify(randomData);
  }

  // 生成随机盐值
  static generateSalt(length: number = 16): string {
    return this.generateSeed(length);
  }

  // 生成随机nonce
  static generateNonce(): string {
    const timestamp = Date.now();
    const randomPart = randomBytes(8);
    return hexlify(randomPart) + timestamp.toString(16);
  }

  // 生成随机会话ID
  static generateSessionId(): string {
    const sessionData = randomBytes(24);
    return hexlify(sessionData);
  }

  // 生成随机API密钥
  static generateApiKey(length: number = 32): string {
    const keyData = randomBytes(length);
    return hexlify(keyData);
  }

  // 生成随机JWT密钥
  static generateJWTSecret(length: number = 64): string {
    return RandomStringGenerator.randomString(length);
  }

  // 验证随机数质量
  static validateRandomness(data: Uint8Array): {
    entropy: number;
    isSecure: boolean;
    analysis: any;
  } {
    const analysis = this.analyzeRandomness(data);
    const entropy = this.calculateEntropy(data);
    const isSecure = entropy > 7.5 && analysis.uniformity > 0.9;

    return {
      entropy,
      isSecure,
      analysis
    };
  }

  private static analyzeRandomness(data: Uint8Array): any {
    const frequency = new Array(256).fill(0);
    
    // 计算字节频率
    for (const byte of data) {
      frequency[byte]++;
    }

    // 计算均匀性
    const expected = data.length / 256;
    const chiSquare = frequency.reduce((sum, count) => {
      const diff = count - expected;
      return sum + (diff * diff) / expected;
    }, 0);

    const uniformity = 1 - (chiSquare / (255 * data.length));

    return {
      uniformity: Math.max(0, uniformity),
      chiSquare,
      frequency
    };
  }

  private static calculateEntropy(data: Uint8Array): number {
    const frequency = new Array(256).fill(0);
    
    for (const byte of data) {
      frequency[byte]++;
    }

    let entropy = 0;
    for (const count of frequency) {
      if (count > 0) {
        const probability = count / data.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }
}

// 使用示例
console.log('安全种子:', SecureRandomGenerator.generateSeed());
console.log('随机盐值:', SecureRandomGenerator.generateSalt());
console.log('随机nonce:', SecureRandomGenerator.generateNonce());
console.log('API密钥:', SecureRandomGenerator.generateApiKey());

// 验证随机数质量
const testData = randomBytes(1000);
const validation = SecureRandomGenerator.validateRandomness(testData);
console.log('随机数质量分析:', validation);
```

### 2. 钱包和密钥生成

```typescript
import { Wallet, HDNodeWallet } from 'ethers';

class WalletGenerator {
  // 生成随机钱包
  static generateRandomWallet(): {
    wallet: Wallet;
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const wallet = Wallet.createRandom();
    
    return {
      wallet,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  // 批量生成钱包
  static generateWalletBatch(count: number): Array<{
    index: number;
    address: string;
    privateKey: string;
  }> {
    return Array.from({ length: count }, (_, index) => {
      const wallet = Wallet.createRandom();
      return {
        index,
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    });
  }

  // 从自定义熵生成钱包
  static generateWalletFromEntropy(entropy?: Uint8Array): {
    wallet: Wallet;
    address: string;
    privateKey: string;
    mnemonic: string;
  } {
    const customEntropy = entropy || randomBytes(32);
    const wallet = Wallet.createRandom({ extraEntropy: customEntropy });
    
    return {
      wallet,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  // 生成HD钱包
  static generateHDWallet(count: number = 5): {
    masterWallet: HDNodeWallet;
    derivedWallets: Array<{
      index: number;
      path: string;
      address: string;
      privateKey: string;
    }>;
  } {
    const masterWallet = Wallet.createRandom();
    const hdWallet = HDNodeWallet.fromPhrase(masterWallet.mnemonic!.phrase);
    
    const derivedWallets = Array.from({ length: count }, (_, index) => {
      const path = `m/44'/60'/0'/0/${index}`;
      const derived = hdWallet.derivePath(path);
      
      return {
        index,
        path,
        address: derived.address,
        privateKey: derived.privateKey
      };
    });

    return {
      masterWallet: hdWallet,
      derivedWallets
    };
  }

  // 生成多签钱包地址
  static generateMultisigWallets(signerCount: number): {
    signers: Array<{
      index: number;
      address: string;
      privateKey: string;
    }>;
    addresses: string[];
  } {
    const signers = this.generateWalletBatch(signerCount);
    const addresses = signers.map(signer => signer.address);
    
    return {
      signers,
      addresses
    };
  }
}

// 使用示例
console.log('=== 钱包生成示例 ===');

// 生成单个随机钱包
const randomWallet = WalletGenerator.generateRandomWallet();
console.log('随机钱包:', {
  address: randomWallet.address,
  mnemonic: randomWallet.mnemonic
});

// 批量生成钱包
const walletBatch = WalletGenerator.generateWalletBatch(3);
console.log('批量钱包:', walletBatch);

// 生成HD钱包
const hdWallet = WalletGenerator.generateHDWallet(5);
console.log('HD钱包:', hdWallet.derivedWallets);
```

## 随机数组和选择

### 1. 数组随机操作

```typescript
class RandomArrayOperations {
  // 随机选择数组元素
  static randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Array is empty');
    }
    const randomIndex = RandomNumberGenerator.randomInt(0, array.length);
    return array[randomIndex];
  }

  // 随机选择多个元素
  static randomChoices<T>(array: T[], count: number, allowDuplicates: boolean = false): T[] {
    if (count <= 0) return [];
    if (!allowDuplicates && count > array.length) {
      throw new Error('Count exceeds array length when duplicates not allowed');
    }

    const result: T[] = [];
    const availableItems = [...array];

    for (let i = 0; i < count; i++) {
      const randomIndex = RandomNumberGenerator.randomInt(0, availableItems.length);
      const selectedItem = availableItems[randomIndex];
      result.push(selectedItem);

      if (!allowDuplicates) {
        availableItems.splice(randomIndex, 1);
      }
    }

    return result;
  }

  // 打乱数组
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = RandomNumberGenerator.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  // 生成随机数组
  static generateRandomArray(length: number, min: number, max: number): number[] {
    return Array.from({ length }, () => 
      RandomNumberGenerator.randomInt(min, max)
    );
  }

  // 生成随机权重选择
  static weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const randomValue = RandomNumberGenerator.randomFloat() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < items.length; i++) {
      currentWeight += weights[i];
      if (randomValue <= currentWeight) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  // 生成随机分组
  static randomGroups<T>(array: T[], groupCount: number): T[][] {
    const shuffled = this.shuffle(array);
    const groups: T[][] = Array.from({ length: groupCount }, () => []);
    
    shuffled.forEach((item, index) => {
      const groupIndex = index % groupCount;
      groups[groupIndex].push(item);
    });
    
    return groups;
  }
}

// 使用示例
const testArray = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
console.log('原数组:', testArray);
console.log('随机选择:', RandomArrayOperations.randomChoice(testArray));
console.log('随机选择3个:', RandomArrayOperations.randomChoices(testArray, 3));
console.log('打乱数组:', RandomArrayOperations.shuffle(testArray));

// 权重选择示例
const items = ['common', 'rare', 'epic', 'legendary'];
const weights = [50, 30, 15, 5];
console.log('权重选择:', RandomArrayOperations.weightedChoice(items, weights));

// 随机分组
const groups = RandomArrayOperations.randomGroups(testArray, 2);
console.log('随机分组:', groups);
```

### 2. 随机数据生成器

```typescript
class RandomDataGenerator {
  // 生成随机用户数据
  static generateRandomUser(): {
    id: string;
    name: string;
    email: string;
    age: number;
    address: string;
  } {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    const firstName = RandomArrayOperations.randomChoice(firstNames);
    const lastName = RandomArrayOperations.randomChoice(lastNames);
    const domain = RandomArrayOperations.randomChoice(domains);
    
    return {
      id: RandomStringGenerator.randomId('user'),
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      age: RandomNumberGenerator.randomInt(18, 80),
      address: `0x${RandomStringGenerator.randomHex(40)}`
    };
  }

  // 生成随机交易数据
  static generateRandomTransaction(): {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gasLimit: number;
    nonce: number;
    timestamp: number;
  } {
    return {
      hash: `0x${RandomStringGenerator.randomHex(64)}`,
      from: `0x${RandomStringGenerator.randomHex(40)}`,
      to: `0x${RandomStringGenerator.randomHex(40)}`,
      value: RandomNumberGenerator.randomDecimal(0.001, 10, 6).toString(),
      gasPrice: RandomNumberGenerator.randomInt(20, 100).toString(),
      gasLimit: RandomNumberGenerator.randomInt(21000, 500000),
      nonce: RandomNumberGenerator.randomInt(0, 1000),
      timestamp: Date.now() - RandomNumberGenerator.randomInt(0, 86400000) // 最近24小时
    };
  }

  // 生成随机代币数据
  static generateRandomToken(): {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    price: number;
  } {
    const tokenNames = ['Bitcoin', 'Ethereum', 'Chainlink', 'Uniswap', 'Polygon', 'Solana'];
    const symbols = ['BTC', 'ETH', 'LINK', 'UNI', 'MATIC', 'SOL'];
    
    const index = RandomNumberGenerator.randomInt(0, tokenNames.length);
    
    return {
      address: `0x${RandomStringGenerator.randomHex(40)}`,
      name: tokenNames[index],
      symbol: symbols[index],
      decimals: RandomArrayOperations.randomChoice([6, 8, 18]),
      totalSupply: RandomNumberGenerator.randomBigInt(64).toString(),
      price: RandomNumberGenerator.randomDecimal(0.01, 1000, 4)
    };
  }

  // 生成随机NFT数据
  static generateRandomNFT(): {
    tokenId: string;
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
    rarity: string;
  } {
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const rarityWeights = [40, 30, 20, 8, 2];
    
    const attributes = [
      { trait_type: 'Background', value: RandomArrayOperations.randomChoice(['Blue', 'Red', 'Green', 'Purple', 'Gold']) },
      { trait_type: 'Eyes', value: RandomArrayOperations.randomChoice(['Normal', 'Laser', 'Glowing', 'Closed']) },
      { trait_type: 'Mouth', value: RandomArrayOperations.randomChoice(['Smile', 'Frown', 'Open', 'Surprised']) },
      { trait_type: 'Level', value: RandomNumberGenerator.randomInt(1, 100) }
    ];
    
    return {
      tokenId: RandomNumberGenerator.randomBigInt(32).toString(),
      name: `Random NFT #${RandomNumberGenerator.randomInt(1, 10000)}`,
      description: 'A randomly generated NFT for testing purposes',
      image: `https://example.com/nft/${RandomStringGenerator.randomHex(32)}.png`,
      attributes,
      rarity: RandomArrayOperations.weightedChoice(rarities, rarityWeights)
    };
  }

  // 批量生成测试数据
  static generateTestDataset(type: 'users' | 'transactions' | 'tokens' | 'nfts', count: number): any[] {
    const generators = {
      users: this.generateRandomUser,
      transactions: this.generateRandomTransaction,
      tokens: this.generateRandomToken,
      nfts: this.generateRandomNFT
    };
    
    const generator = generators[type];
    return Array.from({ length: count }, () => generator());
  }
}

// 使用示例
console.log('=== 随机数据生成示例 ===');

// 生成随机用户
const randomUser = RandomDataGenerator.generateRandomUser();
console.log('随机用户:', randomUser);

// 生成随机交易
const randomTx = RandomDataGenerator.generateRandomTransaction();
console.log('随机交易:', randomTx);

// 生成随机NFT
const randomNFT = RandomDataGenerator.generateRandomNFT();
console.log('随机NFT:', randomNFT);

// 批量生成测试数据
const testUsers = RandomDataGenerator.generateTestDataset('users', 5);
console.log('测试用户数据:', testUsers);
```

## 随机数种子和重现

### 1. 伪随机数生成器

```typescript
class SeededRandomGenerator {
  private seed: number;
  private state: number;

  constructor(seed?: number) {
    this.seed = seed || this.generateSeed();
    this.state = this.seed;
  }

  // 生成种子
  private generateSeed(): number {
    const randomData = randomBytes(4);
    return toBigInt(randomData) % BigInt(2147483647);
  }

  // 线性同余生成器
  private next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state;
  }

  // 生成0-1之间的随机数
  random(): number {
    return this.next() / 4294967296;
  }

  // 生成指定范围的整数
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  // 生成指定范围的浮点数
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  // 重置种子
  setSeed(seed: number): void {
    this.seed = seed;
    this.state = seed;
  }

  // 获取当前种子
  getSeed(): number {
    return this.seed;
  }

  // 获取当前状态
  getState(): number {
    return this.state;
  }

  // 保存状态
  saveState(): { seed: number; state: number } {
    return {
      seed: this.seed,
      state: this.state
    };
  }

  // 恢复状态
  restoreState(savedState: { seed: number; state: number }): void {
    this.seed = savedState.seed;
    this.state = savedState.state;
  }
}

// 使用示例
console.log('=== 种子随机数生成示例 ===');

// 使用固定种子
const seededRng1 = new SeededRandomGenerator(12345);
const seededRng2 = new SeededRandomGenerator(12345);

console.log('相同种子的随机数序列:');
for (let i = 0; i < 5; i++) {
  console.log(`RNG1: ${seededRng1.random()}, RNG2: ${seededRng2.random()}`);
}

// 保存和恢复状态
const rng = new SeededRandomGenerator(54321);
console.log('初始随机数:', rng.random());

const savedState = rng.saveState();
console.log('第二个随机数:', rng.random());
console.log('第三个随机数:', rng.random());

rng.restoreState(savedState);
console.log('恢复状态后的随机数:', rng.random()); // 应该等于第二个随机数
```

### 2. 可重现的随机测试

```typescript
class ReproducibleRandomTest {
  private rng: SeededRandomGenerator;
  private testResults: any[] = [];

  constructor(seed?: number) {
    this.rng = new SeededRandomGenerator(seed);
  }

  // 运行可重现的测试
  runTest(testName: string, testFunction: (rng: SeededRandomGenerator) => any): void {
    const initialState = this.rng.saveState();
    
    try {
      const result = testFunction(this.rng);
      this.testResults.push({
        name: testName,
        seed: this.rng.getSeed(),
        state: initialState,
        result,
        success: true,
        timestamp: Date.now()
      });
    } catch (error) {
      this.testResults.push({
        name: testName,
        seed: this.rng.getSeed(),
        state: initialState,
        error: error.message,
        success: false,
        timestamp: Date.now()
      });
    }
  }

  // 重现特定测试
  reproduceTest(testIndex: number): any {
    const test = this.testResults[testIndex];
    if (!test) {
      throw new Error('Test not found');
    }

    this.rng.restoreState(test.state);
    console.log(`重现测试: ${test.name}`);
    console.log(`使用种子: ${test.seed}`);
    
    return test;
  }

  // 获取测试报告
  getTestReport(): {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    results: any[];
  } {
    const successfulTests = this.testResults.filter(test => test.success).length;
    const failedTests = this.testResults.length - successfulTests;

    return {
      totalTests: this.testResults.length,
      successfulTests,
      failedTests,
      results: this.testResults
    };
  }

  // 生成测试数据
  generateTestData(count: number): any[] {
    return Array.from({ length: count }, () => ({
      id: this.rng.randomInt(1, 1000000),
      value: this.rng.randomFloat(0, 100),
      category: RandomArrayOperations.randomChoice(['A', 'B', 'C', 'D']),
      timestamp: Date.now() + this.rng.randomInt(-86400000, 86400000)
    }));
  }
}

// 使用示例
const testRunner = new ReproducibleRandomTest(98765);

// 运行测试
testRunner.runTest('数据生成测试', (rng) => {
  const data = Array.from({ length: 10 }, () => rng.random());
  return { generatedData: data, sum: data.reduce((a, b) => a + b, 0) };
});

testRunner.runTest('随机选择测试', (rng) => {
  const choices = ['option1', 'option2', 'option3'];
  const selected = Array.from({ length: 5 }, () => 
    choices[rng.randomInt(0, choices.length)]
  );
  return { selections: selected };
});

// 获取测试报告
const report = testRunner.getTestReport();
console.log('测试报告:', report);

// 重现第一个测试
const reproduced = testRunner.reproduceTest(0);
console.log('重现的测试:', reproduced);
```

## 性能优化和最佳实践

### 1. 随机数池

```typescript
class RandomPool {
  private pool: Uint8Array;
  private position: number = 0;
  private readonly poolSize: number;

  constructor(poolSize: number = 1024) {
    this.poolSize = poolSize;
    this.pool = randomBytes(poolSize);
  }

  // 获取随机字节
  getRandomBytes(length: number): Uint8Array {
    if (length > this.poolSize) {
      // 对于大请求，直接生成
      return randomBytes(length);
    }

    if (this.position + length > this.poolSize) {
      // 重新填充池
      this.refillPool();
    }

    const result = this.pool.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }

  // 重新填充池
  private refillPool(): void {
    this.pool = randomBytes(this.poolSize);
    this.position = 0;
  }

  // 获取池状态
  getPoolStatus(): { size: number; used: number; remaining: number } {
    return {
      size: this.poolSize,
      used: this.position,
      remaining: this.poolSize - this.position
    };
  }

  // 预热池
  warmUp(): void {
    this.refillPool();
  }
}

// 使用示例
const randomPool = new RandomPool(2048);

console.log('随机池状态:', randomPool.getPoolStatus());

// 批量获取随机数据
for (let i = 0; i < 10; i++) {
  const randomData = randomPool.getRandomBytes(32);
  console.log(`随机数据 ${i + 1}:`, hexlify(randomData));
}

console.log('使用后池状态:', randomPool.getPoolStatus());
```

### 2. 性能基准测试

```typescript
class RandomPerformanceBenchmark {
  // 基准测试随机数生成
  static benchmarkRandomGeneration(): {
    cryptoRandom: number;
    seededRandom: number;
    pooledRandom: number;
  } {
    const iterations = 10000;
    
    // 测试加密随机数
    const cryptoStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      randomBytes(32);
    }
    const cryptoTime = performance.now() - cryptoStart;

    // 测试种子随机数
    const seededRng = new SeededRandomGenerator(12345);
    const seededStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      seededRng.random();
    }
    const seededTime = performance.now() - seededStart;

    // 测试池化随机数
    const pool = new RandomPool(4096);
    const poolStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      pool.getRandomBytes(32);
    }
    const poolTime = performance.now() - poolStart;

    return {
      cryptoRandom: cryptoTime,
      seededRandom: seededTime,
      pooledRandom: poolTime
    };
  }

  // 测试随机数质量
  static testRandomQuality(generator: () => number, samples: number = 10000): {
    mean: number;
    variance: number;
    uniformity: number;
    passesTests: boolean;
  } {
    const values: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      values.push(generator());
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / samples;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples;
    
    // 简单的均匀性测试
    const bins = 10;
    const binCounts = new Array(bins).fill(0);
    
    values.forEach(val => {
      const binIndex = Math.floor(val * bins);
      if (binIndex >= 0 && binIndex < bins) {
        binCounts[binIndex]++;
      }
    });

    const expectedPerBin = samples / bins;
    const chiSquare = binCounts.reduce((sum, count) => {
      const diff = count - expectedPerBin;
      return sum + (diff * diff) / expectedPerBin;
    }, 0);

    const uniformity = 1 - (chiSquare / (bins * samples));
    const passesTests = Math.abs(mean - 0.5) < 0.01 && uniformity > 0.95;

    return {
      mean,
      variance,
      uniformity: Math.max(0, uniformity),
      passesTests
    };
  }
}

// 运行基准测试
console.log('=== 性能基准测试 ===');
const benchmark = RandomPerformanceBenchmark.benchmarkRandomGeneration();
console.log('性能测试结果 (毫秒):', benchmark);

// 测试随机数质量
const seededRng = new SeededRandomGenerator();
const qualityTest = RandomPerformanceBenchmark.testRandomQuality(
  () => seededRng.random(),
  10000
);
console.log('随机数质量测试:', qualityTest);
```

## 安全注意事项

### 1. 随机数安全检查

```typescript
class RandomSecurityChecker {
  // 检查随机数源的安全性
  static checkRandomSource(): {
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 检查是否在安全环境中
    if (typeof window !== 'undefined' && !window.crypto) {
      warnings.push('Web Crypto API 不可用');
      recommendations.push('使用现代浏览器或 Node.js 环境');
    }

    // 测试随机数质量
    const testSample = randomBytes(1000);
    const validation = SecureRandomGenerator.validateRandomness(testSample);
    
    if (!validation.isSecure) {
      warnings.push('随机数质量不足');
      recommendations.push('检查系统熵源');
    }

    const isSecure = warnings.length === 0;

    return {
      isSecure,
      warnings,
      recommendations
    };
  }

  // 安全随机数使用指南
  static getSecurityGuidelines(): string[] {
    return [
      '始终使用 randomBytes() 生成加密密钥',
      '不要使用 Math.random() 进行安全相关操作',
      '定期验证随机数质量',
      '在生产环境中使用硬件随机数生成器',
      '避免在客户端生成敏感密钥',
      '使用足够长度的随机数（至少256位用于密钥）',
      '不要重复使用随机数作为nonce',
      '定期更新随机种子'
    ];
  }

  // 检测弱随机数
  static detectWeakRandomness(data: Uint8Array): {
    isWeak: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 检查全零
    if (data.every(byte => byte === 0)) {
      issues.push('数据全为零');
    }

    // 检查重复模式
    if (this.hasRepeatingPattern(data)) {
      issues.push('存在重复模式');
    }

    // 检查熵不足
    const entropy = SecureRandomGenerator['calculateEntropy'](data);
    if (entropy < 6) {
      issues.push('熵值过低');
    }

    return {
      isWeak: issues.length > 0,
      issues
    };
  }

  private static hasRepeatingPattern(data: Uint8Array): boolean {
    // 简单的重复模式检测
    for (let patternLength = 1; patternLength <= Math.min(16, data.length / 4); patternLength++) {
      let repeats = 0;
      for (let i = 0; i < data.length - patternLength; i += patternLength) {
        const pattern = data.slice(i, i + patternLength);
        const nextPattern = data.slice(i + patternLength, i + 2 * patternLength);
        
        if (pattern.every((byte, index) => byte === nextPattern[index])) {
          repeats++;
        }
      }
      
      if (repeats > data.length / (patternLength * 4)) {
        return true;
      }
    }
    
    return false;
  }
}

// 安全检查示例
console.log('=== 随机数安全检查 ===');

const securityCheck = RandomSecurityChecker.checkRandomSource();
console.log('安全检查结果:', securityCheck);

const guidelines = RandomSecurityChecker.getSecurityGuidelines();
console.log('安全使用指南:', guidelines);

// 检测弱随机数
const weakData = new Uint8Array(100).fill(0); // 全零数据
const weaknessCheck = RandomSecurityChecker.detectWeakRandomness(weakData);
console.log('弱随机数检测:', weaknessCheck);

const strongData = randomBytes(100);
const strengthCheck = RandomSecurityChecker.detectWeakRandomness(strongData);
console.log('强随机数检测:', strengthCheck);
```

## 常见问题

### Q: 什么时候应该使用加密安全的随机数？
A: 在生成私钥、密码、会话令牌、nonce 等安全敏感场景时，必须使用 `randomBytes()` 等加密安全的随机数生成器。

### Q: 如何确保随机数的质量？
A: 使用 `SecureRandomGenerator.validateRandomness()` 检查熵值和均匀性，确保随机数通过统计测试。

### Q: 种子随机数和真随机数有什么区别？
A: 种子随机数是确定性的，相同种子产生相同序列，适合测试；真随机数是不可预测的，适合安全应用。

### Q: 如何在测试中使用可重现的随机数？
A: 使用 `SeededRandomGenerator` 类，通过固定种子确保测试结果的可重现性。

## 下一步

- [地址处理](/ethers/utils/addresses) - 学习地址生成和验证
- [哈希函数](/ethers/utils/hashing) - 掌握数据哈希计算
- [钱包管理](/ethers/signers/wallet) - 应用随机数到钱包创建
- [合约部署](/ethers/contracts/deployment) - 了解随机数在合约中的应用