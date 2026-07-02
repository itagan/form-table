import type { TableRow } from '../types'

/**
 * 判断值是否可以继续按对象路径读取。
 */
function isObjectLike(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object'
}

/**
 * 将 `a.b[0].c` 归一化为路径片段数组。
 */
function normalizePath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
}

/**
 * 按路径读取对象值。
 *
 * 支持点路径和数组下标写法，如 `profile.city`、`items[0].name`。
 */
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

/**
 * 按路径写入对象值，并返回新的根对象。
 *
 * 写入过程中会浅拷贝路径上的对象/数组，避免直接修改原始行数据。
 */
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

/**
 * 将一组 patch 应用到行数据。
 *
 * patch 的 key 同样支持路径写法，适合字段联动返回嵌套字段更新。
 */
export function applyRowPatch(row: TableRow, patch: Partial<TableRow>): TableRow {
  return Object.keys(patch).reduce((nextRow, key) => {
    return setValueByPath(nextRow, key, patch[key])
  }, row)
}
