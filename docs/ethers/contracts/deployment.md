---
title: 合约部署
description: 使用 Ethers.js 部署智能合约的完整指南
keywords: [ethers, 合约部署, ContractFactory, 智能合约, 部署, Web3]
---

# 合约部署

合约部署是将智能合约代码发布到区块链网络的过程。Ethers.js 提供了 `ContractFactory` 类来简化合约部署流程。

## 基础部署概念

### 1. 部署流程

合约部署包含以下步骤：

1. **编译合约**：将 Solidity 代码编译为字节码
2. **创建工厂**：使用字节码和 ABI 创建 ContractFactory
3. **部署交易**：发送包含字节码的交易
4. **等待确认**：等待交易被挖矿确认
5. **获取地址**：获取部署后的合约地址

### 2. 部署所需信息

```typescript
// 合约编译后的输出
interface CompiledContract {
  abi: any[];                    // 应用程序二进制接口
  bytecode: string;              // 合约字节码
  deployedBytecode?: string;     // 部署后的字节码
  linkReferences?: any;          // 库链接引用
  metadata?: string;             // 元数据
}
```

## 基本部署方法

### 1. 使用 ContractFactory

```typescript
import { ethers } from 'ethers';

// 合约 ABI 和字节码（通常从编译器获取）
const contractABI = [
  "constructor(string memory name, string memory symbol, uint256 totalSupply)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const contractBytecode = "0x608060405234801561001057600080fd5b50..."; // 完整的字节码

// 创建 Provider 和 Signer
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR-PROJECT-ID');
const wallet = new ethers.Wallet('0x...privateKey', provider);

// 创建合约工厂
const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);

// 部署合约
async function deployContract() {
  try {
    console.log('开始部署合约...');
    
    // 部署参数
    const name = "MyToken";
    const symbol = "MTK";
    const totalSupply = ethers.parseEther("1000000"); // 100万代币

    // 部署合约
    const contract = await contractFactory.deploy(name, symbol, totalSupply);
    
    console.log('部署交易已发送:', contract.deploymentTransaction()?.hash);
    console.log('合约地址:', await contract.getAddress());
    
    // 等待部署确认
    await contract.waitForDeployment();
    console.log('合约部署完成!');
    
    return contract;
  } catch (error) {
    console.error('部署失败:', error);
    throw error;
  }
}

// 执行部署
const deployedContract = await deployContract();
```

### 2. 带选项的部署

```typescript
async function deployWithOptions() {
  try {
    // 估算部署 Gas
    const deploymentGas = await contractFactory.getDeployTransaction(
      "MyToken", 
      "MTK", 
      ethers.parseEther("1000000")
    ).then(tx => wallet.estimateGas(tx));

    console.log('预估 Gas:', deploymentGas.toString());

    // 获取当前 Gas 价格
    const gasPrice = await provider.getFeeData();
    console.log('当前 Gas 价格:', gasPrice.gasPrice?.toString());

    // 部署合约（带自定义选项）
    const contract = await contractFactory.deploy(
      "MyToken",
      "MTK", 
      ethers.parseEther("1000000"),
      {
        gasLimit: deploymentGas * 120n / 100n, // 增加 20% 缓冲
        gasPrice: gasPrice.gasPrice,
        value: 0, // 发送的 ETH 数量
        nonce: await wallet.getNonce() // 手动指定 nonce
      }
    );

    console.log('部署交易:', contract.deploymentTransaction()?.hash);
    
    // 等待指定数量的确认
    const receipt = await contract.deploymentTransaction()?.wait(2); // 等待 2 个确认
    console.log('部署确认:', receipt?.status === 1 ? '成功' : '失败');
    
    return contract;
  } catch (error) {
    console.error('部署失败:', error);
    throw error;
  }
}
```

### 3. 从编译输出部署

```typescript
// 从 Hardhat 或 Truffle 编译输出部署
async function deployFromCompiledOutput() {
  // 假设这是从编译器获取的输出
  const compiledContract = {
    abi: [
      // ... ABI 数组
    ],
    bytecode: "0x608060405234801561001057600080fd5b50...",
    deployedBytecode: "0x608060405234801561001057600080fd5b50...",
    linkReferences: {},
    metadata: "{...}"
  };

  // 创建工厂
  const factory = new ethers.ContractFactory(
    compiledContract.abi,
    compiledContract.bytecode,
    wallet
  );

  // 部署
  const contract = await factory.deploy(/* 构造函数参数 */);
  await contract.waitForDeployment();

  return {
    contract,
    address: await contract.getAddress(),
    deploymentTransaction: contract.deploymentTransaction()
  };
}
```

## 高级部署功能

### 1. 预计算合约地址

```typescript
class ContractAddressPredictor {
  // 使用 CREATE 操作码预计算地址
  static predictCreate(deployerAddress: string, nonce: number): string {
    return ethers.getCreateAddress({
      from: deployerAddress,
      nonce
    });
  }

  // 使用 CREATE2 操作码预计算地址
  static predictCreate2(
    deployerAddress: string,
    salt: string,
    initCodeHash: string
  ): string {
    return ethers.getCreate2Address(deployerAddress, salt, initCodeHash);
  }

  // 预计算并验证地址
  static async predictAndDeploy(
    factory: ethers.ContractFactory,
    constructorArgs: any[] = []
  ) {
    const signer = factory.runner as ethers.Signer;
    const deployerAddress = await signer.getAddress();
    const nonce = await signer.getNonce();

    // 预计算地址
    const predictedAddress = this.predictCreate(deployerAddress, nonce);
    console.log('预计算的合约地址:', predictedAddress);

    // 部署合约
    const contract = await factory.deploy(...constructorArgs);
    const actualAddress = await contract.getAddress();

    // 验证地址是否匹配
    const addressMatch = predictedAddress.toLowerCase() === actualAddress.toLowerCase();
    console.log('地址预测', addressMatch ? '正确' : '错误');

    return {
      contract,
      predictedAddress,
      actualAddress,
      addressMatch
    };
  }
}

// 使用示例
const result = await ContractAddressPredictor.predictAndDeploy(
  contractFactory,
  ["MyToken", "MTK", ethers.parseEther("1000000")]
);
```

### 2. 使用 CREATE2 部署

```typescript
// CREATE2 部署器合约 ABI
const create2DeployerABI = [
  "function deploy(uint256 amount, bytes32 salt, bytes memory bytecode) returns (address)"
];

class Create2Deployer {
  private deployerContract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(deployerAddress: string, signer: ethers.Signer) {
    this.deployerContract = new ethers.Contract(deployerAddress, create2DeployerABI, signer);
    this.signer = signer;
  }

  // 计算 CREATE2 地址
  calculateAddress(salt: string, bytecode: string): string {
    const deployerAddress = this.deployerContract.target as string;
    const initCodeHash = ethers.keccak256(bytecode);
    
    return ethers.getCreate2Address(deployerAddress, salt, initCodeHash);
  }

  // 使用 CREATE2 部署
  async deploy(
    salt: string,
    bytecode: string,
    value: bigint = 0n
  ): Promise<{
    address: string;
    transaction: ethers.ContractTransactionResponse;
  }> {
    // 预计算地址
    const predictedAddress = this.calculateAddress(salt, bytecode);
    console.log('CREATE2 预计算地址:', predictedAddress);

    // 检查地址是否已被使用
    const code = await this.signer.provider?.getCode(predictedAddress);
    if (code && code !== '0x') {
      throw new Error(`地址 ${predictedAddress} 已被使用`);
    }

    // 部署合约
    const tx = await this.deployerContract.deploy(value, salt, bytecode);
    console.log('CREATE2 部署交易:', tx.hash);

    await tx.wait();
    console.log('CREATE2 部署完成');

    return {
      address: predictedAddress,
      transaction: tx
    };
  }

  // 部署带构造函数参数的合约
  async deployWithConstructor(
    salt: string,
    bytecode: string,
    constructorTypes: string[],
    constructorArgs: any[],
    value: bigint = 0n
  ) {
    // 编码构造函数参数
    const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
      constructorTypes,
      constructorArgs
    );

    // 组合字节码和构造函数参数
    const fullBytecode = bytecode + encodedArgs.slice(2); // 移除 0x 前缀

    return await this.deploy(salt, fullBytecode, value);
  }
}

// 使用示例
const create2Deployer = new Create2Deployer('0x...deployerAddress', wallet);

const salt = ethers.id("my-unique-salt"); // 生成 salt
const result = await create2Deployer.deployWithConstructor(
  salt,
  contractBytecode,
  ["string", "string", "uint256"],
  ["MyToken", "MTK", ethers.parseEther("1000000")]
);

console.log('CREATE2 部署的合约地址:', result.address);
```

### 3. 批量部署

```typescript
class BatchDeployer {
  private signer: ethers.Signer;
  private deployments: Map<string, any> = new Map();

  constructor(signer: ethers.Signer) {
    this.signer = signer;
  }

  // 添加部署任务
  addDeployment(
    name: string,
    factory: ethers.ContractFactory,
    args: any[] = [],
    options: any = {}
  ) {
    this.deployments.set(name, {
      factory,
      args,
      options,
      status: 'pending'
    });
  }

  // 执行批量部署
  async deployAll(concurrency: number = 3): Promise<Map<string, {
    contract: ethers.Contract;
    address: string;
    transaction: ethers.ContractTransactionResponse;
    status: 'success' | 'failed';
    error?: string;
  }>> {
    const results = new Map();
    const deploymentEntries = Array.from(this.deployments.entries());

    // 分批处理
    for (let i = 0; i < deploymentEntries.length; i += concurrency) {
      const batch = deploymentEntries.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async ([name, deployment]) => {
        try {
          console.log(`开始部署 ${name}...`);
          
          const contract = await deployment.factory.deploy(
            ...deployment.args,
            deployment.options
          );

          const address = await contract.getAddress();
          const transaction = contract.deploymentTransaction()!;

          console.log(`${name} 部署交易:`, transaction.hash);
          
          // 等待确认
          await contract.waitForDeployment();
          console.log(`${name} 部署完成:`, address);

          return {
            name,
            result: {
              contract,
              address,
              transaction,
              status: 'success' as const
            }
          };
        } catch (error: any) {
          console.error(`${name} 部署失败:`, error.message);
          return {
            name,
            result: {
              contract: null,
              address: '',
              transaction: null,
              status: 'failed' as const,
              error: error.message
            }
          };
        }
      });

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ name, result }) => {
        results.set(name, result);
      });
    }

    return results;
  }

  // 获取部署摘要
  getDeploymentSummary(results: Map<string, any>) {
    const successful = Array.from(results.values()).filter(r => r.status === 'success');
    const failed = Array.from(results.values()).filter(r => r.status === 'failed');

    return {
      total: results.size,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.size) * 100,
      deployedContracts: successful.map(r => ({
        address: r.address,
        transaction: r.transaction.hash
      })),
      errors: failed.map(r => r.error)
    };
  }
}

// 使用示例
const batchDeployer = new BatchDeployer(wallet);

// 添加多个部署任务
batchDeployer.addDeployment('Token1', tokenFactory, ['Token1', 'TK1', ethers.parseEther('1000')]);
batchDeployer.addDeployment('Token2', tokenFactory, ['Token2', 'TK2', ethers.parseEther('2000')]);
batchDeployer.addDeployment('Token3', tokenFactory, ['Token3', 'TK3', ethers.parseEther('3000')]);

// 执行批量部署
const results = await batchDeployer.deployAll(2); // 并发度为 2
const summary = batchDeployer.getDeploymentSummary(results);

console.log('部署摘要:', summary);
```

## 部署验证和管理

### 1. 部署后验证

```typescript
class DeploymentVerifier {
  // 验证合约部署
  static async verifyDeployment(
    contract: ethers.Contract,
    expectedBytecode?: string
  ): Promise<{
    isDeployed: boolean;
    hasCorrectBytecode: boolean;
    address: string;
    codeSize: number;
    deploymentBlock?: number;
  }> {
    const address = await contract.getAddress();
    const provider = contract.runner?.provider;

    if (!provider) {
      throw new Error('无法获取 Provider');
    }

    // 检查合约代码
    const deployedCode = await provider.getCode(address);
    const isDeployed = deployedCode !== '0x';
    
    let hasCorrectBytecode = true;
    if (expectedBytecode && isDeployed) {
      // 比较部署后的字节码（移除元数据部分）
      hasCorrectBytecode = deployedCode.includes(expectedBytecode.slice(0, -100));
    }

    // 获取部署区块
    let deploymentBlock: number | undefined;
    const deploymentTx = contract.deploymentTransaction();
    if (deploymentTx) {
      const receipt = await deploymentTx.wait();
      deploymentBlock = receipt?.blockNumber;
    }

    return {
      isDeployed,
      hasCorrectBytecode,
      address,
      codeSize: deployedCode.length,
      deploymentBlock
    };
  }

  // 验证构造函数参数
  static async verifyConstructorArgs(
    contract: ethers.Contract,
    expectedArgs: any[]
  ): Promise<boolean> {
    try {
      // 这里需要根据具体合约的 getter 函数来验证
      // 示例：验证 ERC20 代币的构造函数参数
      if (expectedArgs.length >= 3) {
        const [expectedName, expectedSymbol, expectedSupply] = expectedArgs;
        
        const actualName = await contract.name();
        const actualSymbol = await contract.symbol();
        const actualSupply = await contract.totalSupply();

        return (
          actualName === expectedName &&
          actualSymbol === expectedSymbol &&
          actualSupply === expectedSupply
        );
      }
      
      return true;
    } catch (error) {
      console.error('验证构造函数参数失败:', error);
      return false;
    }
  }

  // 完整验证
  static async fullVerification(
    contract: ethers.Contract,
    expectedBytecode?: string,
    expectedConstructorArgs?: any[]
  ) {
    const deploymentVerification = await this.verifyDeployment(contract, expectedBytecode);
    
    let constructorVerification = true;
    if (expectedConstructorArgs) {
      constructorVerification = await this.verifyConstructorArgs(contract, expectedConstructorArgs);
    }

    return {
      ...deploymentVerification,
      constructorArgsCorrect: constructorVerification,
      overallValid: deploymentVerification.isDeployed && 
                   deploymentVerification.hasCorrectBytecode && 
                   constructorVerification
    };
  }
}

// 使用示例
const verification = await DeploymentVerifier.fullVerification(
  deployedContract,
  contractBytecode,
  ["MyToken", "MTK", ethers.parseEther("1000000")]
);

console.log('部署验证结果:', verification);
```

### 2. 部署记录管理

```typescript
interface DeploymentRecord {
  name: string;
  address: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  constructorArgs: any[];
  bytecode: string;
  abi: any[];
  network: string;
  deployer: string;
}

class DeploymentManager {
  private records: DeploymentRecord[] = [];
  private network: string;

  constructor(network: string) {
    this.network = network;
  }

  // 记录部署
  async recordDeployment(
    name: string,
    contract: ethers.Contract,
    constructorArgs: any[] = [],
    bytecode: string = '',
    abi: any[] = []
  ): Promise<void> {
    const address = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();
    
    if (!deploymentTx) {
      throw new Error('无法获取部署交易信息');
    }

    const receipt = await deploymentTx.wait();
    if (!receipt) {
      throw new Error('无法获取交易收据');
    }

    const block = await contract.runner?.provider?.getBlock(receipt.blockNumber);
    const deployer = await (contract.runner as ethers.Signer)?.getAddress();

    const record: DeploymentRecord = {
      name,
      address,
      transactionHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp || Date.now(),
      constructorArgs,
      bytecode,
      abi,
      network: this.network,
      deployer: deployer || ''
    };

    this.records.push(record);
    console.log(`已记录 ${name} 的部署信息`);
  }

  // 获取部署记录
  getRecord(name: string): DeploymentRecord | undefined {
    return this.records.find(record => record.name === name);
  }

  // 获取所有记录
  getAllRecords(): DeploymentRecord[] {
    return [...this.records];
  }

  // 导出记录到 JSON
  exportToJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }

  // 从 JSON 导入记录
  importFromJSON(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.records = imported;
        console.log(`已导入 ${imported.length} 条部署记录`);
      }
    } catch (error) {
      console.error('导入部署记录失败:', error);
    }
  }

  // 生成部署报告
  generateReport(): string {
    const report = [
      `部署报告 - ${this.network}`,
      `生成时间: ${new Date().toISOString()}`,
      `总计部署: ${this.records.length} 个合约`,
      '',
      '部署详情:',
      ...this.records.map(record => 
        `- ${record.name}: ${record.address} (区块 ${record.blockNumber})`
      )
    ];

    return report.join('\n');
  }
}

// 使用示例
const deploymentManager = new DeploymentManager('sepolia');

// 部署并记录
const contract = await contractFactory.deploy("MyToken", "MTK", ethers.parseEther("1000000"));
await contract.waitForDeployment();

await deploymentManager.recordDeployment(
  'MyToken',
  contract,
  ["MyToken", "MTK", ethers.parseEther("1000000")],
  contractBytecode,
  contractABI
);

// 生成报告
console.log(deploymentManager.generateReport());
```

## 部署最佳实践

### 1. 部署前检查清单

```typescript
class DeploymentChecklist {
  static async runPreDeploymentChecks(
    factory: ethers.ContractFactory,
    constructorArgs: any[] = []
  ): Promise<{
    passed: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
    }>;
  }> {
    const checks = [];
    const signer = factory.runner as ethers.Signer;
    const provider = signer.provider;

    if (!provider) {
      throw new Error('无法获取 Provider');
    }

    // 检查 1: 账户余额
    try {
      const balance = await provider.getBalance(await signer.getAddress());
      const minBalance = ethers.parseEther('0.01'); // 最少需要 0.01 ETH
      
      checks.push({
        name: '账户余额检查',
        passed: balance >= minBalance,
        message: balance >= minBalance 
          ? `余额充足: ${ethers.formatEther(balance)} ETH`
          : `余额不足: ${ethers.formatEther(balance)} ETH (需要至少 0.01 ETH)`
      });
    } catch (error) {
      checks.push({
        name: '账户余额检查',
        passed: false,
        message: '无法获取账户余额'
      });
    }

    // 检查 2: 网络连接
    try {
      const blockNumber = await provider.getBlockNumber();
      checks.push({
        name: '网络连接检查',
        passed: true,
        message: `网络正常，当前区块: ${blockNumber}`
      });
    } catch (error) {
      checks.push({
        name: '网络连接检查',
        passed: false,
        message: '网络连接失败'
      });
    }

    // 检查 3: Gas 估算
    try {
      const deployTx = await factory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await signer.estimateGas(deployTx);
      
      checks.push({
        name: 'Gas 估算检查',
        passed: true,
        message: `预估 Gas: ${gasEstimate.toString()}`
      });
    } catch (error) {
      checks.push({
        name: 'Gas 估算检查',
        passed: false,
        message: 'Gas 估算失败，部署可能会失败'
      });
    }

    // 检查 4: 构造函数参数验证
    try {
      // 基本类型检查
      const fragment = factory.interface.deploy;
      if (fragment.inputs.length !== constructorArgs.length) {
        throw new Error(`参数数量不匹配: 期望 ${fragment.inputs.length}，实际 ${constructorArgs.length}`);
      }

      checks.push({
        name: '构造函数参数检查',
        passed: true,
        message: '参数验证通过'
      });
    } catch (error: any) {
      checks.push({
        name: '构造函数参数检查',
        passed: false,
        message: error.message
      });
    }

    const allPassed = checks.every(check => check.passed);
    
    return {
      passed: allPassed,
      checks
    };
  }

  // 打印检查结果
  static printCheckResults(results: any): void {
    console.log('\n=== 部署前检查 ===');
    results.checks.forEach((check: any) => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.message}`);
    });
    console.log(`\n总体结果: ${results.passed ? '✅ 通过' : '❌ 失败'}`);
  }
}

// 使用示例
const checkResults = await DeploymentChecklist.runPreDeploymentChecks(
  contractFactory,
  ["MyToken", "MTK", ethers.parseEther("1000000")]
);

DeploymentChecklist.printCheckResults(checkResults);

if (checkResults.passed) {
  console.log('所有检查通过，开始部署...');
  // 执行部署
} else {
  console.log('检查失败，请解决问题后重试');
}
```

### 2. 部署配置管理

```typescript
interface DeploymentConfig {
  network: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  confirmations: number;
  timeout: number;
  retries: number;
}

class ConfigurableDeployer {
  private config: DeploymentConfig;
  private factory: ethers.ContractFactory;

  constructor(factory: ethers.ContractFactory, config: DeploymentConfig) {
    this.factory = factory;
    this.config = config;
  }

  // 部署合约
  async deploy(constructorArgs: any[] = []): Promise<ethers.Contract> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(`部署尝试 ${attempt}/${this.config.retries}`);

        // 准备交易选项
        const txOptions: any = {};
        
        if (this.config.gasLimit) {
          txOptions.gasLimit = this.config.gasLimit;
        }
        
        if (this.config.gasPrice) {
          txOptions.gasPrice = this.config.gasPrice;
        }
        
        if (this.config.maxFeePerGas) {
          txOptions.maxFeePerGas = this.config.maxFeePerGas;
        }
        
        if (this.config.maxPriorityFeePerGas) {
          txOptions.maxPriorityFeePerGas = this.config.maxPriorityFeePerGas;
        }

        // 部署合约
        const contract = await this.factory.deploy(...constructorArgs, txOptions);
        
        console.log('部署交易已发送:', contract.deploymentTransaction()?.hash);

        // 等待确认
        const receipt = await this.waitForDeployment(contract);
        
        if (receipt.status === 1) {
          console.log('部署成功!');
          return contract;
        } else {
          throw new Error('部署交易失败');
        }
      } catch (error: any) {
        lastError = error;
        console.error(`部署尝试 ${attempt} 失败:`, error.message);
        
        if (attempt < this.config.retries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`部署失败，已重试 ${this.config.retries} 次。最后错误: ${lastError?.message}`);
  }

  // 等待部署确认
  private async waitForDeployment(contract: ethers.Contract): Promise<any> {
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('无法获取部署交易');
    }

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('部署超时')), this.config.timeout);
    });

    // 等待确认
    const confirmationPromise = deploymentTx.wait(this.config.confirmations);

    return await Promise.race([confirmationPromise, timeoutPromise]);
  }

  // 更新配置
  updateConfig(newConfig: Partial<DeploymentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 使用示例
const deploymentConfig: DeploymentConfig = {
  network: 'sepolia',
  gasLimit: 2000000n,
  confirmations: 2,
  timeout: 300000, // 5 分钟
  retries: 3
};

const deployer = new ConfigurableDeployer(contractFactory, deploymentConfig);
const contract = await deployer.deploy(["MyToken", "MTK", ethers.parseEther("1000000")]);
```

## 与开发框架集成

### 1. Hardhat 集成

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;

// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 部署合约
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("MyToken", "MTK", ethers.parseEther("1000000"));
  
  await token.waitForDeployment();
  
  const address = await token.getAddress();
  console.log("合约地址:", address);

  // 验证合约（可选）
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("等待区块确认...");
    await token.deploymentTransaction()?.wait(6);
    
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: ["MyToken", "MTK", ethers.parseEther("1000000")],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 2. Foundry 集成

```bash
# forge.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = []

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/MyToken.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MyToken token = new MyToken("MyToken", "MTK", 1000000 * 10**18);
        
        console.log("Token deployed to:", address(token));

        vm.stopBroadcast();
    }
}
```

```bash
# 部署命令
forge script script/Deploy.s.sol:DeployScript --rpc-url sepolia --broadcast --verify
```

## 常见问题

### Q: 部署失败常见原因有哪些？
A: 常见原因包括：Gas 不足、构造函数参数错误、合约代码有误、网络拥堵、nonce 冲突等。

### Q: 如何降低部署成本？
A: 优化合约代码、选择 Gas 价格较低的时间、使用 CREATE2 预计算地址、批量部署等方法可以降低成本。

### Q: 部署后如何验证合约？
A: 可以通过区块链浏览器验证源码，或者使用 Hardhat 的验证插件自动验证。

### Q: 如何处理部署失败的情况？
A: 检查错误信息、验证参数、确保余额充足、调整 Gas 设置，必要时重新部署。

## 下一步

- [Contract 基础](/ethers/contracts/basics) - 学习合约交互基础
- [函数调用](/ethers/contracts/function-calls) - 深入了解函数调用
- [事件监听](/ethers/contracts/events) - 掌握事件处理
- [交易处理](/ethers/transactions/basics) - 学习交易管理
