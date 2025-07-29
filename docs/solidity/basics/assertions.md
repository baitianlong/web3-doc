# 断言和要求

断言（assert）和要求（require）是 Solidity 中最常用的条件检查工具，用于保障合约的正确性和安全性。

## require 语句

- 用于输入参数校验、业务条件判断，失败时回退并返回错误信息

```solidity
contract RequireExample {
    function deposit(uint amount) public {
        require(amount > 0, "存入金额必须大于0");
        // ... 业务逻辑
    }
}
```

## assert 语句

- 用于检查不变量和内部严重错误，失败时消耗所有 Gas

```solidity
contract AssertExample {
    uint public total = 100;
    function decrease(uint x) public {
        total -= x;
        assert(total <= 100); // 断言总量不会超过初始值
    }
}
```

## 断言与要求的区别

- require 适合用于外部输入、业务逻辑校验
- assert 仅用于开发阶段的内部不变量检查
- require 失败会返还剩余 Gas，assert 失败会消耗所有 Gas

## 实战案例

### 代币转账中的条件检查

```solidity
contract Token {
    mapping(address => uint) public balances;
    function transfer(address to, uint amount) public {
        require(to != address(0), "收款地址不能为空");
        require(balances[msg.sender] >= amount, "余额不足");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

### 复杂业务中的断言

```solidity
contract Voting {
    mapping(address => bool) public hasVoted;
    uint public totalVotes;
    function vote() public {
        require(!hasVoted[msg.sender], "已投过票");
        hasVoted[msg.sender] = true;
        totalVotes++;
        assert(totalVotes > 0); // 总票数应始终大于0
    }
}
```

## 最佳实践

- 优先使用 require 进行参数和状态校验
- assert 仅用于开发和调试阶段的不变量检查
- 错误信息应简洁明了，便于前端和用户理解
- 生产环境建议用 require 替代 assert

---

## 下一步操作

1. **动手实践**：为你的合约添加合理的 require 和 assert 检查。
2. **进阶挑战**：分析 assert 和 require 的 Gas 消耗差异。
3. **深入阅读**：
   - [Solidity 官方文档：断言和要求](https://docs.soliditylang.org/en/latest/control-structures.html#assert-and-require) 