# 控制结构

控制结构用于控制程序的执行流程，包括条件语句、循环语句和跳转语句。在智能合约中，合理使用控制结构对于实现复杂的业务逻辑和优化 Gas 消耗至关重要。

## 条件语句

### if-else 语句

```solidity
contract ConditionalStatements {
    mapping(address => uint) public balances;
    mapping(address => bool) public isVIP;
    
    function transfer(address to, uint amount) public {
        uint balance = balances[msg.sender];
        
        // 基本 if 语句
        if (balance < amount) {
            revert("Insufficient balance");
        }
        
        // if-else 语句
        if (isVIP[msg.sender]) {
            // VIP 用户免手续费
            balances[msg.sender] = balance - amount;
            balances[to] += amount;
        } else {
            // 普通用户收取 1% 手续费
            uint fee = amount / 100;
            uint transferAmount = amount - fee;
            
            balances[msg.sender] = balance - amount;
            balances[to] += transferAmount;
            balances[address(this)] += fee;  // 手续费给合约
        }
    }
    
    function getTransferFee(address user, uint amount) public view returns (uint) {
        // 嵌套 if-else
        if (isVIP[user]) {
            return 0;
        } else {
            if (amount >= 10000) {
                return amount / 200;  // 0.5% 手续费（大额优惠）
            } else if (amount >= 1000) {
                return amount / 100;  // 1% 手续费
            } else {
                return amount / 50;   // 2% 手续费（小额手续费高）
            }
        }
    }
}
```

### 三元运算符

```solidity
contract TernaryOperator {
    uint public maxSupply = 1000000;
    
    function calculateBonus(uint amount, bool isPremium) public pure returns (uint) {
        // 基本三元运算符
        uint bonus = isPremium ? amount / 10 : amount / 20;
        return bonus;
    }
    
    function getStatus(uint value) public view returns (string memory) {
        // 嵌套三元运算符
        return value > maxSupply ? "Exceeds limit" : 
               value > maxSupply / 2 ? "High value" : 
               value > 0 ? "Normal" : "Invalid";
    }
    
    function min(uint a, uint b) public pure returns (uint) {
        return a < b ? a : b;
    }
    
    function max(uint a, uint b) public pure returns (uint) {
        return a > b ? a : b;
    }
}
```

## 循环语句

### for 循环

```solidity
contract ForLoops {
    uint[] public numbers;
    mapping(address => uint[]) public userTransactions;
    
    function addNumbers(uint count) public {
        // 基本 for 循环
        for (uint i = 0; i < count; i++) {
            numbers.push(i + 1);
        }
    }
    
    function calculateSum() public view returns (uint) {
        uint sum = 0;
        // 遍历数组
        for (uint i = 0; i < numbers.length; i++) {
            sum += numbers[i];
        }
        return sum;
    }
    
    function batchTransfer(
        address[] memory recipients,
        uint[] memory amounts
    ) public {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        // 批量操作
        for (uint i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            
            // 执行转账逻辑
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }
    
    function findMaxValue() public view returns (uint maxValue, uint maxIndex) {
        require(numbers.length > 0, "Array is empty");
        
        maxValue = numbers[0];
        maxIndex = 0;
        
        // 查找最大值
        for (uint i = 1; i < numbers.length; i++) {
            if (numbers[i] > maxValue) {
                maxValue = numbers[i];
                maxIndex = i;
            }
        }
    }
    
    function _transfer(address from, address to, uint amount) internal {
        // 转账逻辑实现
    }
}
```

### while 循环

```solidity
contract WhileLoops {
    function calculatePower(uint base, uint exponent) public pure returns (uint) {
        uint result = 1;
        uint counter = 0;
        
        // while 循环计算幂
        while (counter < exponent) {
            result *= base;
            counter++;
        }
        
        return result;
    }
    
    function findFirstDivisor(uint number) public pure returns (uint) {
        require(number > 1, "Number must be greater than 1");
        
        uint divisor = 2;
        
        // 查找第一个除数
        while (divisor * divisor <= number) {
            if (number % divisor == 0) {
                return divisor;
            }
            divisor++;
        }
        
        return number;  // 质数
    }
    
    function processQueue(uint[] memory queue) public pure returns (uint[] memory) {
        uint[] memory processed = new uint[](queue.length);
        uint index = 0;
        uint processedCount = 0;
        
        // 处理队列中的元素
        while (index < queue.length) {
            if (queue[index] > 0) {
                processed[processedCount] = queue[index] * 2;
                processedCount++;
            }
            index++;
        }
        
        // 调整数组大小
        uint[] memory result = new uint[](processedCount);
        for (uint i = 0; i < processedCount; i++) {
            result[i] = processed[i];
        }
        
        return result;
    }
}
```

### do-while 循环

```solidity
contract DoWhileLoops {
    function generateSequence(uint start, uint multiplier) public pure returns (uint[] memory) {
        uint[] memory sequence = new uint[](10);
        uint current = start;
        uint index = 0;
        
        // do-while 循环生成序列
        do {
            sequence[index] = current;
            current *= multiplier;
            index++;
        } while (index < 10 && current < 1000000);
        
        return sequence;
    }
    
    function findGCD(uint a, uint b) public pure returns (uint) {
        // 使用欧几里得算法
        do {
            uint temp = b;
            b = a % b;
            a = temp;
        } while (b != 0);
        
        return a;
    }
}
```

## 跳转语句

### break 和 continue

```solidity
contract JumpStatements {
    function findPrimes(uint limit) public pure returns (uint[] memory) {
        uint[] memory primes = new uint[](limit);
        uint primeCount = 0;
        
        for (uint num = 2; num <= limit; num++) {
            bool isPrime = true;
            
            // 检查是否为质数
            for (uint i = 2; i * i <= num; i++) {
                if (num % i == 0) {
                    isPrime = false;
                    break;  // 找到除数，跳出内层循环
                }
            }
            
            if (!isPrime) {
                continue;  // 不是质数，跳过当前迭代
            }
            
            primes[primeCount] = num;
            primeCount++;
        }
        
        // 调整数组大小
        uint[] memory result = new uint[](primeCount);
        for (uint i = 0; i < primeCount; i++) {
            result[i] = primes[i];
        }
        
        return result;
    }
    
    function processData(uint[] memory data) public pure returns (uint[] memory) {
        uint[] memory processed = new uint[](data.length);
        uint processedCount = 0;
        
        for (uint i = 0; i < data.length; i++) {
            // 跳过零值
            if (data[i] == 0) {
                continue;
            }
            
            // 遇到特殊值时停止处理
            if (data[i] == 999) {
                break;
            }
            
            processed[processedCount] = data[i] * 2;
            processedCount++;
        }
        
        // 返回处理后的数据
        uint[] memory result = new uint[](processedCount);
        for (uint i = 0; i < processedCount; i++) {
            result[i] = processed[i];
        }
        
        return result;
    }
}
```

## 错误处理控制

### require 语句

```solidity
contract RequireStatements {
    mapping(address => uint) public balances;
    address public owner;
    bool public paused = false;
    
    constructor() {
        owner = msg.sender;
    }
    
    function transfer(address to, uint amount) public {
        // 多重条件检查
        require(!paused, "Contract is paused");
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be positive");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // 执行转账
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    function withdraw(uint amount) public {
        uint balance = balances[msg.sender];
        
        require(balance > 0, "No balance to withdraw");
        require(amount <= balance, "Withdrawal amount exceeds balance");
        
        // 检查合约余额
        require(address(this).balance >= amount, "Contract insufficient funds");
        
        balances[msg.sender] = balance - amount;
        payable(msg.sender).transfer(amount);
    }
}
```

### assert 语句

```solidity
contract AssertStatements {
    uint public totalSupply;
    mapping(address => uint) public balances;
    
    function mint(address to, uint amount) public {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");
        
        uint oldSupply = totalSupply;
        uint oldBalance = balances[to];
        
        totalSupply += amount;
        balances[to] += amount;
        
        // 使用 assert 检查不变量
        assert(totalSupply == oldSupply + amount);
        assert(balances[to] == oldBalance + amount);
        assert(totalSupply >= oldSupply);  // 防止溢出
    }
    
    function burn(uint amount) public {
        uint oldSupply = totalSupply;
        uint oldBalance = balances[msg.sender];
        
        require(oldBalance >= amount, "Insufficient balance to burn");
        
        totalSupply -= amount;
        balances[msg.sender] -= amount;
        
        // 检查状态一致性
        assert(totalSupply == oldSupply - amount);
        assert(balances[msg.sender] == oldBalance - amount);
        assert(totalSupply <= oldSupply);
    }
}
```

### try-catch 语句

```solidity
interface IERC20 {
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract TryCatchExample {
    event TransferSuccess(address token, address to, uint amount);
    event TransferFailed(address token, address to, uint amount, string reason);
    
    function safeTransfer(address token, address to, uint amount) public {
        try IERC20(token).transfer(to, amount) returns (bool success) {
            if (success) {
                emit TransferSuccess(token, to, amount);
            } else {
                emit TransferFailed(token, to, amount, "Transfer returned false");
            }
        } catch Error(string memory reason) {
            // 捕获 revert 错误
            emit TransferFailed(token, to, amount, reason);
        } catch Panic(uint errorCode) {
            // 捕获 panic 错误（如除零、数组越界等）
            emit TransferFailed(token, to, amount, 
                string(abi.encodePacked("Panic: ", errorCode)));
        } catch (bytes memory lowLevelData) {
            // 捕获其他低级错误
            emit TransferFailed(token, to, amount, "Low-level error");
        }
    }
    
    function getTokenBalance(address token, address account) public view returns (uint, bool) {
        try IERC20(token).balanceOf(account) returns (uint balance) {
            return (balance, true);
        } catch {
            return (0, false);
        }
    }
}
```

## 复杂控制流示例

### 状态机实现

```solidity
contract StateMachine {
    enum State {
        Inactive,
        Active,
        Paused,
        Terminated
    }
    
    State public currentState = State.Inactive;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    modifier inState(State _state) {
        require(currentState == _state, "Invalid state");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function activate() public onlyOwner inState(State.Inactive) {
        currentState = State.Active;
    }
    
    function pause() public onlyOwner inState(State.Active) {
        currentState = State.Paused;
    }
    
    function resume() public onlyOwner inState(State.Paused) {
        currentState = State.Active;
    }
    
    function terminate() public onlyOwner {
        require(
            currentState == State.Active || currentState == State.Paused,
            "Cannot terminate from current state"
        );
        currentState = State.Terminated;
    }
    
    function executeAction() public inState(State.Active) {
        // 只有在 Active 状态下才能执行的操作
    }
}
```

### 投票系统

```solidity
contract VotingSystem {
    struct Proposal {
        string description;
        uint yesVotes;
        uint noVotes;
        uint deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint => Proposal) public proposals;
    uint public proposalCount;
    uint public constant VOTING_PERIOD = 7 days;
    
    function createProposal(string memory description) public {
        uint proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.description = description;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        proposal.executed = false;
    }
    
    function vote(uint proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp < proposal.deadline, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(!proposal.executed, "Proposal already executed");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
    }
    
    function executeProposal(uint proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp >= proposal.deadline, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.yesVotes > proposal.noVotes, "Proposal rejected");
        
        proposal.executed = true;
        
        // 执行提案逻辑
        _executeProposalLogic(proposalId);
    }
    
    function _executeProposalLogic(uint proposalId) internal {
        // 提案执行逻辑
    }
}
```

## Gas 优化技巧

### 循环优化

```solidity
contract LoopOptimization {
    uint[] public data;
    
    // 不好的做法：重复访问 length
    function badLoop() public view returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < data.length; i++) {  // 每次都访问 length
            sum += data[i];
        }
        return sum;
    }
    
    // 好的做法：缓存 length
    function goodLoop() public view returns (uint) {
        uint sum = 0;
        uint length = data.length;  // 缓存长度
        for (uint i = 0; i < length; i++) {
            sum += data[i];
        }
        return sum;
    }
    
    // 更好的做法：使用 unchecked（Solidity 0.8+）
    function optimizedLoop() public view returns (uint) {
        uint sum = 0;
        uint length = data.length;
        
        for (uint i = 0; i < length;) {
            sum += data[i];
            unchecked {
                ++i;  // 避免溢出检查
            }
        }
        return sum;
    }
}
```

### 条件优化

```solidity
contract ConditionalOptimization {
    mapping(address => uint) public balances;
    mapping(address => bool) public isVIP;
    
    // 不好的做法：复杂的嵌套条件
    function badTransfer(address to, uint amount) public {
        if (balances[msg.sender] >= amount) {
            if (to != address(0)) {
                if (amount > 0) {
                    if (!isVIP[msg.sender]) {
                        uint fee = amount / 100;
                        balances[msg.sender] -= amount;
                        balances[to] += amount - fee;
                    } else {
                        balances[msg.sender] -= amount;
                        balances[to] += amount;
                    }
                }
            }
        }
    }
    
    // 好的做法：早期返回
    function goodTransfer(address to, uint amount) public {
        require(amount > 0, "Invalid amount");
        require(to != address(0), "Invalid recipient");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        
        if (isVIP[msg.sender]) {
            balances[to] += amount;
        } else {
            uint fee = amount / 100;
            balances[to] += amount - fee;
        }
    }
}
```

## 最佳实践

### 1. 避免无限循环
```solidity
contract SafeLoops {
    uint public constant MAX_ITERATIONS = 100;
    
    function safeProcess(uint[] memory data) public pure returns (uint) {
        uint sum = 0;
        uint iterations = data.length > MAX_ITERATIONS ? MAX_ITERATIONS : data.length;
        
        for (uint i = 0; i < iterations; i++) {
            sum += data[i];
        }
        
        return sum;
    }
}
```

### 2. 合理使用 require
```solidity
contract RequireBestPractices {
    function transfer(address to, uint amount) public {
        // 按照失败概率排序，最可能失败的检查放在前面
        require(amount > 0, "Amount must be positive");
        require(to != address(0), "Invalid recipient");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // 执行转账逻辑
    }
}
```

### 3. 状态检查
```solidity
contract StateChecks {
    enum Status { Active, Paused, Terminated }
    Status public status = Status.Active;
    
    modifier whenActive() {
        require(status == Status.Active, "Contract not active");
        _;
    }
    
    function criticalOperation() public whenActive {
        // 关键操作只在 Active 状态下执行
    }
}
```

## 使用场景总结

| 控制结构 | 使用场景 | 注意事项 |
|---------|---------|---------|
| `if-else` | 条件判断 | 避免过深嵌套 |
| `for` 循环 | 数组遍历、批量操作 | 注意 Gas 限制 |
| `while` 循环 | 条件循环 | 防止无限循环 |
| `require` | 输入验证 | 提供清晰错误信息 |
| `try-catch` | 外部调用 | 处理调用失败 |

## 下一步

- [合约结构](/basics/contract-structure) - 学习合约的整体架构
- [函数](/basics/functions) - 深入了解函数定义和修饰符
- [错误处理](/advanced/error-handling) - 学习高级错误处理技巧