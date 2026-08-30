import { onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  FORM_TABLE_HINT_TRIGGER_ATTRIBUTE
} from '../utils/hint'
import { createElementTooltipAdapter } from '../utils/elementTooltipAdapter'
import type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'
import { createHintTooltipPresenter } from './hintTooltipPresenter'
import { createHintTooltipTargetResolver } from './hintTooltipTargets'

export type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'

interface UseFormTableHintTooltipOptions {
  containerRef: Readonly<Ref<HTMLElement | null>>
  tooltipRef: Ref<FormTableHintTooltipRef | null>
  content: Ref<string>
}

interface HintInteractionState {
  /** 指针目标优先于键盘焦点目标。 */
  hoveredTarget: HTMLElement | null
  focusedTarget: HTMLElement | null
  /** 实际接收 aria-describedby 的焦点元素，可能是 FormItem 内部控件。 */
  focusAriaTarget: HTMLElement | null
  /** Escape 只压制当前目标，切换目标后恢复展示。 */
  escapeSuppressed: boolean
  /** 指针主动离开后，不因控件仍保有焦点而立即回弹。 */
  focusSuppressedByPointer: boolean
}

const createInteractionState = (): HintInteractionState => ({
  hoveredTarget: null,
  focusedTarget: null,
  focusAriaTarget: null,
  escapeSuppressed: false,
  focusSuppressedByPointer: false
})

/** 在当前 FormTable 根节点委托提示事件，并协调目标、展示与生命周期模块。 */
export function useFormTableHintTooltip(options: UseFormTableHintTooltipOptions) {
  const tooltip = createElementTooltipAdapter(options.tooltipRef)
  const targetResolver = createHintTooltipTargetResolver(() => options.containerRef.value)
  const presenter = createHintTooltipPresenter({
    tooltip,
    content: options.content,
    resolveReferenceTarget: targetResolver.resolveReferenceTarget
  })
  const state = createInteractionState()
  let observedContainer: HTMLElement | null = null
  let observer: MutationObserver | null = null
  let positionRefreshPending = false
  let positionRefreshVersion = 0

  const resetInteractionState = () => {
    Object.assign(state, createInteractionState())
  }

  const clearDetachedTargets = () => {
    if (!targetResolver.isOwnedByContainer(state.hoveredTarget)) state.hoveredTarget = null
    if (!targetResolver.isOwnedByContainer(state.focusedTarget)) {
      state.focusedTarget = null
      state.focusAriaTarget = null
    }
  }

  const resolveActiveTarget = () => (
    state.hoveredTarget
    || (state.focusSuppressedByPointer ? null : state.focusedTarget)
  )

  const syncActiveTarget = (forcePositionUpdate = false) => {
    if (state.escapeSuppressed) {
      presenter.hide()
      return
    }

    clearDetachedTargets()
    const target = resolveActiveTarget()
    const content = target?.getAttribute(FORM_TABLE_HINT_ATTRIBUTE) || ''
    if (!target || !content) {
      presenter.hide()
      return
    }

    const ariaTarget = !state.hoveredTarget
      && target === state.focusedTarget
      && targetResolver.isOwnedByContainer(state.focusAriaTarget)
      ? state.focusAriaTarget
      : target
    presenter.show(target, content, ariaTarget, forcePositionUpdate)
  }

  const schedulePositionRefresh = () => {
    if (positionRefreshPending) return
    positionRefreshPending = true
    const scheduledVersion = positionRefreshVersion
    void Promise.resolve().then(() => {
      if (scheduledVersion !== positionRefreshVersion) return
      positionRefreshPending = false
      if (state.hoveredTarget || state.focusedTarget) syncActiveTarget(true)
    })
  }

  const handleMouseOver = (event: MouseEvent) => {
    const nextTarget = targetResolver.findHintTarget(event.target)
    if (nextTarget !== state.hoveredTarget) state.escapeSuppressed = false
    state.hoveredTarget = nextTarget
    syncActiveTarget()
  }

  const handleMouseOut = (event: MouseEvent) => {
    const sourceTarget = targetResolver.findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== state.hoveredTarget) return
    const nextTarget = targetResolver.findHintTarget(event.relatedTarget)
    // FormItem 内部子节点之间移动不算真正离开当前 Hint 区域。
    if (nextTarget === sourceTarget) return

    state.hoveredTarget = null
    if (nextTarget) {
      state.hoveredTarget = nextTarget
      syncActiveTarget()
      return
    }
    if (state.focusedTarget) state.focusSuppressedByPointer = true
    syncActiveTarget()
  }

  const handleFocusIn = (event: FocusEvent) => {
    const nextTarget = targetResolver.findHintTarget(event.target)
    if (nextTarget !== state.focusedTarget) state.escapeSuppressed = false
    state.focusSuppressedByPointer = false
    state.focusedTarget = nextTarget
    state.focusAriaTarget = event.target instanceof HTMLElement ? event.target : state.focusedTarget
    syncActiveTarget()
  }

  const handleFocusOut = (event: FocusEvent) => {
    const sourceTarget = targetResolver.findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== state.focusedTarget) return
    const nextTarget = targetResolver.findHintTarget(event.relatedTarget)
    if (nextTarget !== state.focusedTarget) state.escapeSuppressed = false
    state.focusedTarget = nextTarget
    state.focusAriaTarget = state.focusedTarget && event.relatedTarget instanceof HTMLElement
      ? event.relatedTarget
      : state.focusedTarget
    syncActiveTarget()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !presenter.hasActiveTarget()) return
    state.escapeSuppressed = true
    presenter.hide()
  }

  const removeListeners = () => {
    if (!observedContainer) return
    observedContainer.removeEventListener('mouseover', handleMouseOver)
    observedContainer.removeEventListener('mouseout', handleMouseOut)
    observedContainer.removeEventListener('focusin', handleFocusIn)
    observedContainer.removeEventListener('focusout', handleFocusOut)
    observedContainer.removeEventListener('keydown', handleKeyDown)
    observedContainer = null
    observer?.disconnect()
    observer = null
    positionRefreshVersion += 1
    positionRefreshPending = false
  }

  const addListeners = (container: HTMLElement) => {
    observedContainer = container
    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseout', handleMouseOut)
    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)
    container.addEventListener('keydown', handleKeyDown)
    // Hint 内容、可见性或子树变化时，复用当前目标并在下一次 DOM 更新后刷新定位。
    observer = new MutationObserver(schedulePositionRefresh)
    observer.observe(container, {
      attributes: true,
      attributeFilter: [
        FORM_TABLE_HINT_ATTRIBUTE,
        FORM_TABLE_HINT_TRIGGER_ATTRIBUTE,
        'class',
        'hidden',
        'style'
      ],
      childList: true,
      subtree: true
    })
  }

  watch(options.containerRef, (container) => {
    // 根节点替换时旧 DOM 引用全部失效，Presenter 与交互状态必须一起清空。
    removeListeners()
    resetInteractionState()
    presenter.hide()
    if (container) addListeners(container)
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(() => {
    presenter.hide()
    removeListeners()
    tooltip.destroy()
  })
}
