import type {
  FieldBindingConfig,
  FieldBindingMapEntry,
  FormTableRecord,
  FormTableRowPatch,
  FormTableValue,
  TableRow
} from '../types'
import {
  getValueByPath,
  normalizePath,
  resolveValueByPath,
  setValueByPath
} from './path'

interface CompiledBindingEntry extends FieldBindingMapEntry {
  fieldSegments: readonly string[]
  valueSegments: readonly string[]
}

interface CompiledBinding {
  entries: CompiledBindingEntry[]
  valueRoot: 'array' | 'object'
}

const ARRAY_INDEX_SEGMENT = /^(0|[1-9]\d*)$/
const compiledBindingCache = new WeakMap<FieldBindingConfig, CompiledBinding>()

function isSameOrParentPath(left: readonly string[], right: readonly string[]) {
  if (left.length > right.length) return false
  return left.every((segment, index) => segment === right[index])
}

function assertIndependentPaths(
  entries: CompiledBindingEntry[],
  key: 'fieldSegments' | 'valueSegments',
  label: 'fieldPath' | 'valuePath'
) {
  entries.forEach((entry, index) => {
    entries.slice(index + 1).forEach((candidate) => {
      if (
        isSameOrParentPath(entry[key], candidate[key])
        || isSameOrParentPath(candidate[key], entry[key])
      ) {
        throw new TypeError(
          `[FormTable] binding.map contains duplicate or overlapping ${label} values: "${entry[label]}" and "${candidate[label]}"`
        )
      }
    })
  })
}

/** 校验并缓存静态 binding.map，避免每行每次响应式求值重复解析路径。 */
function compileBinding(binding: FieldBindingConfig): CompiledBinding {
  const cached = compiledBindingCache.get(binding)
  if (cached) return cached
  if (!Array.isArray(binding.map) || binding.map.length === 0) {
    throw new TypeError('[FormTable] binding.map must contain at least one entry')
  }

  const entries = binding.map.map((entry) => {
    if (
      !entry
      || typeof entry.fieldPath !== 'string'
      || typeof entry.valuePath !== 'string'
    ) {
      throw new TypeError('[FormTable] binding.map entries require string fieldPath and valuePath values')
    }
    const fieldSegments = normalizePath(entry.fieldPath)
    const valueSegments = normalizePath(entry.valuePath)
    if (fieldSegments.length === 0 || valueSegments.length === 0) {
      throw new TypeError('[FormTable] binding.map fieldPath and valuePath must not be empty')
    }
    return { ...entry, fieldSegments, valueSegments }
  })

  assertIndependentPaths(entries, 'fieldSegments', 'fieldPath')
  assertIndependentPaths(entries, 'valueSegments', 'valuePath')

  const rootKinds = new Set(entries.map(entry => (
    ARRAY_INDEX_SEGMENT.test(entry.valueSegments[0]) ? 'array' : 'object'
  )))
  if (rootKinds.size !== 1) {
    throw new TypeError('[FormTable] binding.map valuePath values cannot mix array and object roots')
  }

  const compiled: CompiledBinding = {
    entries,
    valueRoot: rootKinds.has('array') ? 'array' : 'object'
  }
  compiledBindingCache.set(binding, compiled)
  return compiled
}

/** 按字段映射从当前行构造组件受控值。 */
export function resolveBindingValue<TRow extends TableRow>(
  row: Readonly<TRow>,
  binding: FieldBindingConfig
): FormTableValue {
  const compiled = compileBinding(binding)
  let result: FormTableRecord = compiled.valueRoot === 'array' ? [] : {}

  compiled.entries.forEach((entry) => {
    result = setValueByPath(result, entry.valuePath, getValueByPath(row, entry.fieldPath))
  })
  return result
}

/** 按组件值反向生成一次 updateRow 所需的字段路径 patch。 */
export function createBindingPatch<TRow extends TableRow>(
  binding: FieldBindingConfig,
  value: FormTableValue
): FormTableRowPatch<TRow> {
  const compiled = compileBinding(binding)
  const patch: FormTableRecord = {}

  if (value === null) {
    compiled.entries.forEach((entry) => {
      patch[entry.fieldPath] = null
    })
    return patch as FormTableRowPatch<TRow>
  }

  compiled.entries.forEach((entry) => {
    const resolved = resolveValueByPath(value, entry.valuePath)
    if (resolved.exists) patch[entry.fieldPath] = resolved.value
  })
  return patch as FormTableRowPatch<TRow>
}
