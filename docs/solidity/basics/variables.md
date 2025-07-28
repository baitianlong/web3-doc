# 变量和常量

在 Solidity 中，变量用于存储数据，常量用于定义不可变的值。理解变量的作用域和生命周期对于编写高效的智能合约至关重要。

## 变量类型

### 状态变量 (State Variables)

状态变量存储在区块链上，是合约的持久化数据。

```solidity
contract StateVariables {
    // 公共状态变量（自动生成 getter 函数）
    uint public totalSupply = 1000000;
    string public name = "MyToken";
    address public owner;
    
    // 私有状态变量
    mapping(address => uint) private balances;
    uint private secretNumber;
    
    // 内部状态变量
    uint internal internalValue;
    
    constructor() {
        owner = msg.sender;
        balances[owner] = totalSupply;
    }
}
```

**使用场景**：
- 代币总供应量
- 合约所有者
- 用户余额
- 配置参数

### 局部变量 (Local Variables)

局部变量存储在内存中，函数执行完毕后销毁。

```solidity
contract LocalVariables {
    uint public result;
    
    function calculate(uint a, uint b) public {
        // 局部变量
        uint sum = a + b;
        uint product = a * b;
        uint difference = a > b ? a - b : b - a;
        
        // 复杂计算
        uint temp = sum * 2;
        result = temp + product - difference;
    }
    
    function processArray(uint[] memory numbers) public pure returns (uint) {
        uint total = 0;
        uint length = numbers.length;  // 局部变量
        
        for (uint i = 0; i < length; i++) {
            total += numbers[i];
        }
        
        return total;
    }
}
```

### 全局变量 (Global Variables)

Solidity 提供了许多内置的全局变量。

```solidity
contract GlobalVariables {
    event LogGlobalVars(
        address sender,
        uint blockNumber,
        uint timestamp,
        uint gasLeft
    );
    
    function showGlobalVars() public {
        // 消息相关
        address sender = msg.sender;      // 调用者地址
        uint value = msg.value;           // 发送的以太币数量
        bytes memory data = msg.data;     // 调用数据
        bytes4 sig = msg.sig;            // 函数选择器
        
        // 区块相关
        uint blockNum = block.number;     // 当前区块号
        uint timestamp = block.timestamp; // 当前时间戳
        address coinbase = block.coinbase; // 矿工地址
        uint difficulty = block.difficulty; // 区块难度
        uint gasLimit = block.gaslimit;   // Gas 限制
        
        // 交易相关
        uint gasPrice = tx.gasprice;      // Gas 价格
        address origin = tx.origin;       // 交易发起者
        
        // Gas 相关
        uint gasLeft = gasleft();         // 剩余 Gas
        
        emit LogGlobalVars(sender, blockNum, timestamp, gasLeft);
    }
}
```

## 常量

### constant 常量

编译时确定的常量，节省 Gas。

```solidity
contract Constants {
    // 基本常量
    uint public constant MAX_SUPPLY = 1000000;
    string public constant TOKEN_NAME = "MyToken";
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // 计算常量
    uint public constant DECIMALS = 18;
    uint public constant TOTAL_SUPPLY = MAX_SUPPLY * 10**DECIMALS;
    
    // 时间常量
    uint public constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint public constant SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;
    
    function getMaxSupply() public pure returns (uint) {
        return MAX_SUPPLY;  // 直接返回常量值
    }
}
```

### immutable 不可变量

部署时确定的常量，比状态变量更节省 Gas。

```solidity
contract ImmutableExample {
    // 部署时设置的不可变量
    address public immutable owner;
    uint public immutable deploymentTime;
    string public immutable tokenName;
    uint public immutable initialSupply;
    
    constructor(string memory _name, uint _supply) {
        owner = msg.sender;
        deploymentTime = block.timestamp;
        tokenName = _name;
        initialSupply = _supply;
    }
    
    function getDeploymentInfo() public view returns (
        address,
        uint,
        string memory,
        uint
    ) {
        return (owner, deploymentTime, tokenName, initialSupply);
    }
}
```

## 变量作用域

### 函数作用域

```solidity
contract Scope {
    uint public globalVar = 100;
    
    function scopeExample(uint param) public view returns (uint) {
        uint localVar = 50;
        
        if (param > 10) {
            uint blockVar = 25;  // 块级作用域
            return globalVar + localVar + blockVar + param;
        }
        
        // blockVar 在这里不可访问
        return globalVar + localVar + param;
    }
    
    function shadowingExample() public view returns (uint) {
        uint globalVar = 200;  // 遮蔽状态变量
        return globalVar;      // 返回 200，不是 100
    }
}
```

### 继承中的作用域

```solidity
contract Parent {
    uint internal parentVar = 100;
    uint private privateVar = 200;
    
    function getParentVar() public view returns (uint) {
        return parentVar;
    }
}

contract Child is Parent {
    uint public childVar = 300;
    
    function accessVars() public view returns (uint, uint) {
        // 可以访问 internal 变量
        uint parent = parentVar;
        
        // 不能访问 private 变量
        // uint private = privateVar;  // 编译错误
        
        return (parent, childVar);
    }
}
```

## 存储位置 (Data Location)

### storage（存储）

```solidity
contract StorageExample {
    struct User {
        string name;
        uint age;
        bool active;
    }
    
    mapping(address => User) public users;
    
    function updateUser(string memory _name, uint _age) public {
        // 引用存储中的数据
        User storage user = users[msg.sender];
        user.name = _name;
        user.age = _age;
        user.active = true;
    }
    
    function getUserCopy() public view returns (User memory) {
        // 返回内存中的副本
        return users[msg.sender];
    }
}
```

### memory（内存）

```solidity
contract MemoryExample {
    function processStrings(
        string memory str1,
        string memory str2
    ) public pure returns (string memory) {
        // 在内存中处理字符串
        bytes memory str1Bytes = bytes(str1);
        bytes memory str2Bytes = bytes(str2);
        bytes memory result = new bytes(str1Bytes.length + str2Bytes.length);
        
        uint k = 0;
        for (uint i = 0; i < str1Bytes.length; i++) {
            result[k++] = str1Bytes[i];
        }
        for (uint i = 0; i < str2Bytes.length; i++) {
            result[k++] = str2Bytes[i];
        }
        
        return string(result);
    }
    
    function processArray(uint[] memory numbers) public pure returns (uint[] memory) {
        // 在内存中创建新数组
        uint[] memory doubled = new uint[](numbers.length);
        
        for (uint i = 0; i < numbers.length; i++) {
            doubled[i] = numbers[i] * 2;
        }
        
        return doubled;
    }
}
```

### calldata（调用数据）

```solidity
contract CalldataExample {
    event DataProcessed(uint length, bytes32 hash);
    
    // 使用 calldata 节省 Gas
    function processData(bytes calldata data) external {
        // 不能修改 calldata
        // data[0] = 0x00;  // 编译错误
        
        uint length = data.length;
        bytes32 hash = keccak256(data);
        
        emit DataProcessed(length, hash);
    }
    
    function batchProcess(
        address[] calldata recipients,
        uint[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Length mismatch");
        
        for (uint i = 0; i < recipients.length; i++) {
            // 处理批量数据
            // transfer(recipients[i], amounts[i]);
        }
    }
}
```

## 变量初始化

### 默认值

```solidity
contract DefaultValues {
    // 数值类型默认为 0
    uint public defaultUint;        // 0
    int public defaultInt;          // 0
    
    // 布尔类型默认为 false
    bool public defaultBool;        // false
    
    // 地址类型默认为零地址
    address public defaultAddress;  // 0x0000000000000000000000000000000000000000
    
    // 字符串默认为空
    string public defaultString;    // ""
    
    // 数组默认为空数组
    uint[] public defaultArray;     // []
    
    function checkDefaults() public view returns (
        uint, int, bool, address, string memory, uint
    ) {
        return (
            defaultUint,
            defaultInt,
            defaultBool,
            defaultAddress,
            defaultString,
            defaultArray.length
        );
    }
}
```

### 显式初始化

```solidity
contract Initialization {
    // 声明时初始化
    uint public counter = 1;
    string public name = "MyContract";
    address public admin = 0x1234567890123456789012345678901234567890;
    
    // 构造函数中初始化
    uint public startTime;
    address public owner;
    mapping(address => bool) public authorized;
    
    constructor() {
        startTime = block.timestamp;
        owner = msg.sender;
        authorized[msg.sender] = true;
    }
    
    // 函数中初始化
    function initializeArray() public pure returns (uint[] memory) {
        uint[] memory numbers = new uint[](5);
        for (uint i = 0; i < 5; i++) {
            numbers[i] = i + 1;
        }
        return numbers;
    }
}
```

## 变量命名规范

### 推荐的命名约定

```solidity
contract NamingConventions {
    // 状态变量：小驼峰命名
    uint public totalSupply;
    address public contractOwner;
    mapping(address => uint) public userBalances;
    
    // 常量：大写字母 + 下划线
    uint public constant MAX_SUPPLY = 1000000;
    address public constant ZERO_ADDRESS = address(0);
    
    // 私有变量：下划线前缀
    uint private _internalCounter;
    mapping(address => bool) private _authorized;
    
    // 函数参数：下划线前缀
    function transfer(address _to, uint _amount) public {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Invalid amount");
        
        // 局部变量：小驼峰命名
        uint senderBalance = userBalances[msg.sender];
        require(senderBalance >= _amount, "Insufficient balance");
        
        userBalances[msg.sender] = senderBalance - _amount;
        userBalances[_to] += _amount;
    }
}
```

## Gas 优化技巧

### 变量打包

```solidity
contract VariablePacking {
    // 不好的做法：每个变量占用一个存储槽
    struct BadUser {
        uint256 id;        // 32 字节
        bool active;       // 32 字节（浪费）
        uint256 balance;   // 32 字节
        uint8 level;       // 32 字节（浪费）
    }
    
    // 好的做法：变量打包到同一个存储槽
    struct GoodUser {
        uint256 id;        // 32 字节
        uint256 balance;   // 32 字节
        bool active;       // 1 字节
        uint8 level;       // 1 字节
        // 剩余 30 字节可用于其他小类型变量
    }
    
    // 更好的打包示例
    struct OptimizedUser {
        uint128 balance;   // 16 字节
        uint64 timestamp;  // 8 字节
        uint32 id;         // 4 字节
        uint16 level;      // 2 字节
        bool active;       // 1 字节
        bool verified;     // 1 字节
        // 总共 32 字节，完美填充一个存储槽
    }
}
```

### 局部变量优化

```solidity
contract LocalVariableOptimization {
    mapping(address => uint) public balances;
    
    // 不好的做法：重复访问存储
    function badTransfer(address to, uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    // 好的做法：使用局部变量缓存
    function goodTransfer(address to, uint amount) public {
        uint senderBalance = balances[msg.sender];
        require(senderBalance >= amount, "Insufficient balance");
        
        balances[msg.sender] = senderBalance - amount;
        balances[to] += amount;
    }
}
```

## 最佳实践

### 1. 变量声明
```solidity
// 好的做法
uint256 public constant MAX_SUPPLY = 1000000;
address public immutable owner;
mapping(address => uint256) private _balances;

// 避免的做法
uint public max;  // 不明确的命名
var x = 10;      // 已弃用的 var 关键字
```

### 2. 初始化检查
```solidity
contract InitializationCheck {
    address public owner;
    bool private initialized;
    
    modifier onlyOnce() {
        require(!initialized, "Already initialized");
        _;
        initialized = true;
    }
    
    function initialize(address _owner) public onlyOnce {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }
}
```

### 3. 变量验证
```solidity
contract VariableValidation {
    uint public maxValue = 1000000;
    
    function setValue(uint _value) public {
        require(_value > 0, "Value must be positive");
        require(_value <= maxValue, "Value exceeds maximum");
        
        // 设置值的逻辑
    }
    
    function setAddress(address _addr) public {
        require(_addr != address(0), "Invalid address");
        require(_addr != address(this), "Cannot be contract address");
        
        // 设置地址的逻辑
    }
}
```

## 使用场景总结

| 变量类型 | 使用场景 | Gas 成本 | 示例 |
|---------|---------|---------|------|
| `constant` | 编译时常量 | 最低 | 配置参数、数学常数 |
| `immutable` | 部署时常量 | 低 | 合约地址、初始配置 |
| 状态变量 | 持久化数据 | 高 | 用户余额、合约状态 |
| 局部变量 | 临时计算 | 低 | 循环计数器、临时结果 |
| `memory` | 函数内数据 | 中等 | 字符串处理、数组操作 |
| `calldata` | 外部调用数据 | 最低 | 函数参数、批量操作 |

## 下一步

- [控制结构](/basics/control-structures) - 学习条件语句和循环
- [函数](/basics/functions) - 了解函数定义和修饰符
- [合约结构](/basics/contract-structure) - 掌握合约的整体架构