---
title: useSignMessage
description: 签名消息的 React Hook
keywords: [wagmi, useSignMessage, 消息签名, 数字签名, React Hook, Web3]
---

# useSignMessage

`useSignMessage` 用于签名任意消息，常用于身份验证、数据完整性验证等场景。

## 基本用法

```tsx
import { useSignMessage } from 'wagmi'

function SignMessage() {
  const { data, isLoading, isSuccess, signMessage } = useSignMessage({
    message: 'Hello, Web3!',
  })

  return (
    <div>
      <button 
        disabled={isLoading} 
        onClick={() => signMessage()}
      >
        {isLoading ? '签名中...' : '签名消息'}
      </button>
      
      {isSuccess && (
        <div>
          <p>签名成功!</p>
          <p>签名: {data}</p>
        </div>
      )}
    </div>
  )
}
```

## 参数配置

```tsx
import { useSignMessage } from 'wagmi'

function ConfiguredSignMessage() {
  const { signMessage } = useSignMessage({
    message: 'Please sign this message to authenticate',
    onSuccess: (signature) => {
      console.log('签名成功:', signature)
    },
    onError: (error) => {
      console.error('签名失败:', error)
    },
    onMutate: () => {
      console.log('开始签名...')
    },
    onSettled: (data, error) => {
      console.log('签名完成:', { data, error })
    }
  })

  return (
    <button onClick={() => signMessage()}>
      签名消息
    </button>
  )
}
```

## 返回值

- `data` - 签名结果 (string)
- `error` - 错误信息
- `isLoading` - 是否正在签名
- `isSuccess` - 是否签名成功
- `isError` - 是否发生错误
- `signMessage` - 执行签名的函数
- `reset` - 重置状态

## 详细示例

### 身份验证系统

```tsx
import { useSignMessage, useAccount } from 'wagmi'
import { useState } from 'react'

function AuthenticationSystem() {
  const { address } = useAccount()
  const [nonce, setNonce] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { data: signature, isLoading, signMessage } = useSignMessage({
    message: nonce ? `Please sign this message to authenticate: ${nonce}` : '',
    onSuccess: async (signature) => {
      // 验证签名
      const isValid = await verifySignature(signature, nonce, address!)
      setIsAuthenticated(isValid)
    }
  })

  const generateNonce = () => {
    const randomNonce = Math.random().toString(36).substring(2, 15)
    setNonce(randomNonce)
  }

  const verifySignature = async (signature: string, nonce: string, address: string) => {
    try {
      // 这里应该调用后端 API 验证签名
      const response = await fetch('/api/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, nonce, address })
      })
      const result = await response.json()
      return result.isValid
    } catch (error) {
      console.error('验证签名失败:', error)
      return false
    }
  }

  if (!address) {
    return <div>请先连接钱包</div>
  }

  if (isAuthenticated) {
    return (
      <div className="auth-success">
        <h3>✅ 身份验证成功</h3>
        <p>地址: {address}</p>
        <p>签名: {signature}</p>
        <button onClick={() => {
          setIsAuthenticated(false)
          setNonce('')
        }}>
          退出登录
        </button>
      </div>
    )
  }

  return (
    <div className="auth-system">
      <h3>身份验证</h3>
      <p>地址: {address}</p>
      
      {!nonce ? (
        <button onClick={generateNonce}>
          生成验证码
        </button>
      ) : (
        <div>
          <p>验证码: {nonce}</p>
          <button 
            onClick={() => signMessage()}
            disabled={isLoading}
          >
            {isLoading ? '签名中...' : '签名验证'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### 消息签名工具

```tsx
import { useSignMessage } from 'wagmi'
import { useState } from 'react'
import { verifyMessage } from 'ethers'

function MessageSigningTool() {
  const [message, setMessage] = useState('')
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    recoveredAddress: string
  } | null>(null)

  const { 
    data: signature, 
    isLoading, 
    isSuccess, 
    signMessage,
    reset 
  } = useSignMessage({
    message,
    onSuccess: (signature) => {
      // 自动验证签名
      try {
        const recoveredAddress = verifyMessage(message, signature)
        setVerificationResult({
          isValid: true,
          recoveredAddress
        })
      } catch (error) {
        setVerificationResult({
          isValid: false,
          recoveredAddress: ''
        })
      }
    }
  })

  const handleSignMessage = () => {
    if (!message.trim()) {
      alert('请输入要签名的消息')
      return
    }
    signMessage()
  }

  const handleReset = () => {
    reset()
    setMessage('')
    setVerificationResult(null)
  }

  return (
    <div className="message-signing-tool">
      <h3>消息签名工具</h3>
      
      <div className="input-section">
        <label htmlFor="message">要签名的消息:</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入要签名的消息..."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className="action-buttons">
        <button 
          onClick={handleSignMessage}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? '签名中...' : '签名消息'}
        </button>
        
        {isSuccess && (
          <button onClick={handleReset}>
            重置
          </button>
        )}
      </div>

      {signature && (
        <div className="result-section">
          <h4>签名结果</h4>
          <div className="signature-display">
            <label>签名:</label>
            <textarea 
              value={signature} 
              readOnly 
              rows={3}
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          {verificationResult && (
            <div className="verification-result">
              <h5>验证结果</h5>
              <div className={`status ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                {verificationResult.isValid ? '✅ 签名有效' : '❌ 签名无效'}
              </div>
              {verificationResult.isValid && (
                <div className="recovered-address">
                  <label>恢复的地址:</label>
                  <code>{verificationResult.recoveredAddress}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 数据完整性验证

```tsx
import { useSignMessage, useAccount } from 'wagmi'
import { useState } from 'react'

interface DataPackage {
  id: string
  data: any
  timestamp: number
  signature?: string
  signer?: string
}

function DataIntegrityVerification() {
  const { address } = useAccount()
  const [dataPackages, setDataPackages] = useState<DataPackage[]>([])
  const [newData, setNewData] = useState('')

  const { signMessage, isLoading } = useSignMessage({
    onSuccess: (signature) => {
      // 添加已签名的数据包
      const dataPackage: DataPackage = {
        id: Date.now().toString(),
        data: JSON.parse(newData),
        timestamp: Date.now(),
        signature,
        signer: address
      }
      
      setDataPackages(prev => [...prev, dataPackage])
      setNewData('')
    }
  })

  const handleSignData = () => {
    try {
      const parsedData = JSON.parse(newData)
      const messageToSign = JSON.stringify({
        data: parsedData,
        timestamp: Date.now(),
        signer: address
      })
      
      signMessage({ message: messageToSign })
    } catch (error) {
      alert('请输入有效的 JSON 数据')
    }
  }

  const verifyDataIntegrity = async (dataPackage: DataPackage) => {
    if (!dataPackage.signature || !dataPackage.signer) {
      return false
    }

    try {
      const messageToVerify = JSON.stringify({
        data: dataPackage.data,
        timestamp: dataPackage.timestamp,
        signer: dataPackage.signer
      })

      const { verifyMessage } = await import('ethers')
      const recoveredAddress = verifyMessage(messageToVerify, dataPackage.signature)
      
      return recoveredAddress.toLowerCase() === dataPackage.signer.toLowerCase()
    } catch (error) {
      console.error('验证失败:', error)
      return false
    }
  }

  return (
    <div className="data-integrity-verification">
      <h3>数据完整性验证</h3>
      
      <div className="create-data-section">
        <h4>创建签名数据</h4>
        <textarea
          value={newData}
          onChange={(e) => setNewData(e.target.value)}
          placeholder='输入 JSON 数据，例如: {"name": "Alice", "amount": 100}'
          rows={3}
        />
        <button 
          onClick={handleSignData}
          disabled={isLoading || !newData.trim()}
        >
          {isLoading ? '签名中...' : '签名数据'}
        </button>
      </div>

      <div className="data-packages-section">
        <h4>已签名的数据包 ({dataPackages.length})</h4>
        {dataPackages.map((pkg) => (
          <DataPackageCard 
            key={pkg.id} 
            dataPackage={pkg}
            onVerify={verifyDataIntegrity}
          />
        ))}
      </div>
    </div>
  )
}

function DataPackageCard({ 
  dataPackage, 
  onVerify 
}: { 
  dataPackage: DataPackage
  onVerify: (pkg: DataPackage) => Promise<boolean>
}) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const result = await onVerify(dataPackage)
      setVerificationResult(result)
    } catch (error) {
      setVerificationResult(false)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="data-package-card">
      <div className="package-header">
        <span className="package-id">ID: {dataPackage.id}</span>
        <span className="package-timestamp">
          {new Date(dataPackage.timestamp).toLocaleString()}
        </span>
      </div>
      
      <div className="package-data">
        <label>数据:</label>
        <pre>{JSON.stringify(dataPackage.data, null, 2)}</pre>
      </div>
      
      <div className="package-signature">
        <label>签名者:</label>
        <code>{dataPackage.signer}</code>
      </div>
      
      <div className="package-actions">
        <button 
          onClick={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? '验证中...' : '验证完整性'}
        </button>
        
        {verificationResult !== null && (
          <div className={`verification-status ${verificationResult ? 'valid' : 'invalid'}`}>
            {verificationResult ? '✅ 数据完整' : '❌ 数据被篡改'}
          </div>
        )}
      </div>
    </div>
  )
}
```

## 错误处理

```tsx
import { useSignMessage } from 'wagmi'
import { useState } from 'react'

function SignMessageWithErrorHandling() {
  const [errorMessage, setErrorMessage] = useState('')

  const { signMessage, isLoading, error } = useSignMessage({
    message: 'Test message',
    onError: (error) => {
      console.error('签名错误:', error)
      
      // 处理不同类型的错误
      if (error.message.includes('User rejected')) {
        setErrorMessage('用户拒绝了签名请求')
      } else if (error.message.includes('Not connected')) {
        setErrorMessage('请先连接钱包')
      } else {
        setErrorMessage('签名失败，请重试')
      }
    },
    onSuccess: () => {
      setErrorMessage('')
    }
  })

  return (
    <div>
      <button 
        onClick={() => signMessage()}
        disabled={isLoading}
      >
        签名消息
      </button>
      
      {(error || errorMessage) && (
        <div className="error-message">
          {errorMessage || error?.message}
        </div>
      )}
    </div>
  )
}
```

## 常见问题

### Q: 签名的消息可以被其他人看到吗？
A: 是的，消息内容是公开的。签名只能证明消息来自特定地址，不能加密消息内容。

### Q: 如何防止签名重放攻击？
A: 在消息中包含时间戳、随机数或一次性令牌，并在服务端验证这些值。

### Q: 用户拒绝签名怎么处理？
A: 监听 `onError` 回调，检查错误信息中是否包含 "User rejected"，并提供相应提示。

### Q: 签名后如何验证？
A: 使用 `ethers.verifyMessage()` 或后端 API 验证签名的有效性。

## 下一步

- [useSignTypedData](/wagmi/hooks/signing/use-sign-typed-data) - 学习结构化数据签名
- [useVerifyMessage](/wagmi/hooks/signing/use-verify-message) - 学习消息验证
- [useAccount](/wagmi/hooks/account/use-account) - 学习账户管理