---
title: 离线签名
description: 使用 Ethers.js 实现离线签名的完整指南，包括交易签名、消息签名和安全实践
keywords: [ethers.js, 离线签名, 冷钱包, 安全签名, 交易签名, 消息签名]
---

# 离线签名

离线签名是一种在没有网络连接的环境中对交易和消息进行签名的技术。这种方法大大提高了私钥的安全性，广泛应用于冷钱包、硬件钱包和高安全性要求的场景中。

## 离线签名基础

### 1. 离线签名概念

```javascript
import { ethers } from 'ethers';

// 离线签名的基本流程
const offlineSigningProcess = {
    step1: '在离线环境中创建和管理私钥',
    step2: '构造待签名的交易或消息',
    step3: '使用私钥进行签名',
    step4: '将签名结果传输到在线环境',
    step5: '在在线环境中广播交易'
};

// 离线钱包创建
function createOfflineWallet(privateKey) {
    // 注意：这里不连接任何 Provider
    const wallet = new ethers.Wallet(privateKey);
    
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        wallet: wallet
    };
}

// 使用示例
const offlineWallet = createOfflineWallet('0x...privateKey');
console.log('离线钱包地址:', offlineWallet.address);
```

### 2. 离线环境设置

```javascript
class OfflineEnvironment {
    constructor() {
        this.isOnline = false;
        this.wallets = new Map();
        this.signedTransactions = [];
        this.signedMessages = [];
    }
    
    // 导入钱包
    importWallet(privateKey, alias) {
        if (this.isOnline) {
            throw new Error('请在离线环境中导入钱包');
        }
        
        const wallet = new ethers.Wallet(privateKey);
        this.wallets.set(alias, wallet);
        
        return {
            alias,
            address: wallet.address,
            imported: true
        };
    }
    
    // 从助记词导入钱包
    importWalletFromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0", alias) {
        if (this.isOnline) {
            throw new Error('请在离线环境中导入钱包');
        }
        
        const wallet = ethers.Wallet.fromPhrase(mnemonic, null, path);
        this.wallets.set(alias, wallet);
        
        return {
            alias,
            address: wallet.address,
            path,
            imported: true
        };
    }
    
    // 创建随机钱包
    createRandomWallet(alias) {
        if (this.isOnline) {
            throw new Error('请在离线环境中创建钱包');
        }
        
        const wallet = ethers.Wallet.createRandom();
        this.wallets.set(alias, wallet);
        
        return {
            alias,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase,
            created: true
        };
    }
    
    // 获取钱包列表
    getWallets() {
        return Array.from(this.wallets.entries()).map(([alias, wallet]) => ({
            alias,
            address: wallet.address
        }));
    }
    
    // 获取指定钱包
    getWallet(alias) {
        const wallet = this.wallets.get(alias);
        if (!wallet) {
            throw new Error(`钱包 ${alias} 不存在`);
        }
        return wallet;
    }
    
    // 清除所有钱包（安全清理）
    clearWallets() {
        this.wallets.clear();
        this.signedTransactions = [];
        this.signedMessages = [];
    }
}

// 使用示例
const offlineEnv = new OfflineEnvironment();

// 导入钱包
const wallet1 = offlineEnv.importWallet('0x...privateKey', 'main-wallet');
const wallet2 = offlineEnv.importWalletFromMnemonic(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    "m/44'/60'/0'/0/0",
    'hd-wallet'
);

// 创建随机钱包
const wallet3 = offlineEnv.createRandomWallet('random-wallet');

console.log('离线环境钱包列表:', offlineEnv.getWallets());
```

## 离线交易签名

### 1. 基础交易签名

```javascript
class OfflineTransactionSigner {
    constructor(offlineEnvironment) {
        this.env = offlineEnvironment;
    }
    
    // 签名基础交易
    async signTransaction(walletAlias, transactionRequest) {
        const wallet = this.env.getWallet(walletAlias);
        
        // 构造完整的交易对象
        const transaction = {
            to: transactionRequest.to,
            value: transactionRequest.value || 0,
            gasLimit: transactionRequest.gasLimit || 21000,
            gasPrice: transactionRequest.gasPrice,
            maxFeePerGas: transactionRequest.maxFeePerGas,
            maxPriorityFeePerGas: transactionRequest.maxPriorityFeePerGas,
            nonce: transactionRequest.nonce,
            chainId: transactionRequest.chainId,
            data: transactionRequest.data || '0x',
            type: transactionRequest.type || 2 // EIP-1559
        };
        
        // 验证必要字段
        this.validateTransaction(transaction);
        
        // 签名交易
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // 计算交易哈希
        const transactionHash = ethers.keccak256(signedTransaction);
        
        const result = {
            signedTransaction,
            transactionHash,
            from: wallet.address,
            transaction,
            timestamp: Date.now()
        };
        
        // 保存到离线环境
        this.env.signedTransactions.push(result);
        
        return result;
    }
    
    // 签名 EIP-1559 交易
    async signEIP1559Transaction(walletAlias, transactionRequest) {
        const transaction = {
            ...transactionRequest,
            type: 2,
            gasPrice: undefined // EIP-1559 不使用 gasPrice
        };
        
        if (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas) {
            throw new Error('EIP-1559 交易需要 maxFeePerGas 和 maxPriorityFeePerGas');
        }
        
        return await this.signTransaction(walletAlias, transaction);
    }
    
    // 签名传统交易
    async signLegacyTransaction(walletAlias, transactionRequest) {
        const transaction = {
            ...transactionRequest,
            type: 0,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined
        };
        
        if (!transaction.gasPrice) {
            throw new Error('传统交易需要 gasPrice');
        }
        
        return await this.signTransaction(walletAlias, transaction);
    }
    
    // 批量签名交易
    async signBatchTransactions(walletAlias, transactionRequests) {
        const results = [];
        
        for (const txRequest of transactionRequests) {
            try {
                const result = await this.signTransaction(walletAlias, txRequest);
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({ 
                    success: false, 
                    error: error.message,
                    transaction: txRequest
                });
            }
        }
        
        return results;
    }
    
    // 验证交易
    validateTransaction(transaction) {
        if (!transaction.to) {
            throw new Error('交易必须指定接收地址');
        }
        
        if (!transaction.chainId) {
            throw new Error('交易必须指定链 ID');
        }
        
        if (transaction.nonce === undefined) {
            throw new Error('交易必须指定 nonce');
        }
        
        if (transaction.type === 2) {
            if (!transaction.maxFeePerGas || !transaction.maxPriorityFeePerGas) {
                throw new Error('EIP-1559 交易需要费用参数');
            }
        } else {
            if (!transaction.gasPrice) {
                throw new Error('传统交易需要 gasPrice');
            }
        }
    }
    
    // 获取已签名的交易
    getSignedTransactions() {
        return this.env.signedTransactions;
    }
    
    // 导出签名交易
    exportSignedTransactions(format = 'json') {
        const transactions = this.env.signedTransactions;
        
        switch (format) {
            case 'json':
                return JSON.stringify(transactions, null, 2);
            case 'csv':
                return this.exportToCSV(transactions);
            case 'hex':
                return transactions.map(tx => tx.signedTransaction);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }
    
    // 导出为 CSV
    exportToCSV(transactions) {
        const headers = ['timestamp', 'from', 'to', 'value', 'gasLimit', 'transactionHash', 'signedTransaction'];
        const rows = transactions.map(tx => [
            new Date(tx.timestamp).toISOString(),
            tx.from,
            tx.transaction.to,
            tx.transaction.value.toString(),
            tx.transaction.gasLimit.toString(),
            tx.transactionHash,
            tx.signedTransaction
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// 使用示例
async function offlineTransactionSigningExample() {
    const offlineEnv = new OfflineEnvironment();
    const signer = new OfflineTransactionSigner(offlineEnv);
    
    // 导入钱包
    offlineEnv.importWallet('0x...privateKey', 'main');
    
    // 构造交易
    const transactionRequest = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: ethers.parseEther('1.0'),
        gasLimit: 21000,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
        nonce: 42,
        chainId: 1
    };
    
    // 签名交易
    const signedTx = await signer.signTransaction('main', transactionRequest);
    console.log('已签名交易:', signedTx);
    
    // 批量签名
    const batchRequests = [
        { ...transactionRequest, nonce: 43, value: ethers.parseEther('0.5') },
        { ...transactionRequest, nonce: 44, value: ethers.parseEther('0.3') }
    ];
    
    const batchResults = await signer.signBatchTransactions('main', batchRequests);
    console.log('批量签名结果:', batchResults);
    
    // 导出签名交易
    const exportedTxs = signer.exportSignedTransactions('json');
    console.log('导出的交易:', exportedTxs);
    
    return signer;
}
```

### 2. 合约交互签名

```javascript
class OfflineContractSigner {
    constructor(offlineEnvironment) {
        this.env = offlineEnvironment;
        this.contractInterfaces = new Map();
    }
    
    // 添加合约接口
    addContractInterface(contractAddress, abi) {
        const iface = new ethers.Interface(abi);
        this.contractInterfaces.set(contractAddress.toLowerCase(), iface);
        
        return {
            address: contractAddress,
            functions: Object.keys(iface.functions),
            events: Object.keys(iface.events)
        };
    }
    
    // 签名合约调用交易
    async signContractTransaction(walletAlias, contractAddress, functionName, args, transactionOptions) {
        const iface = this.contractInterfaces.get(contractAddress.toLowerCase());
        if (!iface) {
            throw new Error(`合约 ${contractAddress} 的 ABI 未添加`);
        }
        
        // 编码函数调用
        const data = iface.encodeFunctionData(functionName, args);
        
        // 构造交易
        const transactionRequest = {
            to: contractAddress,
            data: data,
            value: transactionOptions.value || 0,
            gasLimit: transactionOptions.gasLimit || 200000,
            maxFeePerGas: transactionOptions.maxFeePerGas,
            maxPriorityFeePerGas: transactionOptions.maxPriorityFeePerGas,
            gasPrice: transactionOptions.gasPrice,
            nonce: transactionOptions.nonce,
            chainId: transactionOptions.chainId,
            type: transactionOptions.type || 2
        };
        
        // 使用基础交易签名器
        const txSigner = new OfflineTransactionSigner(this.env);
        const result = await txSigner.signTransaction(walletAlias, transactionRequest);
        
        // 添加合约相关信息
        return {
            ...result,
            contractAddress,
            functionName,
            args,
            decodedData: {
                function: functionName,
                args: args
            }
        };
    }
    
    // 签名 ERC-20 转账
    async signERC20Transfer(walletAlias, tokenAddress, to, amount, transactionOptions) {
        const erc20ABI = [
            'function transfer(address to, uint256 amount) returns (bool)'
        ];
        
        this.addContractInterface(tokenAddress, erc20ABI);
        
        return await this.signContractTransaction(
            walletAlias,
            tokenAddress,
            'transfer',
            [to, amount],
            transactionOptions
        );
    }
    
    // 签名 ERC-20 授权
    async signERC20Approve(walletAlias, tokenAddress, spender, amount, transactionOptions) {
        const erc20ABI = [
            'function approve(address spender, uint256 amount) returns (bool)'
        ];
        
        this.addContractInterface(tokenAddress, erc20ABI);
        
        return await this.signContractTransaction(
            walletAlias,
            tokenAddress,
            'approve',
            [spender, amount],
            transactionOptions
        );
    }
    
    // 签名 ERC-721 转账
    async signERC721Transfer(walletAlias, nftAddress, from, to, tokenId, transactionOptions) {
        const erc721ABI = [
            'function transferFrom(address from, address to, uint256 tokenId)'
        ];
        
        this.addContractInterface(nftAddress, erc721ABI);
        
        return await this.signContractTransaction(
            walletAlias,
            nftAddress,
            'transferFrom',
            [from, to, tokenId],
            transactionOptions
        );
    }
    
    // 批量签名合约交易
    async signBatchContractTransactions(walletAlias, contractCalls, baseTransactionOptions) {
        const results = [];
        
        for (const call of contractCalls) {
            try {
                const txOptions = { ...baseTransactionOptions, ...call.transactionOptions };
                const result = await this.signContractTransaction(
                    walletAlias,
                    call.contractAddress,
                    call.functionName,
                    call.args,
                    txOptions
                );
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    call
                });
            }
        }
        
        return results;
    }
    
    // 解码交易数据
    decodeTransactionData(contractAddress, data) {
        const iface = this.contractInterfaces.get(contractAddress.toLowerCase());
        if (!iface) {
            throw new Error(`合约 ${contractAddress} 的 ABI 未添加`);
        }
        
        try {
            const decoded = iface.parseTransaction({ data });
            return {
                functionName: decoded.name,
                args: decoded.args,
                signature: decoded.signature
            };
        } catch (error) {
            throw new Error(`解码失败: ${error.message}`);
        }
    }
}

// 使用示例
async function offlineContractSigningExample() {
    const offlineEnv = new OfflineEnvironment();
    const contractSigner = new OfflineContractSigner(offlineEnv);
    
    // 导入钱包
    offlineEnv.importWallet('0x...privateKey', 'main');
    
    // 添加 ERC-20 合约接口
    const erc20ABI = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)'
    ];
    
    const tokenAddress = '0x...tokenAddress';
    contractSigner.addContractInterface(tokenAddress, erc20ABI);
    
    // 签名 ERC-20 转账
    const transferTx = await contractSigner.signERC20Transfer(
        'main',
        tokenAddress,
        '0x...recipient',
        ethers.parseEther('100'),
        {
            gasLimit: 60000,
            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
            nonce: 42,
            chainId: 1
        }
    );
    
    console.log('ERC-20 转账签名:', transferTx);
    
    // 批量合约调用
    const batchCalls = [
        {
            contractAddress: tokenAddress,
            functionName: 'approve',
            args: ['0x...spender', ethers.parseEther('1000')],
            transactionOptions: { nonce: 43 }
        },
        {
            contractAddress: tokenAddress,
            functionName: 'transfer',
            args: ['0x...recipient2', ethers.parseEther('50')],
            transactionOptions: { nonce: 44 }
        }
    ];
    
    const batchResults = await contractSigner.signBatchContractTransactions(
        'main',
        batchCalls,
        {
            gasLimit: 60000,
            maxFeePerGas: ethers.parseUnits('20', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
            chainId: 1
        }
    );
    
    console.log('批量合约调用签名:', batchResults);
    
    return contractSigner;
}
```

## 离线消息签名

### 1. 基础消息签名

```javascript
class OfflineMessageSigner {
    constructor(offlineEnvironment) {
        this.env = offlineEnvironment;
    }
    
    // 签名字符串消息
    async signMessage(walletAlias, message) {
        const wallet = this.env.getWallet(walletAlias);
        
        const signature = await wallet.signMessage(message);
        
        const result = {
            message,
            signature,
            signer: wallet.address,
            timestamp: Date.now(),
            type: 'string'
        };
        
        this.env.signedMessages.push(result);
        
        return result;
    }
    
    // 签名字节消息
    async signMessageBytes(walletAlias, messageBytes) {
        const wallet = this.env.getWallet(walletAlias);
        
        const signature = await wallet.signMessage(messageBytes);
        
        const result = {
            message: ethers.hexlify(messageBytes),
            messageBytes,
            signature,
            signer: wallet.address,
            timestamp: Date.now(),
            type: 'bytes'
        };
        
        this.env.signedMessages.push(result);
        
        return result;
    }
    
    // 签名类型化数据 (EIP-712)
    async signTypedData(walletAlias, domain, types, value) {
        const wallet = this.env.getWallet(walletAlias);
        
        const signature = await wallet.signTypedData(domain, types, value);
        
        const result = {
            domain,
            types,
            value,
            signature,
            signer: wallet.address,
            timestamp: Date.now(),
            type: 'typed-data'
        };
        
        this.env.signedMessages.push(result);
        
        return result;
    }
    
    // 批量签名消息
    async signBatchMessages(walletAlias, messages) {
        const results = [];
        
        for (const msg of messages) {
            try {
                let result;
                
                switch (msg.type) {
                    case 'string':
                        result = await this.signMessage(walletAlias, msg.message);
                        break;
                    case 'bytes':
                        result = await this.signMessageBytes(walletAlias, msg.messageBytes);
                        break;
                    case 'typed-data':
                        result = await this.signTypedData(walletAlias, msg.domain, msg.types, msg.value);
                        break;
                    default:
                        throw new Error(`不支持的消息类型: ${msg.type}`);
                }
                
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    message: msg
                });
            }
        }
        
        return results;
    }
    
    // 验证消息签名
    verifyMessage(message, signature, expectedSigner) {
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return {
                valid: recoveredAddress.toLowerCase() === expectedSigner.toLowerCase(),
                recoveredAddress,
                expectedSigner
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    // 验证类型化数据签名
    verifyTypedData(domain, types, value, signature, expectedSigner) {
        try {
            const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
            return {
                valid: recoveredAddress.toLowerCase() === expectedSigner.toLowerCase(),
                recoveredAddress,
                expectedSigner
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    // 获取已签名的消息
    getSignedMessages() {
        return this.env.signedMessages;
    }
    
    // 导出签名消息
    exportSignedMessages(format = 'json') {
        const messages = this.env.signedMessages;
        
        switch (format) {
            case 'json':
                return JSON.stringify(messages, null, 2);
            case 'csv':
                return this.exportMessagesToCSV(messages);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }
    
    // 导出消息为 CSV
    exportMessagesToCSV(messages) {
        const headers = ['timestamp', 'type', 'signer', 'message', 'signature'];
        const rows = messages.map(msg => [
            new Date(msg.timestamp).toISOString(),
            msg.type,
            msg.signer,
            msg.type === 'typed-data' ? JSON.stringify(msg.value) : msg.message,
            msg.signature
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// 使用示例
async function offlineMessageSigningExample() {
    const offlineEnv = new OfflineEnvironment();
    const messageSigner = new OfflineMessageSigner(offlineEnv);
    
    // 导入钱包
    offlineEnv.importWallet('0x...privateKey', 'main');
    
    // 签名字符串消息
    const stringSignature = await messageSigner.signMessage('main', 'Hello, Ethereum!');
    console.log('字符串消息签名:', stringSignature);
    
    // 签名字节消息
    const bytesMessage = ethers.toUtf8Bytes('Binary message');
    const bytesSignature = await messageSigner.signMessageBytes('main', bytesMessage);
    console.log('字节消息签名:', bytesSignature);
    
    // 签名类型化数据
    const domain = {
        name: 'MyDApp',
        version: '1',
        chainId: 1,
        verifyingContract: '0x...contractAddress'
    };
    
    const types = {
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
        ]
    };
    
    const value = {
        name: 'Alice',
        wallet: '0x...address'
    };
    
    const typedDataSignature = await messageSigner.signTypedData('main', domain, types, value);
    console.log('类型化数据签名:', typedDataSignature);
    
    // 验证签名
    const verification = messageSigner.verifyMessage(
        'Hello, Ethereum!',
        stringSignature.signature,
        stringSignature.signer
    );
    console.log('签名验证:', verification);
    
    return messageSigner;
}
```

### 2. 高级消息签名

```javascript
class AdvancedOfflineMessageSigner extends OfflineMessageSigner {
    constructor(offlineEnvironment) {
        super(offlineEnvironment);
        this.messageTemplates = new Map();
    }
    
    // 添加消息模板
    addMessageTemplate(name, template) {
        this.messageTemplates.set(name, template);
        
        return {
            name,
            template,
            added: true
        };
    }
    
    // 使用模板签名消息
    async signMessageFromTemplate(walletAlias, templateName, variables) {
        const template = this.messageTemplates.get(templateName);
        if (!template) {
            throw new Error(`消息模板 ${templateName} 不存在`);
        }
        
        let message = template.message;
        
        // 替换变量
        for (const [key, value] of Object.entries(variables)) {
            message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        // 根据模板类型签名
        switch (template.type) {
            case 'string':
                return await this.signMessage(walletAlias, message);
            case 'typed-data':
                return await this.signTypedData(
                    walletAlias,
                    template.domain,
                    template.types,
                    { ...template.value, ...variables }
                );
            default:
                throw new Error(`不支持的模板类型: ${template.type}`);
        }
    }
    
    // 签名认证消息
    async signAuthenticationMessage(walletAlias, domain, nonce, timestamp) {
        const message = `请签名以验证您的身份\n域名: ${domain}\n随机数: ${nonce}\n时间: ${new Date(timestamp).toISOString()}`;
        
        return await this.signMessage(walletAlias, message);
    }
    
    // 签名授权消息
    async signAuthorizationMessage(walletAlias, action, resource, expiry) {
        const authDomain = {
            name: 'Authorization',
            version: '1',
            chainId: 1
        };
        
        const authTypes = {
            Authorization: [
                { name: 'action', type: 'string' },
                { name: 'resource', type: 'string' },
                { name: 'expiry', type: 'uint256' }
            ]
        };
        
        const authValue = {
            action,
            resource,
            expiry
        };
        
        return await this.signTypedData(walletAlias, authDomain, authTypes, authValue);
    }
    
    // 签名 Permit 消息 (EIP-2612)
    async signPermitMessage(walletAlias, tokenAddress, spender, value, deadline, nonce) {
        const domain = {
            name: 'Token', // 实际应用中应该从合约获取
            version: '1',
            chainId: 1,
            verifyingContract: tokenAddress
        };
        
        const types = {
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
            ]
        };
        
        const wallet = this.env.getWallet(walletAlias);
        const permitValue = {
            owner: wallet.address,
            spender,
            value,
            nonce,
            deadline
        };
        
        return await this.signTypedData(walletAlias, domain, types, permitValue);
    }
    
    // 签名多重签名提案
    async signMultisigProposal(walletAlias, multisigAddress, to, value, data, nonce) {
        const domain = {
            name: 'Multisig',
            version: '1',
            chainId: 1,
            verifyingContract: multisigAddress
        };
        
        const types = {
            Transaction: [
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'data', type: 'bytes' },
                { name: 'nonce', type: 'uint256' }
            ]
        };
        
        const proposalValue = {
            to,
            value,
            data,
            nonce
        };
        
        return await this.signTypedData(walletAlias, domain, types, proposalValue);
    }
    
    // 创建签名证书
    async createSignatureCertificate(walletAlias, subject, validFrom, validTo, permissions) {
        const domain = {
            name: 'Certificate',
            version: '1',
            chainId: 1
        };
        
        const types = {
            Certificate: [
                { name: 'subject', type: 'address' },
                { name: 'validFrom', type: 'uint256' },
                { name: 'validTo', type: 'uint256' },
                { name: 'permissions', type: 'string[]' }
            ]
        };
        
        const certificateValue = {
            subject,
            validFrom,
            validTo,
            permissions
        };
        
        const signature = await this.signTypedData(walletAlias, domain, types, certificateValue);
        
        return {
            ...signature,
            certificate: {
                subject,
                validFrom,
                validTo,
                permissions,
                issuer: signature.signer,
                issuedAt: signature.timestamp
            }
        };
    }
}

// 使用示例
async function advancedOfflineMessageSigningExample() {
    const offlineEnv = new OfflineEnvironment();
    const advancedSigner = new AdvancedOfflineMessageSigner(offlineEnv);
    
    // 导入钱包
    offlineEnv.importWallet('0x...privateKey', 'main');
    
    // 添加消息模板
    advancedSigner.addMessageTemplate('login', {
        type: 'string',
        message: '登录到 {{domain}} 在 {{timestamp}}'
    });
    
    // 使用模板签名
    const loginSignature = await advancedSigner.signMessageFromTemplate('main', 'login', {
        domain: 'example.com',
        timestamp: new Date().toISOString()
    });
    console.log('登录签名:', loginSignature);
    
    // 签名认证消息
    const authSignature = await advancedSigner.signAuthenticationMessage(
        'main',
        'example.com',
        'random-nonce-123',
        Date.now()
    );
    console.log('认证签名:', authSignature);
    
    // 签名 Permit 消息
    const permitSignature = await advancedSigner.signPermitMessage(
        'main',
        '0x...tokenAddress',
        '0x...spenderAddress',
        ethers.parseEther('1000'),
        Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
        0
    );
    console.log('Permit 签名:', permitSignature);
    
    // 创建签名证书
    const certificate = await advancedSigner.createSignatureCertificate(
        'main',
        '0x...subjectAddress',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 86400 * 30, // 30天有效期
        ['read', 'write', 'admin']
    );
    console.log('签名证书:', certificate);
    
    return advancedSigner;
}
```

## 安全传输和存储

### 1. 安全数据传输

```javascript
class SecureOfflineDataTransfer {
    constructor() {
        this.encryptionKey = null;
    }
    
    // 生成加密密钥
    generateEncryptionKey() {
        this.encryptionKey = ethers.randomBytes(32);
        return ethers.hexlify(this.encryptionKey);
    }
    
    // 设置加密密钥
    setEncryptionKey(keyHex) {
        this.encryptionKey = ethers.getBytes(keyHex);
    }
    
    // 加密数据
    async encryptData(data) {
        if (!this.encryptionKey) {
            throw new Error('未设置加密密钥');
        }
        
        const dataBytes = ethers.toUtf8Bytes(JSON.stringify(data));
        const iv = ethers.randomBytes(16);
        
        // 简化的加密实现（实际应用中应使用更强的加密）
        const encrypted = ethers.keccak256(ethers.concat([this.encryptionKey, iv, dataBytes]));
        
        return {
            encrypted: ethers.hexlify(encrypted),
            iv: ethers.hexlify(iv),
            timestamp: Date.now()
        };
    }
    
    // 解密数据
    async decryptData(encryptedData) {
        if (!this.encryptionKey) {
            throw new Error('未设置加密密钥');
        }
        
        // 简化的解密实现
        // 实际应用中需要实现对应的解密逻辑
        return {
            decrypted: true,
            timestamp: encryptedData.timestamp
        };
    }
    
    // 创建安全传输包
    async createSecurePackage(signedTransactions, signedMessages, metadata = {}) {
        const packageData = {
            transactions: signedTransactions,
            messages: signedMessages,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                version: '1.0'
            }
        };
        
        const encrypted = await this.encryptData(packageData);
        const checksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(packageData)));
        
        return {
            ...encrypted,
            checksum,
            type: 'secure-offline-package'
        };
    }
    
    // 验证安全传输包
    async verifySecurePackage(securePackage) {
        try {
            const decrypted = await this.decryptData(securePackage);
            // 验证校验和
            const calculatedChecksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(decrypted)));
            
            return {
                valid: calculatedChecksum === securePackage.checksum,
                data: decrypted,
                checksum: calculatedChecksum
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
    
    // 生成 QR 码数据
    generateQRCodeData(data, maxSize = 2000) {
        const jsonData = JSON.stringify(data);
        
        if (jsonData.length > maxSize) {
            // 分割大数据
            const chunks = [];
            for (let i = 0; i < jsonData.length; i += maxSize) {
                chunks.push(jsonData.slice(i, i + maxSize));
            }
            
            return chunks.map((chunk, index) => ({
                part: index + 1,
                total: chunks.length,
                data: chunk,
                checksum: ethers.keccak256(ethers.toUtf8Bytes(chunk))
            }));
        }
        
        return [{
            part: 1,
            total: 1,
            data: jsonData,
            checksum: ethers.keccak256(ethers.toUtf8Bytes(jsonData))
        }];
    }
    
    // 重组 QR 码数据
    reassembleQRCodeData(qrParts) {
        // 按部分排序
        qrParts.sort((a, b) => a.part - b.part);
        
        // 验证完整性
        const totalParts = qrParts[0].total;
        if (qrParts.length !== totalParts) {
            throw new Error(`缺少 QR 码部分，期望 ${totalParts} 个，实际 ${qrParts.length} 个`);
        }
        
        // 验证校验和
        for (const part of qrParts) {
            const calculatedChecksum = ethers.keccak256(ethers.toUtf8Bytes(part.data));
            if (calculatedChecksum !== part.checksum) {
                throw new Error(`QR 码部分 ${part.part} 校验和不匹配`);
            }
        }
        
        // 重组数据
        const reassembledData = qrParts.map(part => part.data).join('');
        
        return JSON.parse(reassembledData);
    }
}

// 使用示例
async function secureDataTransferExample() {
    const transfer = new SecureOfflineDataTransfer();
    
    // 生成加密密钥
    const encryptionKey = transfer.generateEncryptionKey();
    console.log('加密密钥:', encryptionKey);
    
    // 模拟签名数据
    const signedTransactions = [
        {
            signedTransaction: '0x...',
            transactionHash: '0x...',
            from: '0x...'
        }
    ];
    
    const signedMessages = [
        {
            message: 'Hello, World!',
            signature: '0x...',
            signer: '0x...'
        }
    ];
    
    // 创建安全传输包
    const securePackage = await transfer.createSecurePackage(
        signedTransactions,
        signedMessages,
        { purpose: 'offline-signing-demo' }
    );
    console.log('安全传输包:', securePackage);
    
    // 生成 QR 码数据
    const qrData = transfer.generateQRCodeData(securePackage);
    console.log('QR 码数据:', qrData);
    
    // 重组 QR 码数据
    const reassembled = transfer.reassembleQRCodeData(qrData);
    console.log('重组数据:', reassembled);
    
    return transfer;
}
```

### 2. 安全存储管理

```javascript
class SecureOfflineStorage {
    constructor() {
        this.storageKey = null;
        this.storage = new Map();
    }
    
    // 初始化存储
    async initializeStorage(password) {
        // 从密码派生存储密钥
        this.storageKey = ethers.keccak256(ethers.toUtf8Bytes(password));
        
        return {
            initialized: true,
            keyHash: ethers.keccak256(this.storageKey)
        };
    }
    
    // 安全存储钱包
    async storeWallet(alias, wallet, metadata = {}) {
        if (!this.storageKey) {
            throw new Error('存储未初始化');
        }
        
        const walletData = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase,
            metadata: {
                ...metadata,
                createdAt: Date.now(),
                lastAccessed: Date.now()
            }
        };
        
        // 加密钱包数据
        const encrypted = await this.encryptWalletData(walletData);
        this.storage.set(alias, encrypted);
        
        return {
            alias,
            address: wallet.address,
            stored: true
        };
    }
    
    // 加载钱包
    async loadWallet(alias) {
        if (!this.storageKey) {
            throw new Error('存储未初始化');
        }
        
        const encrypted = this.storage.get(alias);
        if (!encrypted) {
            throw new Error(`钱包 ${alias} 不存在`);
        }
        
        const walletData = await this.decryptWalletData(encrypted);
        
        // 更新最后访问时间
        walletData.metadata.lastAccessed = Date.now();
        const reencrypted = await this.encryptWalletData(walletData);
        this.storage.set(alias, reencrypted);
        
        // 创建钱包实例
        const wallet = new ethers.Wallet(walletData.privateKey);
        
        return {
            wallet,
            metadata: walletData.metadata
        };
    }
    
    // 加密钱包数据
    async encryptWalletData(walletData) {
        const dataBytes = ethers.toUtf8Bytes(JSON.stringify(walletData));
        const iv = ethers.randomBytes(16);
        
        // 简化的加密实现
        const encrypted = ethers.keccak256(ethers.concat([this.storageKey, iv, dataBytes]));
        
        return {
            encrypted: ethers.hexlify(encrypted),
            iv: ethers.hexlify(iv),
            timestamp: Date.now()
        };
    }
    
    // 解密钱包数据
    async decryptWalletData(encryptedData) {
        // 简化的解密实现
        // 实际应用中需要实现真正的解密逻辑
        return {
            address: '0x...',
            privateKey: '0x...',
            metadata: {}
        };
    }
    
    // 导出存储
    async exportStorage(exportPassword) {
        const exportKey = ethers.keccak256(ethers.toUtf8Bytes(exportPassword));
        const storageData = Object.fromEntries(this.storage);
        
        // 重新加密用于导出
        const exportData = {
            version: '1.0',
            data: storageData,
            exportedAt: Date.now()
        };
        
        const dataBytes = ethers.toUtf8Bytes(JSON.stringify(exportData));
        const iv = ethers.randomBytes(16);
        const encrypted = ethers.keccak256(ethers.concat([exportKey, iv, dataBytes]));
        
        return {
            encrypted: ethers.hexlify(encrypted),
            iv: ethers.hexlify(iv),
            checksum: ethers.keccak256(dataBytes)
        };
    }
    
    // 导入存储
    async importStorage(exportedData, importPassword) {
        const importKey = ethers.keccak256(ethers.toUtf8Bytes(importPassword));
        
        // 解密导入数据
        // 简化实现
        const importedData = {
            version: '1.0',
            data: {},
            exportedAt: Date.now()
        };
        
        // 验证版本兼容性
        if (importedData.version !== '1.0') {
            throw new Error('不兼容的存储版本');
        }
        
        // 导入数据
        this.storage = new Map(Object.entries(importedData.data));
        
        return {
            imported: true,
            walletCount: this.storage.size,
            exportedAt: importedData.exportedAt
        };
    }
    
    // 列出存储的钱包
    listWallets() {
        return Array.from(this.storage.keys());
    }
    
    // 删除钱包
    deleteWallet(alias) {
        const deleted = this.storage.delete(alias);
        return { alias, deleted };
    }
    
    // 清空存储
    clearStorage() {
        const count = this.storage.size;
        this.storage.clear();
        this.storageKey = null;
        
        return { cleared: count };
    }
}

// 使用示例
async function secureStorageExample() {
    const storage = new SecureOfflineStorage();
    
    // 初始化存储
    await storage.initializeStorage('strong-password-123');
    
    // 创建并存储钱包
    const wallet = ethers.Wallet.createRandom();
    await storage.storeWallet('my-wallet', wallet, {
        purpose: 'main-wallet',
        network: 'mainnet'
    });
    
    // 加载钱包
    const loaded = await storage.loadWallet('my-wallet');
    console.log('加载的钱包:', loaded.wallet.address);
    
    // 列出钱包
    const wallets = storage.listWallets();
    console.log('存储的钱包:', wallets);
    
    // 导出存储
    const exported = await storage.exportStorage('export-password-456');
    console.log('导出的存储:', exported);
    
    return storage;
}
```

## 最佳实践

### 1. 安全实践

```javascript
const offlineSigningSecurity = {
    environmentSecurity: {
        description: '离线环境安全',
        practices: [
            '使用完全断网的设备',
            '定期清理临时文件',
            '使用专用的离线设备',
            '物理隔离网络连接'
        ]
    },
    
    keyManagement: {
        description: '密钥管理安全',
        practices: [
            '使用强密码保护私钥',
            '定期备份钱包数据',
            '使用硬件安全模块',
            '多重签名保护重要资产'
        ]
    },
    
    dataTransfer: {
        description: '数据传输安全',
        practices: [
            '加密所有传输数据',
            '使用校验和验证完整性',
            '限制数据传输次数',
            '及时清理传输介质'
        ]
    },
    
    operationalSecurity: {
        description: '操作安全',
        practices: [
            '验证所有交易详情',
            '使用多人审核流程',
            '记录所有操作日志',
            '定期安全审计'
        ]
    }
};

// 安全检查工具
class OfflineSigningSecurityChecker {
    constructor() {
        this.securityChecks = [];
    }
    
    // 检查环境安全
    checkEnvironmentSecurity() {
        const checks = {
            networkDisconnected: this.checkNetworkConnection(),
            temporaryFilesCleared: this.checkTemporaryFiles(),
            secureStorage: this.checkStorageSecurity(),
            systemUpdated: this.checkSystemSecurity()
        };
        
        return {
            passed: Object.values(checks).every(check => check),
            checks,
            riskLevel: this.calculateRiskLevel(checks)
        };
    }
    
    checkNetworkConnection() {
        // 检查网络连接状态
        return !navigator.onLine; // 简化检查
    }
    
    checkTemporaryFiles() {
        // 检查临时文件
        return true; // 简化检查
    }
    
    checkStorageSecurity() {
        // 检查存储安全
        return true; // 简化检查
    }
    
    checkSystemSecurity() {
        // 检查系统安全
        return true; // 简化检查
    }
    
    calculateRiskLevel(checks) {
        const failedChecks = Object.values(checks).filter(check => !check).length;
        if (failedChecks === 0) return 'low';
        if (failedChecks <= 2) return 'medium';
        return 'high';
    }
    
    // 生成安全报告
    generateSecurityReport() {
        const envSecurity = this.checkEnvironmentSecurity();
        
        return {
            timestamp: Date.now(),
            environmentSecurity: envSecurity,
            recommendations: this.getSecurityRecommendations(envSecurity),
            overallRisk: envSecurity.riskLevel
        };
    }
    
    getSecurityRecommendations(securityCheck) {
        const recommendations = [];
        
        if (!securityCheck.checks.networkDisconnected) {
            recommendations.push('断开网络连接');
        }
        
        if (!securityCheck.checks.temporaryFilesCleared) {
            recommendations.push('清理临时文件');
        }
        
        if (!securityCheck.checks.secureStorage) {
            recommendations.push('加强存储安全');
        }
        
        if (!securityCheck.checks.systemUpdated) {
            recommendations.push('更新系统安全');
        }
        
        return recommendations;
    }
}
```

### 2. 工作流程优化

```javascript
class OfflineSigningWorkflow {
    constructor() {
        this.workflow = {
            preparation: '准备阶段',
            signing: '签名阶段',
            verification: '验证阶段',
            transfer: '传输阶段',
            execution: '执行阶段'
        };
    }
    
    // 创建签名工作流
    createSigningWorkflow(transactions, options = {}) {
        return {
            id: ethers.hexlify(ethers.randomBytes(16)),
            transactions,
            options,
            status: 'created',
            steps: [
                { name: 'preparation', status: 'pending', startTime: null, endTime: null },
                { name: 'signing', status: 'pending', startTime: null, endTime: null },
                { name: 'verification', status: 'pending', startTime: null, endTime: null },
                { name: 'transfer', status: 'pending', startTime: null, endTime: null },
                { name: 'execution', status: 'pending', startTime: null, endTime: null }
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    
    // 执行工作流步骤
    async executeWorkflowStep(workflowId, stepName, executor) {
        const workflow = this.getWorkflow(workflowId);
        const step = workflow.steps.find(s => s.name === stepName);
        
        if (!step) {
            throw new Error(`工作流步骤 ${stepName} 不存在`);
        }
        
        if (step.status !== 'pending') {
            throw new Error(`工作流步骤 ${stepName} 已经执行过`);
        }
        
        step.status = 'running';
        step.startTime = Date.now();
        
        try {
            const result = await executor(workflow);
            
            step.status = 'completed';
            step.endTime = Date.now();
            step.result = result;
            
            workflow.updatedAt = Date.now();
            
            return result;
        } catch (error) {
            step.status = 'failed';
            step.endTime = Date.now();
            step.error = error.message;
            
            workflow.updatedAt = Date.now();
            
            throw error;
        }
    }
    
    // 获取工作流状态
    getWorkflowStatus(workflowId) {
        const workflow = this.getWorkflow(workflowId);
        
        const completed = workflow.steps.filter(s => s.status === 'completed').length;
        const failed = workflow.steps.filter(s => s.status === 'failed').length;
        const total = workflow.steps.length;
        
        let overallStatus = 'in-progress';
        if (failed > 0) {
            overallStatus = 'failed';
        } else if (completed === total) {
            overallStatus = 'completed';
        }
        
        return {
            workflowId,
            overallStatus,
            progress: `${completed}/${total}`,
            steps: workflow.steps,
            duration: Date.now() - workflow.createdAt
        };
    }
    
    getWorkflow(workflowId) {
        // 简化实现，实际应用中应该有持久化存储
        return this.workflows?.get(workflowId) || null;
    }
}

// 使用示例
async function offlineSigningWorkflowExample() {
    const workflow = new OfflineSigningWorkflow();
    const offlineEnv = new OfflineEnvironment();
    const signer = new OfflineTransactionSigner(offlineEnv);
    
    // 创建工作流
    const transactions = [
        {
            to: '0x...',
            value: ethers.parseEther('1.0'),
            gasLimit: 21000,
            nonce: 42,
            chainId: 1
        }
    ];
    
    const workflowInstance = workflow.createSigningWorkflow(transactions);
    console.log('创建工作流:', workflowInstance.id);
    
    // 执行准备步骤
    await workflow.executeWorkflowStep(workflowInstance.id, 'preparation', async (wf) => {
        // 导入钱包
        offlineEnv.importWallet('0x...privateKey', 'main');
        return { walletsImported: 1 };
    });
    
    // 执行签名步骤
    await workflow.executeWorkflowStep(workflowInstance.id, 'signing', async (wf) => {
        const results = [];
        for (const tx of wf.transactions) {
            const signed = await signer.signTransaction('main', tx);
            results.push(signed);
        }
        return { signedTransactions: results };
    });
    
    // 获取工作流状态
    const status = workflow.getWorkflowStatus(workflowInstance.id);
    console.log('工作流状态:', status);
    
    return workflow;
}
```

## 总结

离线签名技术为区块链应用提供了最高级别的安全保障，本文档涵盖了：

1. **基础概念**: 离线环境设置、钱包管理
2. **交易签名**: 基础交易、EIP-1559、合约交互
3. **消息签名**: 字符串消息、类型化数据、高级应用
4. **安全传输**: 数据加密、QR码传输、完整性验证
5. **安全存储**: 钱包加密存储、导入导出
6. **最佳实践**: 安全检查、工作流程优化

通过合理使用离线签名技术，可以在保证最高安全性的同时，实现灵活的区块链交互。

## 下一步

- [自定义网络](/ethers/advanced/custom-networks) - 了解自定义网络配置
- [多签钱包](/ethers/advanced/multisig) - 掌握多重签名钱包
- [元交易](/ethers/advanced/meta-transactions) - 学习元交易技术
- [ENS 域名服务](/ethers/advanced/ens) - 学习 ENS 域名解析