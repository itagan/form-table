import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const repositoryRoot = process.cwd()
const packageRoot = path.join(repositoryRoot, 'packages/form-table')
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
const requiredFiles = new Set([
  'LICENSE',
  'README.md',
  manifest.main.replace(/^\.\//, ''),
  manifest.module.replace(/^\.\//, ''),
  manifest.types.replace(/^\.\//, ''),
  manifest.exports['./style.css'].replace(/^\.\//, ''),
  'package.json'
])
const forbiddenPrefixes = ['src/', 'docs/', 'playground/', '__tests__/']
const expectedRuntimeExports = [
  'FormTable',
  'createFormTable',
  'default',
  'defineFormTableColumns',
  'defineFormTableType',
  'defineFormTableTypes'
]

const packResult = JSON.parse(execFileSync(
  'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: packageRoot, encoding: 'utf8' }
))[0]
const packedFiles = new Set(packResult.files.map(file => file.path))
const errors = []

const declarationRoot = path.join(packageRoot, 'dist/types')
const pendingDeclarationDirectories = [declarationRoot]
while (pendingDeclarationDirectories.length > 0) {
  const directory = pendingDeclarationDirectories.pop()
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) pendingDeclarationDirectories.push(target)
    else if (entry.name.endsWith('.d.ts')) {
      requiredFiles.add(path.relative(packageRoot, target))
    }
  }
}

for (const file of requiredFiles) {
  if (!packedFiles.has(file)) errors.push(`tarball 缺少必需文件 ${file}`)
}
for (const file of packedFiles) {
  if (forbiddenPrefixes.some(prefix => file.startsWith(prefix))) {
    errors.push(`tarball 包含不应发布的文件 ${file}`)
  }
}

const rootLicense = fs.readFileSync(path.join(repositoryRoot, 'LICENSE'), 'utf8')
const packageLicense = fs.readFileSync(path.join(packageRoot, 'LICENSE'), 'utf8')
if (rootLicense !== packageLicense) errors.push('组件包 LICENSE 与仓库根 LICENSE 不一致')

const esmEntry = await import(pathToFileURL(path.join(packageRoot, manifest.module)).href)
const require = createRequire(import.meta.url)
const cjsEntry = require(path.join(packageRoot, manifest.main))

for (const [format, entry] of [['ESM', esmEntry], ['CommonJS', cjsEntry]]) {
  const runtimeExports = Object.keys(entry).sort()
  if (runtimeExports.join(',') !== expectedRuntimeExports.join(',')) {
    errors.push(`${format} 运行时导出不一致：${runtimeExports.join(',')}`)
  }
  if (entry.default !== entry.FormTable) errors.push(`${format} 默认导出与具名 FormTable 不一致`)
  if (entry.createFormTable() !== entry.FormTable) errors.push(`${format} createFormTable 未返回同一运行时组件`)
  const fieldTypes = { custom: { is: 'custom-field' } }
  const fieldType = { is: 'custom-field' }
  if (entry.defineFormTableType()(fieldType) !== fieldType) {
    errors.push(`${format} defineFormTableType 未保留定义运行时引用`)
  }
  if (entry.defineFormTableTypes()(fieldTypes) !== fieldTypes) {
    errors.push(`${format} defineFormTableTypes 未保留注册表运行时引用`)
  }
}

const publicTypes = fs.readFileSync(path.join(packageRoot, manifest.types), 'utf8')
if (!publicTypes.includes('FormTableComponent<TableRow>')) {
  errors.push('公开声明未为默认组件保留 FormTableComponent<TableRow> 类型')
}
if (publicTypes.includes('FormTablePlugin')) errors.push('公开声明仍包含已移除的 FormTablePlugin')

const stylePath = path.join(packageRoot, manifest.exports['./style.css'])
const styleSource = fs.readFileSync(stylePath, 'utf8')
if (!styleSource.includes('.form-table-field-layout') || !styleSource.includes('flex-wrap:wrap')) {
  errors.push('style.css 缺少稳定的字段换行布局规则')
}
if (!styleSource.includes('.form-table-container .form-table-form-item') || !styleSource.includes('margin-bottom:0')) {
  errors.push('style.css 缺少稳定的 FormItem 间距规则')
}
if (/data-v-[\da-f]+/.test(styleSource)) {
  errors.push('style.css 仍包含 Vue scoped 编译选择器')
}
if (/\.el-[\w-]+/.test(styleSource)) {
  errors.push('style.css 不应依赖 Element UI 内部类名')
}

for (const [format, entryPath] of [
  ['ESM', manifest.module],
  ['CommonJS', manifest.main]
]) {
  const entrySource = fs.readFileSync(path.join(packageRoot, entryPath), 'utf8')
  if (entrySource.includes('style.css')) {
    errors.push(`${format} 入口不应隐式加载 style.css`)
  }
  if (/createElement\(["']style["']\)/.test(entrySource)) {
    errors.push(`${format} 入口不应在运行时注入 style 标签`)
  }
}

if (errors.length > 0) {
  console.error(`npm 包检查失败（${errors.length} 项）：`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `npm 包检查通过：${packResult.name}@${packResult.version}，`
  + `${packResult.entryCount} 个文件，${expectedRuntimeExports.length} 个运行时导出。`
)
