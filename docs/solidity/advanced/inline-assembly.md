# 内联汇编（Inline Assembly）

内联汇编（inline assembly）允许在 Solidity 合约中直接嵌入底层 EVM 汇编代码，适用于性能优化、底层操作和特殊场景。

## 基础语法

- 使用 assembly 关键字包裹汇编代码块
- 支持 Yul 语法（Solidity 0.5+ 推荐）

```solidity
contract AssemblyDemo {
    function add(uint a, uint b) public pure returns (uint result) {
        assembly {
            result := add(a, b)
        }
    }
}
```

## 常见用途

- 访问/修改存储槽（storage slot）
- 直接操作 calldata、memory
- 实现高效的数学运算
- 兼容性处理（如 delegatecall、callcode）

## 实战案例

### 1. 读取合约存储槽

```solidity
contract StorageSlot {
    uint256 public value = 42;
    function getSlot() public view returns (uint slotValue) {
        assembly {
            // slot 0 存储 value
            slotValue := sload(0)
        }
    }
}
```

### 2. 直接操作 memory

```solidity
contract MemoryOps {
    function getFirstByte(bytes memory data) public pure returns (byte b) {
        assembly {
            b := mload(add(data, 32)) // bytes 前32字节为长度
        }
    }
}
```

### 3. 高效实现 uint256 乘法

```solidity
contract MulOpt {
    function mul(uint a, uint b) public pure returns (uint) {
        uint result;
        assembly { result := mul(a, b) }
        return result;
    }
}
```

### 4. 低级调用（delegatecall）

```solidity
contract DelegateCaller {
    function call(address target, bytes memory data) public returns (bool, bytes memory) {
        assembly {
            let succeeded := delegatecall(gas(), target, add(data, 32), mload(data), 0, 0)
            let size := returndatasize()
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, size)
            return(ptr, size)
        }
    }
}
```

## 关键点说明

- 内联汇编可极大提升灵活性，但易出错且难以调试
- 推荐仅在必要时使用，优先用 Solidity 原生语法
- 汇编代码需注意安全性，避免重入、溢出等漏洞
- Yul 语法更现代，建议新项目采用

## 最佳实践

- 仅在性能瓶颈或特殊需求下使用内联汇编
- 汇编块内变量命名应清晰，注释详细
- 充分测试和审计汇编代码
- 避免直接操作合约关键存储槽

---

## 下一步操作

1. **动手实践**：实现一个用内联汇编优化的数学函数。
2. **进阶挑战**：用汇编实现自定义的代理调用或存储操作。
3. **深入阅读**：
   - [Solidity 官方文档：内联汇编](https://docs.soliditylang.org/en/latest/assembly.html)
   - [Yul 语言文档](https://docs.soliditylang.org/en/latest/yul.html) 