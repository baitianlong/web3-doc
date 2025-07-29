# ENS 域名服务

以太坊域名服务（Ethereum Name Service，ENS）是一个基于以太坊区块链的分布式、开放和可扩展的命名系统。ENS 将人类可读的域名（如 'alice.eth'）映射到机器可读的标识符，如以太坊地址、IPFS 哈希和其他元数据。

## 什么是 ENS

ENS 的主要功能包括：

- **域名解析**：将 .eth 域名解析为以太坊地址
- **反向解析**：将以太坊地址解析为域名
- **多种记录类型**：支持地址、文本、内容哈希等多种记录
- **子域名**：支持创建和管理子域名
- **去中心化**：完全运行在以太坊区块链上

## 基本概念

### 1. 域名结构
```
alice.eth          # 顶级域名
subdomain.alice.eth # 子域名
```

### 2. 记录类型
- **地址记录**：ETH 地址、BTC 地址等
- **文本记录**：邮箱、Twitter、GitHub 等
- **内容哈希**：IPFS 哈希、Swarm 哈希等

## 使用 Ethers.js 操作 ENS

### 1. 基本设置

```javascript
import { ethers } from 'ethers';

// 连接到以太坊主网
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// 或者使用浏览器钱包
const provider = new ethers.BrowserProvider(window.ethereum);
```

### 2. 域名解析

#### 解析域名到地址
```javascript
async function resolveName(name) {
    try {
        // 解析 ENS 域名到以太坊地址
        const address = await provider.resolveName(name);
        
        if (address) {
            console.log(`${name} 解析为: ${address}`);
            return address;
        } else {
            console.log(`域名 ${name} 未找到`);
            return null;
        }
    } catch (error) {
        console.error('解析域名失败:', error);
        return null;
    }
}

// 使用示例
await resolveName('vitalik.eth');
await resolveName('alice.eth');
```

#### 反向解析（地址到域名）
```javascript
async function lookupAddress(address) {
    try {
        // 反向解析地址到 ENS 域名
        const name = await provider.lookupAddress(address);
        
        if (name) {
            console.log(`${address} 对应的域名: ${name}`);
            return name;
        } else {
            console.log(`地址 ${address} 没有设置反向记录`);
            return null;
        }
    } catch (error) {
        console.error('反向解析失败:', error);
        return null;
    }
}

// 使用示例
await lookupAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
```

### 3. 获取多种记录类型

```javascript
async function getENSRecords(name) {
    try {
        // 获取 ETH 地址
        const ethAddress = await provider.resolveName(name);
        console.log('ETH 地址:', ethAddress);
        
        // 获取文本记录
        const resolver = await provider.getResolver(name);
        if (resolver) {
            // 获取邮箱
            const email = await resolver.getText('email');
            console.log('邮箱:', email);
            
            // 获取 Twitter
            const twitter = await resolver.getText('com.twitter');
            console.log('Twitter:', twitter);
            
            // 获取 GitHub
            const github = await resolver.getText('com.github');
            console.log('GitHub:', github);
            
            // 获取头像
            const avatar = await resolver.getText('avatar');
            console.log('头像:', avatar);
            
            // 获取网站
            const url = await resolver.getText('url');
            console.log('网站:', url);
            
            // 获取内容哈希（IPFS）
            const contentHash = await resolver.getContentHash();
            console.log('内容哈希:', contentHash);
        }
        
        return {
            ethAddress,
            email,
            twitter,
            github,
            avatar,
            url,
            contentHash
        };
    } catch (error) {
        console.error('获取 ENS 记录失败:', error);
        return null;
    }
}

// 使用示例
await getENSRecords('vitalik.eth');
```

### 4. 检查域名可用性

```javascript
async function checkDomainAvailability(name) {
    try {
        // 检查域名是否已被注册
        const address = await provider.resolveName(name);
        
        if (address) {
            console.log(`域名 ${name} 已被注册，所有者: ${address}`);
            return false;
        } else {
            console.log(`域名 ${name} 可用`);
            return true;
        }
    } catch (error) {
        console.error('检查域名可用性失败:', error);
        return false;
    }
}

// 使用示例
await checkDomainAvailability('myname.eth');
```

## 高级 ENS 操作

### 1. 设置 ENS 记录

```javascript
async function setENSRecords(name, records) {
    try {
        // 需要域名所有者的签名者
        const signer = await provider.getSigner();
        
        // 获取解析器
        const resolver = await provider.getResolver(name);
        if (!resolver) {
            throw new Error('域名没有设置解析器');
        }
        
        // 连接签名者到解析器
        const resolverWithSigner = resolver.connect(signer);
        
        // 设置 ETH 地址
        if (records.ethAddress) {
            const tx = await resolverWithSigner.setAddr(name, records.ethAddress);
            await tx.wait();
            console.log('ETH 地址设置成功');
        }
        
        // 设置文本记录
        if (records.email) {
            const tx = await resolverWithSigner.setText(name, 'email', records.email);
            await tx.wait();
            console.log('邮箱设置成功');
        }
        
        if (records.twitter) {
            const tx = await resolverWithSigner.setText(name, 'com.twitter', records.twitter);
            await tx.wait();
            console.log('Twitter 设置成功');
        }
        
        if (records.github) {
            const tx = await resolverWithSigner.setText(name, 'com.github', records.github);
            await tx.wait();
            console.log('GitHub 设置成功');
        }
        
        // 设置内容哈希
        if (records.contentHash) {
            const tx = await resolverWithSigner.setContentHash(name, records.contentHash);
            await tx.wait();
            console.log('内容哈希设置成功');
        }
        
        return true;
    } catch (error) {
        console.error('设置 ENS 记录失败:', error);
        return false;
    }
}

// 使用示例
await setENSRecords('myname.eth', {
    ethAddress: '0x...',
    email: 'alice@example.com',
    twitter: 'alice_crypto',
    github: 'alice-dev',
    contentHash: 'ipfs://QmHash...'
});
```

### 2. 创建子域名

```javascript
async function createSubdomain(parentDomain, subdomain, targetAddress) {
    try {
        const signer = await provider.getSigner();
        
        // ENS 注册表合约地址
        const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
        const ensRegistryABI = [
            'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)',
            'function resolver(bytes32 node) view returns (address)'
        ];
        
        const ensRegistry = new ethers.Contract(ensRegistryAddress, ensRegistryABI, signer);
        
        // 计算域名哈希
        const parentNode = ethers.namehash(parentDomain);
        const labelHash = ethers.id(subdomain);
        
        // 获取默认解析器
        const resolverAddress = await ensRegistry.resolver(parentNode);
        
        // 创建子域名
        const tx = await ensRegistry.setSubnodeRecord(
            parentNode,
            labelHash,
            await signer.getAddress(),
            resolverAddress,
            0
        );
        
        await tx.wait();
        console.log(`子域名 ${subdomain}.${parentDomain} 创建成功`);
        
        // 设置子域名指向的地址
        const fullSubdomain = `${subdomain}.${parentDomain}`;
        const resolver = await provider.getResolver(fullSubdomain);
        if (resolver) {
            const resolverWithSigner = resolver.connect(signer);
            const setAddrTx = await resolverWithSigner.setAddr(fullSubdomain, targetAddress);
            await setAddrTx.wait();
            console.log(`子域名地址设置为: ${targetAddress}`);
        }
        
        return true;
    } catch (error) {
        console.error('创建子域名失败:', error);
        return false;
    }
}

// 使用示例
await createSubdomain('myname.eth', 'app', '0x...');
```

### 3. 批量解析域名

```javascript
async function batchResolveNames(names) {
    try {
        const results = await Promise.allSettled(
            names.map(async (name) => {
                const address = await provider.resolveName(name);
                return { name, address };
            })
        );
        
        const resolved = [];
        const failed = [];
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.address) {
                resolved.push(result.value);
            } else {
                failed.push(names[index]);
            }
        });
        
        console.log('成功解析:', resolved);
        console.log('解析失败:', failed);
        
        return { resolved, failed };
    } catch (error) {
        console.error('批量解析失败:', error);
        return { resolved: [], failed: names };
    }
}

// 使用示例
await batchResolveNames(['vitalik.eth', 'alice.eth', 'bob.eth']);
```

## 实用工具函数

### 1. ENS 域名验证

```javascript
function isValidENSName(name) {
    // 基本的 ENS 域名格式验证
    const ensPattern = /^[a-z0-9-]+\.eth$/;
    return ensPattern.test(name.toLowerCase());
}

function normalizeENSName(name) {
    // 标准化 ENS 域名格式
    return name.toLowerCase().trim();
}

// 使用示例
console.log(isValidENSName('alice.eth')); // true
console.log(isValidENSName('Alice.ETH')); // true
console.log(isValidENSName('invalid')); // false
console.log(normalizeENSName('Alice.ETH')); // 'alice.eth'
```

### 2. 域名哈希计算

```javascript
function calculateNamehash(name) {
    // 计算 ENS 域名的 namehash
    return ethers.namehash(name);
}

function calculateLabelHash(label) {
    // 计算标签的哈希
    return ethers.id(label);
}

// 使用示例
const namehash = calculateNamehash('alice.eth');
const labelHash = calculateLabelHash('alice');
console.log('域名哈希:', namehash);
console.log('标签哈希:', labelHash);
```

### 3. ENS 记录缓存

```javascript
class ENSCache {
    constructor(ttl = 300000) { // 默认 5 分钟缓存
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    async resolveName(provider, name) {
        const cacheKey = `name:${name}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.value;
        }
        
        try {
            const address = await provider.resolveName(name);
            this.cache.set(cacheKey, {
                value: address,
                timestamp: Date.now()
            });
            return address;
        } catch (error) {
            console.error('解析失败:', error);
            return null;
        }
    }
    
    async lookupAddress(provider, address) {
        const cacheKey = `address:${address}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.value;
        }
        
        try {
            const name = await provider.lookupAddress(address);
            this.cache.set(cacheKey, {
                value: name,
                timestamp: Date.now()
            });
            return name;
        } catch (error) {
            console.error('反向解析失败:', error);
            return null;
        }
    }
    
    clear() {
        this.cache.clear();
    }
}

// 使用示例
const ensCache = new ENSCache();
const address = await ensCache.resolveName(provider, 'vitalik.eth');
const name = await ensCache.lookupAddress(provider, address);
```

## 错误处理

### 1. 常见错误类型

```javascript
async function safeResolveENS(name) {
    try {
        const address = await provider.resolveName(name);
        return { success: true, address };
    } catch (error) {
        let errorMessage = '未知错误';
        
        if (error.code === 'NETWORK_ERROR') {
            errorMessage = '网络连接错误';
        } else if (error.code === 'SERVER_ERROR') {
            errorMessage = '服务器错误';
        } else if (error.message.includes('ENS name not configured')) {
            errorMessage = 'ENS 域名未配置';
        } else if (error.message.includes('invalid ENS name')) {
            errorMessage = '无效的 ENS 域名格式';
        }
        
        return { success: false, error: errorMessage };
    }
}

// 使用示例
const result = await safeResolveENS('alice.eth');
if (result.success) {
    console.log('地址:', result.address);
} else {
    console.error('错误:', result.error);
}
```

### 2. 超时处理

```javascript
async function resolveWithTimeout(name, timeout = 5000) {
    return Promise.race([
        provider.resolveName(name),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('解析超时')), timeout)
        )
    ]);
}

// 使用示例
try {
    const address = await resolveWithTimeout('alice.eth', 3000);
    console.log('地址:', address);
} catch (error) {
    console.error('解析失败或超时:', error.message);
}
```

## 最佳实践

### 1. 性能优化
- 使用缓存减少重复查询
- 批量处理多个域名解析
- 设置合理的超时时间
- 使用 Promise.allSettled 处理批量操作

### 2. 用户体验
- 提供域名格式验证
- 显示解析进度和状态
- 处理网络错误和超时
- 支持域名自动补全

### 3. 安全考虑
- 验证解析结果的有效性
- 防止域名欺骗攻击
- 使用 HTTPS 连接到 ENS 服务
- 定期更新 ENS 记录

## 实际应用场景

### 1. 钱包应用
```javascript
// 在转账时支持 ENS 域名
async function sendToENS(recipientName, amount) {
    const recipientAddress = await provider.resolveName(recipientName);
    if (!recipientAddress) {
        throw new Error('无法解析收款人地址');
    }
    
    // 执行转账
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount)
    });
    
    return tx;
}
```

### 2. DApp 用户系统
```javascript
// 使用 ENS 作为用户标识
async function getUserProfile(ensName) {
    const resolver = await provider.getResolver(ensName);
    if (!resolver) return null;
    
    return {
        address: await provider.resolveName(ensName),
        avatar: await resolver.getText('avatar'),
        email: await resolver.getText('email'),
        twitter: await resolver.getText('com.twitter'),
        github: await resolver.getText('com.github'),
        website: await resolver.getText('url')
    };
}
```

### 3. 去中心化网站
```javascript
// 通过 ENS 访问去中心化网站
async function loadDWebsite(ensName) {
    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
        throw new Error('域名未设置解析器');
    }
    
    const contentHash = await resolver.getContentHash();
    if (!contentHash) {
        throw new Error('域名未设置内容哈希');
    }
    
    // 解析 IPFS 哈希并加载内容
    const ipfsHash = contentHash.replace('ipfs://', '');
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    
    return ipfsUrl;
}
```

## 下一步

- [多签钱包](/ethers/advanced/multisig) - 学习多签钱包的实现
- [代理合约](/ethers/advanced/proxy) - 了解代理合约模式
- [元交易](/ethers/advanced/meta-transactions) - 掌握元交易技术
- [离线签名](/ethers/advanced/offline-signing) - 学习离线签名方法
