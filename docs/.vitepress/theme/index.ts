import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // 可以在这里添加全局组件或插件
    
    // 添加搜索快捷键支持
    if (typeof window !== 'undefined') {
      // 添加 Ctrl+K 或 Cmd+K 快捷键打开搜索
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          const searchButton = document.querySelector('.DocSearch-Button') as HTMLElement
          if (searchButton) {
            searchButton.click()
          }
        }
      })
    }
  }
} satisfies Theme