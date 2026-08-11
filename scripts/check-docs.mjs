import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repositoryRoot = process.cwd()
const ignoredDirectories = new Set(['node_modules', 'dist', '.vitepress'])
const markdownFiles = []
const playgroundExamples = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'playground/examples.json'), 'utf8')
)
const playgroundRoutes = new Set(['/', ...playgroundExamples.map(example => example.path)])

function collectMarkdownFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue

    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) collectMarkdownFiles(target)
    else if (entry.name.endsWith('.md')) markdownFiles.push(target)
  }
}

for (const entry of fs.readdirSync(repositoryRoot, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(path.join(repositoryRoot, entry.name))
}
collectMarkdownFiles(path.join(repositoryRoot, 'docs'))
markdownFiles.push(path.join(repositoryRoot, 'packages/form-table/README.md'))

const uniqueMarkdownFiles = [...new Set(markdownFiles)]
const errors = []
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g
const deprecatedReferences = [
  'guide/row-column-operations',
  'docs/README.md'
]

for (const file of uniqueMarkdownFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const relativeFile = path.relative(repositoryRoot, file)

  for (const reference of deprecatedReferences) {
    if (source.includes(reference)) {
      errors.push(`${relativeFile}: 包含已废弃引用 ${reference}`)
    }
  }

  for (const match of source.matchAll(markdownLinkPattern)) {
    const rawUrl = match[1].trim().replace(/^<|>$/g, '')

    if (rawUrl.startsWith('http://localhost:5173')) {
      try {
        const demoUrl = new URL(rawUrl)
        if (demoUrl.origin !== 'http://localhost:5173' || !demoUrl.pathname.startsWith('/')) {
          errors.push(`${relativeFile}: Demo 地址格式无效 ${rawUrl}`)
        } else if (!playgroundRoutes.has(demoUrl.pathname.replace(/\/$/, '') || '/')) {
          errors.push(`${relativeFile}: Demo 路由未在 playground/examples.json 中声明 ${rawUrl}`)
        }
      } catch {
        errors.push(`${relativeFile}: Demo 地址格式无效 ${rawUrl}`)
      }
      continue
    }

    if (/^(?:https?:|mailto:|#)/.test(rawUrl)) continue

    const urlWithoutAnchor = rawUrl.split('#')[0].split('?')[0]
    if (!urlWithoutAnchor) continue

    let target = path.resolve(path.dirname(file), decodeURIComponent(urlWithoutAnchor))
    if (urlWithoutAnchor.endsWith('/')) target = path.join(target, 'index.md')
    else if (!path.extname(target)) target += '.md'

    if (!fs.existsSync(target)) {
      errors.push(`${relativeFile}: 相对链接不存在 ${rawUrl}`)
    }
  }
}

const exampleIndexSource = fs.readFileSync(path.join(repositoryRoot, 'docs/examples/index.md'), 'utf8')
const playgroundRouterSource = fs.readFileSync(
  path.join(repositoryRoot, 'playground/src/router/index.ts'),
  'utf8'
)
const exampleNames = new Set()
for (const example of playgroundExamples) {
  if (!exampleIndexSource.includes(`http://localhost:5173${example.path}`)) {
    errors.push(`docs/examples/index.md: 缺少示例清单路由 ${example.path}`)
  }
  if (exampleNames.has(example.name)) {
    errors.push(`playground/examples.json: 示例名称重复 ${example.name}`)
  }
  exampleNames.add(example.name)
  if (!playgroundRouterSource.includes(`${example.view}: () =>`)) {
    errors.push(`playground/examples.json: 页面加载器未在 Router 中声明 ${example.view}`)
  }
}

const componentConfigSource = fs.readFileSync(
  path.join(repositoryRoot, 'packages/form-table/src/configs/defaultComponentConfigs.ts'),
  'utf8'
)
const componentTypeBlock = componentConfigSource.match(/componentTypeMap[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1] || ''
const sourceTypes = [...componentTypeBlock.matchAll(/^\s{2}([a-z]+):/gm)].map(match => match[1]).sort()

const componentApiSource = fs.readFileSync(path.join(repositoryRoot, 'docs/api/component.md'), 'utf8')
const mappingSection = componentApiSource.match(/## 内置类型映射([\s\S]*?)(?:\n## |$)/)?.[1] || ''
const documentedTypes = [...mappingSection.matchAll(/^\| `([a-z]+)` \|/gm)]
  .map(match => match[1])
  .filter(type => type !== 'type')
  .sort()

if (sourceTypes.join(',') !== documentedTypes.join(',')) {
  errors.push(`docs/api/component.md: 内置类型映射与源码不一致；源码=${sourceTypes.join(',')}，文档=${documentedTypes.join(',')}`)
}

if (errors.length > 0) {
  console.error(`文档检查失败（${errors.length} 项）：`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`文档检查通过：${uniqueMarkdownFiles.length} 个 Markdown 文件，内置类型 ${sourceTypes.length} 项。`)
