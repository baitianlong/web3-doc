# 库和导入

Solidity 支持库（Library）和导入（Import）机制，便于代码复用、模块化和安全性提升。本章将介绍库的定义、使用方法以及导入外部合约的方式。

## 库（Library）基础

### 库的定义与使用

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Math {
    function add(uint a, uint b) internal pure returns (uint) {
        return a + b;
    }
}

contract Calculator {
    function sum(uint x, uint y) public pure returns (uint) {
        return Math.add(x, y);
    }
}
```

### 使用 using for 语法

```solidity
library ArrayUtils {
    function sum(uint[] storage self) internal view returns (uint total) {
        for (uint i = 0; i < self.length; i++) {
            total += self[i];
        }
    }
}

contract Data {
    using ArrayUtils for uint[];
    uint[] public numbers;
    function getSum() public view returns (uint) {
        return numbers.sum();
    }
}
```

### 部署为外部库（External Library）

```solidity
library ExternalLib {
    function mul(uint a, uint b) external pure returns (uint) {
        return a * b;
    }
}

contract UseExternalLib {
    function multiply(uint x, uint y) public pure returns (uint) {
        return ExternalLib.mul(x, y);
    }
}
```
> 部署外部库时需在编译和部署阶段链接库地址。

## 导入（Import）机制

### 导入语法

```solidity
import "./MyLibrary.sol";
import "@openzeppelin/contracts/utils/Address.sol";
```

- 可以导入本地文件或 NPM 包中的合约/库
- 支持相对路径和绝对路径

### 实战案例：导入 OpenZeppelin 库

1. 安装依赖  
   ```bash
   npm install @openzeppelin/contracts
   ```
2. 在合约中导入  
   ```solidity
   import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
   contract MyToken is ERC20 {
       constructor() ERC20("MyToken", "MTK") {
           _mint(msg.sender, 10000 * 10 ** decimals());
       }
   }
   ```

## 关键点说明

- 库函数通常声明为 internal 或 pure/view
- 库不能存储状态变量，不能接收 ETH
- 库可部署为独立合约（external library），也可内联到调用合约
- 导入路径建议规范管理，便于项目维护

## 最佳实践

- 推荐使用 OpenZeppelin 等社区审计过的库
- 充分利用库提升代码复用性和安全性
- 导入路径统一管理，避免路径混乱
- 使用 using for 提升数据结构操作的可读性

---

## 下一步操作

1. **动手实践**：尝试自定义一个库，并在多个合约中复用。
2. **实战演练**：在 Hardhat/Foundry 项目中导入 OpenZeppelin 库，部署并调用其安全函数。
3. **进阶挑战**：部署并链接 external library，体验库合约的独立升级。
4. **推荐阅读**：
   - [OpenZeppelin Contracts 文档](https://docs.openzeppelin.com/contracts)
   - [Solidity 官方文档：库](https://docs.soliditylang.org/en/latest/contracts.html#libraries) 