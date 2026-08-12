import { watchEffect } from 'vue'
import type { ColumnConfig, FormTableRowKey, TableRow } from '../types'
import { getValueByPath } from '../utils/path'

interface FormTableDiagnosticsOptions<TRow extends TableRow = TableRow> {
  getTableData: () => TRow[]
  getColumns: () => ColumnConfig<TRow>[]
  getRowKey: () => FormTableRowKey<TRow> | undefined
  getLegacyRowKey: () => unknown
}

interface DiagnosticIssue {
  id: string
  message: string
}

/** 每类诊断独立维护活动问题，避免无关数据变化触发整套配置扫描。 */
const createIssueReporter = () => {
  let activeIssueIds = new Set<string>()
  return (issues: DiagnosticIssue[]) => {
    const nextIssueIds = new Set(issues.map(issue => issue.id))
    issues.forEach(issue => {
      if (!activeIssueIds.has(issue.id)) console.warn(issue.message)
    })
    activeIssueIds = nextIssueIds
  }
}

const describeValue = (value: unknown) => {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'symbol') return value.toString()
  try {
    return JSON.stringify(value) || String(value)
  } catch {
    return String(value)
  }
}

const collectDuplicateKeys = (
  issues: DiagnosticIssue[],
  entries: Array<{ key?: string }>,
  scope: string
) => {
  const indexesByKey = new Map<string, number[]>()
  entries.forEach((entry, index) => {
    if (!entry.key) return
    const indexes = indexesByKey.get(entry.key) || []
    indexes.push(index)
    indexesByKey.set(entry.key, indexes)
  })

  indexesByKey.forEach((indexes, key) => {
    if (indexes.length < 2) return
    const location = indexes.join(', ')
    issues.push({
      id: `duplicate-key:${scope}:${key}:${location}`,
      message: `[FormTable] Duplicate key ${JSON.stringify(key)} in ${scope} at indexes [${location}]. Use a unique, stable key within this scope.`
    })
  })
}

const collectColumnIssues = <TRow extends TableRow>(
  issues: DiagnosticIssue[],
  columns: ColumnConfig<TRow>[]
) => {
  collectDuplicateKeys(issues, columns, 'columns')

  columns.forEach((typedColumn, columnIndex) => {
    const column = typedColumn as unknown as Record<string, unknown>
    const hasChildren = Object.prototype.hasOwnProperty.call(column, 'children')
    const hasCellSlot = Object.prototype.hasOwnProperty.call(column, 'cellSlot')

    if (hasChildren && hasCellSlot) {
      issues.push({
        id: `mixed-column-mode:${columnIndex}`,
        message: `[FormTable] columns[${columnIndex}] configures both children and cellSlot. Choose exactly one column rendering mode.`
      })
    }

    if (!hasChildren && !hasCellSlot) {
      const ignoredKeys = [
        'headerSlot',
        'headerProps',
        'headerHint',
        'fieldKey',
        'type',
        'component',
        'colProps',
        'formItemProps',
        'hint'
      ].filter(key => Object.prototype.hasOwnProperty.call(column, key))
      if (ignoredKeys.length > 0) {
        issues.push({
          id: `plain-column-ignored:${columnIndex}:${ignoredKeys.join(',')}`,
          message: `[FormTable] columns[${columnIndex}] is a plain Element column; ignored FormTable properties: ${ignoredKeys.join(', ')}. Use children or cellSlot for FormTable-rendered content.`
        })
      }
    }

    if (!Array.isArray(column.children)) return
    const rows = column.children as Array<{ key?: string, children?: Array<{ key?: string }> }>
    collectDuplicateKeys(issues, rows, `columns[${columnIndex}].children`)
    rows.forEach((row, rowIndex) => {
      if (Array.isArray(row.children)) {
        collectDuplicateKeys(
          issues,
          row.children,
          `columns[${columnIndex}].children[${rowIndex}].children`
        )
      }
    })
  })
}

const collectRowKeyIssues = <TRow extends TableRow>(
  issues: DiagnosticIssue[],
  tableData: TRow[],
  rowKey: FormTableRowKey<TRow> | undefined
) => {
  if (!(typeof rowKey === 'function' || (typeof rowKey === 'string' && rowKey.length > 0))) return

  const indexesByIdentity = new Map<unknown, number[]>()
  const missingIndexes: number[] = []

  tableData.forEach((row, index) => {
    let identity: unknown
    try {
      identity = typeof rowKey === 'function' ? rowKey(row) : getValueByPath(row, rowKey)
    } catch (error) {
      issues.push({
        id: `row-key-error:${index}:${String(error)}`,
        message: `[FormTable] rowKey threw while reading tableData[${index}]: ${String(error)}. Ensure rowKey can read every row.`
      })
      return
    }

    if (identity === undefined || identity === null) {
      missingIndexes.push(index)
      return
    }
    const indexes = indexesByIdentity.get(identity) || []
    indexes.push(index)
    indexesByIdentity.set(identity, indexes)
  })

  if (missingIndexes.length > 0) {
    issues.push({
      id: `missing-row-key:${missingIndexes.join(',')}`,
      message: `[FormTable] rowKey is missing for tableData indexes [${missingIndexes.join(', ')}]. Provide a non-null, stable identity for every row.`
    })
  }

  indexesByIdentity.forEach((indexes, identity) => {
    if (indexes.length < 2) return
    const location = indexes.join(', ')
    issues.push({
      id: `duplicate-row-key:${describeValue(identity)}:${location}`,
      message: `[FormTable] Duplicate rowKey ${describeValue(identity)} at tableData indexes [${location}]. rowKey must be unique and stable.`
    })
  })
}

/** 开发环境诊断当前受控数据和配置；问题持续存在时不重复刷屏。 */
export function useFormTableDiagnostics<TRow extends TableRow = TableRow>(
  options: FormTableDiagnosticsOptions<TRow>
) {
  if (!import.meta.env.DEV) return

  const reportLegacyIssues = createIssueReporter()
  watchEffect(() => {
    const issues: DiagnosticIssue[] = []
    if (options.getLegacyRowKey() !== undefined) {
      issues.push({
        id: 'legacy-table-props-row-key',
        message: '[FormTable] tableProps.rowKey is no longer supported; use the top-level rowKey prop.'
      })
    }
    reportLegacyIssues(issues)
  })

  const reportRowKeyIssues = createIssueReporter()
  watchEffect(() => {
    const issues: DiagnosticIssue[] = []
    collectRowKeyIssues(issues, options.getTableData(), options.getRowKey())
    reportRowKeyIssues(issues)
  })

  const reportColumnIssues = createIssueReporter()
  watchEffect(() => {
    const issues: DiagnosticIssue[] = []
    collectColumnIssues(issues, options.getColumns())
    reportColumnIssues(issues)
  })
}
