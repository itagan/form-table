import { computed, inject } from 'vue'
import type { Ref } from 'vue'
import type {
  FormItemConfig,
  FormTableFieldRenderContext,
  FormTableHintContext,
  FormTableRowContext,
  TableRow
} from '../types'
import { FORM_TABLE_HINT_CONTEXT_KEY } from '../types/internal'
import { resolveDynamicValue } from '../utils/dynamic'
import { applyHintTargetProps, resolveFormTableFieldHint } from '../utils/hint'

interface FormTableFieldPresentationOptions<TRow extends TableRow> {
  getRowContext: () => FormTableRowContext<TRow>
  getConfig: () => FormItemConfig<TRow>
  runtimeContext: Readonly<Ref<FormTableFieldRenderContext<TRow>>>
}

/** 解析字段所在 FormItem 的校验路径、Hint 和展示属性。 */
export function useFormTableFieldPresentation<TRow extends TableRow = TableRow>(
  options: FormTableFieldPresentationOptions<TRow>
) {
  const hintContext = inject<FormTableHintContext<TRow> | undefined>(
    FORM_TABLE_HINT_CONTEXT_KEY,
    undefined
  )
  const hintMode = hintContext?.mode ?? computed(() => 'title' as const)
  const hintTargets = hintContext?.targets ?? computed(() => 'field' as const)
  const defaultFieldHint = hintContext?.defaultFieldHint ?? computed(() => undefined)
  const hintTrigger = computed(() => options.getConfig().hintTrigger ?? 'item')

  /**
   * Element UI 以数组下标组织表单校验路径；行排序后 computed 会生成新路径，
   * 调用方仍应在动态增删行后按文档清理旧校验状态。
   */
  const propPath = computed(() => {
    const rowContext = options.getRowContext()
    if (rowContext.index < 0) return undefined
    return `tableData.${rowContext.index}.${options.getConfig().fieldKey}`
  })

  /** Hint 与其他动态字段配置共享上下文，并只在当前响应式周期求值一次。 */
  const resolvedHint = computed(() => {
    if (hintMode.value === false || hintTargets.value === 'header') return null
    const config = options.getConfig()
    const defaultHint = defaultFieldHint.value
    if (config.hint === undefined && !defaultHint) return null
    const source = resolveDynamicValue(config.hint, options.runtimeContext.value)
    return resolveFormTableFieldHint(source, options.runtimeContext.value, defaultHint)
  })

  /**
   * FormTable 始终掌控 form-item 的 prop；自动 Hint 覆盖透传 title，
   * 自定义托管或未声明 Hint 时保留调用方的原始 formItemProps。
   */
  const resolvedFormItemProps = computed(() => {
    const config = options.getConfig()
    const formItemProps = resolveDynamicValue(
      config.formItemProps,
      options.runtimeContext.value
    ) || {}
    return {
      ...applyHintTargetProps(formItemProps, resolvedHint.value, hintMode.value, {
        trigger: hintTrigger.value,
        fieldKey: config.fieldKey
      }),
      prop: propPath.value
    }
  })

  return {
    propPath,
    resolvedHint,
    hintMode,
    hintTrigger,
    resolvedFormItemProps
  }
}
