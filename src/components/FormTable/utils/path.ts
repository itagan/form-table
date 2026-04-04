import type { TableRow } from '../types'

function isObjectLike(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object'
}

function normalizePath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
}

export function getValueByPath(source: Record<string, any>, path: string) {
  const segments = normalizePath(path)
  let current: any = source

  for (const segment of segments) {
    if (!isObjectLike(current) && !Array.isArray(current)) {
      return undefined
    }

    current = current[segment]
    if (current === undefined) {
      return undefined
    }
  }

  return current
}

export function setValueByPath<T extends Record<string, any>>(
  source: T,
  path: string,
  value: any
): T {
  const segments = normalizePath(path)
  if (segments.length === 0) {
    return source
  }

  const nextSource: Record<string, any> = Array.isArray(source) ? [...source] : { ...source }
  let current: Record<string, any> = nextSource

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    if (isLast) {
      current[segment] = value
      return
    }

    const nextValue = current[segment]
    if (Array.isArray(nextValue)) {
      current[segment] = [...nextValue]
    } else if (isObjectLike(nextValue)) {
      current[segment] = { ...nextValue }
    } else {
      current[segment] = {}
    }

    current = current[segment]
  })

  return nextSource as T
}

export function applyRowPatch(row: TableRow, patch: Partial<TableRow>): TableRow {
  return Object.keys(patch).reduce((nextRow, key) => {
    return setValueByPath(nextRow, key, patch[key])
  }, row)
}
