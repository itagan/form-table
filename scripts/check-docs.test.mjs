import assert from 'node:assert/strict'
import {
  collectMarkdownHeadingIds,
  markdownFileToRoute,
  slugifyHeading,
  validateSidebarRoutes
} from './docs-check-utils.mjs'

assert.equal(slugifyHeading('`updateRows`：原子更新多行'), 'updaterows-原子更新多行')
assert.equal(slugifyHeading('1. 第一步'), '_1-第一步')

const headings = collectMarkdownHeadingIds(`
# 标题
## 重复标题
## 重复标题
\`\`\`md
## 代码块不是标题
\`\`\`
## [复合字段](./target.md) 与 \`model\`
`)
assert.deepEqual([...headings], [
  '标题',
  '重复标题',
  '重复标题-1',
  '复合字段-与-model'
])
assert.equal(headings.has('代码块不是标题'), false)
assert.equal(headings.has('不存在'), false)

assert.equal(markdownFileToRoute('features/index.md'), '/features')
assert.equal(markdownFileToRoute('index.md'), '/')
assert.equal(markdownFileToRoute('guide/quick-start.md'), '/guide/quick-start')
assert.deepEqual(
  validateSidebarRoutes(['/guide/start', '/features/'], ['/', '/guide/start', '/features']),
  []
)
assert.deepEqual(
  validateSidebarRoutes(['/guide/start', '/guide/start', '/missing'], ['/', '/guide/start', '/features']),
  [
    '侧边栏链接重复 /guide/start',
    '侧边栏链接不存在 /missing',
    '正式文档未加入侧边栏 /features'
  ]
)

console.log('文档检查逻辑测试通过。')
