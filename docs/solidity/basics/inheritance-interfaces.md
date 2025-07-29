# 继承和接口

Solidity 支持面向对象编程中的继承和接口机制，便于代码复用和模块化开发。本章将介绍合约继承、接口定义与实现的用法和最佳实践。

## 合约继承基础

### 继承语法与多重继承

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Parent {
    string public parentName = "Parent";
    function sayHello() public pure returns (string memory) {
        return "Hello from Parent";
    }
}

contract Child is Parent {
    function getParentName() public view returns (string memory) {
        return parentName;
    }
}

// 多重继承
contract A { function foo() public pure returns (string memory) { return "A"; } }
contract B { function bar() public pure returns (string memory) { return "B"; } }
contract C is A, B {}
```

### 菱形继承冲突与 C3 线性化

```solidity
contract X { function who() public pure virtual returns (string memory) { return "X"; } }
contract Y is X { function who() public pure virtual override returns (string memory) { return "Y"; } }
contract Z is X { function who() public pure virtual override returns (string memory) { return "Z"; } }
contract Diamond is Y, Z {
    // 必须明确 override
    function who() public pure override(Y, Z) returns (string memory) {
        return super.who(); // 返回 Z 的实现
    }
}
```
> Solidity 按声明顺序（右侧优先）解决多重继承冲突。

### 继承中的构造函数

```solidity
contract Base {
    uint public x;
    constructor(uint _x) { x = _x; }
}

contract Derived is Base {
    constructor(uint _x) Base(_x * 2) {}
}
```

## 接口（Interface）

接口用于定义标准，不能包含实现，只能声明函数。

```solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MyToken is IERC20 {
    function totalSupply() public pure override returns (uint256) { return 10000; }
    function balanceOf(address) public pure override returns (uint256) { return 0; }
    function transfer(address, uint256) public pure override returns (bool) { return true; }
}
```

### 实战案例：多接口实现

```solidity
interface IName {
    function name() external view returns (string memory);
}
interface ISymbol {
    function symbol() external view returns (string memory);
}
contract MyAsset is IName, ISymbol {
    function name() public pure override returns (string memory) { return "MyAsset"; }
    function symbol() public pure override returns (string memory) { return "MAS"; }
}
```

## 关键点说明

- Solidity 支持多重继承，采用 C3 线性化算法解决菱形继承冲突。
- 子合约可重写父合约的函数，需加 override 关键字。
- 接口不能包含状态变量、构造函数和实现体。
- 合约可实现多个接口。

## 最佳实践

- 合理使用继承，避免过深的继承层级。
- 接口用于定义标准，便于合约间交互和升级。
- 避免菱形继承问题，推荐使用 OpenZeppelin 的合约库。
- 明确使用 virtual/override 标记可重写和已重写的函数。

---

## 下一步操作

1. **动手实践**：尝试编写一个 ERC20 代币合约，继承 OpenZeppelin 的 ERC20 并实现自定义接口。
2. **深入学习**：阅读 OpenZeppelin 源码，理解其多重继承结构。
3. **挑战进阶**：实现一个多接口合约，并在 Remix 上部署测试。
4. **推荐阅读**：
   - [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
   - [Solidity 官方文档：继承](https://docs.soliditylang.org/en/latest/contracts.html#inheritance) 