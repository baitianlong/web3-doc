# 字符串处理

字符串（string）是 Solidity 中用于存储和处理文本数据的基本类型。由于 EVM 的限制，字符串操作有一定局限性，但在合约开发中依然非常常用。

## 字符串基础

### 字符串声明与赋值

```solidity
contract StringBasics {
    string public greeting = "Hello, Solidity!";
    string public name;

    function setName(string memory _name) public {
        name = _name;
    }

    function getName() public view returns (string memory) {
        return name;
    }
}
```

### 字符串与字节数组的转换

```solidity
contract StringBytes {
    function stringToBytes(string memory s) public pure returns (bytes memory) {
        return bytes(s);
    }

    function bytesToString(bytes memory b) public pure returns (string memory) {
        return string(b);
    }
}
```

### 字符串拼接

Solidity 0.8.x 及以上推荐使用 abi.encodePacked 进行拼接：

```solidity
contract StringConcat {
    function concat(string memory a, string memory b) public pure returns (string memory) {
        return string(abi.encodePacked(a, b));
    }

    function concat3(string memory a, string memory b, string memory c) public pure returns (string memory) {
        return string(abi.encodePacked(a, b, c));
    }
}
```

### 字符串比较

Solidity 没有内置的字符串比较运算符，通常通过 keccak256 哈希实现：

```solidity
contract StringCompare {
    function isEqual(string memory a, string memory b) public pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
```

### 字符串长度

```solidity
contract StringLength {
    function length(string memory s) public pure returns (uint) {
        return bytes(s).length;
    }
}
```

### 字符串遍历与字符操作

```solidity
contract StringChar {
    function charAt(string memory s, uint index) public pure returns (bytes1) {
        require(index < bytes(s).length, "Index out of bounds");
        return bytes(s)[index];
    }

    function toAscii(string memory s) public pure returns (uint8[] memory) {
        bytes memory b = bytes(s);
        uint8[] memory ascii = new uint8[](b.length);
        for (uint i = 0; i < b.length; i++) {
            ascii[i] = uint8(b[i]);
        }
        return ascii;
    }
}
```

## 实战案例

### 用户名注册与校验

```solidity
contract UsernameRegistry {
    mapping(address => string) public usernames;

    function register(string memory username) public {
        require(bytes(username).length >= 3 && bytes(username).length <= 16, "用户名长度应为3-16");
        usernames[msg.sender] = username;
    }

    function isUsername(address user, string memory username) public view returns (bool) {
        return keccak256(bytes(usernames[user])) == keccak256(bytes(username));
    }
}
```

### 字符串与事件

```solidity
contract StringEvent {
    event Message(address indexed sender, string content);

    function sendMessage(string memory content) public {
        emit Message(msg.sender, content);
    }
}
```

## 关键点说明

- string 是动态大小的 UTF-8 字符串，底层为 bytes
- 字符串操作通常需要转换为 bytes 处理
- 字符串拼接、比较、截取等操作较为低效，需注意 Gas 消耗
- 不建议在合约中存储大量字符串数据

## 最佳实践

- 尽量避免在合约中进行复杂字符串处理，建议在链下处理后传入合约
- 重要字符串建议用 bytes32 定长存储，节省 Gas
- 字符串比较统一用 keccak256(bytes(...))
- 事件日志中可安全使用字符串

---

## 下一步操作

1. **动手实践**：实现一个链上昵称注册与唯一性校验合约。
2. **进阶挑战**：实现链上字符串白名单、黑名单过滤功能。
3. **深入阅读**：
   - [Solidity 官方文档：字符串](https://docs.soliditylang.org/en/latest/types.html#strings)
   - [Solidity by Example: Strings](https://solidity-by-example.org/app/string/) 