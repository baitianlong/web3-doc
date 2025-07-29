---
title: 安全检查清单
description: Solidity 智能合约开发完整的安全检查清单
keywords: [solidity, 安全检查, 智能合约安全, 代码审计, 安全清单]
---

# 安全检查清单

本文档提供了一个全面的 Solidity 智能合约安全检查清单，涵盖从开发到部署的各个阶段。

## 📋 开发阶段检查清单

### 基础设置

- [ ] **使用最新稳定版本的 Solidity**
  ```solidity
  pragma solidity ^0.8.19; // 使用最新稳定版本
  ```

- [ ] **启用所有编译器警告**
  ```json
  // hardhat.config.js
  {
    "solidity": {
      "version": "0.8.19",
      "settings": {
        "optimizer": {
          "enabled": true,
          "runs": 200
        },
        "outputSelection": {
          "*": {
            "*": ["*"]
          }
        }
      }
    }
  }
  ```

- [ ] **使用 SPDX 许可证标识符**
  ```solidity
  // SPDX-License-Identifier: MIT
  ```

### 访问控制

- [ ] **实现适当的访问控制机制**
  ```solidity
  import "@openzeppelin/contracts/access/Ownable.sol";
  
  contract SecureContract is Ownable {
      modifier onlyAuthorized() {
          require(msg.sender == owner(), "Not authorized");
          _;
      }
  }
  ```

- [ ] **避免使用 `tx.origin` 进行身份验证**
  ```solidity
  // ❌ 错误
  require(tx.origin == owner, "Not owner");
  
  // ✅ 正确
  require(msg.sender == owner, "Not owner");
  ```

- [ ] **使用基于角色的访问控制（RBAC）**
  ```solidity
  import "@openzeppelin/contracts/access/AccessControl.sol";
  
  contract RoleBasedContract is AccessControl {
      bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
      bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  }
  ```

### 重入攻击防护

- [ ] **使用检查-效果-交互模式（CEI）**
  ```solidity
  function withdraw(uint256 amount) public {
      // 检查
      require(balances[msg.sender] >= amount, "Insufficient balance");
      
      // 效果
      balances[msg.sender] -= amount;
      
      // 交互
      (bool success, ) = msg.sender.call{value: amount}("");
      require(success, "Transfer failed");
  }
  ```

- [ ] **使用重入锁**
  ```solidity
  import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
  
  contract SecureContract is ReentrancyGuard {
      function sensitiveFunction() public nonReentrant {
          // 敏感操作
      }
  }
  ```

- [ ] **避免在状态更新前进行外部调用**

### 整数安全

- [ ] **使用 Solidity 0.8.0+ 的自动溢出检查**
- [ ] **对于特殊情况使用 `unchecked` 块**
  ```solidity
  function safeIncrement(uint256 value) public pure returns (uint256) {
      unchecked {
          return value + 1; // 确保不会溢出的情况
      }
  }
  ```

- [ ] **验证除法运算的除数不为零**
  ```solidity
  function safeDivide(uint256 a, uint256 b) public pure returns (uint256) {
      require(b > 0, "Division by zero");
      return a / b;
  }
  ```

### 外部调用安全

- [ ] **检查所有外部调用的返回值**
  ```solidity
  function sendEther(address payable recipient, uint256 amount) public {
      (bool success, ) = recipient.call{value: amount}("");
      require(success, "Transfer failed");
  }
  ```

- [ ] **使用 `try-catch` 处理外部合约调用**
  ```solidity
  function callExternal(address target) public {
      try IExternalContract(target).externalFunction() {
          // 成功处理
      } catch Error(string memory reason) {
          // 处理错误
      } catch (bytes memory) {
          // 处理低级错误
      }
  }
  ```

- [ ] **限制外部调用的 Gas 使用量**

### 输入验证

- [ ] **验证所有函数参数**
  ```solidity
  function transfer(address to, uint256 amount) public {
      require(to != address(0), "Invalid recipient");
      require(amount > 0, "Amount must be positive");
      // ...
  }
  ```

- [ ] **检查数组长度和边界**
  ```solidity
  function processArray(uint256[] memory data) public {
      require(data.length <= MAX_ARRAY_LENGTH, "Array too large");
      for (uint256 i = 0; i < data.length; i++) {
          // 处理数据
      }
  }
  ```

- [ ] **验证地址参数不为零地址**
  ```solidity
  modifier validAddress(address addr) {
      require(addr != address(0), "Invalid address");
      _;
  }
  ```

### 随机数安全

- [ ] **避免使用可预测的随机数源**
  ```solidity
  // ❌ 错误 - 可预测
  uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp)));
  
  // ✅ 正确 - 使用 Chainlink VRF
  import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
  ```

- [ ] **使用承诺-揭示方案**
- [ ] **考虑使用外部随机数服务**

### Gas 优化和 DoS 防护

- [ ] **限制循环长度**
  ```solidity
  uint256 public constant MAX_ITERATIONS = 100;
  
  function processItems(uint256 count) public {
      require(count <= MAX_ITERATIONS, "Too many iterations");
      for (uint256 i = 0; i < count; i++) {
          // 处理
      }
  }
  ```

- [ ] **使用拉取模式代替推送模式**
  ```solidity
  mapping(address => uint256) public withdrawableAmounts;
  
  function withdraw() public {
      uint256 amount = withdrawableAmounts[msg.sender];
      withdrawableAmounts[msg.sender] = 0;
      payable(msg.sender).transfer(amount);
  }
  ```

- [ ] **避免无限制的数组操作**

### 时间依赖

- [ ] **避免严格依赖 `block.timestamp`**
  ```solidity
  // ✅ 允许一定的时间容差
  uint256 public constant TIME_TOLERANCE = 15 minutes;
  
  function checkTime(uint256 targetTime) public view returns (bool) {
      return block.timestamp >= targetTime - TIME_TOLERANCE;
  }
  ```

- [ ] **使用区块号代替时间戳（如适用）**
- [ ] **考虑矿工可能的时间戳操纵**

## 🧪 测试阶段检查清单

### 单元测试

- [ ] **测试覆盖率达到 90% 以上**
- [ ] **测试所有公共和外部函数**
- [ ] **测试边界条件**
  ```javascript
  describe("Boundary tests", function() {
      it("should handle maximum uint256", async function() {
          const maxUint256 = ethers.constants.MaxUint256;
          // 测试最大值
      });
      
      it("should handle zero values", async function() {
          // 测试零值
      });
  });
  ```

- [ ] **测试访问控制**
  ```javascript
  it("should revert when non-owner calls restricted function", async function() {
      await expect(
          contract.connect(user).restrictedFunction()
      ).to.be.revertedWith("Not owner");
  });
  ```

### 集成测试

- [ ] **测试合约间交互**
- [ ] **测试升级兼容性（如适用）**
- [ ] **测试多链部署（如适用）**

### 模糊测试

- [ ] **使用 Echidna 进行属性测试**
  ```solidity
  contract TestContract {
      function echidna_balance_never_negative() public view returns (bool) {
          return balance >= 0;
      }
  }
  ```

- [ ] **使用 Foundry 的模糊测试**
  ```solidity
  function testFuzz_transfer(uint256 amount) public {
      vm.assume(amount <= token.balanceOf(address(this)));
      token.transfer(user, amount);
      assertEq(token.balanceOf(user), amount);
  }
  ```

### 攻击场景测试

- [ ] **模拟重入攻击**
- [ ] **模拟前端运行攻击**
- [ ] **模拟 DoS 攻击**
- [ ] **模拟整数溢出攻击**

## 🔍 静态分析检查清单

### 自动化工具

- [ ] **运行 Slither 静态分析**
  ```bash
  slither contracts/
  ```

- [ ] **使用 MythX 安全分析**
  ```bash
  mythx analyze contracts/
  ```

- [ ] **运行 Solhint 代码质量检查**
  ```bash
  solhint contracts/**/*.sol
  ```

### 手动代码审查

- [ ] **检查所有 TODO 和 FIXME 注释**
- [ ] **验证所有魔法数字都有常量定义**
- [ ] **检查未使用的变量和函数**
- [ ] **验证事件日志的完整性**

## 📦 部署前检查清单

### 配置验证

- [ ] **验证构造函数参数**
- [ ] **检查初始化函数（可升级合约）**
- [ ] **验证网络配置**
  ```javascript
  // hardhat.config.js
  networks: {
      mainnet: {
          url: process.env.MAINNET_URL,
          accounts: [process.env.PRIVATE_KEY],
          gasPrice: "auto"
      }
  }
  ```

### 安全设置

- [ ] **设置适当的 Gas 限制**
- [ ] **配置多签钱包（生产环境）**
- [ ] **准备暂停机制（如适用）**
  ```solidity
  import "@openzeppelin/contracts/security/Pausable.sol";
  
  contract PausableContract is Pausable, Ownable {
      function pause() public onlyOwner {
          _pause();
      }
      
      function unpause() public onlyOwner {
          _unpause();
      }
  }
  ```

### 文档和验证

- [ ] **准备合约验证代码**
- [ ] **编写部署文档**
- [ ] **准备应急响应计划**

## 🚀 部署后检查清单

### 立即验证

- [ ] **验证合约在区块链浏览器上**
- [ ] **测试基本功能**
- [ ] **验证权限设置**
- [ ] **检查初始状态**

### 监控设置

- [ ] **设置事件监控**
  ```javascript
  contract.on("Transfer", (from, to, amount) => {
      console.log(`Transfer: ${from} -> ${to}, Amount: ${amount}`);
  });
  ```

- [ ] **配置异常告警**
- [ ] **设置 Gas 价格监控**
- [ ] **监控合约余额变化**

### 安全措施

- [ ] **撤销部署者权限（如适用）**
- [ ] **转移所有权到多签钱包**
- [ ] **设置时间锁（如适用）**

## 🛡️ 持续安全检查清单

### 定期审查

- [ ] **每月检查依赖库更新**
- [ ] **关注安全漏洞披露**
- [ ] **审查访问权限**
- [ ] **检查监控告警**

### 事件响应

- [ ] **准备紧急暂停程序**
- [ ] **建立事件响应团队**
- [ ] **准备用户通知机制**
- [ ] **制定资金恢复计划**

## 📊 安全评分系统

### 评分标准

| 类别 | 权重 | 检查项目 |
|------|------|----------|
| 访问控制 | 25% | 权限管理、角色控制 |
| 重入防护 | 20% | CEI模式、重入锁 |
| 输入验证 | 15% | 参数检查、边界验证 |
| 外部调用 | 15% | 返回值检查、错误处理 |
| 测试覆盖 | 15% | 单元测试、集成测试 |
| 代码质量 | 10% | 静态分析、代码审查 |

### 安全等级

- **A级 (90-100分)**: 生产就绪，安全性极高
- **B级 (80-89分)**: 基本安全，需要小幅改进
- **C级 (70-79分)**: 存在安全风险，需要重大改进
- **D级 (60-69分)**: 安全性不足，不建议部署
- **F级 (<60分)**: 严重安全问题，必须修复

## 🔧 推荐工具

### 开发工具

- **Hardhat**: 开发框架
- **Foundry**: 测试框架
- **Remix**: 在线IDE
- **OpenZeppelin**: 安全库

### 安全工具

- **Slither**: 静态分析
- **MythX**: 安全分析平台
- **Echidna**: 模糊测试
- **Manticore**: 符号执行

### 监控工具

- **Forta**: 实时监控
- **OpenZeppelin Defender**: 运营平台
- **Tenderly**: 调试和监控

## 📝 检查清单模板

```markdown
## 项目安全检查报告

**项目名称**: _______________
**检查日期**: _______________
**检查人员**: _______________

### 开发阶段 (权重: 40%)
- [ ] 基础设置 (10项)
- [ ] 访问控制 (8项)
- [ ] 重入防护 (5项)
- [ ] 输入验证 (12项)

### 测试阶段 (权重: 30%)
- [ ] 单元测试 (6项)
- [ ] 集成测试 (4项)
- [ ] 模糊测试 (3项)
- [ ] 攻击测试 (5项)

### 部署阶段 (权重: 20%)
- [ ] 部署前检查 (8项)
- [ ] 部署后验证 (6项)

### 持续监控 (权重: 10%)
- [ ] 监控设置 (4项)
- [ ] 定期审查 (3项)

**总分**: ___/100
**安全等级**: ___
**建议**: _______________
```

## 总结

安全检查清单是确保智能合约安全的重要工具。建议：

1. **分阶段执行**：按开发、测试、部署、运营阶段逐步检查
2. **自动化集成**：将检查项目集成到 CI/CD 流程中
3. **定期更新**：根据新的安全威胁更新检查清单
4. **团队培训**：确保所有开发人员熟悉安全检查流程
5. **文档记录**：保留所有检查记录和改进措施

记住：**安全是一个持续的过程，而不是一次性的任务**。

---

## 相关资源

- [常见漏洞](/solidity/security/common-vulnerabilities) - 详细的漏洞分析
- [审计指南](/solidity/security/audit-guide) - 专业审计流程
- [测试策略](/solidity/security/testing-strategies) - 全面的测试方法