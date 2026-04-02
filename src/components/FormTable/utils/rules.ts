import type { ValidationRule } from '../types'

export function normalizeWildcardPropPath(propPath: string): string {
  return propPath
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? '*' : segment))
    .join('.')
}

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
