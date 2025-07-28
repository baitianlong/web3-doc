// 搜索增强功能
export function enhanceSearch() {
  if (typeof window === 'undefined') return

  // 添加搜索快捷键提示
  let hintTimeout: NodeJS.Timeout
  
  function showSearchHint() {
    const hint = document.createElement('div')
    hint.className = 'search-shortcut-hint'
    hint.innerHTML = '按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 搜索'
    document.body.appendChild(hint)
    
    setTimeout(() => hint.classList.add('show'), 100)
    
    hintTimeout = setTimeout(() => {
      hint.classList.remove('show')
      setTimeout(() => document.body.removeChild(hint), 300)
    }, 3000)
  }

  // 检测用户是否是第一次访问
  if (!localStorage.getItem('search-hint-shown')) {
    setTimeout(showSearchHint, 2000)
    localStorage.setItem('search-hint-shown', 'true')
  }

  // 增强搜索结果显示
  function enhanceSearchResults() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const searchResults = document.querySelectorAll('.DocSearch-Hit')
          searchResults.forEach((result) => {
            const title = result.querySelector('.DocSearch-Hit-title')
            if (title && !result.querySelector('.api-tag')) {
              const titleText = title.textContent || ''
              
              // 添加 API 类型标签
              if (titleText.startsWith('use')) {
                const tag = document.createElement('span')
                tag.className = 'api-tag hook'
                tag.textContent = 'Hook'
                title.appendChild(tag)
              } else if (titleText.includes('()') || titleText.includes('function')) {
                const tag = document.createElement('span')
                tag.className = 'api-tag function'
                tag.textContent = 'Function'
                title.appendChild(tag)
              } else if (titleText.includes('interface') || titleText.includes('type')) {
                const tag = document.createElement('span')
                tag.className = 'api-tag type'
                tag.textContent = 'Type'
                title.appendChild(tag)
              }
            }
          })
        }
      })
    })

    // 监听搜索模态框的变化
    const searchModal = document.querySelector('.DocSearch-Modal')
    if (searchModal) {
      observer.observe(searchModal, { childList: true, subtree: true })
    }
  }

  // 监听搜索模态框的打开
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('.DocSearch-Button')) {
      setTimeout(enhanceSearchResults, 100)
    }
  })

  // 添加搜索历史功能
  function addSearchHistory() {
    const searchHistory = JSON.parse(localStorage.getItem('search-history') || '[]')
    
    // 监听搜索输入
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      if (target.classList.contains('DocSearch-Input')) {
        const query = target.value.trim()
        if (query.length > 2) {
          // 防抖保存搜索历史
          clearTimeout(hintTimeout)
          hintTimeout = setTimeout(() => {
            if (!searchHistory.includes(query)) {
              searchHistory.unshift(query)
              if (searchHistory.length > 10) {
                searchHistory.pop()
              }
              localStorage.setItem('search-history', JSON.stringify(searchHistory))
            }
          }, 1000)
        }
      }
    })
  }

  addSearchHistory()

  // 添加搜索分析
  function trackSearch() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const searchHit = target.closest('.DocSearch-Hit')
      if (searchHit) {
        const title = searchHit.querySelector('.DocSearch-Hit-title')?.textContent
        const path = searchHit.querySelector('.DocSearch-Hit-path')?.textContent
        
        // 这里可以发送分析数据到您的分析服务
        console.log('Search result clicked:', { title, path })
      }
    })
  }

  trackSearch()
}

// 搜索结果优化
export function optimizeSearchResults() {
  // 自定义搜索权重
  const searchWeights = {
    'useAccount': 10,
    'useConnect': 10,
    'useContractRead': 9,
    'useContractWrite': 9,
    'useSendTransaction': 8,
    'useBalance': 8,
    'Wagmi': 7,
    'Ethers.js': 7,
    'Solidity': 6,
    'hook': 5,
    'API': 5
  }

  // 这个函数可以用来自定义搜索结果的排序
  return searchWeights
}