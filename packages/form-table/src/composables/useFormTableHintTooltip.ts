import { nextTick, onBeforeUnmount, onUpdated, watch } from 'vue'
import type { Ref } from 'vue'
import { FORM_TABLE_HINT_ATTRIBUTE } from '../utils/hint'

/** Element UI 2 表格内部也使用这些方法复用唯一的 el-tooltip。 */
export interface FormTableHintTooltipRef {
  $refs?: {
    popper?: HTMLElement
  }
  referenceElm?: HTMLElement
  tooltipId?: string
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
const TOOLTIP_ACTIVATION_DELAY = 50

/**
 * 在 FormTable 根节点委托全部提示事件，并集中隔离 Element UI 的内部 Tooltip API。
 */
export function useFormTableHintTooltip(options: UseFormTableHintTooltipOptions) {
  let hoveredTarget: HTMLElement | null = null
  let focusedTarget: HTMLElement | null = null
  let focusAriaTarget: HTMLElement | null = null
  let activeTarget: HTMLElement | null = null
  let describedState: DescribedElementState | null = null
  let activationTimer: ReturnType<typeof setTimeout> | null = null

  const clearActivationTimer = () => {
    if (activationTimer === null) return
    clearTimeout(activationTimer)
    activationTimer = null
  }

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
    clearActivationTimer()
    const tooltip = options.tooltipRef.value
    tooltip?.setExpectedState(false)
    tooltip?.handleClosePopper()
    activeTarget = null
    clearDescription()
  }

  const showForTarget = (target: HTMLElement, content: string, ariaTarget: HTMLElement) => {
    const previousTarget = activeTarget
    if (previousTarget !== target) {
      clearActivationTimer()
      const previousTooltip = options.tooltipRef.value
      // 先隐藏仍在淡出的旧 Popper，再替换内容，避免空内容或新内容闪现。
      if (previousTooltip?.$refs?.popper) previousTooltip.$refs.popper.style.display = 'none'
      if (previousTarget) {
        previousTooltip?.setExpectedState(false)
        previousTooltip?.handleClosePopper()
      }
    }
    activeTarget = target
    options.content.value = content
    describeElement(ariaTarget)

    void nextTick(() => {
      if (activeTarget !== target || !options.enabled.value) return
      const tooltip = options.tooltipRef.value
      if (!tooltip) return

      if (previousTarget !== target) {
        tooltip.referenceElm = target
        tooltip.doDestroy()
        tooltip.setExpectedState(true)
        activationTimer = setTimeout(() => {
          activationTimer = null
          if (activeTarget === target && options.enabled.value) {
            tooltip.handleShowPopper()
          }
        }, TOOLTIP_ACTIVATION_DELAY)
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

    // 与 el-table 单元格提示一致，鼠标当前指向的目标优先；焦点仅作键盘兜底。
    const target = hoveredTarget || focusedTarget
    const content = target?.getAttribute(FORM_TABLE_HINT_ATTRIBUTE) || ''
    if (!target || !content) {
      hideActiveTooltip()
      return
    }

    const ariaTarget = !hoveredTarget && target === focusedTarget && isInsideContainer(focusAriaTarget)
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
    const nextTarget = findHintTarget(event.relatedTarget)
    if (nextTarget === sourceTarget) return

    hoveredTarget = null
    if (nextTarget) {
      // 跨提示目标时先完成旧浮层离开，新目标由随后的 mouseover 激活。
      hideActiveTooltip()
      return
    }
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
