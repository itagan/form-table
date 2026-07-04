import { describe, expect, it } from 'vitest'
import { normalizeWildcardPropPath, resolveRulesForProp } from '../rules'

describe('rule utils', () => {
  it('normalizes numeric path segments to wildcards', () => {
    expect(normalizeWildcardPropPath('tableData.3.name')).toBe('tableData.*.name')
    expect(normalizeWildcardPropPath('tableData.12.profile.city')).toBe('tableData.*.profile.city')
    expect(normalizeWildcardPropPath('formData.owner')).toBe('formData.owner')
  })

  it('resolves wildcard rules before exact rules', () => {
    const requiredRule = { required: true, message: 'required' }
    const exactRule = { min: 2, message: 'too short' }

    expect(resolveRulesForProp({
      'tableData.*.name': [requiredRule],
      'tableData.0.name': [exactRule]
    }, 'tableData.0.name')).toEqual([requiredRule, exactRule])
  })

  it('returns exact rules when no wildcard path is applicable', () => {
    const rule = { required: true }

    expect(resolveRulesForProp({
      'formData.owner': [rule]
    }, 'formData.owner')).toEqual([rule])
  })

  it('returns an empty array when rules are missing', () => {
    expect(resolveRulesForProp(undefined, 'tableData.0.name')).toEqual([])
    expect(resolveRulesForProp({}, 'tableData.0.name')).toEqual([])
  })
})
