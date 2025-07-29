---
title: 编码解码
description: Ethers.js 中数据编码解码的完整指南
keywords: [ethers.js, 编码解码, ABI编码, 十六进制, Base64, UTF-8, 字节数组]
---

# 编码解码

在区块链开发中，数据编码解码是核心功能之一。Ethers.js 提供了丰富的编码解码工具，支持各种数据格式转换，包括十六进制、UTF-8、Base64、ABI 编码等。

## 基础编码解码

### 1. 十六进制编码

```typescript
import { hexlify, arrayify, isHexString, zeroPadValue, stripZerosLeft } from 'ethers';

// 字节数组转十六进制
const bytes = new Uint8Array([1, 2, 3, 4, 5]);
const hex = hexlify(bytes);
console.log('十六进制:', hex); // 0x0102030405

// 十六进制转字节数组
const backToBytes = arrayify(hex);
console.log('字节数组:', backToBytes);

// 检查是否为有效十六进制
console.log('是否为十六进制:', isHexString('0x1234')); // true
console.log('是否为十六进制:', isHexString('1234'));   // false

// 数字转十六进制
const number = 255;
const numberHex = hexlify(number);
console.log('数字转十六进制:', numberHex); // 0xff

// 零填充
const padded = zeroPadValue('0x123', 32);
console.log('零填充:', padded);

// 移除前导零
const stripped = stripZerosLeft('0x000123');
console.log('移除前导零:', stripped); // 0x123
```

### 2. UTF-8 编码

```typescript
import { toUtf8Bytes, toUtf8String } from 'ethers';

// 字符串转 UTF-8 字节
const text = "Hello, 世界! 🌍";
const utf8Bytes = toUtf8Bytes(text);
console.log('UTF-8 字节:', utf8Bytes);
console.log('十六进制表示:', hexlify(utf8Bytes));

// UTF-8 字节转字符串
const backToText = toUtf8String(utf8Bytes);
console.log('还原文本:', backToText);

// 处理特殊字符
const emoji = "🚀💎🌙";
const emojiBytes = toUtf8Bytes(emoji);
console.log('表情符号编码:', hexlify(emojiBytes));

// 中文字符处理
const chinese = "以太坊智能合约";
const chineseBytes = toUtf8Bytes(chinese);
console.log('中文编码:', hexlify(chineseBytes));
```

### 3. Base64 编码

```typescript
import { encodeBase64, decodeBase64 } from 'ethers';

// Base64 编码
const data = "Hello World";
const dataBytes = toUtf8Bytes(data);
const base64 = encodeBase64(dataBytes);
console.log('Base64 编码:', base64);

// Base64 解码
const decodedBytes = decodeBase64(base64);
const decodedText = toUtf8String(decodedBytes);
console.log('Base64 解码:', decodedText);

// 二进制数据 Base64 编码
const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
const binaryBase64 = encodeBase64(binaryData);
console.log('二进制 Base64:', binaryBase64);
```

## ABI 编码解码

### 1. 基础 ABI 编码

```typescript
import { AbiCoder } from 'ethers';

const abiCoder = AbiCoder.defaultAbiCoder();

// 基础类型编码
const encoded = abiCoder.encode(
  ['uint256', 'string', 'bool', 'address'],
  [123, 'Hello', true, '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b']
);
console.log('ABI 编码:', encoded);

// 基础类型解码
const decoded = abiCoder.decode(
  ['uint256', 'string', 'bool', 'address'],
  encoded
);
console.log('ABI 解码:', decoded);

// 数组编码
const arrayEncoded = abiCoder.encode(
  ['uint256[]', 'string[]'],
  [[1, 2, 3], ['hello', 'world']]
);
console.log('数组编码:', arrayEncoded);

// 固定长度数组
const fixedArrayEncoded = abiCoder.encode(
  ['uint256[3]', 'bytes32'],
  [[1, 2, 3], '0x1234567890123456789012345678901234567890123456789012345678901234']
);
console.log('固定数组编码:', fixedArrayEncoded);
```

### 2. 复杂数据结构编码

```typescript
// 结构体编码
const structType = 'tuple(string name, uint256 age, address wallet)';
const structData = ['Alice', 25, '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b'];

const structEncoded = abiCoder.encode([structType], [structData]);
console.log('结构体编码:', structEncoded);

const structDecoded = abiCoder.decode([structType], structEncoded);
console.log('结构体解码:', structDecoded);

// 嵌套结构体
const nestedStructType = 'tuple(string name, tuple(uint256 x, uint256 y) position)';
const nestedStructData = ['Player1', [100, 200]];

const nestedEncoded = abiCoder.encode([nestedStructType], [nestedStructData]);
console.log('嵌套结构体编码:', nestedEncoded);

// 结构体数组
const structArrayType = 'tuple(string name, uint256 value)[]';
const structArrayData = [
  ['Item1', 100],
  ['Item2', 200],
  ['Item3', 300]
];

const structArrayEncoded = abiCoder.encode([structArrayType], [structArrayData]);
console.log('结构体数组编码:', structArrayEncoded);
```

### 3. 高级编码工具类

```typescript
class AdvancedEncoder {
  private abiCoder: AbiCoder;

  constructor() {
    this.abiCoder = AbiCoder.defaultAbiCoder();
  }

  // 编码函数调用数据
  encodeFunctionCall(signature: string, args: any[]): string {
    const functionSelector = keccak256(toUtf8Bytes(signature)).slice(0, 10);
    const types = this.extractTypesFromSignature(signature);
    const encodedArgs = this.abiCoder.encode(types, args);
    return functionSelector + encodedArgs.slice(2);
  }

  // 解码函数调用数据
  decodeFunctionCall(data: string, signature: string): any[] {
    const types = this.extractTypesFromSignature(signature);
    const argsData = '0x' + data.slice(10); // 移除函数选择器
    return this.abiCoder.decode(types, argsData);
  }

  // 编码事件日志数据
  encodeEventLog(signature: string, args: any[]): { topics: string[], data: string } {
    const eventHash = keccak256(toUtf8Bytes(signature));
    const types = this.extractTypesFromSignature(signature);
    
    // 简化示例：假设所有参数都在 data 中
    const encodedData = this.abiCoder.encode(types, args);
    
    return {
      topics: [eventHash],
      data: encodedData
    };
  }

  // 批量编码
  encodeBatch(types: string[], values: any[][]): string[] {
    return values.map(valueSet => this.abiCoder.encode(types, valueSet));
  }

  // 验证编码数据
  validateEncoding(types: string[], values: any[]): boolean {
    try {
      const encoded = this.abiCoder.encode(types, values);
      const decoded = this.abiCoder.decode(types, encoded);
      
      // 简单比较（实际应用中需要更复杂的比较逻辑）
      return JSON.stringify(values) === JSON.stringify(decoded.map(v => v.toString()));
    } catch (error) {
      return false;
    }
  }

  private extractTypesFromSignature(signature: string): string[] {
    const match = signature.match(/\((.*)\)/);
    if (!match) return [];
    
    const params = match[1];
    if (!params) return [];
    
    return params.split(',').map(param => param.trim());
  }
}

// 使用示例
const encoder = new AdvancedEncoder();

// 编码函数调用
const transferCall = encoder.encodeFunctionCall(
  'transfer(address,uint256)',
  ['0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b', parseEther('100')]
);
console.log('Transfer 调用编码:', transferCall);

// 批量编码
const batchEncoded = encoder.encodeBatch(
  ['address', 'uint256'],
  [
    ['0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b', 100],
    ['0xA0b86a33E6417aAb8C6B2C4b4b4b4b4b4b4b4b4b', 200]
  ]
);
console.log('批量编码结果:', batchEncoded);
```

## 数据格式转换

### 1. 数值编码

```typescript
import { toBeHex, toBigInt, formatUnits, parseUnits } from 'ethers';

class NumberEncoder {
  // 数字转十六进制
  static numberToHex(num: number | bigint, width?: number): string {
    return toBeHex(num, width);
  }

  // 十六进制转数字
  static hexToNumber(hex: string): bigint {
    return toBigInt(hex);
  }

  // 大数值处理
  static encodeBigNumber(value: string, decimals: number): bigint {
    return parseUnits(value, decimals);
  }

  static decodeBigNumber(value: bigint, decimals: number): string {
    return formatUnits(value, decimals);
  }

  // 定长数值编码
  static encodeFixedWidth(num: number | bigint, bytes: number): string {
    return zeroPadValue(toBeHex(num), bytes);
  }

  // 数组数值编码
  static encodeNumberArray(numbers: number[]): string {
    const encoded = numbers.map(num => this.encodeFixedWidth(num, 32));
    return encoded.join('');
  }
}

// 使用示例
console.log('数字转十六进制:', NumberEncoder.numberToHex(255)); // 0xff
console.log('定长编码:', NumberEncoder.encodeFixedWidth(255, 32));
console.log('大数值编码:', NumberEncoder.encodeBigNumber('1.5', 18));
```

### 2. 地址编码

```typescript
import { getAddress, isAddress } from 'ethers';

class AddressEncoder {
  // 标准化地址
  static normalizeAddress(address: string): string {
    if (!isAddress(address)) {
      throw new Error('Invalid address format');
    }
    return getAddress(address);
  }

  // 地址数组编码
  static encodeAddressArray(addresses: string[]): string {
    const normalized = addresses.map(addr => this.normalizeAddress(addr));
    return abiCoder.encode(['address[]'], [normalized]);
  }

  // 地址映射编码
  static encodeAddressMapping(mapping: Record<string, any>): string {
    const addresses = Object.keys(mapping).map(addr => this.normalizeAddress(addr));
    const values = Object.values(mapping);
    
    return abiCoder.encode(
      ['address[]', 'uint256[]'],
      [addresses, values]
    );
  }

  // 验证并编码地址
  static validateAndEncode(address: string): { valid: boolean, encoded?: string, error?: string } {
    try {
      const normalized = this.normalizeAddress(address);
      const encoded = abiCoder.encode(['address'], [normalized]);
      return { valid: true, encoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
```

### 3. 字节数据编码

```typescript
class BytesEncoder {
  // 动态字节编码
  static encodeDynamicBytes(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? toUtf8Bytes(data) : data;
    return abiCoder.encode(['bytes'], [bytes]);
  }

  // 固定长度字节编码
  static encodeFixedBytes(data: string | Uint8Array, length: number): string {
    const bytes = typeof data === 'string' ? toUtf8Bytes(data) : data;
    
    if (bytes.length > length) {
      throw new Error(`Data too long for bytes${length}`);
    }
    
    // 右填充零
    const padded = new Uint8Array(length);
    padded.set(bytes);
    
    return abiCoder.encode([`bytes${length}`], [padded]);
  }

  // 字节数组编码
  static encodeBytesArray(dataArray: (string | Uint8Array)[]): string {
    const bytesArray = dataArray.map(data => 
      typeof data === 'string' ? toUtf8Bytes(data) : data
    );
    return abiCoder.encode(['bytes[]'], [bytesArray]);
  }

  // 十六进制字符串处理
  static processHexString(hex: string): {
    isValid: boolean;
    normalized?: string;
    bytes?: Uint8Array;
    length?: number;
  } {
    try {
      if (!isHexString(hex)) {
        return { isValid: false };
      }

      const normalized = hex.toLowerCase();
      const bytes = arrayify(normalized);
      
      return {
        isValid: true,
        normalized,
        bytes,
        length: bytes.length
      };
    } catch (error) {
      return { isValid: false };
    }
  }
}

// 使用示例
const textData = "Hello, World!";
const dynamicEncoded = BytesEncoder.encodeDynamicBytes(textData);
console.log('动态字节编码:', dynamicEncoded);

const fixedEncoded = BytesEncoder.encodeFixedBytes(textData, 32);
console.log('固定字节编码:', fixedEncoded);
```

## 高级编码技术

### 1. 紧密打包编码

```typescript
import { solidityPacked, solidityPackedKeccak256 } from 'ethers';

class PackedEncoder {
  // 紧密打包编码
  static encodePacked(types: string[], values: any[]): string {
    return solidityPacked(types, values);
  }

  // 紧密打包哈希
  static encodePackedHash(types: string[], values: any[]): string {
    return solidityPackedKeccak256(types, values);
  }

  // 多重签名数据打包
  static encodeMultisigData(
    to: string,
    value: bigint,
    data: string,
    nonce: number
  ): string {
    return this.encodePacked(
      ['address', 'uint256', 'bytes', 'uint256'],
      [to, value, data, nonce]
    );
  }

  // EIP-712 结构化数据编码
  static encodeStructuredData(
    domain: any,
    types: Record<string, any>,
    value: any
  ): string {
    // 简化的 EIP-712 编码示例
    const domainSeparator = this.encodeDomain(domain);
    const structHash = this.encodeStruct(types, value);
    
    return this.encodePacked(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', domainSeparator, structHash]
    );
  }

  private static encodeDomain(domain: any): string {
    return keccak256(
      abiCoder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
          keccak256(toUtf8Bytes(domain.name)),
          keccak256(toUtf8Bytes(domain.version)),
          domain.chainId,
          domain.verifyingContract
        ]
      )
    );
  }

  private static encodeStruct(types: Record<string, any>, value: any): string {
    // 简化的结构体编码
    return keccak256(abiCoder.encode(['string'], [JSON.stringify(value)]));
  }
}
```

### 2. 自定义编码器

```typescript
interface EncodingOptions {
  padding?: boolean;
  compression?: boolean;
  validation?: boolean;
  format?: 'hex' | 'base64' | 'utf8';
}

class CustomEncoder {
  private options: EncodingOptions;

  constructor(options: EncodingOptions = {}) {
    this.options = {
      padding: true,
      compression: false,
      validation: true,
      format: 'hex',
      ...options
    };
  }

  // 自定义编码方法
  encode(data: any, type?: string): string {
    if (this.options.validation) {
      this.validateInput(data, type);
    }

    let encoded: string;

    switch (typeof data) {
      case 'string':
        encoded = this.encodeString(data);
        break;
      case 'number':
      case 'bigint':
        encoded = this.encodeNumber(data);
        break;
      case 'object':
        if (Array.isArray(data)) {
          encoded = this.encodeArray(data);
        } else {
          encoded = this.encodeObject(data);
        }
        break;
      default:
        throw new Error(`Unsupported data type: ${typeof data}`);
    }

    if (this.options.compression) {
      encoded = this.compress(encoded);
    }

    return this.formatOutput(encoded);
  }

  // 自定义解码方法
  decode(encoded: string, type?: string): any {
    let data = this.parseInput(encoded);

    if (this.options.compression) {
      data = this.decompress(data);
    }

    return this.decodeByType(data, type);
  }

  private encodeString(str: string): string {
    const bytes = toUtf8Bytes(str);
    return hexlify(bytes);
  }

  private encodeNumber(num: number | bigint): string {
    return toBeHex(num, this.options.padding ? 32 : undefined);
  }

  private encodeArray(arr: any[]): string {
    const encoded = arr.map(item => this.encode(item));
    return abiCoder.encode(['string[]'], [encoded]);
  }

  private encodeObject(obj: any): string {
    const jsonStr = JSON.stringify(obj);
    return this.encodeString(jsonStr);
  }

  private validateInput(data: any, type?: string): void {
    if (type === 'address' && typeof data === 'string') {
      if (!isAddress(data)) {
        throw new Error('Invalid address format');
      }
    }
    // 添加更多验证逻辑
  }

  private compress(data: string): string {
    // 简化的压缩逻辑
    return data.replace(/0+/g, '0');
  }

  private decompress(data: string): string {
    // 简化的解压缩逻辑
    return data;
  }

  private formatOutput(data: string): string {
    switch (this.options.format) {
      case 'base64':
        return encodeBase64(arrayify(data));
      case 'utf8':
        return toUtf8String(data);
      default:
        return data;
    }
  }

  private parseInput(encoded: string): string {
    switch (this.options.format) {
      case 'base64':
        return hexlify(decodeBase64(encoded));
      case 'utf8':
        return hexlify(toUtf8Bytes(encoded));
      default:
        return encoded;
    }
  }

  private decodeByType(data: string, type?: string): any {
    if (!type) {
      return data;
    }

    try {
      return abiCoder.decode([type], data)[0];
    } catch (error) {
      throw new Error(`Failed to decode as ${type}: ${error.message}`);
    }
  }
}

// 使用示例
const customEncoder = new CustomEncoder({
  padding: true,
  validation: true,
  format: 'hex'
});

const userData = {
  name: "Alice",
  age: 25,
  wallet: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"
};

const encoded = customEncoder.encode(userData);
console.log('自定义编码:', encoded);

const decoded = customEncoder.decode(encoded);
console.log('自定义解码:', decoded);
```

## 性能优化

### 1. 编码缓存

```typescript
class EncodingCache {
  private cache = new Map<string, string>();
  private maxSize = 1000;

  encode(data: any, types: string[]): string {
    const key = this.generateKey(data, types);
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const encoded = abiCoder.encode(types, data);
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, encoded);
    return encoded;
  }

  private generateKey(data: any, types: string[]): string {
    return `${JSON.stringify(data)}_${types.join(',')}`;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number, maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}
```

### 2. 批量处理

```typescript
class BatchEncoder {
  static encodeBatch(items: Array<{ types: string[], values: any[] }>): string[] {
    return items.map(item => abiCoder.encode(item.types, item.values));
  }

  static decodeBatch(
    encodedItems: string[],
    typesList: string[][]
  ): any[][] {
    return encodedItems.map((encoded, index) => 
      abiCoder.decode(typesList[index], encoded)
    );
  }

  static encodeParallel(
    items: Array<{ types: string[], values: any[] }>
  ): Promise<string[]> {
    const promises = items.map(item => 
      Promise.resolve(abiCoder.encode(item.types, item.values))
    );
    return Promise.all(promises);
  }
}
```

## 错误处理和调试

### 1. 编码错误处理

```typescript
class EncodingErrorHandler {
  static safeEncode(types: string[], values: any[]): {
    success: boolean;
    result?: string;
    error?: string;
  } {
    try {
      const result = abiCoder.encode(types, values);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static safeDecode(types: string[], data: string): {
    success: boolean;
    result?: any[];
    error?: string;
  } {
    try {
      const result = abiCoder.decode(types, data);
      return { success: true, result: Array.from(result) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static validateTypes(types: string[]): string[] {
    const errors: string[] = [];
    const validTypes = [
      'uint256', 'int256', 'address', 'bool', 'bytes', 'string',
      'bytes32', 'uint8', 'uint16', 'uint32', 'uint64', 'uint128'
    ];

    types.forEach((type, index) => {
      const baseType = type.replace(/\[\]$/, '').replace(/\[\d+\]$/, '');
      if (!validTypes.includes(baseType) && !baseType.startsWith('tuple')) {
        errors.push(`Invalid type at index ${index}: ${type}`);
      }
    });

    return errors;
  }
}
```

### 2. 调试工具

```typescript
class EncodingDebugger {
  static analyzeEncoding(types: string[], values: any[]): {
    typeAnalysis: any[];
    valueAnalysis: any[];
    estimatedSize: number;
    warnings: string[];
  } {
    const typeAnalysis = types.map(type => ({
      type,
      isDynamic: this.isDynamicType(type),
      isArray: type.includes('[]'),
      baseType: this.getBaseType(type)
    }));

    const valueAnalysis = values.map((value, index) => ({
      index,
      value,
      type: typeof value,
      size: this.estimateValueSize(value),
      isValid: this.validateValue(value, types[index])
    }));

    const estimatedSize = this.estimateEncodedSize(types, values);
    const warnings = this.generateWarnings(typeAnalysis, valueAnalysis);

    return {
      typeAnalysis,
      valueAnalysis,
      estimatedSize,
      warnings
    };
  }

  private static isDynamicType(type: string): boolean {
    return type === 'string' || type === 'bytes' || type.includes('[]');
  }

  private static getBaseType(type: string): string {
    return type.replace(/\[\]$/, '').replace(/\[\d+\]$/, '');
  }

  private static estimateValueSize(value: any): number {
    if (typeof value === 'string') {
      return toUtf8Bytes(value).length;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      return 32; // 标准字长
    }
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateValueSize(item), 0);
    }
    return 32; // 默认估计
  }

  private static validateValue(value: any, type: string): boolean {
    try {
      abiCoder.encode([type], [value]);
      return true;
    } catch {
      return false;
    }
  }

  private static estimateEncodedSize(types: string[], values: any[]): number {
    try {
      const encoded = abiCoder.encode(types, values);
      return encoded.length / 2 - 1; // 减去 0x 前缀
    } catch {
      return -1; // 编码失败
    }
  }

  private static generateWarnings(
    typeAnalysis: any[],
    valueAnalysis: any[]
  ): string[] {
    const warnings: string[] = [];

    valueAnalysis.forEach((analysis, index) => {
      if (!analysis.isValid) {
        warnings.push(`Value at index ${index} is invalid for type ${typeAnalysis[index].type}`);
      }
      if (analysis.size > 1024) {
        warnings.push(`Large value at index ${index} (${analysis.size} bytes)`);
      }
    });

    return warnings;
  }
}

// 使用示例
const debugInfo = EncodingDebugger.analyzeEncoding(
  ['string', 'uint256', 'address'],
  ['Hello World', 123, '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b']
);
console.log('编码调试信息:', debugInfo);
```

## 最佳实践

### 1. 类型安全

```typescript
// 使用 TypeScript 类型定义
interface TokenTransfer {
  from: string;
  to: string;
  amount: bigint;
}

function encodeTokenTransfer(transfer: TokenTransfer): string {
  return abiCoder.encode(
    ['address', 'address', 'uint256'],
    [transfer.from, transfer.to, transfer.amount]
  );
}
```

### 2. 数据验证

```typescript
function validateAndEncode(types: string[], values: any[]): string {
  // 验证类型和值的数量匹配
  if (types.length !== values.length) {
    throw new Error('Types and values length mismatch');
  }

  // 验证地址格式
  types.forEach((type, index) => {
    if (type === 'address' && !isAddress(values[index])) {
      throw new Error(`Invalid address at index ${index}`);
    }
  });

  return abiCoder.encode(types, values);
}
```

### 3. 错误恢复

```typescript
function robustEncode(types: string[], values: any[]): string {
  try {
    return abiCoder.encode(types, values);
  } catch (error) {
    console.warn('Encoding failed, attempting recovery:', error);
    
    // 尝试修复常见问题
    const fixedValues = values.map((value, index) => {
      if (types[index] === 'address' && typeof value === 'string') {
        try {
          return getAddress(value);
        } catch {
          return value;
        }
      }
      return value;
    });

    return abiCoder.encode(types, fixedValues);
  }
}
```

## 常见问题

### Q: 如何处理大数值编码？
A: 使用 `parseUnits` 和 `formatUnits` 处理带小数的大数值，使用 `toBigInt` 处理整数。

### Q: 编码后的数据太大怎么办？
A: 考虑使用紧密打包编码、数据压缩或分批处理。

### Q: 如何调试编码错误？
A: 使用 `EncodingDebugger` 分析类型和值，检查数据格式和大小。

### Q: 动态数组编码有什么注意事项？
A: 动态数组会增加额外的长度信息，注意 Gas 消耗和数据大小。

## 下一步

- [哈希函数](/ethers/utils/hashing) - 学习数据哈希计算
- [单位转换](/ethers/utils/units) - 掌握数值单位转换
- [合约交互](/ethers/contracts/basics) - 应用编码到合约调用
- [交易处理](/ethers/transactions/basics) - 了解交易数据编码