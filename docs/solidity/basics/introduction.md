# Solidity 简介

Solidity 是一种面向对象的高级编程语言，专门用于编写在以太坊虚拟机（EVM）上运行的智能合约。

## 什么是 Solidity

Solidity 是一种静态类型语言，语法类似于 JavaScript，但具有以下特点：

- **静态类型**：变量类型在编译时确定
- **面向对象**：支持继承、多态等面向对象特性
- **合约导向**：专门为智能合约设计
- **EVM 兼容**：编译为 EVM 字节码

## 基本语法

### Hello World 合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    
    constructor() {
        message = "Hello, World!";
    }
    
    function setMessage(string memory _message) public {
        message = _message;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}
```

### 关键组成部分

1. **许可证标识符**：`// SPDX-License-Identifier: MIT`
2. **版本声明**：`pragma solidity ^0.8.0;`
3. **合约定义**：`contract HelloWorld { ... }`
4. **状态变量**：`string public message;`
5. **构造函数**：`constructor() { ... }`
6. **函数**：`function setMessage(...) { ... }`

## 使用场景

### 1. 去中心化金融 (DeFi)
- 代币合约 (ERC-20, ERC-721)
- 去中心化交易所 (DEX)
- 借贷协议
- 流动性挖矿

### 2. NFT 和数字收藏品
- 艺术品 NFT
- 游戏道具
- 数字身份证明
- 版权保护

### 3. 去中心化自治组织 (DAO)
- 治理代币
- 投票机制
- 资金管理
- 提案系统

### 4. 供应链管理
- 商品溯源
- 质量认证
- 物流跟踪
- 防伪验证

## 开发环境设置

### 推荐工具

1. **Remix IDE**：在线开发环境
2. **Hardhat**：本地开发框架
3. **Truffle**：开发和测试框架
4. **MetaMask**：浏览器钱包

### 快速开始

```bash
# 安装 Node.js 和 npm
npm install -g @remix-project/remixd

# 或使用 Hardhat
npm install --save-dev hardhat
npx hardhat
```

## 下一步

- [数据类型](/basics/data-types) - 学习 Solidity 的基本数据类型
- [变量和常量](/basics/variables) - 了解变量声明和使用
- [函数](/basics/functions) - 掌握函数定义和调用