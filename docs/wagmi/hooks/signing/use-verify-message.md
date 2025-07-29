---
title: useVerifyMessage
description: 验证消息签名的 React Hook
keywords: [wagmi, useVerifyMessage, 消息验证, 签名验证, React Hook, Web3]
---

# useVerifyMessage

`useVerifyMessage` 用于验证消息签名的有效性，确认签名是否来自指定地址。

## 基本用法

```tsx
import { useVerifyMessage } from 'wagmi'

function VerifyMessage() {
  const { data, isLoading, isSuccess, verifyMessage } = useVerifyMessage({
    message: 'Hello, Web3!',
    signature: '0x...',
    address: '0x...'
  })

  return (
    <div>
      <button 
        disabled={isLoading} 
        onClick={() => verifyMessage()}
      >
        {isLoading ? '验证中...' : '验证签名'}
      </button>
      
      {isSuccess && (
        <div>
          <p>验证结果: {data ? '✅ 签名有效' : '❌ 签名无效'}</p>
        </div>
      )}
    </div>
  )
}
```

## 参数配置

```tsx
import { useVerifyMessage } from 'wagmi'

function ConfiguredVerifyMessage() {
  const { verifyMessage, data } = useVerifyMessage({
    message: 'Please verify this signature',
    signature: '0x1234567890abcdef...',
    address: '0xabcdef1234567890...',
    onSuccess: (isValid) => {
      console.log('验证完成:', isValid ? '有效' : '无效')
    },
    onError: (error) => {
      console.error('验证失败:', error)
    }
  })

  return (
    <div>
      <button onClick={() => verifyMessage()}>
        验证签名
      </button>
      {data !== undefined && (
        <p>结果: {data ? '有效' : '无效'}</p>
      )}
    </div>
  )
}
```

## 返回值

- `data` - 验证结果 (boolean | undefined)
- `error` - 错误信息
- `isLoading` - 是否正在验证
- `isSuccess` - 是否验证完成
- `isError` - 是否发生错误
- `verifyMessage` - 执行验证的函数
- `reset` - 重置状态

## 详细示例

### 签名验证工具

```tsx
import { useVerifyMessage } from 'wagmi'
import { useState } from 'react'

function SignatureVerificationTool() {
  const [formData, setFormData] = useState({
    message: '',
    signature: '',
    address: ''
  })

  const { 
    data: isValid, 
    isLoading, 
    isSuccess, 
    error,
    verifyMessage,
    reset 
  } = useVerifyMessage({
    message: formData.message,
    signature: formData.signature,
    address: formData.address,
    onSuccess: (result) => {
      console.log('验证结果:', result)
    },
    onError: (error) => {
      console.error('验证错误:', error)
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVerify = () => {
    if (!formData.message || !formData.signature || !formData.address) {
      alert('请填写完整信息')
      return
    }
    verifyMessage()
  }

  const handleReset = () => {
    reset()
    setFormData({
      message: '',
      signature: '',
      address: ''
    })
  }

  const isFormValid = formData.message && formData.signature && formData.address

  return (
    <div className="signature-verification-tool">
      <h3>签名验证工具</h3>
      
      <div className="form-section">
        <div className="input-group">
          <label htmlFor="message">原始消息:</label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="输入原始消息..."
            rows={3}
          />
        </div>

        <div className="input-group">
          <label htmlFor="signature">签名:</label>
          <textarea
            id="signature"
            value={formData.signature}
            onChange={(e) => handleInputChange('signature', e.target.value)}
            placeholder="0x..."
            rows={3}
          />
        </div>

        <div className="input-group">
          <label htmlFor="address">签名者地址:</label>
          <input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="0x..."
          />
        </div>
      </div>

      <div className="action-section">
        <button 
          onClick={handleVerify}
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? '验证中...' : '验证签名'}
        </button>

        <button onClick={handleReset}>
          重置
        </button>
      </div>

      {isSuccess && (
        <div className={`result-section ${isValid ? 'valid' : 'invalid'}`}>
          <div className="result-header">
            <span className="result-icon">
              {isValid ? '✅' : '❌'}
            </span>
            <span className="result-text">
              {isValid ? '签名有效' : '签名无效'}
            </span>
          </div>
          
          {isValid && (
            <div className="verification-details">
              <p><strong>验证成功!</strong></p>
              <p>消息确实由地址 <code>{formData.address}</code> 签名</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-section">
          <p>验证失败: {error.message}</p>
        </div>
      )}
    </div>
  )
}
```

### 身份验证系统

```tsx
import { useVerifyMessage, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

interface AuthSession {
  address: string
  nonce: string
  signature: string
  timestamp: number
  isValid: boolean
}

function AuthenticationVerifier() {
  const { address } = useAccount()
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AuthSession | null>(null)

  const { 
    data: isValid, 
    isLoading, 
    isSuccess,
    verifyMessage 
  } = useVerifyMessage({
    message: selectedSession ? `Authentication nonce: ${selectedSession.nonce}` : '',
    signature: selectedSession?.signature || '',
    address: selectedSession?.address || '',
    onSuccess: (result) => {
      if (selectedSession) {
        // 更新会话验证状态
        setSessions(prev => prev.map(session => 
          session === selectedSession 
            ? { ...session, isValid: result }
            : session
        ))
      }
    }
  })

  // 模拟加载历史会话
  useEffect(() => {
    const mockSessions: AuthSession[] = [
      {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
        nonce: 'abc123',
        signature: '0x...',
        timestamp: Date.now() - 3600000,
        isValid: false
      },
      {
        address: '0x8ba1f109551bD432803012645Hac136c',
        nonce: 'def456',
        signature: '0x...',
        timestamp: Date.now() - 1800000,
        isValid: false
      }
    ]
    setSessions(mockSessions)
  }, [])

  const handleVerifySession = (session: AuthSession) => {
    setSelectedSession(session)
    verifyMessage()
  }

  const getSessionStatus = (session: AuthSession) => {
    if (session === selectedSession && isLoading) {
      return '验证中...'
    }
    if (session.isValid) {
      return '✅ 已验证'
    }
    return '❓ 未验证'
  }

  return (
    <div className="authentication-verifier">
      <h3>身份验证会话管理</h3>
      
      <div className="current-user">
        <p>当前用户: {address || '未连接'}</p>
      </div>

      <div className="sessions-list">
        <h4>历史验证会话</h4>
        
        {sessions.length === 0 ? (
          <p>暂无验证会话</p>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session, index) => (
              <div key={index} className="session-card">
                <div className="session-header">
                  <span className="session-address">
                    {session.address.slice(0, 6)}...{session.address.slice(-4)}
                  </span>
                  <span className="session-time">
                    {new Date(session.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="session-details">
                  <p><strong>Nonce:</strong> {session.nonce}</p>
                  <p><strong>状态:</strong> {getSessionStatus(session)}</p>
                </div>
                
                <div className="session-actions">
                  <button 
                    onClick={() => handleVerifySession(session)}
                    disabled={isLoading && selectedSession === session}
                  >
                    验证签名
                  </button>
                </div>
                
                {session.isValid && (
                  <div className="verification-badge">
                    <span>✅ 验证通过</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && isSuccess && (
        <div className="verification-result">
          <h4>验证结果</h4>
          <div className={`result-card ${isValid ? 'valid' : 'invalid'}`}>
            <div className="result-status">
              {isValid ? '✅ 签名有效' : '❌ 签名无效'}
            </div>
            <div className="result-details">
              <p><strong>地址:</strong> {selectedSession.address}</p>
              <p><strong>消息:</strong> Authentication nonce: {selectedSession.nonce}</p>
              <p><strong>签名:</strong> {selectedSession.signature.slice(0, 20)}...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 批量签名验证

```tsx
import { useVerifyMessage } from 'wagmi'
import { useState } from 'react'

interface SignatureItem {
  id: string
  message: string
  signature: string
  address: string
  isValid?: boolean
  isVerifying?: boolean
}

function BatchSignatureVerifier() {
  const [signatures, setSignatures] = useState<SignatureItem[]>([])
  const [currentVerifying, setCurrentVerifying] = useState<string | null>(null)

  const { verifyMessage, isLoading } = useVerifyMessage({
    onSuccess: (isValid) => {
      if (currentVerifying) {
        setSignatures(prev => prev.map(sig => 
          sig.id === currentVerifying 
            ? { ...sig, isValid, isVerifying: false }
            : sig
        ))
        setCurrentVerifying(null)
      }
    },
    onError: () => {
      if (currentVerifying) {
        setSignatures(prev => prev.map(sig => 
          sig.id === currentVerifying 
            ? { ...sig, isValid: false, isVerifying: false }
            : sig
        ))
        setCurrentVerifying(null)
      }
    }
  })

  const addSignature = () => {
    const newSignature: SignatureItem = {
      id: Date.now().toString(),
      message: '',
      signature: '',
      address: ''
    }
    setSignatures(prev => [...prev, newSignature])
  }

  const updateSignature = (id: string, field: keyof SignatureItem, value: string) => {
    setSignatures(prev => prev.map(sig => 
      sig.id === id ? { ...sig, [field]: value } : sig
    ))
  }

  const removeSignature = (id: string) => {
    setSignatures(prev => prev.filter(sig => sig.id !== id))
  }

  const verifySingleSignature = async (signature: SignatureItem) => {
    if (!signature.message || !signature.signature || !signature.address) {
      alert('请填写完整信息')
      return
    }

    setCurrentVerifying(signature.id)
    setSignatures(prev => prev.map(sig => 
      sig.id === signature.id 
        ? { ...sig, isVerifying: true }
        : sig
    ))

    verifyMessage({
      message: signature.message,
      signature: signature.signature,
      address: signature.address
    })
  }

  const verifyAllSignatures = async () => {
    const validSignatures = signatures.filter(sig => 
      sig.message && sig.signature && sig.address
    )

    for (const signature of validSignatures) {
      await verifySingleSignature(signature)
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getValidCount = () => {
    return signatures.filter(sig => sig.isValid === true).length
  }

  const getInvalidCount = () => {
    return signatures.filter(sig => sig.isValid === false).length
  }

  return (
    <div className="batch-signature-verifier">
      <h3>批量签名验证</h3>
      
      <div className="controls-section">
        <button onClick={addSignature}>
          添加签名
        </button>
        
        <button 
          onClick={verifyAllSignatures}
          disabled={isLoading || signatures.length === 0}
        >
          {isLoading ? '验证中...' : '验证全部'}
        </button>
        
        <div className="stats">
          <span>总计: {signatures.length}</span>
          <span>有效: {getValidCount()}</span>
          <span>无效: {getInvalidCount()}</span>
        </div>
      </div>

      <div className="signatures-list">
        {signatures.map((signature) => (
          <div key={signature.id} className="signature-item">
            <div className="signature-form">
              <div className="form-row">
                <label>消息:</label>
                <input
                  type="text"
                  value={signature.message}
                  onChange={(e) => updateSignature(signature.id, 'message', e.target.value)}
                  placeholder="输入原始消息..."
                />
              </div>
              
              <div className="form-row">
                <label>签名:</label>
                <input
                  type="text"
                  value={signature.signature}
                  onChange={(e) => updateSignature(signature.id, 'signature', e.target.value)}
                  placeholder="0x..."
                />
              </div>
              
              <div className="form-row">
                <label>地址:</label>
                <input
                  type="text"
                  value={signature.address}
                  onChange={(e) => updateSignature(signature.id, 'address', e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="signature-actions">
              <button 
                onClick={() => verifySingleSignature(signature)}
                disabled={signature.isVerifying}
              >
                {signature.isVerifying ? '验证中...' : '验证'}
              </button>
              
              <button onClick={() => removeSignature(signature.id)}>
                删除
              </button>
            </div>

            <div className="signature-result">
              {signature.isValid !== undefined && (
                <span className={`result-badge ${signature.isValid ? 'valid' : 'invalid'}`}>
                  {signature.isValid ? '✅ 有效' : '❌ 无效'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {signatures.length === 0 && (
        <div className="empty-state">
          <p>暂无签名，点击"添加签名"开始验证</p>
        </div>
      )}
    </div>
  )
}
```

## 错误处理

```tsx
import { useVerifyMessage } from 'wagmi'
import { useState } from 'react'

function VerifyMessageWithErrorHandling() {
  const [errorMessage, setErrorMessage] = useState('')

  const { verifyMessage, isLoading, error } = useVerifyMessage({
    message: 'Test message',
    signature: '0x...',
    address: '0x...',
    onError: (error) => {
      console.error('验证错误:', error)
      
      // 处理不同类型的错误
      if (error.message.includes('Invalid signature')) {
        setErrorMessage('签名格式无效')
      } else if (error.message.includes('Invalid address')) {
        setErrorMessage('地址格式无效')
      } else {
        setErrorMessage('验证失败，请检查输入')
      }
    },
    onSuccess: () => {
      setErrorMessage('')
    }
  })

  return (
    <div>
      <button 
        onClick={() => verifyMessage()}
        disabled={isLoading}
      >
        验证签名
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

### Q: 验证失败的常见原因有哪些？
A: 1) 签名格式错误 2) 消息内容不匹配 3) 地址格式错误 4) 签名被篡改

### Q: 如何验证历史签名？
A: 只要保存了原始消息、签名和地址，可以随时使用此 Hook 验证历史签名。

### Q: 验证过程是否需要网络连接？
A: 签名验证是纯数学运算，不需要网络连接，可以离线进行。

### Q: 如何批量验证多个签名？
A: 可以循环调用验证函数，但建议添加适当延迟避免过快请求。

## 下一步

- [useVerifyTypedData](/wagmi/hooks/signing/use-verify-typed-data) - 学习验证结构化数据签名
- [useSignMessage](/wagmi/hooks/signing/use-sign-message) - 学习消息签名
- [useSignTypedData](/wagmi/hooks/signing/use-sign-typed-data) - 学习结构化数据签名