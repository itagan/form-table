import type { TableRow } from '../types'

export function normalizeInsertIndex(index: number, rowCount: number) {
  return Math.max(0, Math.min(index, rowCount))
}

export function normalizeMoveIndex(index: number, rowCount: number) {
  const maxIndex = Math.max(rowCount - 1, 0)
  return Math.max(0, Math.min(index, maxIndex))
}

export function insertTableRow(tableData: TableRow[], index: number, row: TableRow) {
  const insertIndex = normalizeInsertIndex(index, tableData.length)
  const nextTableData = [...tableData]
  nextTableData.splice(insertIndex, 0, row)

  return {
    insertIndex,
    nextTableData
  }
}

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
