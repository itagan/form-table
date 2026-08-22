import { defineConfig } from 'vitepress'

const localPlaygroundUrl = 'http://localhost:5173'
const playgroundSiteUrl = (process.env.VITE_PLAYGROUND_SITE_URL || localPlaygroundUrl).replace(/\/+$/, '')

export default defineConfig({
  title: 'FormTable',
  description: 'Vue 2.7 + Element UI editable form table component.',
  lang: 'zh-CN',
  cleanUrls: true,
  // Playground 在 VitePress 完成后写入同一 dist，交由 site:check 校验全部实际路由。
  ignoreDeadLinks: [
    /^http:\/\/localhost:517[34](?:\/|$)/,
    /^\/playground(?:\/|$)/
  ],
  markdown: {
    config(md) {
      const defaultLinkOpen = md.renderer.rules.link_open

      md.renderer.rules.link_open = (tokens, index, options, env, self) => {
        const hrefIndex = tokens[index].attrIndex('href')
        if (hrefIndex >= 0) {
          const href = tokens[index].attrs?.[hrefIndex]?.[1]
          if (href?.startsWith(localPlaygroundUrl)) {
            tokens[index].attrSet('href', `${playgroundSiteUrl}${href.slice(localPlaygroundUrl.length)}`)
          }
        }

        return defaultLinkOpen
          ? defaultLinkOpen(tokens, index, options, env, self)
          : self.renderToken(tokens, index, options)
      }
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '快速开始', link: '/guide/quick-start' },
      { text: 'API', link: '/api/configuration' },
      { text: '示例', link: '/examples/' },
      { text: 'Playground', link: `${playgroundSiteUrl}/` },
      { text: '源码', link: 'https://gitee.com/itagan/form-table' }
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '完整配置指南', link: '/guide/configuration-guide' },
          { text: '业务配置最佳实践', link: '/guide/business-configuration-best-practices' }
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
          {
            text: '基础能力',
            collapsed: false,
            items: [
              { text: '数据更新与受控回写', link: '/features/data-updates' },
              { text: '复合字段映射', link: '/features/composite-binding' },
              { text: '校验、清理与重置', link: '/features/validation-reset' },
              { text: '动态显隐与配置更新', link: '/features/dynamic-configuration' },
              { text: '稳定身份与异步安全', link: '/features/stable-identity' },
              { text: 'Element UI 能力边界', link: '/features/element-ui-boundaries' },
              { text: 'Hint 提示体系', link: '/features/hint' }
            ]
          },
          {
            text: '渲染扩展',
            collapsed: false,
            items: [
              { text: 'Element 功能列透传', link: '/features/native-columns' },
              { text: '自定义表头', link: '/features/custom-header' },
              { text: 'cellSlot 列级单元格', link: '/features/cell-slot' },
              { text: '自定义字段组件', link: '/features/custom-component' }
            ]
          },
          {
            text: '业务组合',
            collapsed: false,
            items: [
              { text: '远程 Schema', link: '/features/remote-schema' },
              { text: '常见操作列与行增删', link: '/features/common-row-actions' },
              { text: '行列操作与异步提交', link: '/features/row-column-operations' }
            ]
          },
          {
            text: '性能',
            collapsed: false,
            items: [
              { text: '性能与大数据量', link: '/features/performance' },
              { text: '性能优化建议', link: '/features/performance-optimization' }
            ]
          }
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
        text: '维护者',
        items: [
          { text: 'npm 包发布准备', link: '/migration/npm-package' }
        ]
      }
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
