# 哈希函数

Ethers.js 提供了多种哈希函数，用于计算数据的哈希值。这些函数在区块链开发中非常重要，用于数据完整性验证、签名验证、Merkle 树构建等场景。

## 基础哈希函数

### keccak256

计算数据的 Keccak-256 哈希值，这是以太坊中最常用的哈希函数。

```javascript
import { keccak256, toUtf8Bytes } from 'ethers';

// 计算字符串的哈希
const hash = keccak256(toUtf8Bytes("Hello World"));
console.log(hash);
// 0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba

// 计算字节数组的哈希
const data = new Uint8Array([1, 2, 3, 4, 5]);
const dataHash = keccak256(data);
console.log(dataHash);
```

### sha256

计算数据的 SHA-256 哈希值。

```javascript
import { sha256, toUtf8Bytes } from 'ethers';

const hash = sha256(toUtf8Bytes("Hello World"));
console.log(hash);
// 0xa591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e
```

### sha512

计算数据的 SHA-512 哈希值。

```javascript
import { sha512, toUtf8Bytes } from 'ethers';

const hash = sha512(toUtf8Bytes("Hello World"));
console.log(hash);
```

## 特殊哈希函数

### solidityKeccak256

计算 Solidity 风格的 keccak256 哈希，支持类型化数据。

```javascript
import { solidityKeccak256 } from 'ethers';

// 计算多个参数的哈希
const hash = solidityKeccak256(
  ["string", "uint256", "address"],
  ["Hello", 123, "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Df8"]
);
console.log(hash);

// 计算代币转账的哈希
const transferHash = solidityKeccak256(
  ["address", "address", "uint256"],
  [fromAddress, toAddress, amount]
);
```

### solidityPackedKeccak256

计算紧密打包的 Solidity 风格哈希。

```javascript
import { solidityPackedKeccak256 } from 'ethers';

const hash = solidityPackedKeccak256(
  ["string", "uint256"],
  ["Hello", 123]
);
console.log(hash);
```

## 实用工具函数

### hashMessage

计算以太坊消息的哈希值，添加了以太坊消息前缀。

```javascript
import { hashMessage } from 'ethers';

const message = "Hello World";
const messageHash = hashMessage(message);
console.log(messageHash);

// 等价于
const prefix = "\x19Ethereum Signed Message:\n";
const fullMessage = prefix + message.length + message;
const hash = keccak256(toUtf8Bytes(fullMessage));
```

### verifyMessage

验证消息签名。

```javascript
import { verifyMessage } from 'ethers';

const message = "Hello World";
const signature = "0x..."; // 签名
const address = "0x...";   // 签名者地址

const recoveredAddress = verifyMessage(message, signature);
console.log(recoveredAddress === address); // true 表示验证成功
```

## 实际应用示例

### 1. 数据完整性验证

```javascript
import { keccak256, toUtf8Bytes } from 'ethers';

class DataIntegrity {
  static calculateHash(data) {
    const jsonString = JSON.stringify(data);
    return keccak256(toUtf8Bytes(jsonString));
  }
  
  static verifyIntegrity(data, expectedHash) {
    const actualHash = this.calculateHash(data);
    return actualHash === expectedHash;
  }
}

// 使用示例
const userData = { name: "Alice", balance: 1000 };
const hash = DataIntegrity.calculateHash(userData);

// 验证数据是否被篡改
const isValid = DataIntegrity.verifyIntegrity(userData, hash);
console.log("数据完整性:", isValid);
```

### 2. Merkle 树构建

```javascript
import { keccak256, concat } from 'ethers';

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(leaf => keccak256(leaf));
    this.tree = this.buildTree();
  }
  
  buildTree() {
    let currentLevel = this.leaves;
    const tree = [currentLevel];
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const parent = keccak256(concat([left, right]));
        nextLevel.push(parent);
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    return tree;
  }
  
  getRoot() {
    return this.tree[this.tree.length - 1][0];
  }
  
  getProof(index) {
    const proof = [];
    let currentIndex = index;
    
    for (let level = 0; level < this.tree.length - 1; level++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < this.tree[level].length) {
        proof.push({
          hash: this.tree[level][siblingIndex],
          isRight: !isRightNode
        });
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }
}

// 使用示例
const data = ["Alice", "Bob", "Charlie", "David"];
const tree = new MerkleTree(data.map(name => toUtf8Bytes(name)));
console.log("Merkle Root:", tree.getRoot());
```

### 3. 智能合约事件哈希

```javascript
import { keccak256, toUtf8Bytes } from 'ethers';

// 计算事件签名哈希
function getEventSignature(eventName, paramTypes) {
  const signature = `${eventName}(${paramTypes.join(',')})`;
  return keccak256(toUtf8Bytes(signature));
}

// ERC-20 Transfer 事件
const transferSignature = getEventSignature('Transfer', ['address', 'address', 'uint256']);
console.log("Transfer 事件哈希:", transferSignature);
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

// 自定义事件
const customEventSignature = getEventSignature('UserRegistered', ['address', 'string', 'uint256']);
console.log("自定义事件哈希:", customEventSignature);
```

### 4. 密码哈希存储

```javascript
import { keccak256, toUtf8Bytes, randomBytes } from 'ethers';

class PasswordManager {
  static hashPassword(password, salt = null) {
    if (!salt) {
      salt = randomBytes(32);
    }
    
    const passwordBytes = toUtf8Bytes(password);
    const combined = concat([passwordBytes, salt]);
    const hash = keccak256(combined);
    
    return {
      hash,
      salt: hexlify(salt)
    };
  }
  
  static verifyPassword(password, storedHash, storedSalt) {
    const { hash } = this.hashPassword(password, arrayify(storedSalt));
    return hash === storedHash;
  }
}

// 使用示例
const password = "mySecretPassword";
const { hash, salt } = PasswordManager.hashPassword(password);

console.log("密码哈希:", hash);
console.log("盐值:", salt);

// 验证密码
const isValid = PasswordManager.verifyPassword(password, hash, salt);
console.log("密码验证:", isValid);
```

## 性能优化建议

### 1. 批量哈希计算

```javascript
import { keccak256, concat } from 'ethers';

class BatchHasher {
  static hashBatch(dataArray) {
    // 将所有数据连接后一次性计算哈希
    const combined = concat(dataArray);
    return keccak256(combined);
  }
  
  static hashIndividually(dataArray) {
    // 分别计算每个数据的哈希
    return dataArray.map(data => keccak256(data));
  }
}
```

### 2. 缓存哈希结果

```javascript
class HashCache {
  constructor() {
    this.cache = new Map();
  }
  
  getHash(data) {
    const key = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const hash = keccak256(toUtf8Bytes(key));
    this.cache.set(key, hash);
    return hash;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

const hashCache = new HashCache();
```

## 安全注意事项

1. **选择合适的哈希函数**：
   - 使用 `keccak256` 进行以太坊相关操作
   - 使用 `sha256` 进行通用哈希计算

2. **避免哈希碰撞**：
   - 使用足够长的输入数据
   - 添加随机盐值

3. **敏感数据处理**：
   - 不要将敏感数据直接哈希
   - 使用适当的盐值和多轮哈希

4. **验证哈希结果**：
   - 始终验证哈希计算的正确性
   - 使用已知测试向量进行验证

通过这些哈希函数，您可以在 Web3 应用中实现数据完整性验证、数字签名、Merkle 证明等重要功能。