# 合约结构

智能合约是 Solidity 的核心概念，理解合约的结构对于编写高质量的智能合约至关重要。本章将详细介绍合约的各个组成部分及其最佳实践。

## 合约基本结构

### 完整的合约示例

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 导入其他合约或库
import "./IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev ERC20 代币合约示例
 * @author Your Name
 */
contract MyToken is IERC20, Ownable {
    // 类型声明
    using SafeMath for uint256;
    
    // 状态变量
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 private _totalSupply;
    
    // 映射
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // 修饰符
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    // 构造函数
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        _totalSupply = _totalSupply * 10**decimals;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    // 公共函数
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    // 内部函数
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);
        
        emit Transfer(from, to, amount);
    }
}
```

## 许可证标识符

### SPDX 许可证标识符

```solidity
// SPDX-License-Identifier: MIT
// SPDX-License-Identifier: GPL-3.0
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: UNLICENSED
```

**常用许可证类型**：
- `MIT`: 最宽松的许可证
- `GPL-3.0`: 开源许可证，要求衍生作品也开源
- `Apache-2.0`: 商业友好的开源许可证
- `UNLICENSED`: 不提供许可证

## 版本声明 (Pragma)

### 版本指定

```solidity
// 精确版本
pragma solidity 0.8.19;

// 版本范围
pragma solidity ^0.8.0;    // >= 0.8.0 < 0.9.0
pragma solidity >=0.8.0 <0.9.0;

// 实验性功能
pragma experimental ABIEncoderV2;  // 0.8.0 之前版本
```

### 最佳实践

```solidity
// 推荐：使用具体的版本范围
pragma solidity ^0.8.0;

// 生产环境：使用精确版本
pragma solidity 0.8.19;
```

## 导入语句

### 导入方式

```solidity
// 导入整个文件
import "./MyContract.sol";

// 导入特定符号
import {MyContract, MyLibrary} from "./MyFile.sol";

// 重命名导入
import "./MyContract.sol" as MC;
import {MyContract as MC} from "./MyFile.sol";

// 从 npm 包导入
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// 导入并重命名所有符号
import * as MyModule from "./MyModule.sol";
```

## 合约声明

### 基本合约

```solidity
contract SimpleContract {
    // 合约内容
}
```

### 抽象合约

```solidity
abstract contract AbstractContract {
    // 抽象函数（必须在子合约中实现）
    function abstractFunction() public virtual returns (uint);
    
    // 普通函数
    function normalFunction() public pure returns (string memory) {
        return "Hello from abstract contract";
    }
}
```

### 接口

```solidity
interface IMyInterface {
    // 接口中的函数都是抽象的
    function interfaceFunction(uint param) external returns (bool);
    
    // 可以定义事件
    event InterfaceEvent(address indexed user, uint value);
}
```

### 库

```solidity
library MathLibrary {
    function add(uint a, uint b) internal pure returns (uint) {
        return a + b;
    }
    
    function multiply(uint a, uint b) internal pure returns (uint) {
        return a * b;
    }
}
```

## 继承

### 单继承

```solidity
contract Parent {
    uint public parentValue = 100;
    
    function parentFunction() public virtual returns (string memory) {
        return "Parent";
    }
}

contract Child is Parent {
    function childFunction() public view returns (uint) {
        return parentValue;  // 继承的状态变量
    }
    
    // 重写父合约函数
    function parentFunction() public pure override returns (string memory) {
        return "Child";
    }
}
```

### 多重继承

```solidity
contract A {
    function funcA() public virtual returns (string memory) {
        return "A";
    }
}

contract B {
    function funcB() public virtual returns (string memory) {
        return "B";
    }
}

contract C is A, B {
    function funcC() public view returns (string memory, string memory) {
        return (funcA(), funcB());
    }
}
```

## 状态变量

### 可见性修饰符

```solidity
contract StateVariables {
    // public: 自动生成 getter 函数
    uint public publicVar = 100;
    
    // internal: 当前合约和子合约可访问（默认）
    uint internal internalVar = 200;
    
    // private: 只有当前合约可访问
    uint private privateVar = 300;
    
    // 常量
    uint public constant CONSTANT_VAR = 1000;
    
    // 不可变量（部署时设置）
    address public immutable owner;
    
    constructor() {
        owner = msg.sender;
    }
}
```

## 函数

### 函数可见性

```solidity
contract FunctionVisibility {
    uint private data = 100;
    
    // public: 内部和外部都可调用
    function publicFunction() public view returns (uint) {
        return data;
    }
    
    // external: 只能外部调用
    function externalFunction() external view returns (uint) {
        return data;
    }
    
    // internal: 当前合约和子合约可调用
    function internalFunction() internal view returns (uint) {
        return data;
    }
    
    // private: 只有当前合约可调用
    function privateFunction() private view returns (uint) {
        return data;
    }
}
```

## 事件

### 事件定义和使用

```solidity
contract Events {
    // 事件定义
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        // 触发事件
        emit Transfer(msg.sender, to, amount);
    }
}
```

## 最佳实践

### 1. 合约组织
```solidity
// 推荐的合约结构顺序：
contract MyContract {
    // 1. 类型声明
    using SafeMath for uint256;
    
    // 2. 状态变量
    uint256 public constant MAX_SUPPLY = 1000000;
    address public owner;
    
    // 3. 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // 4. 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    // 5. 构造函数
    constructor() {
        owner = msg.sender;
    }
    
    // 6. 外部函数
    // 7. 公共函数
    // 8. 内部函数
    // 9. 私有函数
}
```

### 2. 命名规范
```solidity
// 合约名：大驼峰命名
contract MyTokenContract {}

// 函数名：小驼峰命名
function transferTokens() public {}

// 变量名：小驼峰命名
uint256 public totalSupply;

// 常量：大写字母 + 下划线
uint256 public constant MAX_SUPPLY = 1000000;

// 私有变量：下划线前缀
uint256 private _balance;
```

## 下一步

- [进阶特性](/advanced/inheritance) - 学习继承和多态
- [最佳实践](/best-practices/security) - 了解安全编程
- [API参考](/api/global-variables) - 查看完整API文档
