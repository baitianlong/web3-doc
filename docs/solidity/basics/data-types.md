# 数据类型

Solidity 是一种静态类型语言，这意味着每个变量的类型必须在编译时确定。理解 Solidity 的数据类型对于编写高效和安全的智能合约至关重要。

## 值类型 (Value Types)

值类型的变量总是按值传递，当它们被用作函数参数或赋值时，总是被复制。

### 布尔类型 (bool)

```solidity
contract BooleanTypes {
    bool public isActive = true;
    bool public isCompleted = false;
    
    function booleanOperations() public pure returns (bool, bool, bool) {
        bool a = true;
        bool b = false;
        
        bool andResult = a && b;  // false
        bool orResult = a || b;   // true
        bool notResult = !a;      // false
        
        return (andResult, orResult, notResult);
    }
    
    function conditionalExample(uint value) public pure returns (string memory) {
        bool isPositive = value > 0;
        
        if (isPositive) {
            return "Positive number";
        } else {
            return "Zero or negative";
        }
    }
}
```

### 整数类型

#### 无符号整数 (uint)

```solidity
contract UnsignedIntegers {
    // 不同大小的无符号整数
    uint8 public smallNumber = 255;        // 0 到 2^8-1
    uint16 public mediumNumber = 65535;    // 0 到 2^16-1
    uint32 public largeNumber = 4294967295; // 0 到 2^32-1
    uint256 public maxNumber = type(uint256).max; // 0 到 2^256-1
    
    // uint 等价于 uint256
    uint public defaultUint = 1000;
    
    function uintOperations() public pure returns (uint, uint, uint, uint) {
        uint a = 100;
        uint b = 50;
        
        uint sum = a + b;        // 150
        uint difference = a - b; // 50
        uint product = a * b;    // 5000
        uint quotient = a / b;   // 2
        
        return (sum, difference, product, quotient);
    }
    
    function uintLimits() public pure returns (uint8, uint16, uint256) {
        return (
            type(uint8).max,   // 255
            type(uint16).max,  // 65535
            type(uint256).max  // 2^256 - 1
        );
    }
}
```

#### 有符号整数 (int)

```solidity
contract SignedIntegers {
    // 不同大小的有符号整数
    int8 public smallInt = -128;           // -2^7 到 2^7-1
    int16 public mediumInt = -32768;       // -2^15 到 2^15-1
    int256 public largeInt = -1000000;     // -2^255 到 2^255-1
    
    // int 等价于 int256
    int public defaultInt = -500;
    
    function intOperations() public pure returns (int, int, int, int) {
        int a = 100;
        int b = -50;
        
        int sum = a + b;        // 50
        int difference = a - b; // 150
        int product = a * b;    // -5000
        int quotient = a / b;   // -2
        
        return (sum, difference, product, quotient);
    }
    
    function intLimits() public pure returns (int8, int8, int256, int256) {
        return (
            type(int8).min,   // -128
            type(int8).max,   // 127
            type(int256).min, // -2^255
            type(int256).max  // 2^255 - 1
        );
    }
    
    function absoluteValue(int value) public pure returns (uint) {
        if (value < 0) {
            return uint(-value);
        } else {
            return uint(value);
        }
    }
}
```

### 地址类型 (address)

```solidity
contract AddressTypes {
    address public owner;
    address payable public wallet;
    
    constructor() {
        owner = msg.sender;
        wallet = payable(msg.sender);
    }
    
    function addressOperations() public view returns (
        address,
        uint256,
        bytes32,
        bool
    ) {
        address addr = 0x1234567890123456789012345678901234567890;
        
        uint256 balance = addr.balance;           // 地址余额
        bytes32 codeHash = addr.codehash;         // 代码哈希
        bool hasCode = addr.code.length > 0;     // 是否为合约地址
        
        return (addr, balance, codeHash, hasCode);
    }
    
    function payableOperations() public payable {
        // 只有 payable 地址可以接收以太币
        wallet.transfer(msg.value);
        
        // 或者使用 send（需要检查返回值）
        bool success = wallet.send(msg.value);
        require(success, "Transfer failed");
        
        // 或者使用 call（推荐方式）
        (bool sent, ) = wallet.call{value: msg.value}("");
        require(sent, "Transfer failed");
    }
    
    function addressComparison(address addr1, address addr2) 
        public 
        pure 
        returns (bool) 
    {
        return addr1 == addr2;
    }
    
    function isContract(address addr) public view returns (bool) {
        return addr.code.length > 0;
    }
}
```

### 字节类型

#### 固定大小字节数组

```solidity
contract FixedBytes {
    bytes1 public singleByte = 0x42;
    bytes4 public fourBytes = 0x12345678;
    bytes32 public hash = keccak256("Hello World");
    
    function byteOperations() public pure returns (
        bytes1,
        bytes4,
        bytes32,
        uint
    ) {
        bytes1 b1 = 0xFF;
        bytes4 b4 = 0x12345678;
        bytes32 b32 = keccak256("test");
        
        uint length = b32.length; // 32
        
        return (b1, b4, b32, length);
    }
    
    function byteArrayAccess() public pure returns (bytes1, bytes1) {
        bytes4 data = 0x12345678;
        
        bytes1 firstByte = data[0];  // 0x12
        bytes1 lastByte = data[3];   // 0x78
        
        return (firstByte, lastByte);
    }
    
    function bitwiseOperations() public pure returns (bytes1, bytes1, bytes1) {
        bytes1 a = 0xF0;
        bytes1 b = 0x0F;
        
        bytes1 andResult = a & b;  // 0x00
        bytes1 orResult = a | b;   // 0xFF
        bytes1 xorResult = a ^ b;  // 0xFF
        
        return (andResult, orResult, xorResult);
    }
}
```

#### 动态字节数组

```solidity
contract DynamicBytes {
    bytes public data;
    
    function setData(bytes memory _data) public {
        data = _data;
    }
    
    function appendByte(bytes1 _byte) public {
        data.push(_byte);
    }
    
    function getLength() public view returns (uint) {
        return data.length;
    }
    
    function getByteAt(uint index) public view returns (bytes1) {
        require(index < data.length, "Index out of bounds");
        return data[index];
    }
    
    function concatenateBytes(bytes memory a, bytes memory b) 
        public 
        pure 
        returns (bytes memory) 
    {
        return abi.encodePacked(a, b);
    }
    
    function bytesToString(bytes memory _bytes) 
        public 
        pure 
        returns (string memory) 
    {
        return string(_bytes);
    }
}
```

### 字符串类型 (string)

```solidity
contract StringTypes {
    string public name = "Solidity";
    string public description;
    
    function setDescription(string memory _desc) public {
        description = _desc;
    }
    
    function concatenateStrings(string memory a, string memory b) 
        public 
        pure 
        returns (string memory) 
    {
        return string(abi.encodePacked(a, " ", b));
    }
    
    function stringLength(string memory str) public pure returns (uint) {
        return bytes(str).length;
    }
    
    function compareStrings(string memory a, string memory b) 
        public 
        pure 
        returns (bool) 
    {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
    
    function stringToBytes(string memory str) 
        public 
        pure 
        returns (bytes memory) 
    {
        return bytes(str);
    }
    
    function getCharAt(string memory str, uint index) 
        public 
        pure 
        returns (bytes1) 
    {
        bytes memory strBytes = bytes(str);
        require(index < strBytes.length, "Index out of bounds");
        return strBytes[index];
    }
}
```

## 引用类型 (Reference Types)

引用类型的变量存储数据的位置（内存或存储），而不是直接存储值。

### 数组 (Arrays)

```solidity
contract ArrayTypes {
    // 固定大小数组
    uint[5] public fixedArray = [1, 2, 3, 4, 5];
    
    // 动态数组
    uint[] public dynamicArray;
    
    // 二维数组
    uint[][] public matrix;
    
    function arrayOperations() public {
        // 添加元素到动态数组
        dynamicArray.push(10);
        dynamicArray.push(20);
        
        // 访问数组元素
        uint firstElement = dynamicArray[0];
        
        // 获取数组长度
        uint length = dynamicArray.length;
        
        // 删除最后一个元素
        dynamicArray.pop();
    }
    
    function memoryArrays() public pure returns (uint[] memory) {
        // 在内存中创建数组
        uint[] memory memArray = new uint[](3);
        memArray[0] = 1;
        memArray[1] = 2;
        memArray[2] = 3;
        
        return memArray;
    }
}
```

### 映射 (Mappings)

```solidity
contract MappingTypes {
    // 基本映射
    mapping(address => uint) public balances;
    
    // 嵌套映射
    mapping(address => mapping(address => uint)) public allowances;
    
    // 映射到结构体
    struct User {
        string name;
        uint age;
    }
    mapping(address => User) public users;
    
    function mappingOperations() public {
        // 设置映射值
        balances[msg.sender] = 1000;
        
        // 读取映射值（不存在的键返回默认值）
        uint balance = balances[msg.sender];
        
        // 嵌套映射操作
        allowances[msg.sender][address(this)] = 500;
        
        // 删除映射值（重置为默认值）
        delete balances[msg.sender];
    }
}
```

### 结构体 (Structs)

```solidity
contract StructTypes {
    struct Person {
        string name;
        uint age;
        address wallet;
    }
    
    Person public owner;
    Person[] public people;
    mapping(address => Person) public personByAddress;
    
    function createPerson(string memory _name, uint _age) public {
        // 方法1：直接赋值
        Person memory newPerson = Person({
            name: _name,
            age: _age,
            wallet: msg.sender
        });
        
        people.push(newPerson);
        personByAddress[msg.sender] = newPerson;
        
        // 方法2：逐个赋值
        Person memory anotherPerson;
        anotherPerson.name = _name;
        anotherPerson.age = _age;
        anotherPerson.wallet = msg.sender;
    }
}
```

## 数据位置 (Data Location)

### 存储位置类型

```solidity
contract DataLocation {
    uint[] public storageArray;
    
    function dataLocationExample() public {
        // storage: 状态变量的默认位置
        uint[] storage storageRef = storageArray;
        storageRef.push(1); // 修改状态变量
        
        // memory: 函数参数和局部变量的默认位置
        uint[] memory memoryArray = new uint[](3);
        memoryArray[0] = 1;
        
        // calldata: 外部函数参数的位置（只读）
        // 只能在外部函数中使用
    }
    
    function memoryExample(uint[] memory input) public pure returns (uint[] memory) {
        // input 在 memory 中，可以修改
        input[0] = 999;
        return input;
    }
    
    function calldataExample(uint[] calldata input) external pure returns (uint) {
        // input 在 calldata 中，只读
        // input[0] = 999; // 这会导致编译错误
        return input[0];
    }
}
```

## 类型转换

### 隐式转换

```solidity
contract ImplicitConversion {
    function implicitConversions() public pure returns (uint256, int256) {
        uint8 small = 100;
        uint256 large = small; // uint8 -> uint256 (安全)
        
        int8 smallSigned = -50;
        int256 largeSigned = smallSigned; // int8 -> int256 (安全)
        
        return (large, largeSigned);
    }
}
```

### 显式转换

```solidity
contract ExplicitConversion {
    function explicitConversions() public pure returns (
        uint8,
        int8,
        address,
        bytes4
    ) {
        uint256 large = 300;
        uint8 small = uint8(large); // 可能丢失数据
        
        uint256 positive = 100;
        int8 signed = int8(uint8(positive)); // 多步转换
        
        uint160 addrAsUint = 0x1234567890123456789012345678901234567890;
        address addr = address(addrAsUint);
        
        bytes32 hash = keccak256("test");
        bytes4 selector = bytes4(hash);
        
        return (small, signed, addr, selector);
    }
    
    function addressConversions() public view returns (address, address payable) {
        address addr = msg.sender;
        address payable payableAddr = payable(addr);
        
        return (addr, payableAddr);
    }
}
```

## 字面量和常量

### 数字字面量

```solidity
contract Literals {
    function numberLiterals() public pure returns (uint, uint, uint) {
        uint decimal = 123;
        uint hexadecimal = 0x7B;  // 123 in hex
        uint scientific = 1.23e2; // 123 in scientific notation
        
        return (decimal, hexadecimal, scientific);
    }
    
    function underscoreInNumbers() public pure returns (uint) {
        uint large = 1_000_000; // 使用下划线提高可读性
        return large;
    }
}
```

### 字符串字面量

```solidity
contract StringLiterals {
    function stringLiterals() public pure returns (string memory, string memory) {
        string memory singleQuote = 'Hello';
        string memory doubleQuote = "World";
        
        return (singleQuote, doubleQuote);
    }
    
    function escapeSequences() public pure returns (string memory) {
        string memory escaped = "Line 1\nLine 2\tTabbed";
        return escaped;
    }
    
    function unicodeStrings() public pure returns (string memory) {
        string memory unicode = unicode"Hello 世界";
        return unicode;
    }
}
```

### 十六进制字面量

```solidity
contract HexLiterals {
    function hexLiterals() public pure returns (bytes1, bytes2, bytes memory) {
        bytes1 singleByte = hex"FF";
        bytes2 twoBytes = hex"FFFF";
        bytes memory dynamicBytes = hex"001122FF";
        
        return (singleByte, twoBytes, dynamicBytes);
    }
}
```

## 默认值

```solidity
contract DefaultValues {
    // 所有类型都有默认值
    bool public defaultBool;        // false
    uint public defaultUint;        // 0
    int public defaultInt;          // 0
    address public defaultAddress;  // 0x0000000000000000000000000000000000000000
    bytes32 public defaultBytes32;  // 0x0000000000000000000000000000000000000000000000000000000000000000
    string public defaultString;    // ""
    
    uint[] public defaultArray;     // 空数组
    
    struct DefaultStruct {
        uint value;
        bool flag;
    }
    DefaultStruct public defaultStruct; // 所有字段都是默认值
    
    function getDefaults() public view returns (
        bool,
        uint,
        int,
        address,
        bytes32,
        string memory,
        uint
    ) {
        return (
            defaultBool,
            defaultUint,
            defaultInt,
            defaultAddress,
            defaultBytes32,
            defaultString,
            defaultArray.length
        );
    }
}
```

## 实际应用示例

### 代币合约中的数据类型

```solidity
contract TokenDataTypes {
    // 基本信息
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**decimals;
    
    // 余额和授权
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
```

### 投票系统中的数据类型

```solidity
contract VotingDataTypes {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool executed;
        uint256 deadline;
    }
    
    enum VoteChoice {
        Against,  // 0
        For,      // 1
        Abstain   // 2
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => VoteChoice)) public votes;
    
    uint256 public proposalCount;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function createProposal(string memory description, uint256 duration) public {
        require(msg.sender == owner, "Only owner can create proposals");
        
        proposals[proposalCount] = Proposal({
            description: description,
            voteCount: 0,
            executed: false,
            deadline: block.timestamp + duration
        });
        
        proposalCount++;
    }
    
    function vote(uint256 proposalId, VoteChoice choice) public {
        require(proposalId < proposalCount, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp <= proposals[proposalId].deadline, "Voting ended");
        
        hasVoted[proposalId][msg.sender] = true;
        votes[proposalId][msg.sender] = choice;
        
        if (choice == VoteChoice.For) {
            proposals[proposalId].voteCount++;
        }
    }
}
```

## 最佳实践

### 1. 选择合适的数据类型
```solidity
// 好的做法：根据需要选择合适的大小
uint8 public percentage;  // 0-100，uint8 足够
uint256 public balance;   // 可能很大的数值，使用 uint256

// 避免：过度使用 uint256
uint256 public smallCounter; // 如果只需要小数值，考虑 uint8 或 uint16
```

### 2. 使用有意义的变量名
```solidity
// 好的做法
uint256 public totalSupply;
address public contractOwner;
bool public isActive;

// 避免
uint256 public ts;
address public addr;
bool public flag;
```

### 3. 合理使用数据位置
```solidity
// 好的做法：外部函数参数使用 calldata
function processData(uint[] calldata data) external pure returns (uint) {
    // 处理逻辑
}

// 内部函数可以使用 memory
function internalProcess(uint[] memory data) internal pure returns (uint) {
    // 处理逻辑
}
```

## 使用场景总结

| 数据类型 | 使用场景 | 示例 |
|---------|---------|------|
| `bool` | 状态标志 | `isActive`, `hasPermission` |
| `uint256` | 代币数量、余额 | `balance`, `totalSupply` |
| `address` | 用户地址、合约地址 | `owner`, `tokenContract` |
| `string` | 名称、描述 | `name`, `description` |
| `bytes32` | 哈希值、ID | `transactionHash`, `userId` |
| `mapping` | 键值对存储 | `balances`, `allowances` |
| `array` | 列表数据 | `users`, `transactions` |
| `struct` | 复杂数据结构 | `User`, `Order` |
| `enum` | 状态枚举 | `OrderStatus`, `UserRole` |

## 下一步

- [变量和常量](/basics/variables) - 学习变量声明和作用域
- [运算符](/basics/operators) - 了解各种运算符的使用
- [数组和映射](/basics/arrays-mappings) - 深入学习复合数据类型