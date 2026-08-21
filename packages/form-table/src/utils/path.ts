import type { FormTableRecord, FormTableValue } from '../types/base'

/**
 * 判断值是否可以继续按对象路径读取。
 */
function isObjectLike(value: unknown): value is FormTableRecord {
  return value !== null && typeof value === 'object'
}

/**
 * 将 `a.b[0].c` 归一化为路径片段数组。
 */
const NORMALIZED_PATH_CACHE_LIMIT = 512
const normalizedPathCache = new Map<string, readonly string[]>()
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])
const ARRAY_INDEX_SEGMENT = /^(0|[1-9]\d*)$/

/** 拒绝可能改变或穿透对象原型链的字段路径。 */
function assertSafePath(path: string, segments: readonly string[]) {
  const unsafeSegment = segments.find(segment => UNSAFE_PATH_SEGMENTS.has(segment))
  if (unsafeSegment) {
    throw new TypeError(`Unsafe FormTable field path "${path}": segment "${unsafeSegment}" is not allowed`)
  }
}

export function normalizePath(path: string): readonly string[] {
  const cached = normalizedPathCache.get(path)
  if (cached) return cached

  const segments = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  assertSafePath(path, segments)

  if (normalizedPathCache.size >= NORMALIZED_PATH_CACHE_LIMIT) {
    const oldestPath = normalizedPathCache.keys().next().value
    if (oldestPath !== undefined) normalizedPathCache.delete(oldestPath)
  }
  normalizedPathCache.set(path, segments)
  return segments
}

/** 区分路径不存在与路径明确存在但值为 undefined。 */
export function resolveValueByPath(
  source: Readonly<FormTableRecord>,
  path: string
): { exists: boolean, value: FormTableValue | undefined } {
  const segments = normalizePath(path)
  let current: FormTableValue = source

  for (const segment of segments) {
    if (
      !isObjectLike(current)
      || !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return { exists: false, value: undefined }
    }
    current = current[segment]
  }

  return { exists: segments.length > 0, value: current }
}

/**
 * 按路径读取对象值。
 *
 * 支持点路径和数组下标写法，如 `profile.city`、`items[0].name`。
 */
export function getValueByPath(source: Readonly<FormTableRecord>, path: string): FormTableValue | undefined {
  return resolveValueByPath(source, path).value
}

/**
 * 按路径写入对象值，并返回新的根对象。
 *
 * 写入过程中会浅拷贝路径上的对象/数组，避免直接修改原始行数据。
 */
export function setValueByPath<T extends FormTableRecord>(
  source: T,
  path: string,
  value: FormTableValue
): T {
  const segments = normalizePath(path)
  if (segments.length === 0) {
    return source
  }

  const nextSource: FormTableRecord = Array.isArray(source) ? [...source] : { ...source }
  let current: FormTableRecord = nextSource

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    if (isLast) {
      current[segment] = value
      return
    }

    const nextValue = Object.prototype.hasOwnProperty.call(current, segment)
      ? current[segment]
      : undefined
    if (Array.isArray(nextValue)) {
      current[segment] = [...nextValue]
    } else if (isObjectLike(nextValue)) {
      current[segment] = { ...nextValue }
    } else {
      current[segment] = ARRAY_INDEX_SEGMENT.test(segments[index + 1]) ? [] : {}
    }

    current = current[segment]
  })

  return nextSource as T
}
