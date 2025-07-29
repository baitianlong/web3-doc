# ERC-20 代币标准

ERC-20 是以太坊上最常用的代币标准，定义了一组通用的接口，使代币在钱包、交易所、DApp 等之间具有良好的互操作性。

## 标准简介

- ERC-20 由以太坊社区提出，编号为 [EIP-20](https://eips.ethereum.org/EIPS/eip-20)
- 适用于同质化（Fungible）代币，如 USDT、USDC、DAI 等

## 接口定义

```solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

## 主要函数说明

- `totalSupply()`：返回代币总供应量
- `balanceOf(address)`：查询账户余额
- `transfer(address,uint)`：转账给其他地址
- `approve(address,uint)`：授权第三方支配代币
- `transferFrom(address,address,uint)`：第三方转账（如 DEX、合约）
- `allowance(address,address)`：查询授权额度

## 实战案例：最简 ERC-20 实现

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleERC20 {
    string public name = "DemoToken";
    string public symbol = "DMT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
```

## 关键点说明

- 事件 Transfer、Approval 必须实现
- decimals 通常为 18，但不是强制
- 建议使用 OpenZeppelin 的 ERC20 实现，安全性更高
- 授权（approve）和转账（transferFrom）常用于 DEX、DeFi

## 最佳实践

- 遵循标准接口，确保兼容性
- 事件参数加 indexed，便于检索
- 防止授权重入攻击（如“先置零再授权”）
- 生产环境建议用 OpenZeppelin ERC20

---

## 下一步操作

1. **动手实践**：用 OpenZeppelin 部署一个自定义 ERC-20 代币。
2. **进阶挑战**：实现带手续费、黑名单等扩展功能。
3. **深入阅读**：
   - [EIP-20 标准](https://eips.ethereum.org/EIPS/eip-20)
   - [OpenZeppelin ERC20 文档](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20) 