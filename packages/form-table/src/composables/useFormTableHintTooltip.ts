import { nextTick, onBeforeUnmount, onUpdated, watch } from 'vue'
import type { Ref } from 'vue'
import { FORM_TABLE_HINT_ATTRIBUTE } from '../utils/hint'

/** Element UI 2 表格内部也使用这些方法复用唯一的 el-tooltip。 */
export interface FormTableHintTooltipRef {
  referenceElm?: HTMLElement
  tooltipId?: string
  showPopper?: boolean
  setExpectedState: (expectedState: boolean) => void
  handleShowPopper: () => void
  handleClosePopper: () => void
  doDestroy: (forceDestroy?: boolean) => void
  updatePopper?: () => void
}

interface UseFormTableHintTooltipOptions {
  enabled: Readonly<Ref<boolean>>
  containerRef: Ref<HTMLElement | null>
  tooltipRef: Ref<FormTableHintTooltipRef | null>
  content: Ref<string>
}

interface DescribedElementState {
  element: HTMLElement
  previousValue: string | null
}

const HINT_SELECTOR = `[${FORM_TABLE_HINT_ATTRIBUTE}]`

/**
 * 在 FormTable 根节点委托全部提示事件，并集中隔离 Element UI 的内部 Tooltip API。
 */
export function useFormTableHintTooltip(options: UseFormTableHintTooltipOptions) {
  let hoveredTarget: HTMLElement | null = null
  let focusedTarget: HTMLElement | null = null
  let focusAriaTarget: HTMLElement | null = null
  let activeTarget: HTMLElement | null = null
  let describedState: DescribedElementState | null = null

  const isInsideContainer = (element: HTMLElement | null): element is HTMLElement => {
    const container = options.containerRef.value
    return Boolean(element && container && container.contains(element))
  }

  const findHintTarget = (candidate: EventTarget | null): HTMLElement | null => {
    if (!(candidate instanceof Element)) return null
    const target = candidate.closest(HINT_SELECTOR)
    return target instanceof HTMLElement && isInsideContainer(target) ? target : null
  }

  const clearDescription = () => {
    if (!describedState) return
    const { element, previousValue } = describedState
    if (previousValue === null) {
      element.removeAttribute('aria-describedby')
    } else {
      element.setAttribute('aria-describedby', previousValue)
    }
    describedState = null
  }

  const describeElement = (element: HTMLElement | null) => {
    const tooltipId = options.tooltipRef.value?.tooltipId
    if (!element || !tooltipId || describedState?.element === element) return

    clearDescription()
    const previousValue = element.getAttribute('aria-describedby')
    const ids = new Set((previousValue || '').split(/\s+/).filter(Boolean))
    ids.add(tooltipId)
    element.setAttribute('aria-describedby', Array.from(ids).join(' '))
    describedState = { element, previousValue }
  }

  const hideActiveTooltip = () => {
    const tooltip = options.tooltipRef.value
    tooltip?.setExpectedState(false)
    tooltip?.handleClosePopper()
    activeTarget = null
    options.content.value = ''
    clearDescription()
  }

  const showForTarget = (target: HTMLElement, content: string, ariaTarget: HTMLElement) => {
    const previousTarget = activeTarget
    activeTarget = target
    options.content.value = content
    describeElement(ariaTarget)

    void nextTick(() => {
      if (activeTarget !== target || !options.enabled.value) return
      const tooltip = options.tooltipRef.value
      if (!tooltip) return

      if (previousTarget !== target) {
        tooltip.setExpectedState(false)
        tooltip.showPopper = false
        tooltip.doDestroy(true)
        tooltip.referenceElm = target
        tooltip.setExpectedState(true)
        tooltip.handleShowPopper()
      } else {
        tooltip.updatePopper?.()
      }
    })
  }

  const syncActiveTarget = () => {
    if (!options.enabled.value) {
      hideActiveTooltip()
      return
    }

    if (!isInsideContainer(hoveredTarget)) hoveredTarget = null
    if (!isInsideContainer(focusedTarget)) {
      focusedTarget = null
      focusAriaTarget = null
    }

    const target = focusedTarget || hoveredTarget
    const content = target?.getAttribute(FORM_TABLE_HINT_ATTRIBUTE) || ''
    if (!target || !content) {
      hideActiveTooltip()
      return
    }

    const ariaTarget = target === focusedTarget && isInsideContainer(focusAriaTarget)
      ? focusAriaTarget
      : target
    showForTarget(target, content, ariaTarget)
  }

  const handleMouseOver = (event: MouseEvent) => {
    hoveredTarget = findHintTarget(event.target)
    syncActiveTarget()
  }

  const handleMouseOut = (event: MouseEvent) => {
    const sourceTarget = findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== hoveredTarget) return
    hoveredTarget = findHintTarget(event.relatedTarget)
    syncActiveTarget()
  }

  const handleFocusIn = (event: FocusEvent) => {
    focusedTarget = findHintTarget(event.target)
    focusAriaTarget = event.target instanceof HTMLElement ? event.target : focusedTarget
    syncActiveTarget()
  }

  const handleFocusOut = (event: FocusEvent) => {
    const sourceTarget = findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== focusedTarget) return
    focusedTarget = findHintTarget(event.relatedTarget)
    focusAriaTarget = focusedTarget && event.relatedTarget instanceof HTMLElement
      ? event.relatedTarget
      : focusedTarget
    syncActiveTarget()
  }

  watch(options.enabled, enabled => {
    if (!enabled) {
      hoveredTarget = null
      focusedTarget = null
      focusAriaTarget = null
      hideActiveTooltip()
    }
  })

  // 动态 hint、显隐和行删除均可能在没有新 DOM 事件时改变当前目标。
  onUpdated(syncActiveTarget)

  onBeforeUnmount(() => {
    hideActiveTooltip()
    options.tooltipRef.value?.doDestroy(true)
  })

  return {
    handleMouseOver,
    handleMouseOut,
    handleFocusIn,
    handleFocusOut
  }
}
