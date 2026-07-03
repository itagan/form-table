import { computed } from 'vue'
import type {
  CustomComponentConfig,
  FormTableBaseContext,
  TableRow
} from '../types'

interface FormTableModelProps {
  tableData: TableRow[]
  formData: Record<string, any>
  customComponents?: CustomComponentConfig[]
}

interface UseFormTableModelOptions {
  props: FormTableModelProps
  emitTableData: (tableData: TableRow[]) => void
  emitFormData: (formData: Record<string, any>) => void
}

/**
 * Maintains the public model contract for FormTable.
 *
 * `tableData` remains the editable source for rows; every internal row change
 * also emits `formData.tableData` so callers that use a form-level model stay
 * in sync without maintaining a second update path.
 */
export function useFormTableModel(options: UseFormTableModelOptions) {
  const { props, emitTableData, emitFormData } = options

  const formModel = computed(() => ({
    ...props.formData,
    tableData: props.tableData
  }))

  const formTableContext = computed<FormTableBaseContext>(() => ({
    formData: formModel.value,
    tableData: props.tableData
  }))

  const createTableBaseContext = (tableData: TableRow[]): FormTableBaseContext => ({
    formData: {
      ...props.formData,
      tableData
    },
    tableData
  })

  const emitFormDataUpdate = (tableData: TableRow[]) => {
    emitFormData({
      ...props.formData,
      tableData
    })
  }

  const emitTableDataChange = (tableData: TableRow[]) => {
    emitTableData(tableData)
    emitFormDataUpdate(tableData)
  }

  const customComponentsMap = computed(() => {
    const map: Record<string, any> = {}
    ;(props.customComponents || []).forEach((item) => {
      map[item.name] = item.component
    })
    return map
  })

  return {
    formModel,
    formTableContext,
    createTableBaseContext,
    emitTableDataChange,
    customComponentsMap
  }
}
