# 升级合约（Upgradeable Contracts）

升级合约允许在不更换合约地址的情况下，升级合约逻辑，实现长期可维护和灵活扩展的 DApp。

## 升级合约原理

- 通过代理合约（Proxy）与逻辑合约（Implementation）分离
- 用户与代理交互，代理 delegatecall 到当前逻辑合约
- 升级时仅更换逻辑合约地址，数据不变

## 常见升级模式

- Transparent Proxy（透明代理）
- UUPS（Universal Upgradeable Proxy Standard）
- Beacon Proxy

## 升级合约的挑战

- 存储布局兼容性：新旧逻辑合约变量顺序、类型必须一致
- 初始化与构造函数：升级合约不能用 constructor，需用 initializer
- 权限控制：升级操作需严格权限管理

## 实战案例

### 1. OpenZeppelin UUPS 升级合约

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MyUpgradeable is Initializable, UUPSUpgradeable {
    uint256 public value;
    function initialize(uint256 _v) public initializer {
        value = _v;
    }
    function setValue(uint256 _v) public {
        value = _v;
    }
    function _authorizeUpgrade(address) internal override {}
}
```

### 2. 升级流程（Hardhat/OpenZeppelin 插件）

1. 编写逻辑合约 V1、V2
2. 部署代理合约（Proxy）
3. 通过插件执行升级，代理指向新逻辑合约

## 关键点说明

- 升级合约不能用 constructor，需用 initializer 修饰初始化函数
- 存储变量顺序、类型必须严格一致，避免数据损坏
- 升级操作应有多签或严格权限控制
- 推荐用 OpenZeppelin Upgrades 插件自动化升级流程

## 最佳实践

- 充分测试升级流程，确保数据安全
- 记录每次升级的合约地址和版本
- 升级合约应有回退机制，防止升级失败
- 生产环境建议用多签钱包管理升级权限

---

## 下一步操作

1. **动手实践**：用 Hardhat + OpenZeppelin 插件部署并升级一个合约。
2. **进阶挑战**：实现自定义的升级权限和回退机制。
3. **深入阅读**：
   - [OpenZeppelin Upgrades 文档](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
   - [Solidity 官方文档：可升级合约](https://docs.soliditylang.org/en/latest/contracts.html#upgradeability) 