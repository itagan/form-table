import type { FormTableRowPatch, FormTableValue, TableRow } from '../types/base'
import { getValueByPath, setValueByPath } from './path'

export interface PendingFieldChange {
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

export interface RowPatchResult<TRow extends TableRow> {
  nextRow: TRow
  changes: PendingFieldChange[]
}

/** 纯粹计算一行 patch 的结果和事件载荷，不触发 emit 或修改同步缓存。 */
export function applyRowPatch<TRow extends TableRow>(
  currentRow: TRow,
  patch: FormTableRowPatch<TRow>
): RowPatchResult<TRow> {
  let nextRow = currentRow
  const changes: PendingFieldChange[] = []

  Object.keys(patch).forEach((fieldKey) => {
    const value = patch[fieldKey]
    // 始终从逐步生成的 nextRow 读取，使有先后依赖的路径 Patch 保持对象键顺序语义。
    const previousValue = getValueByPath(nextRow, fieldKey)
    if (Object.is(previousValue, value)) return

    nextRow = setValueByPath(nextRow, fieldKey, value)
    changes.push({ fieldKey, value, previousValue })
  })

  return { nextRow, changes }
}
