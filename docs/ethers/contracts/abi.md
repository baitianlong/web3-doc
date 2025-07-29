---
title: ABI 处理
description: Ethers.js 中 ABI 编码解码和处理的完整指南
keywords: [ethers, ABI, 编码解码, 智能合约, 函数签名, 事件签名, Web3]
---

# ABI 处理

ABI（Application Binary Interface）是智能合约与外部世界交互的标准接口。Ethers.js 提供了强大的 ABI 处理功能，包括编码、解码、函数签名生成等。

## ABI 基础概念

### 1. ABI 结构

```typescript
// ABI 条目类型
interface ABIEntry {
  type: 'function' | 'event' | 'constructor' | 'fallback' | 'receive' | 'error';
  name?: string;
  inputs?: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

interface ABIInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIInput[]; // 用于结构体
}

interface ABIOutput {
  name: string;
  type: string;
  components?: ABIOutput[];
}

// 完整的 ERC-20 ABI 示例
const ERC20_ABI = [
  // 构造函数
  {
    "type": "constructor",
    "inputs": [
      {"name": "name", "type": "string"},
      {"name": "symbol", "type": "string"},
      {"name": "decimals", "type": "uint8"}
    ]
  },
  // 只读函数
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{"name": "owner", "type": "address"}],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  // 写入函数
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  },
  // 事件
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true},
      {"name": "to", "type": "address", "indexed": true},
      {"name": "value", "type": "uint256", "indexed": false}
    ],
    "anonymous": false
  },
  // 自定义错误
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      {"name": "available", "type": "uint256"},
      {"name": "required", "type": "uint256"}
    ]
  }
];
```

### 2. Interface 对象

```typescript
import { ethers } from 'ethers';

// 创建 Interface 对象
const iface = new ethers.Interface(ERC20_ABI);

// 或者使用人类可读的 ABI
const humanReadableABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const ifaceHuman = new ethers.Interface(humanReadableABI);

// Interface 提供的功能
console.log('函数列表:', iface.fragments.filter(f => f.type === 'function'));
console.log('事件列表:', iface.fragments.filter(f => f.type === 'event'));
console.log('错误列表:', iface.fragments.filter(f => f.type === 'error'));
```

## 函数编码解码

### 1. 函数调用编码

```typescript
class FunctionEncoder {
  private iface: ethers.Interface;

  constructor(abi: any[]) {
    this.iface = new ethers.Interface(abi);
  }

  // 编码函数调用
  encodeFunctionCall(functionName: string, args: any[]): string {
    try {
      const encoded = this.iface.encodeFunctionData(functionName, args);
      console.log(`编码 ${functionName}:`, encoded);
      return encoded;
    } catch (error) {
      console.error(`编码 ${functionName} 失败:`, error);
      throw error;
    }
  }

  // 解码函数调用
  decodeFunctionCall(data: string): {
    functionName: string;
    args: any[];
    signature: string;
  } | null {
    try {
      // 获取函数选择器
      const selector = data.slice(0, 10);
      
      // 查找匹配的函数
      for (const fragment of this.iface.fragments) {
        if (fragment.type === 'function') {
          const functionSelector = this.iface.getFunction(fragment.name!)?.selector;
          if (functionSelector === selector) {
            const decoded = this.iface.decodeFunctionData(fragment.name!, data);
            return {
              functionName: fragment.name!,
              args: Array.from(decoded),
              signature: fragment.format()
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('解码函数调用失败:', error);
      return null;
    }
  }

  // 编码函数返回值
  encodeFunctionResult(functionName: string, values: any[]): string {
    try {
      return this.iface.encodeFunctionResult(functionName, values);
    } catch (error) {
      console.error(`编码 ${functionName} 返回值失败:`, error);
      throw error;
    }
  }

  // 解码函数返回值
  decodeFunctionResult(functionName: string, data: string): any[] {
    try {
      const decoded = this.iface.decodeFunctionResult(functionName, data);
      return Array.from(decoded);
    } catch (error) {
      console.error(`解码 ${functionName} 返回值失败:`, error);
      throw error;
    }
  }

  // 获取函数选择器
  getFunctionSelector(functionName: string): string {
    try {
      const func = this.iface.getFunction(functionName);
      return func?.selector || '';
    } catch (error) {
      console.error(`获取 ${functionName} 选择器失败:`, error);
      throw error;
    }
  }

  // 获取函数签名
  getFunctionSignature(functionName: string): string {
    try {
      const func = this.iface.getFunction(functionName);
      return func?.format() || '';
    } catch (error) {
      console.error(`获取 ${functionName} 签名失败:`, error);
      throw error;
    }
  }

  // 批量编码函数调用
  batchEncodeFunctionCalls(calls: Array<{
    functionName: string;
    args: any[];
  }>): string[] {
    return calls.map(call => {
      try {
        return this.encodeFunctionCall(call.functionName, call.args);
      } catch (error) {
        console.error(`批量编码失败 ${call.functionName}:`, error);
        return '';
      }
    });
  }

  // 验证函数参数
  validateFunctionArgs(functionName: string, args: any[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    try {
      const func = this.iface.getFunction(functionName);
      if (!func) {
        errors.push(`函数 ${functionName} 不存在`);
        return { valid: false, errors };
      }

      if (args.length !== func.inputs.length) {
        errors.push(`参数数量不匹配: 期望 ${func.inputs.length}, 实际 ${args.length}`);
      }

      // 简单的类型检查
      func.inputs.forEach((input, index) => {
        if (index < args.length) {
          const arg = args[index];
          const expectedType = input.type;
          
          if (expectedType === 'address' && typeof arg === 'string') {
            if (!ethers.isAddress(arg)) {
              errors.push(`参数 ${index} (${input.name}) 不是有效地址`);
            }
          } else if (expectedType.startsWith('uint') && typeof arg !== 'bigint' && typeof arg !== 'number' && typeof arg !== 'string') {
            errors.push(`参数 ${index} (${input.name}) 类型不匹配: 期望数字类型`);
          }
        }
      });

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`验证失败: ${error}`);
      return { valid: false, errors };
    }
  }
}

// 使用示例
const encoder = new FunctionEncoder(ERC20_ABI);

// 编码 transfer 函数调用
const transferData = encoder.encodeFunctionCall('transfer', [
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  ethers.parseEther('100')
]);

// 解码函数调用
const decoded = encoder.decodeFunctionCall(transferData);
console.log('解码结果:', decoded);

// 获取函数选择器
const selector = encoder.getFunctionSelector('transfer');
console.log('transfer 选择器:', selector);

// 验证参数
const validation = encoder.validateFunctionArgs('transfer', [
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  ethers.parseEther('100')
]);
console.log('参数验证:', validation);
```

### 2. 构造函数编码

```typescript
class ConstructorEncoder {
  private iface: ethers.Interface;

  constructor(abi: any[]) {
    this.iface = new ethers.Interface(abi);
  }

  // 编码构造函数参数
  encodeConstructor(args: any[]): string {
    try {
      const constructor = this.iface.fragments.find(f => f.type === 'constructor');
      if (!constructor) {
        throw new Error('合约没有构造函数');
      }

      return this.iface.encodeDeploy(args);
    } catch (error) {
      console.error('编码构造函数失败:', error);
      throw error;
    }
  }

  // 解码构造函数参数
  decodeConstructor(data: string, bytecode: string): any[] {
    try {
      // 移除字节码部分，只保留构造函数参数
      const constructorData = data.slice(bytecode.length);
      
      const constructor = this.iface.fragments.find(f => f.type === 'constructor');
      if (!constructor) {
        return [];
      }

      // 使用 AbiCoder 解码
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const types = (constructor as any).inputs.map((input: any) => input.type);
      
      return abiCoder.decode(types, '0x' + constructorData);
    } catch (error) {
      console.error('解码构造函数失败:', error);
      throw error;
    }
  }

  // 获取构造函数签名
  getConstructorSignature(): string {
    const constructor = this.iface.fragments.find(f => f.type === 'constructor');
    return constructor ? constructor.format() : '';
  }

  // 验证构造函数参数
  validateConstructorArgs(args: any[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    try {
      const constructor = this.iface.fragments.find(f => f.type === 'constructor');
      if (!constructor) {
        return { valid: true, errors: [] }; // 没有构造函数也是有效的
      }

      const inputs = (constructor as any).inputs;
      if (args.length !== inputs.length) {
        errors.push(`构造函数参数数量不匹配: 期望 ${inputs.length}, 实际 ${args.length}`);
      }

      // 类型检查
      inputs.forEach((input: any, index: number) => {
        if (index < args.length) {
          const arg = args[index];
          const expectedType = input.type;
          
          if (expectedType === 'address' && typeof arg === 'string') {
            if (!ethers.isAddress(arg)) {
              errors.push(`构造函数参数 ${index} (${input.name}) 不是有效地址`);
            }
          }
        }
      });

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`验证构造函数参数失败: ${error}`);
      return { valid: false, errors };
    }
  }
}

// 使用示例
const constructorEncoder = new ConstructorEncoder(ERC20_ABI);

// 编码构造函数
const constructorData = constructorEncoder.encodeConstructor([
  'MyToken',
  'MTK',
  18
]);

console.log('构造函数数据:', constructorData);
console.log('构造函数签名:', constructorEncoder.getConstructorSignature());
```

## 事件编码解码

### 1. 事件日志处理

```typescript
class EventDecoder {
  private iface: ethers.Interface;

  constructor(abi: any[]) {
    this.iface = new ethers.Interface(abi);
  }

  // 解码事件日志
  decodeEventLog(log: {
    topics: string[];
    data: string;
    address?: string;
  }): {
    eventName: string;
    args: any[];
    signature: string;
    decodedArgs: { [key: string]: any };
  } | null {
    try {
      const parsed = this.iface.parseLog(log);
      if (!parsed) return null;

      // 创建命名参数对象
      const decodedArgs: { [key: string]: any } = {};
      const fragment = parsed.fragment as any;
      
      fragment.inputs.forEach((input: any, index: number) => {
        if (input.name) {
          decodedArgs[input.name] = parsed.args[index];
        }
      });

      return {
        eventName: parsed.name,
        args: Array.from(parsed.args),
        signature: fragment.format(),
        decodedArgs
      };
    } catch (error) {
      console.error('解码事件日志失败:', error);
      return null;
    }
  }

  // 批量解码事件日志
  batchDecodeEventLogs(logs: Array<{
    topics: string[];
    data: string;
    address?: string;
    blockNumber?: number;
    transactionHash?: string;
  }>): Array<{
    log: any;
    decoded: any;
    error?: string;
  }> {
    return logs.map(log => {
      try {
        const decoded = this.decodeEventLog(log);
        return {
          log,
          decoded,
          error: decoded ? undefined : '无法解码'
        };
      } catch (error) {
        return {
          log,
          decoded: null,
          error: `解码失败: ${error}`
        };
      }
    });
  }

  // 获取事件主题
  getEventTopic(eventName: string): string {
    try {
      const event = this.iface.getEvent(eventName);
      return event?.topicHash || '';
    } catch (error) {
      console.error(`获取 ${eventName} 主题失败:`, error);
      throw error;
    }
  }

  // 编码事件过滤器
  encodeEventFilter(
    eventName: string,
    filters: { [paramName: string]: any }
  ): {
    topics: (string | string[] | null)[];
    address?: string;
  } {
    try {
      const event = this.iface.getEvent(eventName);
      if (!event) {
        throw new Error(`事件 ${eventName} 不存在`);
      }

      const topics: (string | string[] | null)[] = [event.topicHash];
      
      // 处理索引参数
      const inputs = (event as any).inputs;
      let topicIndex = 1;

      inputs.forEach((input: any) => {
        if (input.indexed) {
          if (filters[input.name] !== undefined) {
            const value = filters[input.name];
            if (Array.isArray(value)) {
              // 多个值的情况
              topics[topicIndex] = value.map(v => this.encodeTopicValue(input.type, v));
            } else {
              topics[topicIndex] = this.encodeTopicValue(input.type, value);
            }
          } else {
            topics[topicIndex] = null;
          }
          topicIndex++;
        }
      });

      return { topics };
    } catch (error) {
      console.error(`编码事件过滤器失败:`, error);
      throw error;
    }
  }

  // 编码主题值
  private encodeTopicValue(type: string, value: any): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    
    if (type === 'address') {
      return ethers.zeroPadValue(value, 32);
    } else if (type.startsWith('uint') || type.startsWith('int')) {
      return ethers.zeroPadValue(ethers.toBeHex(value), 32);
    } else if (type === 'bool') {
      return ethers.zeroPadValue(value ? '0x01' : '0x00', 32);
    } else if (type === 'bytes32') {
      return value;
    } else if (type === 'string' || type === 'bytes') {
      return ethers.keccak256(ethers.toUtf8Bytes(value));
    } else {
      // 对于复杂类型，计算哈希
      const encoded = abiCoder.encode([type], [value]);
      return ethers.keccak256(encoded);
    }
  }

  // 解析事件签名
  parseEventSignature(signature: string): {
    name: string;
    inputs: Array<{
      name: string;
      type: string;
      indexed: boolean;
    }>;
  } | null {
    try {
      // 解析形如 "Transfer(address indexed from, address indexed to, uint256 value)" 的签名
      const match = signature.match(/^(\w+)\((.*)\)$/);
      if (!match) return null;

      const [, name, paramsStr] = match;
      const inputs: Array<{ name: string; type: string; indexed: boolean }> = [];

      if (paramsStr.trim()) {
        const params = paramsStr.split(',').map(p => p.trim());
        
        params.forEach(param => {
          const parts = param.split(/\s+/);
          let type = '';
          let paramName = '';
          let indexed = false;

          if (parts.includes('indexed')) {
            indexed = true;
            const indexedIndex = parts.indexOf('indexed');
            type = parts[indexedIndex - 1] || parts[0];
            paramName = parts[indexedIndex + 1] || '';
          } else {
            type = parts[0];
            paramName = parts[1] || '';
          }

          inputs.push({ name: paramName, type, indexed });
        });
      }

      return { name, inputs };
    } catch (error) {
      console.error('解析事件签名失败:', error);
      return null;
    }
  }

  // 获取所有事件信息
  getAllEvents(): Array<{
    name: string;
    signature: string;
    topicHash: string;
    inputs: any[];
  }> {
    return this.iface.fragments
      .filter(f => f.type === 'event')
      .map(fragment => {
        const event = fragment as any;
        return {
          name: event.name,
          signature: event.format(),
          topicHash: this.iface.getEvent(event.name)?.topicHash || '',
          inputs: event.inputs
        };
      });
  }
}

// 使用示例
const eventDecoder = new EventDecoder(ERC20_ABI);

// 解码事件日志
const log = {
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
    '0x000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4d8b6'
  ],
  data: '0x0000000000000000000000000000000000000000000000056bc75e2d630eb187'
};

const decodedEvent = eventDecoder.decodeEventLog(log);
console.log('解码事件:', decodedEvent);

// 获取事件主题
const transferTopic = eventDecoder.getEventTopic('Transfer');
console.log('Transfer 事件主题:', transferTopic);

// 编码事件过滤器
const filter = eventDecoder.encodeEventFilter('Transfer', {
  from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
});
console.log('事件过滤器:', filter);
```

## 错误处理

### 1. 自定义错误解码

```typescript
class ErrorDecoder {
  private iface: ethers.Interface;

  constructor(abi: any[]) {
    this.iface = new ethers.Interface(abi);
  }

  // 解码错误数据
  decodeError(data: string): {
    errorName: string;
    args: any[];
    signature: string;
    decodedArgs: { [key: string]: any };
  } | null {
    try {
      const parsed = this.iface.parseError(data);
      if (!parsed) return null;

      // 创建命名参数对象
      const decodedArgs: { [key: string]: any } = {};
      const fragment = parsed.fragment as any;
      
      fragment.inputs.forEach((input: any, index: number) => {
        if (input.name) {
          decodedArgs[input.name] = parsed.args[index];
        }
      });

      return {
        errorName: parsed.name,
        args: Array.from(parsed.args),
        signature: fragment.format(),
        decodedArgs
      };
    } catch (error) {
      console.error('解码错误数据失败:', error);
      return null;
    }
  }

  // 编码自定义错误
  encodeError(errorName: string, args: any[]): string {
    try {
      return this.iface.encodeErrorResult(errorName, args);
    } catch (error) {
      console.error(`编码错误 ${errorName} 失败:`, error);
      throw error;
    }
  }

  // 获取错误选择器
  getErrorSelector(errorName: string): string {
    try {
      const error = this.iface.getError(errorName);
      return error?.selector || '';
    } catch (error) {
      console.error(`获取错误 ${errorName} 选择器失败:`, error);
      throw error;
    }
  }

  // 解析交易失败原因
  parseTransactionError(error: any): {
    type: 'revert' | 'panic' | 'custom' | 'unknown';
    reason?: string;
    errorName?: string;
    args?: any[];
    code?: string;
  } {
    try {
      // 检查是否是 revert 错误
      if (error.data) {
        // 尝试解码自定义错误
        const customError = this.decodeError(error.data);
        if (customError) {
          return {
            type: 'custom',
            errorName: customError.errorName,
            args: customError.args,
            reason: `${customError.errorName}(${customError.args.join(', ')})`
          };
        }

        // 检查是否是 Panic 错误
        if (error.data.startsWith('0x4e487b71')) {
          const panicCode = error.data.slice(10);
          return {
            type: 'panic',
            code: panicCode,
            reason: this.getPanicReason(panicCode)
          };
        }

        // 检查是否是普通 revert
        if (error.data.startsWith('0x08c379a0')) {
          try {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const decoded = abiCoder.decode(['string'], '0x' + error.data.slice(10));
            return {
              type: 'revert',
              reason: decoded[0]
            };
          } catch {
            return {
              type: 'revert',
              reason: '未知 revert 原因'
            };
          }
        }
      }

      // 检查错误消息
      if (error.reason) {
        return {
          type: 'revert',
          reason: error.reason
        };
      }

      return {
        type: 'unknown',
        reason: error.message || '未知错误'
      };
    } catch (parseError) {
      return {
        type: 'unknown',
        reason: `解析错误失败: ${parseError}`
      };
    }
  }

  // 获取 Panic 错误原因
  private getPanicReason(code: string): string {
    const panicCodes: { [key: string]: string } = {
      '0x00': '通用编译器插入的 panic',
      '0x01': '断言失败',
      '0x11': '算术运算溢出或下溢',
      '0x12': '除零错误',
      '0x21': '枚举转换错误',
      '0x22': '访问错误编码的存储字节数组',
      '0x31': '在空数组上调用 .pop()',
      '0x32': '数组访问越界',
      '0x41': '内存分配过多',
      '0x51': '调用零初始化的内部函数类型变量'
    };

    return panicCodes[code] || `未知 Panic 代码: ${code}`;
  }

  // 获取所有错误信息
  getAllErrors(): Array<{
    name: string;
    signature: string;
    selector: string;
    inputs: any[];
  }> {
    return this.iface.fragments
      .filter(f => f.type === 'error')
      .map(fragment => {
        const error = fragment as any;
        return {
          name: error.name,
          signature: error.format(),
          selector: this.iface.getError(error.name)?.selector || '',
          inputs: error.inputs
        };
      });
  }
}

// 使用示例
const errorDecoder = new ErrorDecoder([
  ...ERC20_ABI,
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      {"name": "available", "type": "uint256"},
      {"name": "required", "type": "uint256"}
    ]
  }
]);

// 模拟解析交易错误
const mockError = {
  data: '0x...' // 实际的错误数据
};

const parsedError = errorDecoder.parseTransactionError(mockError);
console.log('解析的错误:', parsedError);

// 编码自定义错误
const encodedError = errorDecoder.encodeError('InsufficientBalance', [
  ethers.parseEther('50'),
  ethers.parseEther('100')
]);
console.log('编码的错误:', encodedError);
```

## 高级 ABI 操作

### 1. ABI 合并和管理

```typescript
class ABIManager {
  private interfaces: Map<string, ethers.Interface> = new Map();
  private combinedABI: any[] = [];

  // 添加 ABI
  addABI(name: string, abi: any[]): void {
    try {
      const iface = new ethers.Interface(abi);
      this.interfaces.set(name, iface);
      
      // 合并到总 ABI 中（去重）
      abi.forEach(item => {
        const exists = this.combinedABI.some(existing => 
          existing.type === item.type && 
          existing.name === item.name &&
          JSON.stringify(existing.inputs) === JSON.stringify(item.inputs)
        );
        
        if (!exists) {
          this.combinedABI.push(item);
        }
      });

      console.log(`添加 ABI: ${name}, 包含 ${abi.length} 个条目`);
    } catch (error) {
      console.error(`添加 ABI ${name} 失败:`, error);
      throw error;
    }
  }

  // 获取接口
  getInterface(name: string): ethers.Interface | undefined {
    return this.interfaces.get(name);
  }

  // 获取合并的 ABI
  getCombinedABI(): any[] {
    return [...this.combinedABI];
  }

  // 创建合并的接口
  getCombinedInterface(): ethers.Interface {
    return new ethers.Interface(this.combinedABI);
  }

  // 查找函数
  findFunction(functionName: string): Array<{
    abiName: string;
    fragment: any;
    signature: string;
  }> {
    const results: Array<{
      abiName: string;
      fragment: any;
      signature: string;
    }> = [];

    this.interfaces.forEach((iface, name) => {
      try {
        const func = iface.getFunction(functionName);
        if (func) {
          results.push({
            abiName: name,
            fragment: func,
            signature: func.format()
          });
        }
      } catch {
        // 函数不存在，继续查找
      }
    });

    return results;
  }

  // 查找事件
  findEvent(eventName: string): Array<{
    abiName: string;
    fragment: any;
    signature: string;
    topicHash: string;
  }> {
    const results: Array<{
      abiName: string;
      fragment: any;
      signature: string;
      topicHash: string;
    }> = [];

    this.interfaces.forEach((iface, name) => {
      try {
        const event = iface.getEvent(eventName);
        if (event) {
          results.push({
            abiName: name,
            fragment: event,
            signature: event.format(),
            topicHash: event.topicHash
          });
        }
      } catch {
        // 事件不存在，继续查找
      }
    });

    return results;
  }

  // 解码未知数据
  decodeUnknownData(data: string): Array<{
    abiName: string;
    type: 'function' | 'error';
    decoded: any;
  }> {
    const results: Array<{
      abiName: string;
      type: 'function' | 'error';
      decoded: any;
    }> = [];

    this.interfaces.forEach((iface, name) => {
      // 尝试解码为函数调用
      try {
        const selector = data.slice(0, 10);
        for (const fragment of iface.fragments) {
          if (fragment.type === 'function') {
            const func = iface.getFunction(fragment.name!);
            if (func?.selector === selector) {
              const decoded = iface.decodeFunctionData(fragment.name!, data);
              results.push({
                abiName: name,
                type: 'function',
                decoded: {
                  functionName: fragment.name,
                  args: Array.from(decoded),
                  signature: fragment.format()
                }
              });
            }
          }
        }
      } catch {
        // 解码失败，继续尝试
      }

      // 尝试解码为错误
      try {
        const parsed = iface.parseError(data);
        if (parsed) {
          results.push({
            abiName: name,
            type: 'error',
            decoded: {
              errorName: parsed.name,
              args: Array.from(parsed.args),
              signature: parsed.fragment.format()
            }
          });
        }
      } catch {
        // 解码失败，继续尝试
      }
    });

    return results;
  }

  // 生成 ABI 统计
  getStatistics(): {
    totalABIs: number;
    totalFunctions: number;
    totalEvents: number;
    totalErrors: number;
    abiDetails: Array<{
      name: string;
      functions: number;
      events: number;
      errors: number;
    }>;
  } {
    let totalFunctions = 0;
    let totalEvents = 0;
    let totalErrors = 0;
    const abiDetails: Array<{
      name: string;
      functions: number;
      events: number;
      errors: number;
    }> = [];

    this.interfaces.forEach((iface, name) => {
      const functions = iface.fragments.filter(f => f.type === 'function').length;
      const events = iface.fragments.filter(f => f.type === 'event').length;
      const errors = iface.fragments.filter(f => f.type === 'error').length;

      totalFunctions += functions;
      totalEvents += events;
      totalErrors += errors;

      abiDetails.push({
        name,
        functions,
        events,
        errors
      });
    });

    return {
      totalABIs: this.interfaces.size,
      totalFunctions,
      totalEvents,
      totalErrors,
      abiDetails
    };
  }

  // 导出 ABI
  exportABI(format: 'json' | 'human' = 'json'): string {
    if (format === 'human') {
      const humanReadable: string[] = [];
      
      this.combinedABI.forEach(item => {
        if (item.type === 'function') {
          const inputs = item.inputs?.map((input: any) => `${input.type} ${input.name}`).join(', ') || '';
          const outputs = item.outputs?.map((output: any) => output.type).join(', ') || '';
          const stateMutability = item.stateMutability && item.stateMutability !== 'nonpayable' ? ` ${item.stateMutability}` : '';
          const returnsClause = outputs ? ` returns (${outputs})` : '';
          
          humanReadable.push(`function ${item.name}(${inputs})${stateMutability}${returnsClause}`);
        } else if (item.type === 'event') {
          const inputs = item.inputs?.map((input: any) => {
            const indexed = input.indexed ? 'indexed ' : '';
            return `${input.type} ${indexed}${input.name}`;
          }).join(', ') || '';
          
          humanReadable.push(`event ${item.name}(${inputs})`);
        } else if (item.type === 'error') {
          const inputs = item.inputs?.map((input: any) => `${input.type} ${input.name}`).join(', ') || '';
          humanReadable.push(`error ${item.name}(${inputs})`);
        }
      });

      return humanReadable.join('\n');
    } else {
      return JSON.stringify(this.combinedABI, null, 2);
    }
  }
}

// 使用示例
const abiManager = new ABIManager();

// 添加多个 ABI
abiManager.addABI('ERC20', ERC20_ABI);
abiManager.addABI('ERC721', [
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {"name": "from", "type": "address", "indexed": true},
      {"name": "to", "type": "address", "indexed": true},
      {"name": "tokenId", "type": "uint256", "indexed": true}
    ]
  }
]);

// 查找函数
const transferFunctions = abiManager.findFunction('transfer');
console.log('找到的 transfer 函数:', transferFunctions);

// 获取统计信息
const stats = abiManager.getStatistics();
console.log('ABI 统计:', stats);

// 导出人类可读格式
const humanReadableABI = abiManager.exportABI('human');
console.log('人类可读 ABI:\n', humanReadableABI);
```

### 2. 动态 ABI 生成

```typescript
class DynamicABIBuilder {
  private abi: any[] = [];

  // 添加函数
  addFunction(
    name: string,
    inputs: Array<{ name: string; type: string }>,
    outputs: Array<{ name: string; type: string }> = [],
    stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable' = 'nonpayable'
  ): this {
    this.abi.push({
      type: 'function',
      name,
      inputs,
      outputs,
      stateMutability
    });
    return this;
  }

  // 添加事件
  addEvent(
    name: string,
    inputs: Array<{ name: string; type: string; indexed?: boolean }>
  ): this {
    this.abi.push({
      type: 'event',
      name,
      inputs,
      anonymous: false
    });
    return this;
  }

  // 添加错误
  addError(
    name: string,
    inputs: Array<{ name: string; type: string }> = []
  ): this {
    this.abi.push({
      type: 'error',
      name,
      inputs
    });
    return this;
  }

  // 添加构造函数
  addConstructor(
    inputs: Array<{ name: string; type: string }> = []
  ): this {
    this.abi.push({
      type: 'constructor',
      inputs
    });
    return this;
  }

  // 从函数签名添加
  addFromSignature(signature: string): this {
    try {
      const parsed = this.parseSignature(signature);
      if (parsed) {
        this.abi.push(parsed);
      }
    } catch (error) {
      console.error('解析签名失败:', error);
    }
    return this;
  }

  // 解析函数签名
  private parseSignature(signature: string): any | null {
    // 解析形如 "function transfer(address to, uint256 amount) returns (bool)" 的签名
    const functionMatch = signature.match(/^function\s+(\w+)\s*\((.*?)\)(?:\s+(view|pure|payable|nonpayable))?(?:\s+returns\s*\((.*?)\))?$/);
    if (functionMatch) {
      const [, name, inputsStr, stateMutability, outputsStr] = functionMatch;
      
      const inputs = this.parseParameters(inputsStr);
      const outputs = outputsStr ? this.parseParameters(outputsStr) : [];
      
      return {
        type: 'function',
        name,
        inputs,
        outputs,
        stateMutability: stateMutability || 'nonpayable'
      };
    }

    // 解析事件签名
    const eventMatch = signature.match(/^event\s+(\w+)\s*\((.*?)\)$/);
    if (eventMatch) {
      const [, name, inputsStr] = eventMatch;
      const inputs = this.parseParameters(inputsStr, true); // 支持 indexed
      
      return {
        type: 'event',
        name,
        inputs,
        anonymous: false
      };
    }

    // 解析错误签名
    const errorMatch = signature.match(/^error\s+(\w+)\s*\((.*?)\)$/);
    if (errorMatch) {
      const [, name, inputsStr] = errorMatch;
      const inputs = this.parseParameters(inputsStr);
      
      return {
        type: 'error',
        name,
        inputs
      };
    }

    return null;
  }

  // 解析参数
  private parseParameters(paramsStr: string, supportIndexed: boolean = false): any[] {
    if (!paramsStr.trim()) return [];

    const params = paramsStr.split(',').map(p => p.trim());
    return params.map(param => {
      const parts = param.split(/\s+/);
      
      if (supportIndexed && parts.includes('indexed')) {
        const indexedIndex = parts.indexOf('indexed');
        const type = parts[indexedIndex - 1] || parts[0];
        const name = parts[indexedIndex + 1] || '';
        return { name, type, indexed: true };
      } else {
        const type = parts[0];
        const name = parts[1] || '';
        return { name, type };
      }
    });
  }

  // 构建 ABI
  build(): any[] {
    return [...this.abi];
  }

  // 构建接口
  buildInterface(): ethers.Interface {
    return new ethers.Interface(this.abi);
  }

  // 重置构建器
  reset(): this {
    this.abi = [];
    return this;
  }

  // 克隆构建器
  clone(): DynamicABIBuilder {
    const cloned = new DynamicABIBuilder();
    cloned.abi = JSON.parse(JSON.stringify(this.abi));
    return cloned;
  }

  // 合并其他 ABI
  merge(otherABI: any[]): this {
    otherABI.forEach(item => {
      // 检查是否已存在
      const exists = this.abi.some(existing => 
        existing.type === item.type && 
        existing.name === item.name &&
        JSON.stringify(existing.inputs) === JSON.stringify(item.inputs)
      );
      
      if (!exists) {
        this.abi.push(item);
      }
    });
    return this;
  }

  // 移除条目
  remove(type: string, name?: string): this {
    this.abi = this.abi.filter(item => {
      if (item.type !== type) return true;
      if (name && item.name !== name) return true;
      return false;
    });
    return this;
  }

  // 获取统计信息
  getStats(): {
    functions: number;
    events: number;
    errors: number;
    constructors: number;
    total: number;
  } {
    const stats = {
      functions: 0,
      events: 0,
      errors: 0,
      constructors: 0,
      total: this.abi.length
    };

    this.abi.forEach(item => {
      switch (item.type) {
        case 'function':
          stats.functions++;
          break;
        case 'event':
          stats.events++;
          break;
        case 'error':
          stats.errors++;
          break;
        case 'constructor':
          stats.constructors++;
          break;
      }
    });

    return stats;
  }
}

// 使用示例
const builder = new DynamicABIBuilder();

// 构建 ERC-20 ABI
const erc20ABI = builder
  .addFunction('name', [], [{ name: '', type: 'string' }], 'view')
  .addFunction('symbol', [], [{ name: '', type: 'string' }], 'view')
  .addFunction('decimals', [], [{ name: '', type: 'uint8' }], 'view')
  .addFunction('totalSupply', [], [{ name: '', type: 'uint256' }], 'view')
  .addFunction('balanceOf', [{ name: 'owner', type: 'address' }], [{ name: '', type: 'uint256' }], 'view')
  .addFunction('transfer', [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], [{ name: '', type: 'bool' }])
  .addEvent('Transfer', [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false }
  ])
  .addError('InsufficientBalance', [{ name: 'available', type: 'uint256' }, { name: 'required', type: 'uint256' }])
  .build();

console.log('动态构建的 ERC-20 ABI:', JSON.stringify(erc20ABI, null, 2));

// 从签名构建
const signatureBuilder = new DynamicABIBuilder()
  .addFromSignature('function transfer(address to, uint256 amount) returns (bool)')
  .addFromSignature('event Transfer(address indexed from, address indexed to, uint256 value)')
  .addFromSignature('error InsufficientBalance(uint256 available, uint256 required)');

console.log('从签名构建的 ABI:', signatureBuilder.build());
console.log('统计信息:', signatureBuilder.getStats());
```

## 最佳实践

### 1. ABI 处理最佳实践

```typescript
class ABIBestPractices {
  // ABI 验证
  static validateABI(abi: any[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 尝试创建接口
      new ethers.Interface(abi);
    } catch (error) {
      errors.push(`ABI 格式错误: ${error}`);
      return { valid: false, errors, warnings };
    }

    // 检查重复定义
    const names = new Map<string, string[]>();
    abi.forEach((item, index) => {
      if (item.name) {
        const key = `${item.type}:${item.name}`;
        if (!names.has(key)) {
          names.set(key, []);
        }
        names.get(key)!.push(`索引 ${index}`);
      }
    });

    names.forEach((indices, key) => {
      if (indices.length > 1) {
        warnings.push(`重复定义 ${key} 在 ${indices.join(', ')}`);
      }
    });

    // 检查函数命名规范
    abi.forEach((item, index) => {
      if (item.type === 'function' && item.name) {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(item.name)) {
          warnings.push(`函数名 ${item.name} (索引 ${index}) 不符合命名规范`);
        }
      }
    });

    // 检查事件命名规范
    abi.forEach((item, index) => {
      if (item.type === 'event' && item.name) {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(item.name)) {
          warnings.push(`事件名 ${item.name} (索引 ${index}) 不符合命名规范`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ABI 优化建议
  static getOptimizationSuggestions(abi: any[]): string[] {
    const suggestions: string[] = [];

    // 检查是否有过多的函数重载
    const functionNames = new Map<string, number>();
    abi.forEach(item => {
      if (item.type === 'function' && item.name) {
        functionNames.set(item.name, (functionNames.get(item.name) || 0) + 1);
      }
    });

    functionNames.forEach((count, name) => {
      if (count > 3) {
        suggestions.push(`函数 ${name} 有 ${count} 个重载，考虑简化`);
      }
    });

    // 检查事件索引使用
    abi.forEach(item => {
      if (item.type === 'event' && item.inputs) {
        const indexedCount = item.inputs.filter((input: any) => input.indexed).length;
        if (indexedCount === 0) {
          suggestions.push(`事件 ${item.name} 没有索引参数，考虑添加索引以提高查询效率`);
        } else if (indexedCount > 3) {
          suggestions.push(`事件 ${item.name} 有 ${indexedCount} 个索引参数，超过了最大限制 3`);
        }
      }
    });

    // 检查函数可见性
    abi.forEach(item => {
      if (item.type === 'function' && !item.stateMutability) {
        suggestions.push(`函数 ${item.name} 没有指定状态可变性，建议明确指定`);
      }
    });

    return suggestions;
  }

  // ABI 兼容性检查
  static checkCompatibility(oldABI: any[], newABI: any[]): {
    compatible: boolean;
    breakingChanges: string[];
    additions: string[];
    removals: string[];
  } {
    const breakingChanges: string[] = [];
    const additions: string[] = [];
    const removals: string[] = [];

    const oldInterface = new ethers.Interface(oldABI);
    const newInterface = new ethers.Interface(newABI);

    // 检查函数变化
    oldInterface.fragments.forEach(oldFragment => {
      if (oldFragment.type === 'function') {
        try {
          const newFragment = newInterface.getFunction(oldFragment.name!);
          if (!newFragment) {
            removals.push(`函数 ${oldFragment.name} 被移除`);
          } else {
            // 检查签名是否变化
            if (oldFragment.format() !== newFragment.format()) {
              breakingChanges.push(`函数 ${oldFragment.name} 签名发生变化`);
            }
          }
        } catch {
          removals.push(`函数 ${oldFragment.name} 被移除`);
        }
      }
    });

    // 检查新增函数
    newInterface.fragments.forEach(newFragment => {
      if (newFragment.type === 'function') {
        try {
          oldInterface.getFunction(newFragment.name!);
        } catch {
          additions.push(`新增函数 ${newFragment.name}`);
        }
      }
    });

    // 检查事件变化
    oldInterface.fragments.forEach(oldFragment => {
      if (oldFragment.type === 'event') {
        try {
          const newFragment = newInterface.getEvent(oldFragment.name!);
          if (!newFragment) {
            removals.push(`事件 ${oldFragment.name} 被移除`);
          } else if (oldFragment.format() !== newFragment.format()) {
            breakingChanges.push(`事件 ${oldFragment.name} 签名发生变化`);
          }
        } catch {
          removals.push(`事件 ${oldFragment.name} 被移除`);
        }
      }
    });

    return {
      compatible: breakingChanges.length === 0 && removals.length === 0,
      breakingChanges,
      additions,
      removals
    };
  }

  // 生成 ABI 文档
  static generateDocumentation(abi: any[]): string {
    const iface = new ethers.Interface(abi);
    const docs: string[] = [];

    docs.push('# 合约 ABI 文档\n');

    // 函数文档
    const functions = iface.fragments.filter(f => f.type === 'function');
    if (functions.length > 0) {
      docs.push('## 函数\n');
      functions.forEach(func => {
        const fragment = func as any;
        docs.push(`### ${fragment.name}\n`);
        docs.push(`**签名:** \`${fragment.format()}\`\n`);
        docs.push(`**状态可变性:** ${fragment.stateMutability}\n`);
        
        if (fragment.inputs.length > 0) {
          docs.push('**参数:**');
          fragment.inputs.forEach((input: any) => {
            docs.push(`- \`${input.name}\` (${input.type})`);
          });
          docs.push('');
        }

        if (fragment.outputs.length > 0) {
          docs.push('**返回值:**');
          fragment.outputs.forEach((output: any, index: number) => {
            const name = output.name || `返回值${index}`;
            docs.push(`- \`${name}\` (${output.type})`);
          });
          docs.push('');
        }
        docs.push('');
      });
    }

    // 事件文档
    const events = iface.fragments.filter(f => f.type === 'event');
    if (events.length > 0) {
      docs.push('## 事件\n');
      events.forEach(event => {
        const fragment = event as any;
        docs.push(`### ${fragment.name}\n`);
        docs.push(`**签名:** \`${fragment.format()}\`\n`);
        
        if (fragment.inputs.length > 0) {
          docs.push('**参数:**');
          fragment.inputs.forEach((input: any) => {
            const indexed = input.indexed ? ' (indexed)' : '';
            docs.push(`- \`${input.name}\` (${input.type})${indexed}`);
          });
          docs.push('');
        }
        docs.push('');
      });
    }

    // 错误文档
    const errors = iface.fragments.filter(f => f.type === 'error');
    if (errors.length > 0) {
      docs.push('## 错误\n');
      errors.forEach(error => {
        const fragment = error as any;
        docs.push(`### ${fragment.name}\n`);
        docs.push(`**签名:** \`${fragment.format()}\`\n`);
        
        if (fragment.inputs.length > 0) {
          docs.push('**参数:**');
          fragment.inputs.forEach((input: any) => {
            docs.push(`- \`${input.name}\` (${input.type})`);
          });
          docs.push('');
        }
        docs.push('');
      });
    }

    return docs.join('\n');
  }
}

// 使用示例
const validation = ABIBestPractices.validateABI(ERC20_ABI);
console.log('ABI 验证结果:', validation);

const suggestions = ABIBestPractices.getOptimizationSuggestions(ERC20_ABI);
console.log('优化建议:', suggestions);

const documentation = ABIBestPractices.generateDocumentation(ERC20_ABI);
console.log('生成的文档:\n', documentation);
```

## 常见问题

### Q: 如何处理 ABI 版本兼容性问题？
A: 使用 `checkCompatibility` 方法检查 ABI 变化，避免破坏性更改，保持向后兼容。

### Q: 为什么函数调用编码失败？
A: 检查参数类型是否匹配、参数数量是否正确、地址格式是否有效。

### Q: 如何优化 ABI 大小？
A: 移除未使用的函数、合并相似功能、使用更紧凑的数据类型。

### Q: 事件解码失败怎么办？
A: 确认事件签名正确、主题数量匹配、数据格式有效。

## 下一步

- [错误处理](/ethers/contracts/error-handling) - 学习合约错误处理
- [批量调用](/ethers/contracts/batch-calls) - 掌握批量操作
- [交易处理](/ethers/transactions/basics) - 了解交易管理
- [工具函数](/ethers/utils/encoding) - 学习编码解码工具