import { computed, ref, watch } from 'vue'
import type { TableRow } from '../types/base'
import type { ColumnConfig } from '../types/config/column'
import type { FormTableTableContext } from '../types/context'
import { createColumnContext, resolveVisible } from '../utils/dynamic'

/** 管理 Element Table 动态列的稳定身份、顺序版本和可见集合。 */
export function useColumnIdentity<TRow extends TableRow = TableRow>(
  getColumns: () => ColumnConfig<TRow>[],
  tableContext: FormTableTableContext<TRow>
) {
  const columnIdentities = computed(() => {
    const columns = getColumns()
    const keyCounts = columns.reduce<Map<string, number>>((counts, column) => {
      if (column.key) counts.set(column.key, (counts.get(column.key) || 0) + 1)
      return counts
    }, new Map())

    return columns.map((column, sourceIndex) => (
      column.key && keyCounts.get(column.key) === 1
        ? `key:${column.key}`
        : `fallback:${column.key || column.label || 'column'}:${sourceIndex}`
    ))
  })

  const columnOrderVersion = ref(0)
  let previousColumnIdentities: string[] | null = null
  const columnIdentitySignature = computed(() => JSON.stringify(columnIdentities.value))

  watch(columnIdentitySignature, () => {
    const nextIdentities = columnIdentities.value
    if (previousColumnIdentities) {
      const previousSet = new Set(previousColumnIdentities)
      const nextSet = new Set(nextIdentities)
      const previousShared = previousColumnIdentities.filter(identity => nextSet.has(identity))
      const nextShared = nextIdentities.filter(identity => previousSet.has(identity))
      const orderChanged = previousShared.length > 1
        && previousShared.some((identity, index) => identity !== nextShared[index])

      if (orderChanged) columnOrderVersion.value += 1
    }
    previousColumnIdentities = [...nextIdentities]
  }, { immediate: true })

  const visibleColumns = computed(() => getColumns().reduce<Array<{
    column: ColumnConfig<TRow>
    renderKey: string
  }>>((result, column, sourceIndex) => {
    if (resolveVisible(column.visible, createColumnContext(tableContext, column))) {
      result.push({
        column,
        renderKey: `${columnIdentities.value[sourceIndex]}:order:${columnOrderVersion.value}`
      })
    }
    return result
  }, []))

  return { visibleColumns }
}
