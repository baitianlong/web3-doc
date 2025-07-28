# 函数

函数是 Solidity 中执行特定任务的代码块。理解函数的定义、调用、修饰符和各种特性对于编写高质量的智能合约至关重要。

## 函数基础

### 函数定义语法

```solidity
contract FunctionBasics {
    // 基本函数语法
    function functionName(
        parameterType parameterName
    ) visibility stateModifier returns (returnType) {
        // 函数体
        return returnValue;
    }
    
    // 简单示例
    function add(uint a, uint b) public pure returns (uint) {
        return a + b;
    }
    
    // 无参数函数
    function getCurrentTime() public view returns (uint) {
        return block.timestamp;
    }
    
    // 无返回值函数
    function setMessage(string memory _message) public {
        message = _message;
    }
    
    string public message;
}
```

### 函数可见性

```solidity
contract FunctionVisibility {
    uint private privateData = 100;
    uint internal internalData = 200;
    uint public publicData = 300;
    
    // public: 内部和外部都可以调用
    function publicFunction() public view returns (uint) {
        return publicData;
    }
    
    // external: 只能从外部调用
    function externalFunction() external view returns (uint) {
        return publicData;
    }
    
    // internal: 只能从内部和继承合约调用
    function internalFunction() internal view returns (uint) {
        return internalData;
    }
    
    // private: 只能从当前合约内部调用
    function privateFunction() private view returns (uint) {
        return privateData;
    }
    
    // 调用内部函数的公共函数
    function callInternalFunction() public view returns (uint) {
        return internalFunction();
    }
    
    // 在内部调用外部函数需要使用 this
    function callExternalFunction() public view returns (uint) {
        return this.externalFunction();
    }
}
```

### 状态可变性

```solidity
contract StateMutability {
    uint public stateVariable = 100;
    
    // pure: 不读取也不修改状态
    function pureFunction(uint a, uint b) public pure returns (uint) {
        return a + b;  // 只使用参数和局部变量
    }
    
    // view: 读取状态但不修改
    function viewFunction() public view returns (uint) {
        return stateVariable;  // 读取状态变量
    }
    
    // 默认（可修改状态）
    function modifyState(uint newValue) public {
        stateVariable = newValue;  // 修改状态变量
    }
    
    // payable: 可以接收以太币
    function payableFunction() public payable {
        // 可以接收 msg.value
        stateVariable += msg.value;
    }
    
    // 复杂的 view 函数示例
    function complexViewFunction() public view returns (
        uint currentValue,
        uint doubled,
        uint blockNumber,
        address sender
    ) {
        currentValue = stateVariable;
        doubled = stateVariable * 2;
        blockNumber = block.number;
        sender = msg.sender;
        
        return (currentValue, doubled, blockNumber, sender);
    }
}
```

## 函数参数和返回值

### 参数类型和数据位置

```solidity
contract FunctionParameters {
    struct User {
        string name;
        uint age;
    }
    
    mapping(address => User) public users;
    uint[] public numbers;
    
    // 值类型参数
    function setValue(uint value, bool flag) public pure returns (uint) {
        if (flag) {
            return value * 2;
        }
        return value;
    }
    
    // memory 参数（函数内可修改，不影响原数据）
    function processArray(uint[] memory arr) public pure returns (uint[] memory) {
        for (uint i = 0; i < arr.length; i++) {
            arr[i] *= 2;
        }
        return arr;
    }
    
    // calldata 参数（只读，节省 gas）
    function sumArray(uint[] calldata arr) external pure returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum;
    }
    
    // 结构体参数
    function createUser(User memory user) public {
        users[msg.sender] = user;
    }
    
    // 多个参数
    function multipleParams(
        string memory name,
        uint age,
        address wallet,
        bool isActive
    ) public pure returns (string memory) {
        if (isActive && age >= 18) {
            return string(abi.encodePacked("Adult user: ", name));
        }
        return string(abi.encodePacked("User: ", name));
    }
}
```

### 返回值

```solidity
contract FunctionReturns {
    // 单个返回值
    function singleReturn(uint a, uint b) public pure returns (uint) {
        return a + b;
    }
    
    // 多个返回值
    function multipleReturns(uint a, uint b) public pure returns (
        uint sum,
        uint product,
        uint difference
    ) {
        sum = a + b;
        product = a * b;
        difference = a > b ? a - b : b - a;
        
        return (sum, product, difference);
    }
    
    // 命名返回值（自动返回）
    function namedReturns(uint a, uint b) public pure returns (
        uint sum,
        uint product
    ) {
        sum = a + b;
        product = a * b;
        // 不需要显式 return
    }
    
    // 混合返回方式
    function mixedReturns(uint a, uint b) public pure returns (
        uint sum,
        uint product
    ) {
        sum = a + b;
        product = a * b;
        
        // 可以显式返回部分值
        return (sum, a * b * 2);
    }
    
    // 返回数组
    function returnArray(uint size) public pure returns (uint[] memory) {
        uint[] memory result = new uint[](size);
        for (uint i = 0; i < size; i++) {
            result[i] = i + 1;
        }
        return result;
    }
    
    // 返回结构体
    struct Point {
        uint x;
        uint y;
    }
    
    function returnStruct(uint x, uint y) public pure returns (Point memory) {
        return Point(x, y);
    }
}
```

### 函数调用和返回值处理

```solidity
contract FunctionCalls {
    FunctionReturns public returnsContract;
    
    constructor() {
        returnsContract = new FunctionReturns();
    }
    
    function callFunctions() public view returns (uint, uint, uint) {
        // 调用单返回值函数
        uint singleResult = returnsContract.singleReturn(10, 5);
        
        // 调用多返回值函数 - 接收所有返回值
        (uint sum, uint product, uint diff) = returnsContract.multipleReturns(10, 5);
        
        // 调用多返回值函数 - 只接收部分返回值
        (uint sum2, , uint diff2) = returnsContract.multipleReturns(20, 8);
        
        // 调用多返回值函数 - 只接收第一个返回值
        (uint sum3, ,) = returnsContract.multipleReturns(30, 12);
        
        return (singleResult, sum, product);
    }
    
    function destructuringExample() public view returns (uint, uint) {
        // 解构赋值
        (uint a, uint b) = (10, 20);
        
        // 交换变量
        (a, b) = (b, a);
        
        return (a, b);
    }
}
```

## 函数修饰符 (Modifiers)

### 基本修饰符

```solidity
contract FunctionModifiers {
    address public owner;
    bool public paused = false;
    mapping(address => bool) public authorized;
    
    constructor() {
        owner = msg.sender;
        authorized[msg.sender] = true;
    }
    
    // 基本修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;  // 占位符，表示被修饰函数的代码位置
    }
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender], "Not authorized");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    // 使用修饰符的函数
    function transferOwnership(address newOwner) 
        public 
        onlyOwner 
        validAddress(newOwner) 
    {
        owner = newOwner;
    }
    
    function pause() public onlyOwner {
        paused = true;
    }
    
    function unpause() public onlyOwner {
        paused = false;
    }
    
    function authorizeUser(address user) 
        public 
        onlyOwner 
        validAddress(user) 
    {
        authorized[user] = true;
    }
    
    function sensitiveOperation() 
        public 
        onlyAuthorized 
        whenNotPaused 
    {
        // 敏感操作代码
    }
}
```

### 高级修饰符

```solidity
contract AdvancedModifiers {
    mapping(address => uint) public balances;
    mapping(address => uint) public lastAccess;
    
    uint public constant COOLDOWN_PERIOD = 1 hours;
    uint public constant MIN_BALANCE = 100;
    
    // 带参数的修饰符
    modifier minAmount(uint amount) {
        require(amount >= MIN_BALANCE, "Amount too small");
        _;
    }
    
    modifier cooldown() {
        require(
            block.timestamp >= lastAccess[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not met"
        );
        _;
        lastAccess[msg.sender] = block.timestamp;
    }
    
    modifier sufficientBalance(uint amount) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        _;
    }
    
    // 修饰符中的前置和后置逻辑
    modifier lockAndUnlock() {
        // 前置逻辑
        require(!locked, "Function is locked");
        locked = true;
        
        _;  // 执行函数
        
        // 后置逻辑
        locked = false;
    }
    
    bool private locked = false;
    
    function withdraw(uint amount) 
        public 
        minAmount(amount)
        sufficientBalance(amount)
        cooldown
        lockAndUnlock
    {
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    // 修饰符的继承和重写
    modifier virtual onlyAdmin() {
        require(isAdmin(msg.sender), "Only admin");
        _;
    }
    
    function isAdmin(address user) internal view virtual returns (bool) {
        return user == owner;
    }
    
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
}
```

## 特殊函数

### 构造函数

```solidity
contract ConstructorExample {
    string public name;
    uint public totalSupply;
    address public owner;
    mapping(address => uint) public balances;
    
    // 构造函数在合约部署时执行一次
    constructor(string memory _name, uint _totalSupply) {
        name = _name;
        totalSupply = _totalSupply;
        owner = msg.sender;
        balances[msg.sender] = _totalSupply;
    }
    
    // 带修饰符的构造函数
    modifier validSupply(uint supply) {
        require(supply > 0, "Supply must be positive");
        _;
    }
    
    // 注意：修饰符在构造函数中的使用（较少见）
    // constructor(uint _supply) validSupply(_supply) {
    //     totalSupply = _supply;
    // }
}
```

### 接收以太币的函数

```solidity
contract ReceiveEther {
    event Received(address sender, uint amount);
    event Fallback(address sender, uint amount, bytes data);
    
    // receive() 函数：接收纯以太币转账
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
    // fallback() 函数：当调用不存在的函数时执行
    fallback() external payable {
        emit Fallback(msg.sender, msg.value, msg.data);
    }
    
    // 显式的 payable 函数
    function deposit() public payable {
        emit Received(msg.sender, msg.value);
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
    
    function withdraw(uint amount) public {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(msg.sender).transfer(amount);
    }
}
```

## 函数重载

```solidity
contract FunctionOverloading {
    // 函数重载：相同名称，不同参数
    function transfer(address to, uint amount) public returns (bool) {
        // 基本转账
        return true;
    }
    
    function transfer(
        address to, 
        uint amount, 
        string memory memo
    ) public returns (bool) {
        // 带备注的转账
        return true;
    }
    
    function transfer(
        address[] memory recipients,
        uint[] memory amounts
    ) public returns (bool) {
        // 批量转账
        require(recipients.length == amounts.length, "Length mismatch");
        return true;
    }
    
    // 重载的 getter 函数
    function getValue() public pure returns (uint) {
        return 100;
    }
    
    function getValue(uint multiplier) public pure returns (uint) {
        return 100 * multiplier;
    }
    
    function getValue(uint a, uint b) public pure returns (uint) {
        return a + b;
    }
}
```

## 递归函数

```solidity
contract RecursiveFunctions {
    // 计算阶乘
    function factorial(uint n) public pure returns (uint) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
    
    // 计算斐波那契数列
    function fibonacci(uint n) public pure returns (uint) {
        if (n <= 1) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    // 优化的斐波那契（使用记忆化）
    mapping(uint => uint) private fibCache;
    
    function fibonacciOptimized(uint n) public returns (uint) {
        if (n <= 1) {
            return n;
        }
        
        if (fibCache[n] != 0) {
            return fibCache[n];
        }
        
        fibCache[n] = fibonacciOptimized(n - 1) + fibonacciOptimized(n - 2);
        return fibCache[n];
    }
    
    // 计算最大公约数
    function gcd(uint a, uint b) public pure returns (uint) {
        if (b == 0) {
            return a;
        }
        return gcd(b, a % b);
    }
}
```

## 高级函数特性

### 函数指针和回调

```solidity
contract FunctionPointers {
    // 定义函数类型
    function mathOperation(uint a, uint b) external pure returns (uint) {}
    
    // 使用函数指针
    function calculate(
        uint a,
        uint b,
        function(uint, uint) external pure returns (uint) operation
    ) public pure returns (uint) {
        return operation(a, b);
    }
    
    // 具体的数学操作函数
    function add(uint a, uint b) external pure returns (uint) {
        return a + b;
    }
    
    function multiply(uint a, uint b) external pure returns (uint) {
        return a * b;
    }
    
    // 回调函数示例
    function processWithCallback(
        uint[] memory data,
        function(uint) external pure returns (uint) processor
    ) public pure returns (uint[] memory) {
        uint[] memory result = new uint[](data.length);
        for (uint i = 0; i < data.length; i++) {
            result[i] = processor(data[i]);
        }
        return result;
    }
    
    function double(uint x) external pure returns (uint) {
        return x * 2;
    }
    
    function square(uint x) external pure returns (uint) {
        return x * x;
    }
}
```

### 内联汇编函数

```solidity
contract AssemblyFunctions {
    function addAssembly(uint a, uint b) public pure returns (uint result) {
        assembly {
            result := add(a, b)
        }
    }
    
    function getCodeSize(address addr) public view returns (uint size) {
        assembly {
            size := extcodesize(addr)
        }
    }
    
    function efficientKeccak(bytes memory data) public pure returns (bytes32 result) {
        assembly {
            result := keccak256(add(data, 0x20), mload(data))
        }
    }
}
```

## 实际应用示例

### ERC20 代币函数

```solidity
contract ERC20Functions {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10**_decimals;
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Invalid recipient");
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
    
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }
    
    function increaseAllowance(address spender, uint256 addedValue) 
        public 
        returns (bool) 
    {
        allowance[msg.sender][spender] += addedValue;
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }
    
    function decreaseAllowance(address spender, uint256 subtractedValue) 
        public 
        returns (bool) 
    {
        uint256 currentAllowance = allowance[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "Decreased allowance below zero");
        
        allowance[msg.sender][spender] = currentAllowance - subtractedValue;
        emit Approval(msg.sender, spender, allowance[msg.sender][spender]);
        return true;
    }
}
```

### 多签钱包函数

```solidity
contract MultiSigWallet {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;
    
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    event Submission(uint256 indexed transactionId);
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier transactionExists(uint256 transactionId) {
        require(transactionId < transactions.length, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }
    
    modifier notConfirmed(uint256 transactionId) {
        require(!confirmations[transactionId][msg.sender], "Transaction already confirmed");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        required = _required;
    }
    
    function submitTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) public onlyOwner returns (uint256) {
        uint256 transactionId = transactions.length;
        
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        }));
        
        emit Submission(transactionId);
        confirmTransaction(transactionId);
        
        return transactionId;
    }
    
    function confirmTransaction(uint256 transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notConfirmed(transactionId)
    {
        confirmations[transactionId][msg.sender] = true;
        transactions[transactionId].confirmations++;
        
        emit Confirmation(msg.sender, transactionId);
        
        executeTransaction(transactionId);
    }
    
    function executeTransaction(uint256 transactionId)
        public
        onlyOwner
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        Transaction storage txn = transactions[transactionId];
        
        if (txn.confirmations >= required) {
            txn.executed = true;
            
            (bool success, ) = txn.to.call{value: txn.value}(txn.data);
            require(success, "Transaction execution failed");
            
            emit Execution(transactionId);
        }
    }
    
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
    
    function getOwners() public view returns (address[] memory) {
        return owners;
    }
    
    function isConfirmed(uint256 transactionId) public view returns (bool) {
        return transactions[transactionId].confirmations >= required;
    }
    
    receive() external payable {}
}
```

## 最佳实践

### 1. 函数命名和组织
```solidity
// 好的做法：使用清晰的函数名
function transferTokens(address to, uint256 amount) public {}
function calculateInterest(uint256 principal, uint256 rate) public pure returns (uint256) {}

// 避免：模糊的函数名
function doStuff() public {}
function calc(uint256 a, uint256 b) public pure returns (uint256) {}
```

### 2. 参数验证
```solidity
function transfer(address to, uint256 amount) public {
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Amount must be positive");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // 函数逻辑
}
```

### 3. 使用修饰符简化代码
```solidity
modifier validTransfer(address to, uint256 amount) {
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Amount must be positive");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    _;
}

function transfer(address to, uint256 amount) public validTransfer(to, amount) {
    // 简化的函数逻辑
}
```

### 4. Gas 优化
```solidity
// 好的做法：缓存状态变量
function optimizedFunction() public {
    uint256 balance = balances[msg.sender];  // 缓存
    // 使用 balance 而不是重复访问 balances[msg.sender]
}

// 使用 calldata 而不是 memory（外部函数）
function processData(uint[] calldata data) external pure returns (uint) {
    // 处理逻辑
}
```

## 使用场景总结

| 函数类型 | 使用场景 | 示例 |
|---------|---------|------|
| `public` | 内外部都可调用 | 代币转账、查询余额 |
| `external` | 只能外部调用 | 接口函数、回调函数 |
| `internal` | 内部和继承合约 | 工具函数、验证逻辑 |
| `private` | 仅当前合约 | 敏感计算、内部状态 |
| `pure` | 纯计算 | 数学运算、格式化 |
| `view` | 只读状态 | 查询函数、计算属性 |
| `payable` | 接收以太币 | 充值、购买、捐赠 |

## 下一步

- [控制结构](/basics/control-structures) - 学习条件语句和循环
- [合约结构](/basics/contract-structure) - 了解合约的整体架构
- [进阶特性](/advanced/inheritance) - 学习继承和多态