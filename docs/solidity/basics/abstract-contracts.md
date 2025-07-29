# 抽象合约

抽象合约（Abstract Contract）是指包含至少一个未实现函数的合约，不能被直接部署，只能被继承和实现。抽象合约常用于定义通用模板和标准。

## 抽象合约基础

### 抽象合约定义与用法

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Animal {
    function speak() public view virtual returns (string memory);
}

contract Dog is Animal {
    function speak() public pure override returns (string memory) {
        return "Woof!";
    }
}

contract Cat is Animal {
    function speak() public pure override returns (string memory) {
        return "Meow!";
    }
}
```

### 抽象合约与接口的区别

- 抽象合约可以包含已实现的函数和状态变量
- 接口只能声明函数，不能有实现和状态变量

### 实战案例：抽象合约+接口

```solidity
interface IShape {
    function area() external view returns (uint);
}

abstract contract Shape is IShape {
    function area() public view virtual override returns (uint);
    function description() public pure returns (string memory) {
        return "This is a shape";
    }
}

contract Square is Shape {
    uint public side;
    constructor(uint _side) { side = _side; }
    function area() public view override returns (uint) {
        return side * side;
    }
}
```

### 典型应用场景

- 设计可扩展的合约体系结构（如 ERC 标准、模板合约）
- 作为基础模板，强制子合约实现特定逻辑
- 升级合约模式（如 UUPS、Proxy）

## 关键点说明

- 抽象合约中未实现的函数需加 virtual 关键字
- 继承抽象合约的子合约必须实现所有未实现的函数
- 抽象合约不能被直接部署

## 最佳实践

- 用抽象合约定义通用逻辑和接口，便于代码复用
- 结合 virtual/override 明确函数可重写性
- 推荐与接口结合使用，提升合约的可扩展性和安全性

---

## 下一步操作

1. **动手实践**：编写一个抽象合约，定义通用的业务逻辑，并实现多个子合约。
2. **进阶挑战**：结合接口和抽象合约，实现一个多边形面积计算合约体系。
3. **深入阅读**：
   - [Solidity 官方文档：抽象合约](https://docs.soliditylang.org/en/latest/contracts.html#abstract-contracts)
   - [OpenZeppelin 升级合约模式](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies) 