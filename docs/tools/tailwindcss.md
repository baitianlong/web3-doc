# Tailwind CSS 实用指南

## 简介

Tailwind CSS 是一个功能类优先的 CSS 框架，它直接在 HTML 中提供原子级的 CSS 类，使开发者能够快速构建现代网站而无需编写自定义 CSS。

在 Web3 项目开发中，Tailwind CSS 可以帮助我们快速构建美观且响应式的 DApp 界面，同时保持代码的可维护性。

## 安装与配置

### 1. 基本安装

```bash
# 使用 npm
npm install -D tailwindcss postcss autoprefixer

# 使用 yarn
yarn add -D tailwindcss postcss autoprefixer

# 使用 pnpm
pnpm add -D tailwindcss postcss autoprefixer


### 2. 初始化配置文件
```bash
npx tailwindcss init -p
```

### 3. 配置 Tailwind 以扫描你的文件
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. 添加 Tailwind 的指令到你的 CSS
```css
/* ./src/index.css */
