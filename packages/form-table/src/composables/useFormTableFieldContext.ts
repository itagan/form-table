import { computed, inject, ref } from 'vue'
import type {
  FormItemConfig,
  FormTableFieldContext,
  FormTableHintModeContext,
  FormTableHintFormatterContext,
  FormTableResolvedFieldContext,
  FormTableRowContext,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from '../types'
import {
  FORM_TABLE_HINT_FORMATTER_KEY,
  FORM_TABLE_HINT_MODE_KEY,
  FORM_TABLE_UPDATE_KEY
} from '../types'
import {
  createFieldRenderContext,
  extendLazyContext,
  resolveDynamicValue
} from '../utils/dynamic'
import { applyHintTargetProps, resolveFormTableFieldHint } from '../utils/hint'

interface FormTableFieldContextOptions<TRow extends TableRow> {
  getRowContext: () => FormTableRowContext<TRow>
  getConfig: () => FormItemConfig<TRow>
}

/**
 * 构造单个字段的响应式上下文和 el-form-item 属性。
 *
 * 本组合式 API 只处理“字段位于哪一行、绑定哪个路径、如何写回”三类状态，
 * 不解析实际渲染组件，避免数据更新协议和渲染配置相互耦合。
 */
export function useFormTableFieldContext<TRow extends TableRow = TableRow>(
  options: FormTableFieldContextOptions<TRow>
) {
  /** 注入缺失时字段仍可只读渲染，更新助手退化为空操作。 */
  const updateApi = inject<FormTableUpdateApi<TRow>>(FORM_TABLE_UPDATE_KEY)
  const hintMode = inject<FormTableHintModeContext>(FORM_TABLE_HINT_MODE_KEY, ref<'title'>('title'))
  const hintFormatter = inject<FormTableHintFormatterContext<TRow>>(
    FORM_TABLE_HINT_FORMATTER_KEY,
    ref(undefined)
  )

  /**
   * Element UI 以数组下标组织表单校验路径；行排序后 computed 会生成新路径，
   * 调用方仍应在动态增删行后按文档清理旧校验状态。
   */
  const propPath = computed(() => {
    const rowContext = options.getRowContext()
    return `tableData.${rowContext.index}.${options.getConfig().fieldKey}`
  })

  /** 动态配置共享同一个字段渲染上下文，避免各属性分别拼装上下文。 */
  const runtimeContext = computed(() => createFieldRenderContext(
    options.getRowContext(),
    options.getConfig()
  ))

  /** Hint 与其他动态字段配置共享上下文，并只在当前响应式周期求值一次。 */
  const resolvedHint = computed(() => {
    const config = options.getConfig()
    if (!Object.prototype.hasOwnProperty.call(config, 'hint')) return null
    return resolveFormTableFieldHint(
      resolveDynamicValue(config.hint, runtimeContext.value),
      runtimeContext.value,
      hintFormatter.value
    )
  })

  /** 组件配置、监听器和 Slot 共享 Hint 求值后的稳定上下文。 */
  const resolvedContext = computed<FormTableResolvedFieldContext<TRow>>(() => extendLazyContext(
    runtimeContext.value,
    {
      get hint() {
        return resolvedHint.value
      }
    }
  ))

  /**
   * FormTable 始终掌控 form-item 的 prop；自动 Hint 覆盖透传 title，
   * 自定义托管或未声明 Hint 时保留调用方的原始 formItemProps。
   */
  const resolvedFormItemProps = computed(() => {
    const config = options.getConfig()
    const formItemProps = resolveDynamicValue(config.formItemProps, runtimeContext.value) || {}
    if (!Object.prototype.hasOwnProperty.call(config, 'hint')) {
      return { ...formItemProps, prop: propPath.value }
    }

    return {
      ...applyHintTargetProps(formItemProps, resolvedHint.value, hintMode.value),
      prop: propPath.value
    }
  })

  /**
   * 每次上下文重建时把当前行引用和 fieldKey 固化进更新闭包。
   * 业务代码保存旧 context 后再调用 setValue，仍只会尝试更新原行和原字段。
   */
  const fieldContext = computed<FormTableFieldContext<TRow>>(() => {
    const context = resolvedContext.value
    const targetRow = context.row as TRow
    const targetFieldKey = context.fieldKey
    return extendLazyContext(context, {
      setValue: (nextValue: FormTableValue) => updateApi?.setValue(
        targetRow,
        targetFieldKey,
        nextValue
      ),
      updateRow: (patch: Partial<TRow>) => updateApi?.updateRow(targetRow, patch)
    })
  })

  return {
    propPath,
    runtimeContext,
    resolvedContext,
    resolvedFormItemProps,
    resolvedHint,
    fieldContext
  }
}
