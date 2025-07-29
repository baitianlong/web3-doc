# 代理模式（Proxy Patterns）

代理模式是一种智能合约设计模式，通过代理合约转发调用，实现合约的可升级、权限控制和逻辑分离。

## 代理模式基础

- 代理合约（Proxy）负责接收和转发调用
- 实现合约（Implementation/Logic）包含实际业务逻辑
- 用户与代理交互，代理再 delegatecall 到实现合约

## 常见代理模式

### 1. 最小代理（Minimal Proxy, EIP-1167）

- 适合批量部署轻量合约（如工厂模式）
- 节省 Gas，部署高效

```solidity
contract MinimalProxyFactory {
    function clone(address implementation) external returns (address instance) {
        bytes20 targetBytes = bytes20(implementation);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf3)
            instance := create(0, clone, 0x37)
        }
    }
}
```

### 2. 通用代理（Transparent/UUPS/Beacon）

- Transparent Proxy：OpenZeppelin 标准，分为 Proxy、Admin、Logic 三合约
- UUPS Proxy：逻辑合约自带升级函数，节省存储
- Beacon Proxy：多合约共用升级点，适合批量升级

```solidity
// 以 OpenZeppelin Transparent Proxy 为例
// 代理合约（Proxy）
contract Proxy {
    address public implementation;
    constructor(address _impl) { implementation = _impl; }
    fallback() external payable {
        address impl = implementation;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

## 实战案例

### 可升级代币合约（UUPS）

```solidity
// 逻辑合约
contract MyTokenV1 {
    uint public value;
    function setValue(uint _v) public { value = _v; }
}

// 代理合约见上
// 升级逻辑由新合约实现
contract MyTokenV2 {
    uint public value;
    function setValue(uint _v) public { value = _v * 2; }
}
```

## 关键点说明

- 代理合约使用 delegatecall，数据存储在代理自身
- 升级需注意存储布局兼容
- 代理合约部署和调用更复杂，需配合前端/工具
- 推荐使用 OpenZeppelin Upgrades 插件

## 最佳实践

- 采用社区成熟的代理实现（如 OpenZeppelin）
- 升级逻辑前充分测试，避免存储冲突
- 代理合约应有权限控制，防止恶意升级
- 记录升级历史，便于追溯

---

## 下一步操作

1. **动手实践**：用 OpenZeppelin 插件部署一个可升级合约。
2. **进阶挑战**：实现自定义的最小代理工厂。
3. **深入阅读**：
   - [OpenZeppelin Upgrades 文档](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
   - [EIP-1967 代理标准](https://eips.ethereum.org/EIPS/eip-1967)
   - [EIP-1167 Minimal Proxy](https://eips.ethereum.org/EIPS/eip-1167) 