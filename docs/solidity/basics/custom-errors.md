# 自定义错误

自定义错误（Custom Error）是 Solidity 0.8.4+ 引入的高效错误处理机制。相比字符串错误，自定义错误更省 Gas，适合复杂合约和库。

## 自定义错误声明与使用

```solidity
contract CustomErrorDemo {
    error Unauthorized(address caller);
    error InsufficientBalance(uint requested, uint available);

    address public owner;
    mapping(address => uint) public balances;

    constructor() {
        owner = msg.sender;
    }

    function withdraw(uint amount) public {
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender);
        }
        uint bal = balances[msg.sender];
        if (amount > bal) {
            revert InsufficientBalance(amount, bal);
        }
        balances[msg.sender] -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Transfer failed");
    }
}
```

## 自定义错误的优势

- 节省 Gas（不携带字符串）
- 可携带参数，便于调试和前端处理
- 适合库、复杂合约和多条件分支

## 实战案例

### 订单合约中的自定义错误

```solidity
contract OrderManager {
    error InvalidStatus(uint orderId, uint8 status);
    error OnlyBuyer(address caller);

    struct Order {
        address buyer;
        uint amount;
        uint8 status; // 0: Created, 1: Paid, 2: Shipped
    }
    mapping(uint => Order) public orders;

    function updateStatus(uint orderId, uint8 newStatus) public {
        Order storage order = orders[orderId];
        if (msg.sender != order.buyer) {
            revert OnlyBuyer(msg.sender);
        }
        if (newStatus > 2) {
            revert InvalidStatus(orderId, newStatus);
        }
        order.status = newStatus;
    }
}
```

## 关键点说明

- 自定义错误用 error 关键字声明，推荐放在合约或库开头
- 可带参数，便于链下调试和前端处理
- 使用 revert ErrorName(...) 触发
- 仅支持 revert，不支持 require/assert

## 最佳实践

- 复杂合约建议优先使用自定义错误，提升效率和可维护性
- 错误命名建议简洁明了，参数含义清晰
- 可结合 require/revert 进行多层次错误处理

---

## 下一步操作

1. **动手实践**：将你的合约错误处理改为自定义错误，测试 Gas 优化效果。
2. **进阶挑战**：实现带参数的自定义错误，并在前端解析错误信息。
3. **深入阅读**：
   - [Solidity 官方文档：自定义错误](https://docs.soliditylang.org/en/latest/control-structures.html#custom-errors) 