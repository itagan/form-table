import { computed } from 'vue'
import type {
  CustomComponentsMap,
  FormTableBaseContext,
  FormTableProps,
  FormTableRecord,
  TableRow
} from '../types'

type FormTableModelProps = Pick<FormTableProps, 'tableData' | 'formData' | 'customComponents'>

interface UseFormTableModelOptions {
  props: FormTableModelProps
  emitTableData: (tableData: TableRow[]) => void
  emitFormData: (formData: FormTableRecord) => void
}

/**
 * 维护 FormTable 的模型同步约定。
 *
 * 组件内部只把 `tableData` 视为行编辑的主数据源；每次行数据变化时，
 * 再同步派发一份带最新 `tableData` 的 `formData`，方便外层用完整表单模型提交。
 */
export function useFormTableModel(options: UseFormTableModelOptions) {
  const { props, emitTableData, emitFormData } = options

  // Element UI Form 的 model 需要能按 `tableData.${rowIndex}.${field}` 路径取到值。
  const formModel = computed(() => ({
    ...props.formData,
    tableData: props.tableData
  }))

  // 动态配置函数共享的基础上下文，列/行/字段配置都会从这里读取全局状态。
  const formTableContext = computed<FormTableBaseContext>(() => ({
    formData: formModel.value,
    tableData: props.tableData
  }))

  // 行操作过程中 props 还没回写，用临时 tableData 构造上下文以计算显隐和校验路径。
  const createTableBaseContext = (tableData: TableRow[]): FormTableBaseContext => ({
    formData: {
      ...props.formData,
      tableData
    },
    tableData
  })

  // 保持兼容：外层如果监听 update:formData，也会拿到最新 tableData。
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

  // 子组件通过 name 查找自定义组件，避免在每个字段渲染时重复遍历注册列表。
  const customComponentsMap = computed(() => {
    const map: CustomComponentsMap = {}
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
