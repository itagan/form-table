import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FormTable',
  description: 'Vue 2.7 + Element UI editable form table component.',
  lang: 'zh-CN',
  cleanUrls: true,
  // 本地 Playground 与文档开发服务不属于静态构建产物，构建阶段无法解析这些地址。
  ignoreDeadLinks: [/^http:\/\/localhost:517[34](?:\/|$)/],
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
          { text: '完整配置指南', link: '/guide/configuration-guide' },
          { text: '行、列与延迟提交', link: '/guide/row-column-operations' }
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'API 总览', link: '/api/configuration' },
          { text: 'FormTable Props', link: '/api/form-table' },
          { text: 'Column / Row / Item', link: '/api/columns' },
          { text: 'Component 配置', link: '/api/component' },
          { text: 'Slot 与上下文', link: '/api/contexts' },
          { text: '事件与 Ref API', link: '/api/events-and-ref' },
          { text: '类型边界', link: '/api/types' }
        ]
      },
      {
        text: '功能专题',
        items: [
          { text: '专题索引', link: '/features/' },
          { text: '原生 title 提示', link: '/features/native-title' },
          { text: '自定义表头', link: '/features/custom-header' },
          { text: 'cellSlot 列级单元格', link: '/features/cell-slot' },
          { text: '自定义字段组件', link: '/features/custom-component' },
          { text: '远程 Schema', link: '/features/remote-schema' }
        ]
      },
      {
        text: '示例',
        items: [
          { text: '示例索引', link: '/examples/' },
          { text: '企业复杂组件接入', link: '/examples/enterprise-components' },
          { text: '单元格合并', link: '/examples/cell-merge' },
          { text: '多需求费用明细', link: '/examples/heterogeneous-demands' },
          { text: '多日议程编排', link: '/examples/itinerary-simple' }
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
