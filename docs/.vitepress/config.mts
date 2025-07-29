import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/web3-doc/",
  title: "Web3 开发中文文档",
  description: "Web3 智能合约和前端开发完整指南",
  
  // 添加搜索功能
  themeConfig: {
    // 本地搜索配置
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        },
        // 自定义搜索配置
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: {
              title: 4,
              text: 2,
              titles: 1
            }
          }
        }
      }
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { 
        text: 'Solidity', 
        link: '/solidity/basics/introduction',
        activeMatch: '^/solidity/'
      },
      { 
        text: 'Ethers.js', 
        link: '/ethers/basics/introduction',
        activeMatch: '^/ethers/'
      },
      { 
        text: 'Wagmi', 
        link: '/wagmi/basics/introduction',
        activeMatch: '^/wagmi/'
      },
    ],  

    sidebar: {
      '/solidity/': [
        {
          text: 'Solidity 智能合约',
          collapsed: false,
          items: [
            {
              text: '基础语法',
              collapsed: false,
              items: [
                { text: 'Solidity 简介', link: '/solidity/basics/introduction' },
                { text: '数据类型', link: '/solidity/basics/data-types' },
                { text: '变量和常量', link: '/solidity/basics/variables' },
                { text: '运算符', link: '/solidity/basics/operators' },
                { text: '控制结构', link: '/solidity/basics/control-structures' }
              ]
            },
            {
              text: '函数和修饰符',
              collapsed: false,
              items: [
                { text: '函数定义', link: '/solidity/basics/functions' },
                { text: '函数修饰符', link: '/solidity/basics/modifiers' },
                { text: '函数可见性', link: '/solidity/basics/function-visibility' },
                { text: '函数重载', link: '/solidity/basics/function-overloading' }
              ]
            },
            {
              text: '数据结构',
              collapsed: false,
              items: [
                { text: '数组和映射', link: '/solidity/basics/arrays-mappings' },
                { text: '结构体和枚举', link: '/solidity/basics/structs-enums' },
                { text: '字符串处理', link: '/solidity/basics/strings' },
                { text: '字节数组', link: '/solidity/basics/bytes' }
              ]
            },
            {
              text: '合约架构',
              collapsed: false,
              items: [
                { text: '合约结构', link: '/solidity/basics/contract-structure' },
                { text: '继承和接口', link: '/solidity/basics/inheritance-interfaces' },
                { text: '抽象合约', link: '/solidity/basics/abstract-contracts' },
                { text: '库和导入', link: '/solidity/basics/libraries-imports' }
              ]
            },
            {
              text: '事件和错误',
              collapsed: false,
              items: [
                { text: '事件和日志', link: '/solidity/basics/events-logs' },
                { text: '错误处理', link: '/solidity/basics/error-handling' },
                { text: '自定义错误', link: '/solidity/basics/custom-errors' },
                { text: '断言和要求', link: '/solidity/basics/assertions' }
              ]
            },
            {
              text: '高级特性',
              collapsed: false,
              items: [
                { text: '内联汇编', link: '/solidity/advanced/inline-assembly' },
                { text: '代理模式', link: '/solidity/advanced/proxy-patterns' },
                { text: '升级合约', link: '/solidity/advanced/upgradeable-contracts' },
                { text: '元交易', link: '/solidity/advanced/meta-transactions' }
              ]
            },
            {
              text: '标准合约',
              collapsed: false,
              items: [
                { text: 'ERC-20 代币', link: '/solidity/standards/erc20' },
                { text: 'ERC-721 NFT', link: '/solidity/standards/erc721' },
                { text: 'ERC-1155 多代币', link: '/solidity/standards/erc1155' },
                { text: 'ERC-4626 金库', link: '/solidity/standards/erc4626' }
              ]
            },
            {
              text: '安全实践',
              collapsed: false,
              items: [
                { text: '常见漏洞', link: '/solidity/security/common-vulnerabilities' },
                { text: '安全检查清单', link: '/solidity/security/checklist' },
                { text: '审计指南', link: '/solidity/security/audit-guide' },
                { text: '测试策略', link: '/solidity/security/testing-strategies' }
              ]
            }
          ]
        }
      ],
      '/ethers/': [
        {
          text: 'Ethers.js 前端开发',
          collapsed: false,
          items: [
            {
              text: '基础概念',
              collapsed: false,
              items: [
                { text: 'Ethers.js 简介', link: '/ethers/basics/introduction' },
                { text: '安装和设置', link: '/ethers/basics/installation' },
                { text: '核心概念', link: '/ethers/basics/core-concepts' },
                { text: '与 Web3.js 对比', link: '/ethers/basics/web3-comparison' }
              ]
            },
            {
              text: 'Provider 连接',
              collapsed: false,
              items: [
                { text: 'Provider 基础', link: '/ethers/providers/basics' },
                { text: 'JsonRpcProvider', link: '/ethers/providers/json-rpc-provider' },
                { text: 'BrowserProvider', link: '/ethers/providers/browser-provider' },
                { text: 'WebSocketProvider', link: '/ethers/providers/websocket-provider' },
                { text: 'FallbackProvider', link: '/ethers/providers/fallback-provider' }
              ]
            },
            {
              text: 'Signer 签名',
              collapsed: false,
              items: [
                { text: 'Signer 基础', link: '/ethers/signers/basics' },
                { text: 'JsonRpcSigner', link: '/ethers/signers/json-rpc-signer' },
                { text: 'Wallet', link: '/ethers/signers/wallet' },
                { text: '消息签名', link: '/ethers/signers/message-signing' },
                { text: '类型化数据签名', link: '/ethers/signers/typed-data' }
              ]
            },
            {
              text: '合约交互',
              collapsed: false,
              items: [
                { text: 'Contract 基础', link: '/ethers/contracts/basics' },
                { text: '合约部署', link: '/ethers/contracts/deployment' },
                { text: '函数调用', link: '/ethers/contracts/function-calls' },
                { text: '事件监听', link: '/ethers/contracts/events' },
                { text: 'ABI 处理', link: '/ethers/contracts/abi' },
                { text: '错误处理', link: '/ethers/contracts/error-handling' },
                { text: '批量调用', link: '/ethers/contracts/batch-calls' }
              ]
            },
            {
              text: '交易处理',
              collapsed: false,
              items: [
                { text: '交易基础', link: '/ethers/transactions/basics' },
                { text: '发送交易', link: '/ethers/transactions/sending' },
                { text: 'Gas 管理', link: '/ethers/transactions/gas' },
                { text: '交易等待', link: '/ethers/transactions/waiting' },
                { text: '批量交易', link: '/ethers/transactions/batch' }
              ]
            },
            {
              text: '工具函数',
              collapsed: false,
              items: [
                { text: '单位转换', link: '/ethers/utils/units' },
                { text: '地址处理', link: '/ethers/utils/addresses' },
                { text: '哈希函数', link: '/ethers/utils/hashing' },
                { text: '编码解码', link: '/ethers/utils/encoding' },
                { text: '随机数生成', link: '/ethers/utils/random' }
              ]
            },
            {
              text: '高级特性',
              collapsed: false,
              items: [
                { text: 'ENS 域名服务', link: '/ethers/advanced/ens' },
                { text: '多签钱包', link: '/ethers/advanced/multisig' },
                { text: '代理合约', link: '/ethers/advanced/proxy' },
                { text: '元交易', link: '/ethers/advanced/meta-transactions' },
                { text: '离线签名', link: '/ethers/advanced/offline-signing' },
                { text: '自定义网络', link: '/ethers/advanced/custom-networks' }
              ]
            },
            {
              text: '实战应用',
              collapsed: false,
              items: [
                { text: 'DeFi 交互', link: '/ethers/examples/defi' },
                { text: 'NFT 操作', link: '/ethers/examples/nft' },
                { text: '代币交换', link: '/ethers/examples/token-swap' },
                { text: '钱包连接', link: '/ethers/examples/wallet-connection' },
                { text: '多链应用', link: '/ethers/examples/multi-chain' },
                { text: '实时数据', link: '/ethers/examples/real-time-data' }
              ]
            }
          ]
        }
      ],
      '/wagmi/': [
        {
          text: 'Wagmi React Hooks',
          collapsed: false,
          items: [
            {
              text: '基础概念',
              collapsed: false,
              items: [
                { text: 'Wagmi 简介', link: '/wagmi/basics/introduction' },
                { text: '安装和配置', link: '/wagmi/basics/installation' },
                { text: '核心概念', link: '/wagmi/basics/core-concepts' },
                { text: '与 Ethers.js 对比', link: '/wagmi/basics/ethers-comparison' }
              ]
            },
            {
              text: '账户管理',
              collapsed: false,
              items: [
                { text: 'useAccount', link: '/wagmi/hooks/account/use-account' },
                { text: 'useConnect', link: '/wagmi/hooks/account/use-connect' },
                { text: 'useDisconnect', link: '/wagmi/hooks/account/use-disconnect' },
                { text: 'useBalance', link: '/wagmi/hooks/account/use-balance' },
                { text: 'useEnsName', link: '/wagmi/hooks/account/use-ens-name' },
                { text: 'useEnsAddress', link: '/wagmi/hooks/account/use-ens-address' }
              ]
            },
            {
              text: '合约交互',
              collapsed: false,
              items: [
                { text: 'useContractRead', link: '/wagmi/hooks/contracts/use-contract-read' },
                { text: 'useContractReads', link: '/wagmi/hooks/contracts/use-contract-reads' },
                { text: 'useContractWrite', link: '/wagmi/hooks/contracts/use-contract-write' },
                { text: 'usePrepareContractWrite', link: '/wagmi/hooks/contracts/use-prepare-contract-write' },
                { text: 'useContractEvent', link: '/wagmi/hooks/contracts/use-contract-event' },
                { text: 'useContractInfiniteReads', link: '/wagmi/hooks/contracts/use-contract-infinite-reads' }
              ]
            },
            {
              text: '交易处理',
              collapsed: false,
              items: [
                { text: 'useSendTransaction', link: '/wagmi/hooks/transactions/use-send-transaction' },
                { text: 'usePrepareSendTransaction', link: '/wagmi/hooks/transactions/use-prepare-send-transaction' },
                { text: 'useWaitForTransaction', link: '/wagmi/hooks/transactions/use-wait-for-transaction' },
                { text: 'useTransaction', link: '/wagmi/hooks/transactions/use-transaction' }
              ]
            },
            {
              text: '网络管理',
              collapsed: false,
              items: [
                { text: 'useNetwork', link: '/wagmi/hooks/network/use-network' },
                { text: 'useSwitchNetwork', link: '/wagmi/hooks/network/use-switch-network' },
                { text: 'useChainId', link: '/wagmi/hooks/network/use-chain-id' },
                { text: 'useBlockNumber', link: '/wagmi/hooks/network/use-block-number' },
                { text: 'useFeeData', link: '/wagmi/hooks/network/use-fee-data' }
              ]
            },
            {
              text: '签名和验证',
              collapsed: false,
              items: [
                { text: 'useSignMessage', link: '/wagmi/hooks/signing/use-sign-message' },
                { text: 'useSignTypedData', link: '/wagmi/hooks/signing/use-sign-typed-data' },
                { text: 'useVerifyMessage', link: '/wagmi/hooks/signing/use-verify-message' },
                { text: 'useVerifyTypedData', link: '/wagmi/hooks/signing/use-verify-typed-data' }
              ]
            },
            {
              text: '实战应用',
              collapsed: false,
              items: [
                { text: 'DeFi 应用开发', link: '/wagmi/examples/defi-app' },
              ]
            }
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],

    // 添加编辑链接
    editLink: {
      pattern: 'https://github.com/your-username/web3-docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    // 添加最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    // 添加页脚
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024 Web3 开发中文文档'
    }
  },

  // 添加 markdown 配置以支持更好的搜索
  markdown: {
    headers: {
      level: [0, 0]
    },
    // 添加代码块的语言标识
    config: (md) => {
      // 可以在这里添加自定义的 markdown 插件
    }
  },

  // 添加 head 配置
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh-CN' }],
    ['meta', { property: 'og:title', content: 'Web3 开发中文文档 | Solidity + Ethers.js + Wagmi' }],
    ['meta', { property: 'og:site_name', content: 'Web3 开发中文文档' }],
    ['meta', { property: 'og:image', content: 'https://your-domain.com/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://your-domain.com/' }]
  ]
})