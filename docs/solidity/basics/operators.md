---
title: 运算符
description: Solidity 中的各种运算符使用指南
keywords: [Solidity, 运算符, 算术运算, 比较运算, 逻辑运算, 位运算]
---

# 运算符

Solidity 支持多种运算符，用于执行算术、比较、逻辑和位操作。理解这些运算符对于编写高效的智能合约至关重要。

## 算术运算符

### 基本算术运算

```solidity
contract ArithmeticOperators {
    function basicArithmetic(uint a, uint b) public pure returns (uint, uint, uint, uint, uint) {
        uint addition = a + b;        // 加法
        uint subtraction = a - b;     // 减法
        uint multiplication = a * b;  // 乘法
        uint division = a / b;        // 除法
        uint modulo = a % b;          // 取模
        
        return (addition, subtraction, multiplication, division, modulo);
    }
    
    function powerOperation(uint base, uint exponent) public pure returns (uint) {
        return base ** exponent;      // 幂运算
    }
}
```

### 溢出检查

```solidity
contract OverflowExample {
    // Solidity 0.8.0+ 默认检查溢出
    function safeAddition(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b; // 溢出时会自动回滚
    }
    
    // 使用 unchecked 跳过溢出检查
    function uncheckedAddition(uint256 a, uint256 b) public pure returns (uint256) {
        unchecked {
            return a + b; // 不检查溢出，可能导致回绕
        }
    }
}
```

## 比较运算符

```solidity
contract ComparisonOperators {
    function compareNumbers(uint a, uint b) public pure returns (bool, bool, bool, bool, bool, bool) {
        bool equal = a == b;          // 等于
        bool notEqual = a != b;       // 不等于
        bool lessThan = a < b;        // 小于
        bool lessOrEqual = a <= b;    // 小于等于
        bool greaterThan = a > b;     // 大于
        bool greaterOrEqual = a >= b; // 大于等于
        
        return (equal, notEqual, lessThan, lessOrEqual, greaterThan, greaterOrEqual);
    }
    
    function compareAddresses(address addr1, address addr2) public pure returns (bool) {
        return addr1 == addr2;
    }
    
    function compareStrings(string memory str1, string memory str2) public pure returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }
}
```

## 逻辑运算符

```solidity
contract LogicalOperators {
    function logicalOperations(bool a, bool b) public pure returns (bool, bool, bool) {
        bool andResult = a && b;      // 逻辑与
        bool orResult = a || b;       // 逻辑或
        bool notResult = !a;          // 逻辑非
        
        return (andResult, orResult, notResult);
    }
    
    function shortCircuitEvaluation(uint x) public pure returns (bool) {
        // 短路求值：如果 x > 0 为 false，不会执行 x / 0
        return x > 0 && (100 / x) > 10;
    }
    
    function complexLogic(uint age, bool hasLicense, bool hasInsurance) public pure returns (bool) {
        return age >= 18 && hasLicense && hasInsurance;
    }
}
```

## 位运算符

```solidity
contract BitwiseOperators {
    function bitwiseOperations(uint8 a, uint8 b) public pure returns (uint8, uint8, uint8, uint8, uint8, uint8) {
        uint8 andResult = a & b;      // 按位与
        uint8 orResult = a | b;       // 按位或
        uint8 xorResult = a ^ b;      // 按位异或
        uint8 notResult = ~a;         // 按位取反
        uint8 leftShift = a << 2;     // 左移
        uint8 rightShift = a >> 2;    // 右移
        
        return (andResult, orResult, xorResult, notResult, leftShift, rightShift);
    }
    
    function checkBit(uint256 number, uint8 position) public pure returns (bool) {
        return (number >> position) & 1 == 1;
    }
    
    function setBit(uint256 number, uint8 position) public pure returns (uint256) {
        return number | (1 << position);
    }
    
    function clearBit(uint256 number, uint8 position) public pure returns (uint256) {
        return number & ~(1 << position);
    }
}
```

## 赋值运算符

```solidity
contract AssignmentOperators {
    uint public value = 100;
    
    function assignmentOperations() public {
        value += 10;    // 等同于 value = value + 10
        value -= 5;     // 等同于 value = value - 5
        value *= 2;     // 等同于 value = value * 2
        value /= 3;     // 等同于 value = value / 3
        value %= 7;     // 等同于 value = value % 7
    }
    
    function bitwiseAssignment() public {
        value |= 8;     // 按位或赋值
        value &= 15;    // 按位与赋值
        value ^= 3;     // 按位异或赋值
        value <<= 1;    // 左移赋值
        value >>= 2;    // 右移赋值
    }
}
```

## 三元运算符

```solidity
contract TernaryOperator {
    function getMax(uint a, uint b) public pure returns (uint) {
        return a > b ? a : b;  // 条件 ? 真值 : 假值
    }
    
    function getStatus(uint score) public pure returns (string memory) {
        return score >= 60 ? "Pass" : "Fail";
    }
    
    function getAbsolute(int x) public pure returns (uint) {
        return x >= 0 ? uint(x) : uint(-x);
    }
}
```

## 运算符优先级

```solidity
contract OperatorPrecedence {
    function precedenceExample() public pure returns (uint) {
        // 运算符优先级（从高到低）：
        // 1. 后缀：++ --
        // 2. 前缀：++ -- + - ! ~
        // 3. 乘除模：* / %
        // 4. 加减：+ -
        // 5. 移位：<< >>
        // 6. 按位与：&
        // 7. 按位异或：^
        // 8. 按位或：|
        // 9. 比较：< <= > >=
        // 10. 等式：== !=
        // 11. 逻辑与：&&
        // 12. 逻辑或：||
        // 13. 三元：? :
        // 14. 赋值：= += -= *= /= %= |= &= ^= <<= >>=
        
        uint result = 2 + 3 * 4;  // 结果是 14，不是 20
        return result;
    }
    
    function useParentheses() public pure returns (uint) {
        uint result = (2 + 3) * 4;  // 使用括号改变优先级，结果是 20
        return result;
    }
}
```

## 实际应用示例

### 权限检查

```solidity
contract PermissionCheck {
    mapping(address => uint8) public userRoles;
    
    uint8 constant ADMIN = 1;
    uint8 constant MODERATOR = 2;
    uint8 constant USER = 4;
    
    function setRole(address user, uint8 role) public {
        userRoles[user] |= role;  // 使用按位或添加角色
    }
    
    function removeRole(address user, uint8 role) public {
        userRoles[user] &= ~role;  // 使用按位与和取反移除角色
    }
    
    function hasRole(address user, uint8 role) public view returns (bool) {
        return (userRoles[user] & role) != 0;  // 检查是否有特定角色
    }
    
    function isAdminOrModerator(address user) public view returns (bool) {
        return hasRole(user, ADMIN) || hasRole(user, MODERATOR);
    }
}
```

### 数学计算

```solidity
contract MathCalculations {
    function calculateCompoundInterest(
        uint principal,
        uint rate,
        uint time
    ) public pure returns (uint) {
        // 复利计算：A = P(1 + r)^t
        // 注意：这里简化了计算，实际应用中需要考虑精度
        uint factor = 100 + rate;  // 1 + r (以百分比表示)
        uint amount = principal;
        
        for (uint i = 0; i < time; i++) {
            amount = (amount * factor) / 100;
        }
        
        return amount;
    }
    
    function isEven(uint number) public pure returns (bool) {
        return number % 2 == 0;  // 使用模运算检查偶数
    }
    
    function isPowerOfTwo(uint number) public pure returns (bool) {
        return number > 0 && (number & (number - 1)) == 0;  // 位运算检查2的幂
    }
}
```

## 最佳实践

### 1. 避免溢出

```solidity
contract SafeMath {
    function safeAdd(uint a, uint b) public pure returns (uint) {
        uint c = a + b;
        require(c >= a, "Addition overflow");
        return c;
    }
    
    // Solidity 0.8.0+ 自动检查溢出
    function modernSafeAdd(uint a, uint b) public pure returns (uint) {
        return a + b;  // 自动回滚溢出
    }
}
```

### 2. 使用适当的数据类型

```solidity
contract DataTypeOptimization {
    // 使用合适的整数大小
    uint8 public smallNumber;   // 0-255
    uint16 public mediumNumber; // 0-65535
    uint256 public largeNumber; // 0-2^256-1
    
    function efficientComparison(uint8 a, uint8 b) public pure returns (bool) {
        return a == b;  // uint8 比较比 uint256 更高效
    }
}
```

### 3. 短路求值优化

```solidity
contract ShortCircuitOptimization {
    mapping(address => bool) public authorized;
    
    function checkAccess(address user) public view returns (bool) {
        // 先检查简单条件，再检查复杂条件
        return authorized[user] && expensiveCheck(user);
    }
    
    function expensiveCheck(address user) private pure returns (bool) {
        // 模拟昂贵的检查操作
        return user != address(0);
    }
}
```

## 常见错误

### 1. 整数除法截断

```solidity
contract DivisionTruncation {
    function incorrectPercentage(uint amount, uint percent) public pure returns (uint) {
        // 错误：先除法后乘法会导致精度丢失
        return (amount / 100) * percent;
    }
    
    function correctPercentage(uint amount, uint percent) public pure returns (uint) {
        // 正确：先乘法后除法
        return (amount * percent) / 100;
    }
}
```

### 2. 浮点数比较

```solidity
contract FloatingPointComparison {
    // Solidity 不支持浮点数，使用定点数
    uint constant PRECISION = 1e18;
    
    function compareWithPrecision(uint a, uint b, uint tolerance) public pure returns (bool) {
        uint diff = a > b ? a - b : b - a;
        return diff <= tolerance;
    }
}
```

## 下一步

- [控制结构](/solidity/basics/control-structures) - 学习条件语句和循环
- [函数定义](/solidity/basics/functions) - 了解函数的定义和使用
- [数组和映射](/solidity/basics/arrays-mappings) - 学习复合数据类型
