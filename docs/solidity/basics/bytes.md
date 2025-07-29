# 字节数组

字节数组（bytes）是 Solidity 中用于处理二进制数据的基础类型。分为定长（bytes1~bytes32）和变长（bytes）两类，广泛用于哈希、签名、底层数据处理等场景。

## 字节数组基础

### 定长字节数组

```solidity
contract FixedBytes {
    bytes32 public hash;
    bytes8 public flag;

    function setHash(bytes32 _hash) public {
        hash = _hash;
    }

    function setFlag(bytes8 _flag) public {
        flag = _flag;
    }
}
```

### 变长字节数组

```solidity
contract DynamicBytes {
    bytes public data;

    function setData(bytes memory _data) public {
        data = _data;
    }

    function appendByte(byte b) public {
        data.push(b);
    }

    function getLength() public view returns (uint) {
        return data.length;
    }

    function getData() public view returns (bytes memory) {
        return data;
    }
}
```

### 字节数组与字符串互转

```solidity
contract BytesString {
    function bytesToString(bytes memory b) public pure returns (string memory) {
        return string(b);
    }

    function stringToBytes(string memory s) public pure returns (bytes memory) {
        return bytes(s);
    }
}
```

### 字节数组操作

```solidity
contract BytesOps {
    bytes public buffer;

    function pushByte(bytes1 b) public {
        buffer.push(b);
    }

    function popByte() public {
        require(buffer.length > 0, "Empty buffer");
        buffer.pop();
    }

    function getByte(uint index) public view returns (bytes1) {
        require(index < buffer.length, "Index out of bounds");
        return buffer[index];
    }

    function slice(uint start, uint len) public view returns (bytes memory) {
        require(start + len <= buffer.length, "Out of range");
        bytes memory result = new bytes(len);
        for (uint i = 0; i < len; i++) {
            result[i] = buffer[start + i];
        }
        return result;
    }
}
```

## 实战案例

### 哈希与签名

```solidity
contract HashAndSign {
    function getHash(bytes memory data) public pure returns (bytes32) {
        return keccak256(data);
    }

    function verify(bytes32 hash, bytes memory signature) public pure returns (address) {
        // 这里只做演示，实际应使用 ECDSA 库
        // return ECDSA.recover(hash, signature);
        return address(0);
    }
}
```

### ABI 编解码

```solidity
contract AbiEncodeDecode {
    function encode(uint a, address b) public pure returns (bytes memory) {
        return abi.encode(a, b);
    }

    function decode(bytes memory data) public pure returns (uint, address) {
        return abi.decode(data, (uint, address));
    }
}
```

## 关键点说明

- bytes 是变长字节数组，bytes1~bytes32 是定长
- 字节数组常用于哈希、签名、底层数据处理
- 字节数组与 string 可互转，但 string 仅限 UTF-8
- 字节数组操作需注意 gas 消耗

## 最佳实践

- 定长字节数组适合存储哈希、地址等定长数据
- 变长字节数组适合存储动态二进制数据
- 字节数组操作建议封装为库，提升复用性
- 处理签名、哈希等建议使用 OpenZeppelin 的 ECDSA、Strings 等库

---

## 下一步操作

1. **动手实践**：实现一个链上哈希校验与签名验证合约。
2. **进阶挑战**：实现字节数组的切片、拼接、查找等工具库。
3. **深入阅读**：
   - [Solidity 官方文档：bytes](https://docs.soliditylang.org/en/latest/types.html#bytes)
   - [OpenZeppelin Contracts: ECDSA](https://docs.openzeppelin.com/contracts/4.x/api/utils#ECDSA) 