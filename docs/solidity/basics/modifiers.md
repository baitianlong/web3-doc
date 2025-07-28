---
title: 函数修饰符
description: Solidity 函数修饰符的详细使用指南
keywords: [Solidity, 修饰符, modifier, 权限控制, 重入保护, 访问控制]
---

# 函数修饰符

函数修饰符（Modifier）是 Solidity 中的一个强大特性，用于在函数执行前后添加额外的逻辑检查。它们主要用于访问控制、状态验证和代码重用。

## 基本修饰符

### 简单修饰符

```solidity
contract BasicModifiers {
    address public owner;
    bool public paused = false;
    
    constructor() {
        owner = msg.sender;
    }
    
    // 基本修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;  // 占位符，表示被修饰函数的代码位置
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    // 使用修饰符
    function pause() public onlyOwner {
        paused = true;
    }
    
    function unpause() public onlyOwner {
        paused = false;
    }
    
    function sensitiveOperation() public onlyOwner whenNotPaused {
        // 只有所有者在合约未暂停时才能执行
    }
}
```

### 带参数的修饰符

```solidity
contract ParameterizedModifiers {
    mapping(address => uint) public balances;
    mapping(address => bool) public authorized;
    
    modifier hasMinBalance(uint minAmount) {
        require(balances[msg.sender] >= minAmount, "Insufficient balance");
        _;
    }
    
    modifier onlyAuthorized(address user) {
        require(authorized[user], "User not authorized");
        _;
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    function withdraw(uint amount) public hasMinBalance(amount) {
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    function authorizeUser(address user) public onlyAuthorized(msg.sender) validAddress(user) {
        authorized[user] = true;
    }
}
```

## 高级修饰符模式

### 重入保护

```solidity
contract ReentrancyGuard {
    bool private locked = false;
    
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    mapping(address => uint) public balances;
    
    function withdraw(uint amount) public nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        
        // 外部调用可能触发重入攻击
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

### 时间锁修饰符

```solidity
contract TimeLock {
    mapping(bytes32 => uint) public timelock;
    uint public constant DELAY = 2 days;
    
    modifier onlyAfterDelay(bytes32 operation) {
        require(timelock[operation] != 0, "Operation not scheduled");
        require(block.timestamp >= timelock[operation], "Operation still locked");
        _;
        delete timelock[operation];  // 执行后清除
    }
    
    modifier onlyValidDelay(uint delay) {
        require(delay >= DELAY, "Delay too short");
        _;
    }
    
    function scheduleOperation(bytes32 operation) public onlyValidDelay(DELAY) {
        timelock[operation] = block.timestamp + DELAY;
    }
    
    function executeOperation(bytes32 operation) public onlyAfterDelay(operation) {
        // 执行延迟操作
    }
}
```

### 状态机修饰符

```solidity
contract StateMachine {
    enum State { Created, Locked, Inactive }
    State public state = State.Created;
    
    modifier inState(State _state) {
        require(state == _state, "Invalid state");
        _;
    }
    
    modifier transitionTo(State _state) {
        _;
        state = _state;
    }
    
    function lock() public inState(State.Created) transitionTo(State.Locked) {
        // 只能从 Created 状态转换到 Locked 状态
    }
    
    function deactivate() public inState(State.Locked) transitionTo(State.Inactive) {
        // 只能从 Locked 状态转换到 Inactive 状态
    }
}
```

## 修饰符组合

### 多重修饰符

```solidity
contract MultipleModifiers {
    address public owner;
    bool public paused = false;
    mapping(address => bool) public whitelist;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }
    
    // 多个修饰符按顺序执行
    function restrictedFunction() 
        public 
        onlyOwner 
        whenNotPaused 
        onlyWhitelisted 
    {
        // 函数体
    }
}
```

### 修饰符继承

```solidity
contract BaseContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}

contract DerivedContract is BaseContract {
    bool public paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    // 可以使用继承的修饰符
    function pause() public onlyOwner {
        paused = true;
    }
    
    // 组合使用继承和自定义修饰符
    function sensitiveOperation() public onlyOwner whenNotPaused {
        // 执行敏感操作
    }
}
```

## 实际应用示例

### 访问控制系统

```solidity
contract AccessControl {
    mapping(bytes32 => mapping(address => bool)) private roles;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "Access denied");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin access required");
        _;
    }
    
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[role][account];
    }
    
    function grantRole(bytes32 role, address account) public onlyAdmin {
        _grantRole(role, account);
    }
    
    function revokeRole(bytes32 role, address account) public onlyAdmin {
        roles[role][account] = false;
    }
    
    function _grantRole(bytes32 role, address account) internal {
        roles[role][account] = true;
    }
    
    // 使用角色控制的函数
    function mint(address to, uint amount) public onlyRole(MINTER_ROLE) {
        // 铸造代币逻辑
    }
    
    function burn(uint amount) public onlyRole(BURNER_ROLE) {
        // 销毁代币逻辑
    }
}
```

### 费用控制

```solidity
contract FeeControl {
    uint public baseFee = 0.01 ether;
    mapping(address => bool) public vipUsers;
    
    modifier paysFee() {
        if (!vipUsers[msg.sender]) {
            require(msg.value >= baseFee, "Insufficient fee");
        }
        _;
    }
    
    modifier refundExcess() {
        _;
        if (msg.value > baseFee && !vipUsers[msg.sender]) {
            uint excess = msg.value - baseFee;
            payable(msg.sender).transfer(excess);
        }
    }
    
    function premiumService() public payable paysFee refundExcess {
        // 提供高级服务
    }
    
    function addVipUser(address user) public {
        vipUsers[user] = true;
    }
}
```

### 限流控制

```solidity
contract RateLimit {
    mapping(address => uint) public lastCallTime;
    mapping(address => uint) public callCount;
    uint public constant RATE_LIMIT = 5;  // 每分钟最多5次调用
    uint public constant TIME_WINDOW = 1 minutes;
    
    modifier rateLimit() {
        uint currentTime = block.timestamp;
        
        if (currentTime - lastCallTime[msg.sender] > TIME_WINDOW) {
            // 重置计数器
            callCount[msg.sender] = 0;
            lastCallTime[msg.sender] = currentTime;
        }
        
        require(callCount[msg.sender] < RATE_LIMIT, "Rate limit exceeded");
        callCount[msg.sender]++;
        _;
    }
    
    function limitedFunction() public rateLimit {
        // 受限制的函数
    }
}
```

## 修饰符最佳实践

### 1. 清晰的命名

```solidity
contract NamingBestPractices {
    // 好的命名
    modifier onlyOwner() { _; }
    modifier whenNotPaused() { _; }
    modifier hasMinBalance(uint amount) { _; }
    
    // 避免的命名
    modifier check() { _; }  // 太模糊
    modifier m1() { _; }     // 无意义
}
```

### 2. 单一职责

```solidity
contract SingleResponsibility {
    // 好的做法：每个修饰符只做一件事
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    // 避免：一个修饰符做多件事
    modifier ownerAndNotPaused() {
        require(msg.sender == owner, "Not owner");
        require(!paused, "Paused");
        _;
    }
}
```

### 3. 错误处理

```solidity
contract ErrorHandling {
    modifier validInput(uint value) {
        require(value > 0, "Value must be positive");
        require(value <= 1000, "Value too large");
        _;
    }
    
    modifier safeTransfer(address to, uint amount) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        _;
    }
}
```

## 常见陷阱

### 1. 修饰符中的状态变化

```solidity
contract ModifierPitfalls {
    uint public counter = 0;
    
    // 危险：修饰符中改变状态
    modifier incrementCounter() {
        counter++;  // 可能导致意外的副作用
        _;
    }
    
    // 更好的做法：在函数中明确改变状态
    modifier validCall() {
        require(msg.sender != address(0), "Invalid caller");
        _;
    }
    
    function safeFunction() public validCall {
        counter++;  // 明确的状态变化
    }
}
```

### 2. 修饰符执行顺序

```solidity
contract ModifierOrder {
    bool public step1 = false;
    bool public step2 = false;
    
    modifier firstStep() {
        step1 = true;
        _;
        step1 = false;
    }
    
    modifier secondStep() {
        require(step1, "Step 1 not completed");
        step2 = true;
        _;
        step2 = false;
    }
    
    // 修饰符按从左到右的顺序执行
    function orderedFunction() public firstStep secondStep {
        // 函数体在所有修饰符的 _ 位置执行
    }
}
```

## 下一步

- [函数可见性](/solidity/basics/function-visibility) - 学习函数的可见性控制
- [错误处理](/solidity/basics/error-handling) - 了解错误处理机制
- [事件和日志](/solidity/basics/events-logs) - 学习事件的使用