import type { FormTableValue, TableRow } from '../types/base'
import type { FormTableRowKey } from '../types/config/form-table'
import { getValueByPath } from './path'

export type RowKey<TRow extends TableRow = TableRow> = FormTableRowKey<TRow> | undefined

export interface RowIdentityIndex<TRow extends TableRow = TableRow> {
  source: TRow[]
  rowKey: Exclude<RowKey<TRow>, undefined>
  indexes: Map<unknown, number>
  duplicates: Set<unknown>
}

const NEGATIVE_ZERO_IDENTITY = Symbol('formTableNegativeZeroIdentity')

/** Map 使用 SameValueZero；单独编码 -0 以保持 Object.is 的身份语义。 */
export const normalizeRowIdentity = (identity: FormTableValue) => (
  typeof identity === 'number' && Object.is(identity, -0)
    ? NEGATIVE_ZERO_IDENTITY
    : identity
)

/** 空字符串不是可用的字段路径，统一按未配置处理。 */
export const isConfiguredRowKey = <TRow extends TableRow>(
  rowKey: RowKey<TRow>
): rowKey is Exclude<RowKey<TRow>, undefined> => (
  typeof rowKey === 'function' || (typeof rowKey === 'string' && rowKey.length > 0)
)

export const getRowIdentity = <TRow extends TableRow>(
  row: TRow,
  rowKey: Exclude<RowKey<TRow>, undefined>
) => typeof rowKey === 'function' ? rowKey(row) : getValueByPath(row, rowKey)

/** 为指定数据引用和 rowKey 建立唯一身份索引，并记录重复值。 */
export function createRowIdentityIndex<TRow extends TableRow>(
  source: TRow[],
  rowKey: Exclude<RowKey<TRow>, undefined>
): RowIdentityIndex<TRow> {
  const indexes = new Map<unknown, number>()
  const duplicates = new Set<unknown>()

  source.forEach((row, index) => {
    const identity = normalizeRowIdentity(getRowIdentity(row, rowKey))
    if (indexes.has(identity)) duplicates.add(identity)
    else indexes.set(identity, index)
  })

  return { source, rowKey, indexes, duplicates }
}

/** 按已建立的唯一身份索引定位目标行；缺失或重复身份均拒绝定位。 */
export function resolveRowIdentityIndex<TRow extends TableRow>(
  identityIndex: RowIdentityIndex<TRow>,
  targetRow: TRow,
  rowKey: Exclude<RowKey<TRow>, undefined>
) {
  const identity = getRowIdentity(targetRow, rowKey)
  if (identity === undefined || identity === null) return -1

  const normalizedIdentity = normalizeRowIdentity(identity)
  if (identityIndex.duplicates.has(normalizedIdentity)) return -1
  return identityIndex.indexes.get(normalizedIdentity) ?? -1
}
