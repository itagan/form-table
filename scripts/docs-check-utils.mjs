const controlCharacters = /[\u0000-\u001f]/g
const specialCharacters = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const combiningCharacters = /[\u0300-\u036f]/g

export function slugifyHeading(title) {
  return title
    .normalize('NFKD')
    .replace(combiningCharacters, '')
    .replace(controlCharacters, '')
    .replace(specialCharacters, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

function headingText(markdown) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, '$1')
}

export function collectMarkdownHeadingIds(source) {
  const headingIds = new Set()
  const slugCounts = new Map()
  let fence = null

  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1]
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null
      continue
    }
    if (fence) continue

    const headingMatch = line.match(/^#{1,6}\s+(.+?)\s*$/)
    if (!headingMatch) continue

    const title = headingText(headingMatch[1].replace(/\s+#+\s*$/, ''))
    const baseSlug = slugifyHeading(title)
    const duplicateIndex = slugCounts.get(baseSlug) || 0
    const slug = duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`
    slugCounts.set(baseSlug, duplicateIndex + 1)
    headingIds.add(slug)
  }

  return headingIds
}

export function decodeAnchor(rawAnchor) {
  try {
    return decodeURIComponent(rawAnchor)
  } catch {
    return rawAnchor
  }
}

export function normalizeDocRoute(route) {
  const withoutQuery = route.split(/[?#]/)[0]
  const withLeadingSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`
  const normalized = withLeadingSlash.replace(/\/+$/, '')
  return normalized || '/'
}

export function markdownFileToRoute(relativePath) {
  const route = relativePath.replace(/\\/g, '/').replace(/\.md$/, '')
  if (route === 'index') return '/'
  return normalizeDocRoute(route.endsWith('/index') ? route.slice(0, -6) : route)
}

export function validateSidebarRoutes(sidebarRoutes, documentRoutes) {
  const errors = []
  const seen = new Set()
  const documents = new Set(documentRoutes.map(normalizeDocRoute))

  for (const rawRoute of sidebarRoutes) {
    const route = normalizeDocRoute(rawRoute)
    if (seen.has(route)) errors.push(`侧边栏链接重复 ${route}`)
    seen.add(route)
    if (!documents.has(route)) errors.push(`侧边栏链接不存在 ${route}`)
  }

  for (const route of documents) {
    if (route !== '/' && !seen.has(route)) errors.push(`正式文档未加入侧边栏 ${route}`)
  }

  return errors
}
