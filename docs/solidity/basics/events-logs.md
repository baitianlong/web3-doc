# 事件和日志

事件（Event）和日志（Log）是 Solidity 智能合约与外部世界（如前端、后端服务）通信的重要机制。事件可用于链上数据追踪、前端监听、合约调试等场景。

## 事件基础

### 事件声明与触发

```solidity
contract EventDemo {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Message(address sender, string content);

    function transfer(address to, uint256 value) public {
        // ... 省略转账逻辑
        emit Transfer(msg.sender, to, value);
    }

    function sendMessage(string memory content) public {
        emit Message(msg.sender, content);
    }
}
```

### indexed 关键字

- 使用 indexed 可对事件参数建立索引，便于前端和节点高效检索
- 每个事件最多可有 3 个 indexed 参数

```solidity
event OrderCreated(uint indexed orderId, address indexed buyer, uint amount);
```

## 日志（Log）原理

- 事件本质上是 EVM 的日志（Log），存储在区块链的交易收据（receipt）中
- 日志不可在链上直接访问，只能通过 RPC、前端、后端等链下工具查询

## 事件监听

### 前端监听事件（以 ethers.js 为例）

```javascript
// 假设已获取合约实例 contract
contract.on('Transfer', (from, to, value, event) => {
  console.log('转账事件:', from, to, value.toString());
  console.log('区块号:', event.blockNumber);
});
```

### 合约内事件监听（不支持）

- Solidity 合约内无法直接监听事件，只能通过外部服务监听

## 实战案例

### 订单系统中的事件

```solidity
contract OrderManager {
    event OrderCreated(uint indexed orderId, address indexed buyer, uint amount);
    event OrderStatusChanged(uint indexed orderId, string status);

    function createOrder(uint orderId, uint amount) public {
        emit OrderCreated(orderId, msg.sender, amount);
    }

    function updateStatus(uint orderId, string memory status) public {
        emit OrderStatusChanged(orderId, status);
    }
}
```

### 事件与前端交互

- 前端可通过事件实时获取合约状态变化，提升用户体验
- 事件常用于 DApp 的通知、数据同步、历史记录等

## 关键点说明

- 事件参数建议加 indexed，便于检索
- 事件数据不可在链上直接读取，仅供链下监听
- 事件日志不消耗太多 Gas，但过多事件会增加区块大小
- 事件可用于合约调试和链上数据分析

## 最佳实践

- 设计事件时参数要简洁明了，避免冗余
- 重要业务流程建议全程记录事件，便于追溯
- 事件命名建议采用动词+对象，如 Transfer、OrderCreated
- 前端监听事件时注意去重和异常处理

---

## 下一步操作

1. **动手实践**：为你的合约添加事件，并在前端监听和展示事件日志。
2. **进阶挑战**：实现链上订单、投票等系统的全流程事件追踪。
3. **深入阅读**：
   - [Solidity 官方文档：事件](https://docs.soliditylang.org/en/latest/contracts.html#events)
   - [Ethers.js 事件监听](https://docs.ethers.org/v6/getting-started/#listening-for-events) 