import type { CreateElement, RenderContext, VNode } from 'vue'
import type { FormTableSlotFn, FormTableValue } from './types'

interface SlotRendererProps {
  slotFn: FormTableSlotFn
  slotProps: FormTableValue
}

/** Vue 2 functional components may return multiple VNodes without adding a DOM root. */
export default {
  name: 'FormTableSlotRenderer',
  functional: true,
  props: {
    slotFn: { type: Function, required: true },
    slotProps: { type: Object, required: true }
  },
  render(
    // Vue 2 functional render 签名要求 h 位于首参；插槽函数已生成 VNode，因此无需再次使用。
    _createElement: CreateElement,
    context: RenderContext<SlotRendererProps>
  ): VNode | VNode[] | undefined {
    return context.props.slotFn(context.props.slotProps) as VNode | VNode[] | undefined
  }
}
