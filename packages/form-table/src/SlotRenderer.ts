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
    _createElement: CreateElement,
    context: RenderContext<SlotRendererProps>
  ): VNode | VNode[] | undefined {
    return context.props.slotFn(context.props.slotProps) as VNode | VNode[] | undefined
  }
}
