# 数组和映射

数组和映射是 Solidity 中最重要的复合数据类型，用于存储和管理集合数据。理解它们的特性和使用方法对于构建复杂的智能合约至关重要。

## 数组 (Arrays)

### 固定大小数组

```solidity
contract FixedArrays {
    // 声明固定大小数组
    uint[5] public fixedArray;
    address[3] public admins;
    bool[10] public flags;
    
    constructor() {
        // 初始化固定数组
        fixedArray = [1, 2, 3, 4, 5];
        admins[0] = msg.sender;
        flags[0] = true;
    }
    
    function setFixedArrayElement(uint index, uint value) public {
        require(index < fixedArray.length, "Index out of bounds");
        fixedArray[index] = value;
    }
    
    function getFixedArrayLength() public view returns (uint) {
        return fixedArray.length;  // 固定数组长度是常量
    }
    
    function getFixedArray() public view returns (uint[5] memory) {
        return fixedArray;
    }
}
```

### 动态数组

```solidity
contract DynamicArrays {
    // 声明动态数组
    uint[] public numbers;
    string[] public names;
    address[] public users;
    
    // 嵌套动态数组
    uint[][] public matrix;
    
    function addNumber(uint _number) public {
        numbers.push(_number);  // 添加元素
    }
    
    function removeLastNumber() public {
        require(numbers.length > 0, "Array is empty");
        numbers.pop();  // 移除最后一个元素
    }
    
    function getNumbersLength() public view returns (uint) {
        return numbers.length;
    }
    
    function getNumbers() public view returns (uint[] memory) {
        return numbers;
    }
    
    function setNumber(uint index, uint value) public {
        require(index < numbers.length, "Index out of bounds");
        numbers[index] = value;
    }
    
    function deleteNumber(uint index) public {
        require(index < numbers.length, "Index out of bounds");
        
        // 方法1：将最后一个元素移到删除位置，然后 pop
        numbers[index] = numbers[numbers.length - 1];
        numbers.pop();
    }
    
    function deleteNumberKeepOrder(uint index) public {
        require(index < numbers.length, "Index out of bounds");
        
        // 方法2：保持顺序的删除（更耗 Gas）
        for (uint i = index; i < numbers.length - 1; i++) {
            numbers[i] = numbers[i + 1];
        }
        numbers.pop();
    }
}
```

### 内存数组

```solidity
contract MemoryArrays {
    function createMemoryArray(uint size) public pure returns (uint[] memory) {
        // 在内存中创建动态数组
        uint[] memory memArray = new uint[](size);
        
        for (uint i = 0; i < size; i++) {
            memArray[i] = i + 1;
        }
        
        return memArray;
    }
    
    function processArray(uint[] memory input) public pure returns (uint[] memory) {
        uint[] memory result = new uint[](input.length);
        
        for (uint i = 0; i < input.length; i++) {
            result[i] = input[i] * 2;
        }
        
        return result;
    }
    
    function sumArray(uint[] memory numbers) public pure returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < numbers.length; i++) {
            sum += numbers[i];
        }
        return sum;
    }
    
    function findMax(uint[] memory numbers) public pure returns (uint) {
        require(numbers.length > 0, "Array cannot be empty");
        
        uint max = numbers[0];
        for (uint i = 1; i < numbers.length; i++) {
            if (numbers[i] > max) {
                max = numbers[i];
            }
        }
        return max;
    }
}
```

### 字节数组

```solidity
contract ByteArrays {
    bytes public dynamicBytes;
    bytes32 public fixedBytes;
    
    function setDynamicBytes(bytes memory _data) public {
        dynamicBytes = _data;
    }
    
    function appendByte(bytes1 _byte) public {
        dynamicBytes.push(_byte);
    }
    
    function getBytesLength() public view returns (uint) {
        return dynamicBytes.length;
    }
    
    function getByteAt(uint index) public view returns (bytes1) {
        require(index < dynamicBytes.length, "Index out of bounds");
        return dynamicBytes[index];
    }
    
    function setByteAt(uint index, bytes1 _byte) public {
        require(index < dynamicBytes.length, "Index out of bounds");
        dynamicBytes[index] = _byte;
    }
    
    function concatenateBytes(bytes memory a, bytes memory b) 
        public 
        pure 
        returns (bytes memory) 
    {
        return abi.encodePacked(a, b);
    }
}
```

## 映射 (Mappings)

### 基本映射

```solidity
contract BasicMappings {
    // 基本映射类型
    mapping(address => uint) public balances;
    mapping(string => bool) public whitelist;
    mapping(uint => string) public idToName;
    mapping(bytes32 => address) public hashToAddress;
    
    function setBalance(address user, uint amount) public {
        balances[user] = amount;
    }
    
    function getBalance(address user) public view returns (uint) {
        return balances[user];  // 不存在的键返回默认值 0
    }
    
    function addToWhitelist(string memory name) public {
        whitelist[name] = true;
    }
    
    function removeFromWhitelist(string memory name) public {
        delete whitelist[name];  // 重置为默认值 false
    }
    
    function isWhitelisted(string memory name) public view returns (bool) {
        return whitelist[name];
    }
}
```

### 嵌套映射

```solidity
contract NestedMappings {
    // 嵌套映射：用户 => 代币地址 => 余额
    mapping(address => mapping(address => uint)) public allowances;
    
    // 三层嵌套：用户 => 年份 => 月份 => 收入
    mapping(address => mapping(uint => mapping(uint => uint))) public monthlyIncome;
    
    function approve(address spender, uint amount) public {
        allowances[msg.sender][spender] = amount;
    }
    
    function getAllowance(address owner, address spender) public view returns (uint) {
        return allowances[owner][spender];
    }
    
    function transferFrom(address from, address to, uint amount) public {
        uint currentAllowance = allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        
        allowances[from][msg.sender] = currentAllowance - amount;
        // 执行转账逻辑...
    }
    
    function setMonthlyIncome(uint year, uint month, uint income) public {
        require(month >= 1 && month <= 12, "Invalid month");
        monthlyIncome[msg.sender][year][month] = income;
    }
    
    function getMonthlyIncome(address user, uint year, uint month) 
        public 
        view 
        returns (uint) 
    {
        return monthlyIncome[user][year][month];
    }
}
```

### 映射与数组结合

```solidity
contract MappingWithArrays {
    struct User {
        string name;
        uint age;
        bool active;
    }
    
    // 映射存储用户信息
    mapping(address => User) public users;
    
    // 数组存储所有用户地址（用于遍历）
    address[] public userAddresses;
    
    // 映射检查地址是否已注册
    mapping(address => bool) public isRegistered;
    
    function registerUser(string memory name, uint age) public {
        require(!isRegistered[msg.sender], "User already registered");
        
        users[msg.sender] = User({
            name: name,
            age: age,
            active: true
        });
        
        userAddresses.push(msg.sender);
        isRegistered[msg.sender] = true;
    }
    
    function getUserCount() public view returns (uint) {
        return userAddresses.length;
    }
    
    function getAllUsers() public view returns (address[] memory) {
        return userAddresses;
    }
    
    function getUserInfo(address userAddr) public view returns (
        string memory name,
        uint age,
        bool active
    ) {
        User memory user = users[userAddr];
        return (user.name, user.age, user.active);
    }
    
    function deactivateUser(address userAddr) public {
        require(isRegistered[userAddr], "User not registered");
        users[userAddr].active = false;
    }
}
```

### 可迭代映射

```solidity
contract IterableMapping {
    struct KeyFlag {
        uint key;
        bool deleted;
    }
    
    struct IterableMap {
        mapping(uint => uint) data;
        KeyFlag[] keys;
        uint size;
    }
    
    IterableMap private map;
    
    function insert(uint key, uint value) public {
        uint keyIndex = map.data[key];
        
        if (keyIndex > 0) {
            // 键已存在，更新值
            map.data[key] = value;
        } else {
            // 新键
            keyIndex = map.keys.length;
            map.keys.push(KeyFlag(key, false));
            map.data[key] = keyIndex + 1;  // +1 因为 0 表示不存在
            map.size++;
        }
    }
    
    function remove(uint key) public {
        uint keyIndex = map.data[key];
        require(keyIndex > 0, "Key does not exist");
        
        map.keys[keyIndex - 1].deleted = true;
        delete map.data[key];
        map.size--;
    }
    
    function contains(uint key) public view returns (bool) {
        uint keyIndex = map.data[key];
        return keyIndex > 0 && !map.keys[keyIndex - 1].deleted;
    }
    
    function size() public view returns (uint) {
        return map.size;
    }
    
    function getKeys() public view returns (uint[] memory) {
        uint[] memory result = new uint[](map.size);
        uint counter = 0;
        
        for (uint i = 0; i < map.keys.length; i++) {
            if (!map.keys[i].deleted) {
                result[counter] = map.keys[i].key;
                counter++;
            }
        }
        
        return result;
    }
}
```

## 高级用法

### 数组排序

```solidity
contract ArraySorting {
    function bubbleSort(uint[] memory arr) public pure returns (uint[] memory) {
        uint n = arr.length;
        
        for (uint i = 0; i < n - 1; i++) {
            for (uint j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    // 交换元素
                    uint temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        
        return arr;
    }
    
    function quickSort(uint[] memory arr, int left, int right) 
        public 
        pure 
        returns (uint[] memory) 
    {
        if (left < right) {
            int pivotIndex = partition(arr, left, right);
            quickSort(arr, left, pivotIndex - 1);
            quickSort(arr, pivotIndex + 1, right);
        }
        return arr;
    }
    
    function partition(uint[] memory arr, int left, int right) 
        private 
        pure 
        returns (int) 
    {
        uint pivot = arr[uint(right)];
        int i = left - 1;
        
        for (int j = left; j < right; j++) {
            if (arr[uint(j)] <= pivot) {
                i++;
                uint temp = arr[uint(i)];
                arr[uint(i)] = arr[uint(j)];
                arr[uint(j)] = temp;
            }
        }
        
        uint temp = arr[uint(i + 1)];
        arr[uint(i + 1)] = arr[uint(right)];
        arr[uint(right)] = temp;
        
        return i + 1;
    }
}
```

### 数组搜索

```solidity
contract ArraySearch {
    function linearSearch(uint[] memory arr, uint target) 
        public 
        pure 
        returns (bool found, uint index) 
    {
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return (true, i);
            }
        }
        return (false, 0);
    }
    
    function binarySearch(uint[] memory arr, uint target) 
        public 
        pure 
        returns (bool found, uint index) 
    {
        uint left = 0;
        uint right = arr.length - 1;
        
        while (left <= right) {
            uint mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                return (true, mid);
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return (false, 0);
    }
    
    function findMultiple(uint[] memory arr, uint target) 
        public 
        pure 
        returns (uint[] memory) 
    {
        uint count = 0;
        
        // 首先计算匹配的数量
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                count++;
            }
        }
        
        // 创建结果数组
        uint[] memory indices = new uint[](count);
        uint resultIndex = 0;
        
        // 填充结果数组
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                indices[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return indices;
    }
}
```

## 实际应用示例

### 投票系统

```solidity
contract VotingSystem {
    struct Proposal {
        string description;
        uint voteCount;
        bool exists;
    }
    
    mapping(uint => Proposal) public proposals;
    mapping(address => mapping(uint => bool)) public hasVoted;
    mapping(address => bool) public voters;
    uint[] public proposalIds;
    uint public nextProposalId = 1;
    
    function addVoter(address voter) public {
        voters[voter] = true;
    }
    
    function createProposal(string memory description) public {
        uint proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            description: description,
            voteCount: 0,
            exists: true
        });
        proposalIds.push(proposalId);
    }
    
    function vote(uint proposalId) public {
        require(voters[msg.sender], "Not authorized to vote");
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(!hasVoted[msg.sender][proposalId], "Already voted");
        
        proposals[proposalId].voteCount++;
        hasVoted[msg.sender][proposalId] = true;
    }
    
    function getProposalCount() public view returns (uint) {
        return proposalIds.length;
    }
    
    function getAllProposals() public view returns (uint[] memory) {
        return proposalIds;
    }
    
    function getWinningProposal() public view returns (uint winningProposalId) {
        uint winningVoteCount = 0;
        
        for (uint i = 0; i < proposalIds.length; i++) {
            uint proposalId = proposalIds[i];
            if (proposals[proposalId].voteCount > winningVoteCount) {
                winningVoteCount = proposals[proposalId].voteCount;
                winningProposalId = proposalId;
            }
        }
    }
}
```

### 代币持有者管理

```solidity
contract TokenHolders {
    mapping(address => uint) public balances;
    address[] public holders;
    mapping(address => bool) public isHolder;
    mapping(address => uint) public holderIndex;
    
    function addTokens(address to, uint amount) public {
        if (!isHolder[to] && amount > 0) {
            // 新持有者
            holders.push(to);
            isHolder[to] = true;
            holderIndex[to] = holders.length - 1;
        }
        
        balances[to] += amount;
    }
    
    function removeTokens(address from, uint amount) public {
        require(balances[from] >= amount, "Insufficient balance");
        
        balances[from] -= amount;
        
        if (balances[from] == 0) {
            // 移除持有者
            removeHolder(from);
        }
    }
    
    function removeHolder(address holder) private {
        require(isHolder[holder], "Not a holder");
        
        uint index = holderIndex[holder];
        uint lastIndex = holders.length - 1;
        
        if (index != lastIndex) {
            address lastHolder = holders[lastIndex];
            holders[index] = lastHolder;
            holderIndex[lastHolder] = index;
        }
        
        holders.pop();
        delete isHolder[holder];
        delete holderIndex[holder];
    }
    
    function getHolderCount() public view returns (uint) {
        return holders.length;
    }
    
    function getAllHolders() public view returns (address[] memory) {
        return holders;
    }
    
    function getTopHolders(uint count) public view returns (
        address[] memory topHolders,
        uint[] memory topBalances
    ) {
        require(count <= holders.length, "Count exceeds holder count");
        
        // 创建临时数组用于排序
        address[] memory tempHolders = new address[](holders.length);
        uint[] memory tempBalances = new uint[](holders.length);
        
        for (uint i = 0; i < holders.length; i++) {
            tempHolders[i] = holders[i];
            tempBalances[i] = balances[holders[i]];
        }
        
        // 简单的冒泡排序（按余额降序）
        for (uint i = 0; i < tempHolders.length - 1; i++) {
            for (uint j = 0; j < tempHolders.length - i - 1; j++) {
                if (tempBalances[j] < tempBalances[j + 1]) {
                    // 交换余额
                    uint tempBalance = tempBalances[j];
                    tempBalances[j] = tempBalances[j + 1];
                    tempBalances[j + 1] = tempBalance;
                    
                    // 交换地址
                    address tempHolder = tempHolders[j];
                    tempHolders[j] = tempHolders[j + 1];
                    tempHolders[j + 1] = tempHolder;
                }
            }
        }
        
        // 返回前 count 个
        topHolders = new address[](count);
        topBalances = new uint[](count);
        
        for (uint i = 0; i < count; i++) {
            topHolders[i] = tempHolders[i];
            topBalances[i] = tempBalances[i];
        }
        
        return (topHolders, topBalances);
    }
}
```

## Gas 优化技巧

### 数组操作优化

```solidity
contract ArrayOptimization {
    uint[] public data;
    
    // 不好的做法：重复访问 length
    function badLoop() public view returns (uint) {
        uint sum = 0;
        for (uint i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum;
    }
    
    // 好的做法：缓存 length
    function goodLoop() public view returns (uint) {
        uint sum = 0;
        uint length = data.length;
        for (uint i = 0; i < length; i++) {
            sum += data[i];
        }
        return sum;
    }
    
    // 批量操作
    function batchAdd(uint[] memory values) public {
        for (uint i = 0; i < values.length; i++) {
            data.push(values[i]);
        }
    }
    
    // 使用 unchecked 优化（Solidity 0.8+）
    function optimizedLoop() public view returns (uint) {
        uint sum = 0;
        uint length = data.length;
        
        for (uint i = 0; i < length;) {
            sum += data[i];
            unchecked {
                ++i;
            }
        }
        return sum;
    }
}
```

### 映射优化

```solidity
contract MappingOptimization {
    mapping(address => uint) public balances;
    
    // 缓存映射值
    function optimizedTransfer(address to, uint amount) public {
        uint senderBalance = balances[msg.sender];  // 缓存值
        require(senderBalance >= amount, "Insufficient balance");
        
        balances[msg.sender] = senderBalance - amount;
        balances[to] += amount;
    }
    
    // 批量操作
    function batchTransfer(
        address[] memory recipients,
        uint[] memory amounts
    ) public {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint senderBalance = balances[msg.sender];
        uint totalAmount = 0;
        
        // 首先计算总金额
        for (uint i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(senderBalance >= totalAmount, "Insufficient balance");
        
        // 执行转账
        balances[msg.sender] = senderBalance - totalAmount;
        for (uint i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amounts[i];
        }
    }
}
```

## 最佳实践

### 1. 选择合适的数据结构
```solidity
// 需要遍历：使用数组
address[] public users;

// 需要快速查找：使用映射
mapping(address => bool) public authorized;

// 需要两者：结合使用
mapping(address => User) public userInfo;
address[] public userList;
```

### 2. 边界检查
```solidity
function safeArrayAccess(uint index) public view returns (uint) {
    require(index < data.length, "Index out of bounds");
    return data[index];
}
```

### 3. 避免无限循环
```solidity
uint public constant MAX_ITERATIONS = 100;

function safeBatchProcess(uint[] memory items) public {
    uint iterations = items.length > MAX_ITERATIONS ? MAX_ITERATIONS : items.length;
    for (uint i = 0; i < iterations; i++) {
        // 处理逻辑
    }
}
```

## 使用场景总结

| 数据结构 | 使用场景 | 优势 | 劣势 |
|---------|---------|------|------|
| 固定数组 | 已知大小的数据 | 节省 Gas | 大小不可变 |
| 动态数组 | 可变大小的列表 | 灵活性 | Gas 成本较高 |
| 映射 | 键值对存储 | O(1) 查找 | 无法遍历 |
| 嵌套映射 | 复杂关系 | 多维索引 | 复杂性增加 |

## 下一步

- [结构体和枚举](/basics/structs-enums) - 学习自定义数据类型
- [函数](/basics/functions) - 了解函数定义和调用
- [合约结构](/basics/contract-structure) - 掌握合约组织结构