import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repositoryRoot = process.cwd()
const playgroundDist = path.join(repositoryRoot, 'docs/.vitepress/dist/playground')
const playgroundEntry = path.join(playgroundDist, 'index.html')
const examples = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'playground/examples.json'), 'utf8')
)

if (!fs.existsSync(playgroundEntry)) {
  console.error('Playground 同站构建不存在，请先运行 pnpm build:playground:site。')
  process.exit(1)
}

for (const example of examples) {
  const routeDirectory = path.join(playgroundDist, example.path.replace(/^\/+/, ''))
  fs.mkdirSync(routeDirectory, { recursive: true })
  fs.copyFileSync(playgroundEntry, path.join(routeDirectory, 'index.html'))
}

console.log(`Playground 静态路由已生成：${examples.length} 个直达入口。`)
