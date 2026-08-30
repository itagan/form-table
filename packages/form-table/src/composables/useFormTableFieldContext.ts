import { computed, inject } from 'vue'
import type {
  FormItemConfig,
  FormTableFieldBindingContext,
  FormTableFieldContext,
  FormTableRowPatch,
  FormTableRowContext,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from '../types'
import { FORM_TABLE_UPDATE_KEY } from '../types/internal'
import {
  createFieldRenderContext,
  extendLazyContext
} from '../utils/dynamic'
import { createBindingPatch, resolveBindingValue } from '../utils/binding'

interface FormTableFieldContextOptions<TRow extends TableRow> {
  getRowContext: () => FormTableRowContext<TRow>
  getConfig: () => FormItemConfig<TRow>
}

/**
 * 构造单个字段的响应式数据与更新上下文。
 *
 * 只处理“字段位于哪一行、绑定哪个路径、如何写回”，
 * FormItem 展示和实际渲染组件由独立模块解析。
 */
export function useFormTableFieldContext<TRow extends TableRow = TableRow>(
  options: FormTableFieldContextOptions<TRow>
) {
  /** 注入缺失时字段仍可只读渲染，更新助手退化为空操作。 */
  const updateApi = inject<FormTableUpdateApi<TRow> | undefined>(FORM_TABLE_UPDATE_KEY, undefined)

  /** 动态配置共享同一个字段渲染上下文，避免各属性分别拼装上下文。 */
  const runtimeContext = computed(() => createFieldRenderContext(
    options.getRowContext(),
    options.getConfig()
  ))

  /**
   * 组件 Props 可读取复合绑定值，但不获得任何更新助手。
   * bindingValue 按当前响应式周期惰性求值一次，供 Props、渲染器和完整字段上下文复用。
   */
  const bindingContext = computed<FormTableFieldBindingContext<TRow>>(() => {
    const context = runtimeContext.value
    const targetRow = context.row as TRow
    const binding = options.getConfig().binding
    let hasResolvedBindingValue = false
    let resolvedBindingValue: FormTableValue

    return extendLazyContext(context, {
      get bindingValue() {
        if (!hasResolvedBindingValue) {
          resolvedBindingValue = binding
            ? resolveBindingValue(targetRow, binding)
            : context.value
          hasResolvedBindingValue = true
        }
        return resolvedBindingValue
      }
    })
  })

  /**
   * 每次上下文重建时把当前行引用和 fieldKey 固化进更新闭包。
   * 业务代码保存旧 context 后再调用 setValue，仍只会尝试更新原行和原字段。
   */
  const fieldContext = computed<FormTableFieldContext<TRow>>(() => {
    const context = bindingContext.value
    const targetRow = context.row as TRow
    const targetFieldKey = context.fieldKey
    const binding = options.getConfig().binding
    const setValue = (nextValue: FormTableValue) => updateApi?.setValue(
      targetRow,
      targetFieldKey,
      nextValue
    )
    return extendLazyContext(context, {
      setValue,
      setBindingValue: (nextValue: FormTableValue) => {
        if (!binding) {
          setValue(nextValue)
          return
        }
        const patch = createBindingPatch<TRow>(binding, nextValue)
        if (Object.keys(patch).length > 0) updateApi?.updateRow(targetRow, patch)
      },
      updateRow: (patch: FormTableRowPatch<TRow>) => updateApi?.updateRow(targetRow, patch)
    })
  })

  return {
    runtimeContext,
    bindingContext,
    fieldContext
  }
}
