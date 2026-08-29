import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repositoryRoot = process.cwd()
const packageManifestPath = path.join(repositoryRoot, 'packages/form-table/package.json')
const changelogPath = path.join(repositoryRoot, 'CHANGELOG.md')
const manifest = JSON.parse(fs.readFileSync(packageManifestPath, 'utf8'))
const changelog = fs.readFileSync(changelogPath, 'utf8')
const errors = []

const parseVersion = version => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version)
  if (!match) return null
  return {
    raw: version,
    core: match.slice(1, 4).map(Number),
    prerelease: match[4]?.split('.') || []
  }
}

const compareVersions = (left, right) => {
  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] !== right.core[index]) return left.core[index] - right.core[index]
  }
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length
  }
  const length = Math.max(left.prerelease.length, right.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = left.prerelease[index]
    const rightPart = right.prerelease[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1
    if (leftPart === rightPart) continue
    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : null
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : null
    if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber
    if (leftNumber !== null) return -1
    if (rightNumber !== null) return 1
    return leftPart.localeCompare(rightPart)
  }
  return 0
}

const isValidDate = date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
}

const packageVersion = parseVersion(manifest.version)
if (!packageVersion) errors.push(`package.json version 不是支持的 SemVer：${manifest.version}`)

const changelogEntries = Array.from(
  changelog.matchAll(/^## (\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?) - (\d{4}-\d{2}-\d{2})$/gm),
  match => ({ version: match[1], date: match[2] })
)

if (changelogEntries.length === 0) {
  errors.push('CHANGELOG.md 缺少“## 版本号 - YYYY-MM-DD”格式的版本条目')
} else {
  if (changelogEntries[0].version !== manifest.version) {
    errors.push(
      `CHANGELOG.md 最新版本 ${changelogEntries[0].version} 与 package.json ${manifest.version} 不一致`
    )
  }

  const seenVersions = new Set()
  for (const entry of changelogEntries) {
    if (seenVersions.has(entry.version)) errors.push(`CHANGELOG.md 存在重复版本 ${entry.version}`)
    seenVersions.add(entry.version)
    if (!isValidDate(entry.date)) errors.push(`CHANGELOG.md ${entry.version} 的日期无效：${entry.date}`)
  }

  for (let index = 1; index < changelogEntries.length; index += 1) {
    const previous = parseVersion(changelogEntries[index - 1].version)
    const current = parseVersion(changelogEntries[index].version)
    if (previous && current && compareVersions(previous, current) <= 0) {
      errors.push(
        `CHANGELOG.md 版本顺序错误：${previous.raw} 应高于 ${current.raw}`
      )
    }
  }
}

const releaseTags = execFileSync('git', ['tag', '--list', 'v*'], {
  cwd: repositoryRoot,
  encoding: 'utf8'
}).trim().split('\n').filter(Boolean).map(tag => ({
  tag,
  version: parseVersion(tag.slice(1))
})).filter(entry => entry.version)

const changelogByVersion = new Map(changelogEntries.map(entry => [entry.version, entry]))
for (const { tag, version } of releaseTags) {
  if (!changelogByVersion.has(version.raw)) errors.push(`${tag} 在 CHANGELOG.md 中没有对应版本条目`)
}

if (packageVersion && releaseTags.length > 0) {
  const latestTag = releaseTags.reduce((latest, entry) => (
    compareVersions(entry.version, latest.version) > 0 ? entry : latest
  ))
  if (compareVersions(latestTag.version, packageVersion) > 0) {
    errors.push(`最新 Git tag ${latestTag.tag} 高于 package.json ${manifest.version}`)
  }
}

const currentTag = releaseTags.find(entry => entry.version.raw === manifest.version)
if (currentTag) {
  const taggedManifest = JSON.parse(execFileSync(
    'git',
    ['show', `${currentTag.tag}:packages/form-table/package.json`],
    { cwd: repositoryRoot, encoding: 'utf8' }
  ))
  if (taggedManifest.version !== manifest.version) {
    errors.push(`${currentTag.tag} 中的包版本是 ${taggedManifest.version}，预期为 ${manifest.version}`)
  }

  const tagDate = execFileSync(
    'git',
    ['for-each-ref', `refs/tags/${currentTag.tag}`, '--format=%(creatordate:short)'],
    { cwd: repositoryRoot, encoding: 'utf8' }
  ).trim()
  const changelogEntry = changelogByVersion.get(manifest.version)
  if (changelogEntry && changelogEntry.date !== tagDate) {
    errors.push(
      `${currentTag.tag} 日期 ${tagDate} 与 CHANGELOG.md 日期 ${changelogEntry.date} 不一致`
    )
  }
}

if (errors.length > 0) {
  console.error(`发布元数据检查失败（${errors.length} 项）：`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `发布元数据检查通过：${manifest.name}@${manifest.version}，`
  + `${changelogEntries.length} 条 Changelog，${releaseTags.length} 个版本 tag。`
)
