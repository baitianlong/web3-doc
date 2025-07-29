---
title: 单位转换
description: Ethers.js 中数值单位转换的完整指南
keywords: [ethers.js, 单位转换, wei, ether, gwei, 数值格式化, BigNumber]
---

# 单位转换

在以太坊开发中，正确处理不同单位之间的转换是至关重要的。Ethers.js 提供了强大的单位转换工具，帮助开发者在 wei、ether、gwei 等单位之间进行精确转换。

## 基础概念

### 1. 以太坊单位体系

```typescript
// 以太坊单位层次结构
const ETHEREUM_UNITS = {
  wei: 1n,                           // 最小单位
  kwei: 1000n,                       // 千 wei
  mwei: 1000000n,                    // 百万 wei
  gwei: 1000000000n,                 // 十亿 wei (Gas 价格常用)
  szabo: 1000000000000n,             // 万亿 wei
  finney: 1000000000000000n,         // 千万亿 wei
  ether: 1000000000000000000n        // 以太币 (10^18 wei)
};

// 常用单位示例
console.log('1 ETH =', ETHEREUM_UNITS.ether.toString(), 'wei');
console.log('1 Gwei =', ETHEREUM_UNITS.gwei.toString(), 'wei');
console.log('Gas 价格通常以 Gwei 为单位');
console.log('代币余额通常以最小单位存储');
```

### 2. 精度和 BigInt

```typescript
import { ethers } from 'ethers';

// JavaScript 数字精度限制
console.log('JavaScript 最大安全整数:', Number.MAX_SAFE_INTEGER);
console.log('1 ETH 的 wei 数量:', 1000000000000000000); // 超出安全范围

// 使用 BigInt 处理大数值
const oneEtherInWei = 1000000000000000000n;
console.log('1 ETH (BigInt):', oneEtherInWei);

// Ethers.js 自动处理 BigInt
const amount = ethers.parseEther('1.5');
console.log('1.5 ETH 类型:', typeof amount); // bigint
console.log('1.5 ETH 值:', amount.toString());
```

## 基础单位转换

### 1. parseEther 和 formatEther

```typescript
import { ethers } from 'ethers';

// 将 ETH 字符串转换为 wei (BigInt)
const ethToWei = ethers.parseEther('1.5');
console.log('1.5 ETH =', ethToWei.toString(), 'wei');

// 将 wei (BigInt) 转换为 ETH 字符串
const weiToEth = ethers.formatEther(ethToWei);
console.log(ethToWei.toString(), 'wei =', weiToEth, 'ETH');

// 处理小数精度
const preciseAmount = ethers.parseEther('0.123456789012345678');
console.log('精确金额:', ethers.formatEther(preciseAmount));

// 处理大数值
const largeAmount = ethers.parseEther('1000000');
console.log('大数值:', ethers.formatEther(largeAmount), 'ETH');

// 边界情况
const zeroAmount = ethers.parseEther('0');
const maxAmount = ethers.parseEther('1000000000'); // 10亿 ETH
console.log('零值:', ethers.formatEther(zeroAmount));
console.log('最大值:', ethers.formatEther(maxAmount));
```

### 2. parseUnits 和 formatUnits

```typescript
// 通用单位转换函数
function demonstrateUnitsConversion() {
  // 不同精度的代币
  const tokens = [
    { name: 'USDC', decimals: 6, amount: '1000.50' },
    { name: 'WBTC', decimals: 8, amount: '0.12345678' },
    { name: 'DAI', decimals: 18, amount: '500.123456789012345678' },
    { name: 'USDT', decimals: 6, amount: '2500.99' }
  ];

  tokens.forEach(token => {
    // 解析：字符串 -> 最小单位 (BigInt)
    const parsed = ethers.parseUnits(token.amount, token.decimals);
    console.log(`${token.name} 解析:`, {
      input: token.amount,
      decimals: token.decimals,
      output: parsed.toString(),
      formatted: ethers.formatUnits(parsed, token.decimals)
    });
  });

  // Gwei 转换 (Gas 价格常用)
  const gasPriceGwei = '20.5';
  const gasPriceWei = ethers.parseUnits(gasPriceGwei, 'gwei');
  console.log('Gas 价格转换:', {
    gwei: gasPriceGwei,
    wei: gasPriceWei.toString(),
    backToGwei: ethers.formatUnits(gasPriceWei, 'gwei')
  });

  // 支持的命名单位
  const namedUnits = ['wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether'];
  namedUnits.forEach(unit => {
    const amount = ethers.parseUnits('1', unit);
    console.log(`1 ${unit} =`, amount.toString(), 'wei');
  });
}

demonstrateUnitsConversion();
```

## 高级单位转换工具

### 1. 单位转换器类

```typescript
interface ConversionResult {
  value: bigint;
  formatted: string;
  decimals: number;
  unit: string;
}

class UnitConverter {
  // 预定义的单位映射
  private static readonly NAMED_UNITS: Record<string, number> = {
    'wei': 0,
    'kwei': 3,
    'mwei': 6,
    'gwei': 9,
    'szabo': 12,
    'finney': 15,
    'ether': 18
  };

  // 解析数值到最小单位
  static parse(value: string | number, decimals: number | string): ConversionResult {
    const decimalPlaces = typeof decimals === 'string' 
      ? this.NAMED_UNITS[decimals] ?? 18 
      : decimals;

    const parsed = ethers.parseUnits(value.toString(), decimalPlaces);
    
    return {
      value: parsed,
      formatted: ethers.formatUnits(parsed, decimalPlaces),
      decimals: decimalPlaces,
      unit: typeof decimals === 'string' ? decimals : `${decimalPlaces}位小数`
    };
  }

  // 格式化最小单位到可读格式
  static format(
    value: bigint | string, 
    decimals: number | string,
    options?: {
      precision?: number;
      useGrouping?: boolean;
      locale?: string;
    }
  ): string {
    const decimalPlaces = typeof decimals === 'string' 
      ? this.NAMED_UNITS[decimals] ?? 18 
      : decimals;

    const formatted = ethers.formatUnits(value.toString(), decimalPlaces);
    
    if (!options) return formatted;

    const num = parseFloat(formatted);
    
    return num.toLocaleString(options.locale || 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: options.precision ?? decimalPlaces,
      useGrouping: options.useGrouping ?? true
    });
  }

  // 单位之间转换
  static convert(
    value: string | bigint,
    fromDecimals: number | string,
    toDecimals: number | string
  ): ConversionResult {
    const fromDecimalPlaces = typeof fromDecimals === 'string' 
      ? this.NAMED_UNITS[fromDecimals] ?? 18 
      : fromDecimals;
    
    const toDecimalPlaces = typeof toDecimals === 'string' 
      ? this.NAMED_UNITS[toDecimals] ?? 18 
      : toDecimals;

    // 如果输入是字符串，先解析为 BigInt
    let bigintValue: bigint;
    if (typeof value === 'string') {
      bigintValue = ethers.parseUnits(value, fromDecimalPlaces);
    } else {
      bigintValue = value;
    }

    // 转换到目标精度
    const difference = toDecimalPlaces - fromDecimalPlaces;
    let convertedValue: bigint;

    if (difference > 0) {
      // 增加精度
      convertedValue = bigintValue * (10n ** BigInt(difference));
    } else if (difference < 0) {
      // 减少精度
      convertedValue = bigintValue / (10n ** BigInt(-difference));
    } else {
      // 精度相同
      convertedValue = bigintValue;
    }

    return {
      value: convertedValue,
      formatted: ethers.formatUnits(convertedValue, toDecimalPlaces),
      decimals: toDecimalPlaces,
      unit: typeof toDecimals === 'string' ? toDecimals : `${toDecimalPlaces}位小数`
    };
  }

  // 批量转换
  static batchConvert(
    values: Array<{ value: string; decimals: number | string }>,
    targetDecimals: number | string
  ): ConversionResult[] {
    return values.map(item => 
      this.convert(item.value, item.decimals, targetDecimals)
    );
  }

  // 计算百分比
  static calculatePercentage(
    part: bigint | string,
    total: bigint | string,
    decimals: number | string,
    precision: number = 2
  ): string {
    const partBigInt = typeof part === 'string' 
      ? ethers.parseUnits(part, decimals) 
      : part;
    
    const totalBigInt = typeof total === 'string' 
      ? ethers.parseUnits(total, decimals) 
      : total;

    if (totalBigInt === 0n) return '0';

    // 使用高精度计算百分比
    const percentage = (partBigInt * 10000n) / totalBigInt;
    const percentageFloat = Number(percentage) / 100;

    return percentageFloat.toFixed(precision);
  }

  // 验证数值格式
  static validateAmount(
    value: string,
    decimals: number | string,
    options?: {
      min?: string;
      max?: string;
      allowZero?: boolean;
    }
  ): { valid: boolean; error?: string; parsed?: bigint } {
    try {
      const decimalPlaces = typeof decimals === 'string' 
        ? this.NAMED_UNITS[decimals] ?? 18 
        : decimals;

      // 检查基本格式
      if (!/^\d*\.?\d*$/.test(value)) {
        return { valid: false, error: '无效的数字格式' };
      }

      // 检查小数位数
      const decimalIndex = value.indexOf('.');
      if (decimalIndex !== -1) {
        const fractionalPart = value.slice(decimalIndex + 1);
        if (fractionalPart.length > decimalPlaces) {
          return { 
            valid: false, 
            error: `小数位数不能超过 ${decimalPlaces} 位` 
          };
        }
      }

      const parsed = ethers.parseUnits(value, decimalPlaces);

      // 检查零值
      if (!options?.allowZero && parsed === 0n) {
        return { valid: false, error: '数值不能为零' };
      }

      // 检查最小值
      if (options?.min) {
        const minValue = ethers.parseUnits(options.min, decimalPlaces);
        if (parsed < minValue) {
          return { 
            valid: false, 
            error: `数值不能小于 ${options.min}` 
          };
        }
      }

      // 检查最大值
      if (options?.max) {
        const maxValue = ethers.parseUnits(options.max, decimalPlaces);
        if (parsed > maxValue) {
          return { 
            valid: false, 
            error: `数值不能大于 ${options.max}` 
          };
        }
      }

      return { valid: true, parsed };

    } catch (error) {
      return { 
        valid: false, 
        error: `解析失败: ${(error as Error).message}` 
      };
    }
  }
}
```

### 2. 使用示例

```typescript
// 基础转换示例
function basicConversionExamples() {
  console.log('=== 基础转换示例 ===');

  // ETH 转换
  const ethAmount = UnitConverter.parse('1.5', 'ether');
  console.log('ETH 转换:', ethAmount);

  // USDC 转换 (6位小数)
  const usdcAmount = UnitConverter.parse('1000.50', 6);
  console.log('USDC 转换:', usdcAmount);

  // 格式化显示
  const formatted = UnitConverter.format(ethAmount.value, 'ether', {
    precision: 4,
    useGrouping: true,
    locale: 'zh-CN'
  });
  console.log('格式化显示:', formatted);
}

// 单位转换示例
function unitConversionExamples() {
  console.log('=== 单位转换示例 ===');

  // ETH 转 Gwei
  const ethToGwei = UnitConverter.convert('1', 'ether', 'gwei');
  console.log('1 ETH =', ethToGwei.formatted, 'Gwei');

  // USDC 转 DAI (不同精度)
  const usdcToDai = UnitConverter.convert('1000', 6, 18);
  console.log('1000 USDC (6位) =', usdcToDai.formatted, 'DAI (18位)');

  // 批量转换
  const amounts = [
    { value: '100', decimals: 6 },    // USDC
    { value: '0.1', decimals: 8 },    // WBTC
    { value: '1000', decimals: 18 }   // DAI
  ];

  const converted = UnitConverter.batchConvert(amounts, 'ether');
  console.log('批量转换到 ETH:', converted);
}

// 百分比计算示例
function percentageExamples() {
  console.log('=== 百分比计算示例 ===');

  const totalSupply = ethers.parseEther('1000000'); // 100万 ETH
  const userBalance = ethers.parseEther('5000');    // 5000 ETH

  const percentage = UnitConverter.calculatePercentage(
    userBalance,
    totalSupply,
    'ether',
    4
  );

  console.log('用户持有比例:', percentage + '%');
}

// 数值验证示例
function validationExamples() {
  console.log('=== 数值验证示例 ===');

  const testCases = [
    { value: '1.5', decimals: 18, options: { min: '0.1', max: '10' } },
    { value: '0.123456789012345678', decimals: 18 },
    { value: '1000.1234567', decimals: 6 }, // 超出精度
    { value: '0', decimals: 18, options: { allowZero: false } },
    { value: 'abc', decimals: 18 } // 无效格式
  ];

  testCases.forEach((testCase, index) => {
    const result = UnitConverter.validateAmount(
      testCase.value,
      testCase.decimals,
      testCase.options
    );
    
    console.log(`测试 ${index + 1}:`, {
      input: testCase.value,
      result: result.valid ? '有效' : '无效',
      error: result.error,
      parsed: result.parsed?.toString()
    });
  });
}

// 运行所有示例
basicConversionExamples();
unitConversionExamples();
percentageExamples();
validationExamples();
```

## 实际应用场景

### 1. 代币余额显示

```typescript
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

class TokenBalanceFormatter {
  private tokens: Map<string, TokenInfo> = new Map();

  // 注册代币信息
  registerToken(token: TokenInfo): void {
    this.tokens.set(token.address.toLowerCase(), token);
  }

  // 格式化代币余额
  formatBalance(
    tokenAddress: string,
    rawBalance: bigint | string,
    options?: {
      precision?: number;
      showSymbol?: boolean;
      useGrouping?: boolean;
      locale?: string;
    }
  ): string {
    const token = this.tokens.get(tokenAddress.toLowerCase());
    if (!token) {
      throw new Error(`未知代币: ${tokenAddress}`);
    }

    const formatted = UnitConverter.format(rawBalance, token.decimals, {
      precision: options?.precision ?? 4,
      useGrouping: options?.useGrouping ?? true,
      locale: options?.locale
    });

    return options?.showSymbol !== false 
      ? `${formatted} ${token.symbol}`
      : formatted;
  }

  // 批量格式化余额
  formatMultipleBalances(
    balances: Array<{
      tokenAddress: string;
      balance: bigint | string;
    }>,
    options?: {
      precision?: number;
      showSymbol?: boolean;
      useGrouping?: boolean;
      locale?: string;
    }
  ): Array<{
    tokenAddress: string;
    symbol: string;
    formattedBalance: string;
    rawBalance: string;
  }> {
    return balances.map(item => {
      const token = this.tokens.get(item.tokenAddress.toLowerCase());
      if (!token) {
        throw new Error(`未知代币: ${item.tokenAddress}`);
      }

      return {
        tokenAddress: item.tokenAddress,
        symbol: token.symbol,
        formattedBalance: this.formatBalance(item.tokenAddress, item.balance, options),
        rawBalance: item.balance.toString()
      };
    });
  }

  // 计算总价值 (需要价格数据)
  calculateTotalValue(
    balances: Array<{
      tokenAddress: string;
      balance: bigint | string;
      priceUSD: number;
    }>
  ):