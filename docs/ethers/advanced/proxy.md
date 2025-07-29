# 代理合约

代理合约（Proxy Contract）是一种设计模式，允许智能合约在部署后进行逻辑升级，同时保持相同的地址和状态。这是实现可升级智能合约的核心技术。

## 代理合约基础

### 1. 代理模式概念

代理模式将合约分为两部分：
- **代理合约（Proxy）**：存储状态和数据，负责委托调用
- **实现合约（Implementation）**：包含业务逻辑，可以被替换

```javascript
// 代理合约的基本结构
const proxyStructure = {
    // 存储槽
    implementation: '0x...', // 实现合约地址
    admin: '0x...',         // 管理员地址
    
    // 委托调用函数
    fallback: function() {
        // delegatecall 到实现合约
    },
    
    // 升级函数
    upgrade: function(newImplementation) {
        // 只有管理员可以调用
    }
};
```

### 2. 委托调用机制

```javascript
import { ethers } from 'ethers';

// 理解 delegatecall 的工作原理
async function demonstrateDelegatecall() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner();
    
    // 代理合约 ABI
    const proxyABI = [
        "function implementation() view returns (address)",
        "function admin() view returns (address)",
        "function upgrade(address newImplementation)",
        "function changeAdmin(address newAdmin)",
        "fallback() payable"
    ];
    
    // 实现合约 ABI
    const implementationABI = [
        "function initialize(uint256 value)",
        "function getValue() view returns (uint256)",
        "function setValue(uint256 value)",
        "function version() view returns (string)"
    ];
    
    const proxyAddress = '0x...'; // 代理合约地址
    
    // 通过代理合约调用实现合约的函数
    const proxy = new ethers.Contract(proxyAddress, implementationABI, signer);
    
    // 这些调用实际上会通过 delegatecall 执行
    const currentValue = await proxy.getValue();
    console.log('当前值:', currentValue);
    
    // 设置新值
    const tx = await proxy.setValue(42);
    await tx.wait();
    console.log('值已更新');
    
    return proxy;
}
```

## 常见代理模式

### 1. 透明代理（Transparent Proxy）

```javascript
class TransparentProxy {
    constructor(proxyAddress, implementationABI, provider) {
        this.proxyAddress = proxyAddress;
        this.provider = provider;
        
        // 代理管理 ABI
        this.proxyABI = [
            "function implementation() view returns (address)",
            "function admin() view returns (address)",
            "function upgrade(address newImplementation)",
            "function changeAdmin(address newAdmin)",
            "event Upgraded(address indexed implementation)",
            "event AdminChanged(address previousAdmin, address newAdmin)"
        ];
        
        this.implementationABI = implementationABI;
    }
    
    // 获取代理信息
    async getProxyInfo() {
        const proxyContract = new ethers.Contract(
            this.proxyAddress, 
            this.proxyABI, 
            this.provider
        );
        
        const [implementation, admin] = await Promise.all([
            proxyContract.implementation(),
            proxyContract.admin()
        ]);
        
        return { implementation, admin };
    }
    
    // 升级实现合约
    async upgrade(newImplementationAddress, adminSigner) {
        const proxyContract = new ethers.Contract(
            this.proxyAddress,
            this.proxyABI,
            adminSigner
        );
        
        const tx = await proxyContract.upgrade(newImplementationAddress);
        const receipt = await tx.wait();
        
        console.log('合约已升级到:', newImplementationAddress);
        console.log('交易哈希:', tx.hash);
        
        return receipt;
    }
    
    // 获取业务合约实例
    getImplementationContract(signer) {
        return new ethers.Contract(
            this.proxyAddress,
            this.implementationABI,
            signer
        );
    }
    
    // 监听升级事件
    onUpgrade(callback) {
        const proxyContract = new ethers.Contract(
            this.proxyAddress,
            this.proxyABI,
            this.provider
        );
        
        proxyContract.on('Upgraded', (implementation, event) => {
            callback({
                newImplementation: implementation,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });
    }
}

// 使用示例
async function useTransparentProxy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const [admin, user] = await provider.listAccounts();
    
    const implementationABI = [
        "function initialize(uint256 value)",
        "function getValue() view returns (uint256)",
        "function setValue(uint256 value)",
        "function version() view returns (string)"
    ];
    
    const proxy = new TransparentProxy(
        '0x...', // 代理合约地址
        implementationABI,
        provider
    );
    
    // 获取代理信息
    const info = await proxy.getProxyInfo();
    console.log('当前实现合约:', info.implementation);
    console.log('管理员地址:', info.admin);
    
    // 通过代理调用业务函数
    const contract = proxy.getImplementationContract(user);
    const value = await contract.getValue();
    console.log('当前值:', value);
    
    // 升级合约（需要管理员权限）
    await proxy.upgrade('0x...newImplementation', admin);
    
    return proxy;
}
```

### 2. UUPS 代理（Universal Upgradeable Proxy Standard）

```javascript
class UUPSProxy {
    constructor(proxyAddress, implementationABI, provider) {
        this.proxyAddress = proxyAddress;
        this.provider = provider;
        
        // UUPS 代理 ABI（升级逻辑在实现合约中）
        this.uupsABI = [
            "function proxiableUUID() view returns (bytes32)",
            "function upgradeTo(address newImplementation)",
            "function upgradeToAndCall(address newImplementation, bytes data)",
            "event Upgraded(address indexed implementation)"
        ];
        
        this.implementationABI = [...implementationABI, ...this.uupsABI];
    }
    
    // 检查合约是否支持 UUPS
    async isUUPSCompliant() {
        try {
            const contract = new ethers.Contract(
                this.proxyAddress,
                this.uupsABI,
                this.provider
            );
            
            const uuid = await contract.proxiableUUID();
            // UUPS 标准 UUID
            const expectedUUID = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
            
            return uuid === expectedUUID;
        } catch (error) {
            return false;
        }
    }
    
    // 升级合约（通过实现合约的升级函数）
    async upgradeTo(newImplementationAddress, authorizedSigner) {
        const contract = new ethers.Contract(
            this.proxyAddress,
            this.implementationABI,
            authorizedSigner
        );
        
        const tx = await contract.upgradeTo(newImplementationAddress);
        const receipt = await tx.wait();
        
        console.log('UUPS 合约已升级到:', newImplementationAddress);
        return receipt;
    }
    
    // 升级并调用初始化函数
    async upgradeToAndCall(newImplementationAddress, initData, authorizedSigner) {
        const contract = new ethers.Contract(
            this.proxyAddress,
            this.implementationABI,
            authorizedSigner
        );
        
        const tx = await contract.upgradeToAndCall(newImplementationAddress, initData);
        const receipt = await tx.wait();
        
        console.log('UUPS 合约已升级并初始化');
        return receipt;
    }
    
    // 获取业务合约实例
    getContract(signer) {
        return new ethers.Contract(
            this.proxyAddress,
            this.implementationABI,
            signer
        );
    }
}

// 使用示例
async function useUUPSProxy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const signer = await provider.getSigner();
    
    const implementationABI = [
        "function initialize(address owner)",
        "function getValue() view returns (uint256)",
        "function setValue(uint256 value)",
        "function owner() view returns (address)",
        "function transferOwnership(address newOwner)"
    ];
    
    const proxy = new UUPSProxy(
        '0x...', // 代理合约地址
        implementationABI,
        provider
    );
    
    // 检查 UUPS 兼容性
    const isUUPS = await proxy.isUUPSCompliant();
    console.log('是否支持 UUPS:', isUUPS);
    
    // 获取合约实例
    const contract = proxy.getContract(signer);
    
    // 调用业务函数
    const currentValue = await contract.getValue();
    console.log('当前值:', currentValue);
    
    // 升级合约（需要有升级权限）
    const newImplementation = '0x...';
    await proxy.upgradeTo(newImplementation, signer);
    
    return proxy;
}
```

### 3. 信标代理（Beacon Proxy）

```javascript
class BeaconProxy {
    constructor(beaconAddress, implementationABI, provider) {
        this.beaconAddress = beaconAddress;
        this.provider = provider;
        
        // 信标合约 ABI
        this.beaconABI = [
            "function implementation() view returns (address)",
            "function owner() view returns (address)",
            "function upgradeTo(address newImplementation)",
            "event Upgraded(address indexed implementation)"
        ];
        
        this.implementationABI = implementationABI;
    }
    
    // 获取当前实现合约地址
    async getCurrentImplementation() {
        const beacon = new ethers.Contract(
            this.beaconAddress,
            this.beaconABI,
            this.provider
        );
        
        return await beacon.implementation();
    }
    
    // 升级所有使用此信标的代理合约
    async upgradeBeacon(newImplementationAddress, ownerSigner) {
        const beacon = new ethers.Contract(
            this.beaconAddress,
            this.beaconABI,
            ownerSigner
        );
        
        const tx = await beacon.upgradeTo(newImplementationAddress);
        const receipt = await tx.wait();
        
        console.log('信标已升级，所有代理合约将使用新实现:', newImplementationAddress);
        return receipt;
    }
    
    // 为特定代理地址创建合约实例
    createProxyContract(proxyAddress, signer) {
        return new ethers.Contract(
            proxyAddress,
            this.implementationABI,
            signer
        );
    }
    
    // 监听信标升级事件
    onBeaconUpgrade(callback) {
        const beacon = new ethers.Contract(
            this.beaconAddress,
            this.beaconABI,
            this.provider
        );
        
        beacon.on('Upgraded', (implementation, event) => {
            callback({
                newImplementation: implementation,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });
    }
}

// 使用示例
async function useBeaconProxy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const [owner, user] = await provider.listAccounts();
    
    const implementationABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)"
    ];
    
    const beacon = new BeaconProxy(
        '0x...', // 信标合约地址
        implementationABI,
        provider
    );
    
    // 获取当前实现
    const currentImpl = await beacon.getCurrentImplementation();
    console.log('当前实现合约:', currentImpl);
    
    // 创建代理合约实例
    const proxyAddress = '0x...'; // 代理合约地址
    const contract = beacon.createProxyContract(proxyAddress, user);
    
    // 调用合约函数
    const name = await contract.name();
    console.log('代币名称:', name);
    
    // 升级信标（影响所有使用此信标的代理）
    await beacon.upgradeBeacon('0x...newImplementation', owner);
    
    return beacon;
}
```

## 代理合约部署

### 1. 部署透明代理

```javascript
async function deployTransparentProxy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const [deployer, admin] = await provider.listAccounts();
    
    // 1. 部署实现合约
    const implementationFactory = new ethers.ContractFactory(
        implementationABI,
        implementationBytecode,
        deployer
    );
    
    const implementation = await implementationFactory.deploy();
    await implementation.waitForDeployment();
    console.log('实现合约地址:', await implementation.getAddress());
    
    // 2. 准备初始化数据
    const initData = implementation.interface.encodeFunctionData(
        'initialize',
        [100] // 初始化参数
    );
    
    // 3. 部署代理合约
    const proxyFactory = new ethers.ContractFactory(
        transparentProxyABI,
        transparentProxyBytecode,
        deployer
    );
    
    const proxy = await proxyFactory.deploy(
        await implementation.getAddress(), // 实现合约地址
        admin.address,                     // 管理员地址
        initData                          // 初始化数据
    );
    
    await proxy.waitForDeployment();
    console.log('代理合约地址:', await proxy.getAddress());
    
    return {
        implementation: await implementation.getAddress(),
        proxy: await proxy.getAddress(),
        admin: admin.address
    };
}
```

### 2. 部署 UUPS 代理

```javascript
async function deployUUPSProxy() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const deployer = await provider.getSigner();
    
    // 1. 部署实现合约
    const implementationFactory = new ethers.ContractFactory(
        uupsImplementationABI,
        uupsImplementationBytecode,
        deployer
    );
    
    const implementation = await implementationFactory.deploy();
    await implementation.waitForDeployment();
    
    // 2. 部署 ERC1967 代理
    const proxyFactory = new ethers.ContractFactory(
        erc1967ProxyABI,
        erc1967ProxyBytecode,
        deployer
    );
    
    const initData = implementation.interface.encodeFunctionData(
        'initialize',
        [await deployer.getAddress()] // 设置所有者
    );
    
    const proxy = await proxyFactory.deploy(
        await implementation.getAddress(),
        initData
    );
    
    await proxy.waitForDeployment();
    
    return {
        implementation: await implementation.getAddress(),
        proxy: await proxy.getAddress()
    };
}
```

## 代理合约安全

### 1. 存储冲突检测

```javascript
class StorageLayoutChecker {
    constructor() {
        this.reservedSlots = {
            // EIP-1967 标准存储槽
            implementation: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
            admin: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
            beacon: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'
        };
    }
    
    // 检查存储槽冲突
    checkStorageConflict(contractABI) {
        const warnings = [];
        
        // 分析合约的状态变量
        const stateVariables = this.extractStateVariables(contractABI);
        
        stateVariables.forEach((variable, index) => {
            const slot = ethers.keccak256(ethers.toUtf8Bytes(variable.name));
            
            // 检查是否与代理存储槽冲突
            Object.entries(this.reservedSlots).forEach(([name, reservedSlot]) => {
                if (slot === reservedSlot) {
                    warnings.push({
                        variable: variable.name,
                        slot: index,
                        conflict: `与 ${name} 存储槽冲突`,
                        severity: 'high'
                    });
                }
            });
        });
        
        return warnings;
    }
    
    extractStateVariables(abi) {
        // 简化的状态变量提取逻辑
        return abi
            .filter(item => item.type === 'function' && item.stateMutability === 'view')
            .map((item, index) => ({
                name: item.name,
                type: item.outputs?.[0]?.type || 'unknown',
                slot: index
            }));
    }
}

// 使用示例
const checker = new StorageLayoutChecker();
const warnings = checker.checkStorageConflict(implementationABI);

if (warnings.length > 0) {
    console.warn('发现存储冲突:');
    warnings.forEach(warning => {
        console.warn(`- ${warning.variable}: ${warning.conflict}`);
    });
}
```

### 2. 升级安全检查

```javascript
class UpgradeSafetyChecker {
    // 检查升级兼容性
    async checkUpgradeCompatibility(oldImplementation, newImplementation, provider) {
        const checks = [];
        
        // 1. 检查存储布局兼容性
        const storageCheck = await this.checkStorageLayout(
            oldImplementation, 
            newImplementation, 
            provider
        );
        checks.push(storageCheck);
        
        // 2. 检查函数签名兼容性
        const functionCheck = this.checkFunctionSignatures(
            oldImplementation,
            newImplementation
        );
        checks.push(functionCheck);
        
        // 3. 检查初始化函数
        const initCheck = this.checkInitializers(newImplementation);
        checks.push(initCheck);
        
        return {
            compatible: checks.every(check => check.passed),
            checks
        };
    }
    
    async checkStorageLayout(oldAddr, newAddr, provider) {
        try {
            // 获取合约的存储布局（需要编译器输出）
            const oldLayout = await this.getStorageLayout(oldAddr, provider);
            const newLayout = await this.getStorageLayout(newAddr, provider);
            
            // 检查存储变量是否只增加，不修改或删除
            const compatible = this.compareStorageLayouts(oldLayout, newLayout);
            
            return {
                name: 'Storage Layout',
                passed: compatible,
                message: compatible ? '存储布局兼容' : '存储布局不兼容'
            };
        } catch (error) {
            return {
                name: 'Storage Layout',
                passed: false,
                message: `存储布局检查失败: ${error.message}`
            };
        }
    }
    
    checkFunctionSignatures(oldABI, newABI) {
        const oldFunctions = this.extractFunctionSignatures(oldABI);
        const newFunctions = this.extractFunctionSignatures(newABI);
        
        // 检查是否有函数被删除或修改
        const removedFunctions = oldFunctions.filter(
            oldFunc => !newFunctions.some(newFunc => newFunc.signature === oldFunc.signature)
        );
        
        const compatible = removedFunctions.length === 0;
        
        return {
            name: 'Function Signatures',
            passed: compatible,
            message: compatible 
                ? '函数签名兼容' 
                : `以下函数被删除或修改: ${removedFunctions.map(f => f.name).join(', ')}`
        };
    }
    
    checkInitializers(abi) {
        const initFunctions = abi.filter(
            item => item.type === 'function' && 
                   (item.name === 'initialize' || item.name.startsWith('init'))
        );
        
        // 检查是否有重复初始化的风险
        const hasReinitializer = initFunctions.some(
            func => func.name.includes('reinitialize') || 
                   func.name.includes('upgrade')
        );
        
        return {
            name: 'Initializers',
            passed: true,
            message: hasReinitializer 
                ? '发现重新初始化函数，请确保正确使用' 
                : '初始化函数检查通过'
        };
    }
    
    extractFunctionSignatures(abi) {
        return abi
            .filter(item => item.type === 'function')
            .map(func => ({
                name: func.name,
                signature: `${func.name}(${func.inputs.map(input => input.type).join(',')})`
            }));
    }
    
    compareStorageLayouts(oldLayout, newLayout) {
        // 简化的存储布局比较
        // 实际应用中需要更复杂的逻辑
        return newLayout.length >= oldLayout.length;
    }
    
    async getStorageLayout(address, provider) {
        // 这里需要从编译器输出或其他来源获取存储布局
        // 简化示例
        return [];
    }
}

// 使用示例
async function safeUpgrade() {
    const checker = new UpgradeSafetyChecker();
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    const oldImplementation = '0x...';
    const newImplementation = '0x...';
    
    const result = await checker.checkUpgradeCompatibility(
        oldImplementation,
        newImplementation,
        provider
    );
    
    if (result.compatible) {
        console.log('升级安全检查通过');
        // 执行升级
    } else {
        console.error('升级安全检查失败:');
        result.checks.forEach(check => {
            if (!check.passed) {
                console.error(`- ${check.name}: ${check.message}`);
            }
        });
    }
}
```

## 最佳实践

### 1. 代理模式选择指南

```javascript
const proxyPatternGuide = {
    transparentProxy: {
        适用场景: [
            '简单的升级需求',
            '管理员和用户分离',
            '不需要复杂的升级逻辑'
        ],
        优点: [
            '简单易懂',
            '管理员权限明确',
            '广泛支持'
        ],
        缺点: [
            'Gas 成本较高',
            '函数选择器冲突风险',
            '管理员权限过大'
        ]
    },
    
    uupsProxy: {
        适用场景: [
            '需要灵活的升级控制',
            'Gas 成本敏感',
            '复杂的权限管理'
        ],
        优点: [
            'Gas 成本较低',
            '升级逻辑在实现合约中',
            '更灵活的权限控制'
        ],
        缺点: [
            '实现复杂',
            '升级逻辑可能有 bug',
            '需要仔细设计权限'
        ]
    },
    
    beaconProxy: {
        适用场景: [
            '多个相同逻辑的合约',
            '批量升级需求',
            '工厂模式部署'
        ],
        优点: [
            '批量升级效率高',
            '统一管理',
            '节省 Gas'
        ],
        缺点: [
            '单点故障风险',
            '不适合个性化需求',
            '信标合约的安全性至关重要'
        ]
    }
};
```

### 2. 升级流程最佳实践

```javascript
class UpgradeManager {
    constructor(proxyAddress, provider) {
        this.proxyAddress = proxyAddress;
        this.provider = provider;
        this.upgradeHistory = [];
    }
    
    // 安全升级流程
    async safeUpgrade(newImplementation, adminSigner, options = {}) {
        const {
            testnet = false,
            dryRun = false,
            backupData = true,
            notifyUsers = true
        } = options;
        
        try {
            // 1. 预升级检查
            console.log('开始预升级检查...');
            await this.preUpgradeChecks(newImplementation);
            
            // 2. 备份关键数据
            if (backupData) {
                console.log('备份关键数据...');
                await this.backupCriticalData();
            }
            
            // 3. 测试网验证
            if (testnet) {
                console.log('在测试网验证升级...');
                await this.testnetValidation(newImplementation);
            }
            
            // 4. 干运行模拟
            if (dryRun) {
                console.log('执行升级模拟...');
                return await this.simulateUpgrade(newImplementation);
            }
            
            // 5. 通知用户
            if (notifyUsers) {
                console.log('通知用户即将升级...');
                await this.notifyUsers();
            }
            
            // 6. 执行升级
            console.log('执行升级...');
            const result = await this.executeUpgrade(newImplementation, adminSigner);
            
            // 7. 升级后验证
            console.log('升级后验证...');
            await this.postUpgradeValidation();
            
            // 8. 记录升级历史
            this.recordUpgrade(newImplementation, result);
            
            return result;
            
        } catch (error) {
            console.error('升级失败:', error);
            
            // 升级失败处理
            await this.handleUpgradeFailure(error);
            throw error;
        }
    }
    
    async preUpgradeChecks(newImplementation) {
        // 实现预升级检查逻辑
        const checker = new UpgradeSafetyChecker();
        const result = await checker.checkUpgradeCompatibility(
            this.proxyAddress,
            newImplementation,
            this.provider
        );
        
        if (!result.compatible) {
            throw new Error('升级兼容性检查失败');
        }
    }
    
    async backupCriticalData() {
        // 备份关键状态数据
        const contract = new ethers.Contract(
            this.proxyAddress,
            ['function owner() view returns (address)'],
            this.provider
        );
        
        const owner = await contract.owner();
        console.log('当前所有者:', owner);
        
        // 可以添加更多数据备份逻辑
    }
    
    async executeUpgrade(newImplementation, adminSigner) {
        // 根据代理类型执行相应的升级
        const proxy = new TransparentProxy(
            this.proxyAddress,
            [],
            this.provider
        );
        
        return await proxy.upgrade(newImplementation, adminSigner);
    }
    
    async postUpgradeValidation() {
        // 升级后验证合约功能
        console.log('验证升级后的合约功能...');
        
        // 添加具体的验证逻辑
        const contract = new ethers.Contract(
            this.proxyAddress,
            ['function version() view returns (string)'],
            this.provider
        );
        
        try {
            const version = await contract.version();
            console.log('新版本:', version);
        } catch (error) {
            console.warn('无法获取版本信息:', error.message);
        }
    }
    
    recordUpgrade(newImplementation, result) {
        this.upgradeHistory.push({
            timestamp: new Date().toISOString(),
            newImplementation,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
        });
    }
    
    async handleUpgradeFailure(error) {
        console.error('处理升级失败:', error.message);
        
        // 可以添加回滚逻辑或其他恢复措施
        // 注意：代理合约通常不支持自动回滚
    }
    
    async notifyUsers() {
        // 实现用户通知逻辑
        console.log('发送升级通知给用户...');
    }
    
    async testnetValidation(newImplementation) {
        // 在测试网上验证升级
        console.log('在测试网验证新实现合约...');
    }
    
    async simulateUpgrade(newImplementation) {
        // 模拟升级过程
        console.log('模拟升级过程...');
        return { simulated: true, newImplementation };
    }
}

// 使用示例
async function performSafeUpgrade() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const admin = await provider.getSigner();
    
    const upgradeManager = new UpgradeManager('0x...proxyAddress', provider);
    
    try {
        const result = await upgradeManager.safeUpgrade(
            '0x...newImplementation',
            admin,
            {
                testnet: true,
                dryRun: false,
                backupData: true,
                notifyUsers: true
            }
        );
        
        console.log('升级成功:', result);
    } catch (error) {
        console.error('升级失败:', error);
    }
}
```

## 下一步

- [元交易](/ethers/advanced/meta-transactions) - 学习元交易技术
- [离线签名](/ethers/advanced/offline-signing) - 掌握离线签名方法
- [自定义网络](/ethers/advanced/custom-networks) - 了解自定义网络配置
- [ENS 域名服务](/ethers/advanced/ens) - 学习ENS域名解析
