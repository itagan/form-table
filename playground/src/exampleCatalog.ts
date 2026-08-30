import examples from '../examples.json'

export const categoryDefinitions = [
  { id: 'basics', title: '基础使用', description: '常规字段编辑、校验和 Element Table 接入。' },
  { id: 'rendering', title: '渲染扩展', description: '组件、Slot、cellSlot、动态配置和 Hint。' },
  { id: 'advanced', title: '高级扩展', description: '稳定业务协议、复合字段、远程 Schema 和企业组件。' },
  { id: 'business', title: '业务场景', description: '行操作、单元格合并和完整业务数据流程。' },
  { id: 'engineering', title: '工程验证', description: '真实浏览器中的性能和容量边界。' }
] as const

export const exampleGroups = categoryDefinitions
  .map(category => ({
    ...category,
    examples: examples.filter(example => example.category === category.id)
  }))
  .filter(category => category.examples.length > 0)

export const levelLabels: Record<string, string> = {
  beginner: '基础',
  intermediate: '进阶',
  advanced: '高级'
}

export const findExampleByPath = (path: string) => (
  examples.find(example => example.path === path)
)
