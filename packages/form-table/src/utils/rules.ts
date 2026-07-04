import type { ValidationRule } from '../types'

/**
 * 将精确行号路径归一化为通配路径。
 *
 * 例如 `tableData.3.name` 会转换为 `tableData.*.name`，
 * 用于动态行场景下复用同一套校验规则。
 */
export function normalizeWildcardPropPath(propPath: string): string {
  return propPath
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? '*' : segment))
    .join('.')
}

/**
 * 解析某个字段最终生效的校验规则。
 *
 * 通配规则先于精确规则合并，精确规则可以追加更具体的约束。
 */
export function resolveRulesForProp(
  rulesMap: Record<string, ValidationRule[]> | undefined,
  propPath: string
): ValidationRule[] {
  if (!rulesMap) {
    return []
  }

  const wildcardPath = normalizeWildcardPropPath(propPath)
  const wildcardRules = wildcardPath !== propPath ? rulesMap[wildcardPath] || [] : []
  const exactRules = rulesMap[propPath] || []

  return [...wildcardRules, ...exactRules]
}
