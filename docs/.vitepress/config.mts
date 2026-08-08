import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FormTable',
  description: 'Vue 2.7 + Element UI editable form table component.',
  lang: 'zh-CN',
  cleanUrls: true,
  // Playground 是独立的本地开发服务，VitePress 构建阶段无法解析其客户端路由。
  ignoreDeadLinks: [/^http:\/\/localhost:5173(?:\/|$)/],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '快速开始', link: '/guide/quick-start' },
      { text: 'API', link: '/api/configuration' },
      { text: '示例', link: '/examples/' },
      { text: 'Playground', link: 'http://localhost:5173/' },
      { text: '发布', link: '/migration/npm-package' }
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '行、列与延迟提交', link: '/guide/row-column-operations' }
        ]
      },
      {
        text: 'API',
        items: [
          { text: '配置 API', link: '/api/configuration' },
          { text: '事件与 Ref API', link: '/api/events-and-ref' },
          { text: '类型边界', link: '/api/types' }
        ]
      },
      {
        text: '示例',
        items: [
          { text: '示例索引', link: '/examples/' },
          { text: '企业复杂组件接入', link: '/examples/enterprise-components' },
          { text: '单元格合并', link: '/examples/cell-merge' }
        ]
      },
      {
        text: '迁移与发布',
        items: [
          { text: 'npm 包发布准备', link: '/migration/npm-package' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://gitee.com/itagan/form-table' }
    ],
    search: {
      provider: 'local'
    },
    outline: {
      label: '本页目录',
      level: [2, 3]
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    lastUpdatedText: '最后更新'
  },
  lastUpdated: true
})
