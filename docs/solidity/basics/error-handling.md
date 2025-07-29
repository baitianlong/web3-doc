# 错误处理

Solidity 提供了多种错误处理机制，保障合约的安全性和健壮性。常用的有 require、revert、assert 语句，以及自定义错误。

## require 语句

- 用于条件检查，失败时回退并返回错误信息

```solidity
contract RequireDemo {
    function transfer(uint amount) public {
        require(amount > 0, "转账金额必须大于0");
        // ... 业务逻辑
    }
}
```

## revert 语句

- 主动回退交易，可自定义错误信息

```solidity
contract RevertDemo {
    function withdraw(uint amount) public {
        if (amount == 0) {
            revert("提现金额不能为0");
        }
        // ... 业务逻辑
    }
}
```

## assert 语句

- 用于检查不变量和严重错误，失败时消耗所有 Gas

```solidity
contract AssertDemo {
    uint public total = 100;
    function decrease(uint x) public {
        total -= x;
        assert(total <= 100); // 断言总量不会超过初始值
    }
}
```

## try/catch 异常捕获

- 仅适用于外部合约调用和 new 创建合约

```solidity
contract TryCatchDemo {
    function callOther(address other) public returns (bool) {
        (bool success, ) = other.call(abi.encodeWithSignature("foo()"));
        if (!success) {
            // 处理失败
            return false;
        }
        return true;
    }
}

contract External {
    function foo() external pure {
        require(false, "外部调用失败");
    }
}
```

## 实战案例

### 资金池合约中的错误处理

```solidity
contract Pool {
    mapping(address => uint) public balances;
    function deposit() public payable {
        require(msg.value > 0, "必须存入正数");
        balances[msg.sender] += msg.value;
    }
    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "余额不足");
        balances[msg.sender] -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "转账失败");
    }
}
```

## 关键点说明

- require 用于输入校验和业务条件判断
- revert 用于复杂条件下的主动回退
- assert 仅用于检查不变量和内部严重错误
- try/catch 适合捕获外部合约异常
- 错误信息应简洁明了，便于前端和用户理解

## 最佳实践

- 优先使用 require 进行参数和状态校验
- 不要滥用 assert，避免无谓的 Gas 损失
- 错误信息建议用英文，便于国际化
- 复杂业务建议自定义错误（见下节）

---

## 下一步操作

1. **动手实践**：为你的合约添加参数校验和错误处理逻辑。
2. **进阶挑战**：实现多合约调用下的 try/catch 异常捕获。
3. **深入阅读**：
   - [Solidity 官方文档：错误处理](https://docs.soliditylang.org/en/latest/control-structures.html#error-handling-assert-require-revert-and-exceptions) 