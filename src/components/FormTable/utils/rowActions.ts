import type { TableRow } from '../types'

/**
 * 归一化插入位置。
 *
 * 插入允许等于 rowCount，表示追加到末尾。
 */
export function normalizeInsertIndex(index: number, rowCount: number) {
  return Math.max(0, Math.min(index, rowCount))
}

/**
 * 归一化移动目标位置。
 *
 * 移动目标必须落在现有行范围内，空表时保持为 0。
 */
export function normalizeMoveIndex(index: number, rowCount: number) {
  const maxIndex = Math.max(rowCount - 1, 0)
  return Math.max(0, Math.min(index, maxIndex))
}

/**
 * 插入一行并返回新的 tableData。
 *
 * 不直接修改传入数组，保证外层可以通过引用变化触发 Vue 更新。
 */
export function insertTableRow(tableData: TableRow[], index: number, row: TableRow) {
  const insertIndex = normalizeInsertIndex(index, tableData.length)
  const nextTableData = [...tableData]
  nextTableData.splice(insertIndex, 0, row)

  return {
    insertIndex,
    nextTableData
  }
}

/**
 * 删除指定行。
 *
 * index 无效时返回 null，便于调用方直接短路，不需要重复边界判断。
 */
export function removeTableRow(tableData: TableRow[], index: number) {
  if (!tableData[index]) {
    return null
  }

  const nextTableData = [...tableData]
  const removedRow = nextTableData.splice(index, 1)[0]

  return {
    removedRow,
    nextTableData
  }
}

/**
 * 移动一行到目标位置。
 *
 * 当源行不存在或目标位置等于当前位置时返回 null，表示没有实际变更。
 */
export function moveTableRow(tableData: TableRow[], fromIndex: number, toIndex: number) {
  if (!tableData[fromIndex]) {
    return null
  }

  const normalizedToIndex = normalizeMoveIndex(toIndex, tableData.length)
  if (fromIndex === normalizedToIndex) {
    return null
  }

  const nextTableData = [...tableData]
  const movedRow = nextTableData.splice(fromIndex, 1)[0]
  nextTableData.splice(normalizedToIndex, 0, movedRow)

  return {
    movedRow,
    normalizedToIndex,
    nextTableData
  }
}
