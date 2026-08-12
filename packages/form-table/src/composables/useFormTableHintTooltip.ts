import { nextTick, onBeforeUnmount, onUpdated, watch } from 'vue'
import type { Ref } from 'vue'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  FORM_TABLE_HINT_ROOT_ATTRIBUTE
} from '../utils/hint'
import { createElementTooltipAdapter } from '../utils/elementTooltipAdapter'
import type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'

export type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'

interface UseFormTableHintTooltipOptions {
  enabled: Readonly<Ref<boolean>>
  containerRef: Ref<HTMLElement | null>
  tooltipRef: Ref<FormTableHintTooltipRef | null>
  content: Ref<string>
}

interface DescribedElementState {
  element: HTMLElement
  tooltipId: string
  added: boolean
}

const HINT_SELECTOR = `[${FORM_TABLE_HINT_ATTRIBUTE}]`
const HINT_ROOT_SELECTOR = `[${FORM_TABLE_HINT_ROOT_ATTRIBUTE}]`

/** 在当前 FormTable 根节点委托提示事件，并维护唯一 Tooltip 的状态。 */
export function useFormTableHintTooltip(options: UseFormTableHintTooltipOptions) {
  const tooltip = createElementTooltipAdapter(options.tooltipRef)
  let hoveredTarget: HTMLElement | null = null
  let focusedTarget: HTMLElement | null = null
  let focusAriaTarget: HTMLElement | null = null
  let activeTarget: HTMLElement | null = null
  let referenceTarget: HTMLElement | null = null
  let activeAriaTarget: HTMLElement | null = null
  let activeContent = ''
  let describedState: DescribedElementState | null = null
  let escapeSuppressed = false
  let focusSuppressedByPointer = false

  const isOwnedByContainer = (element: HTMLElement | null): element is HTMLElement => {
    const container = options.containerRef.value
    return Boolean(
      element
      && container
      && container.contains(element)
      && element.closest(HINT_ROOT_SELECTOR) === container
    )
  }

  const findHintTarget = (candidate: EventTarget | null): HTMLElement | null => {
    if (!(candidate instanceof Element)) return null
    const target = candidate.closest(HINT_SELECTOR)
    return target instanceof HTMLElement && isOwnedByContainer(target) ? target : null
  }

  const clearDescription = () => {
    if (!describedState) return
    const { element, tooltipId, added } = describedState
    if (added) {
      const ids = (element.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(id => id && id !== tooltipId)
      if (ids.length) element.setAttribute('aria-describedby', ids.join(' '))
      else element.removeAttribute('aria-describedby')
    }
    describedState = null
  }

  const describeElement = (element: HTMLElement | null) => {
    const tooltipId = tooltip.getTooltipId()
    if (!element || !tooltipId) return
    if (describedState?.element === element && describedState.tooltipId === tooltipId) return

    clearDescription()
    const ids = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean))
    const added = !ids.has(tooltipId)
    ids.add(tooltipId)
    element.setAttribute('aria-describedby', Array.from(ids).join(' '))
    describedState = { element, tooltipId, added }
  }

  const hideActiveTooltip = () => {
    if (activeTarget) tooltip.close()
    activeTarget = null
    referenceTarget = null
    activeAriaTarget = null
    activeContent = ''
    clearDescription()
  }

  const showForTarget = (
    target: HTMLElement,
    content: string,
    ariaTarget: HTMLElement,
    forcePositionUpdate = false
  ) => {
    if (
      activeTarget === target
      && activeContent === content
      && activeAriaTarget === ariaTarget
    ) {
      if (forcePositionUpdate && referenceTarget === target) {
        void nextTick(() => tooltip.update())
      }
      return
    }

    const targetChanged = activeTarget !== target
    if (targetChanged) {
      tooltip.hideImmediately()
      if (activeTarget) tooltip.close()
      referenceTarget = null
    }

    activeTarget = target
    activeAriaTarget = ariaTarget
    activeContent = content
    options.content.value = content
    describeElement(ariaTarget)

    void nextTick(() => {
      if (activeTarget !== target || activeContent !== content || !options.enabled.value) return
      if (referenceTarget !== target) {
        referenceTarget = target
        tooltip.showFor(target)
      } else {
        tooltip.update()
      }
    })
  }

  const syncActiveTarget = (forcePositionUpdate = false) => {
    if (!options.enabled.value || escapeSuppressed) {
      hideActiveTooltip()
      return
    }

    if (!isOwnedByContainer(hoveredTarget)) hoveredTarget = null
    if (!isOwnedByContainer(focusedTarget)) {
      focusedTarget = null
      focusAriaTarget = null
    }

    // 鼠标当前指向的目标优先；焦点只作为键盘兜底。
    // 指针主动离开 Hint 区域后，不因输入框仍保有焦点而让 Tooltip 常驻。
    const target = hoveredTarget || (focusSuppressedByPointer ? null : focusedTarget)
    const content = target?.getAttribute(FORM_TABLE_HINT_ATTRIBUTE) || ''
    if (!target || !content) {
      hideActiveTooltip()
      return
    }

    const ariaTarget = !hoveredTarget && target === focusedTarget && isOwnedByContainer(focusAriaTarget)
      ? focusAriaTarget
      : target
    showForTarget(target, content, ariaTarget, forcePositionUpdate)
  }

  const handleMouseOver = (event: MouseEvent) => {
    const nextTarget = findHintTarget(event.target)
    if (nextTarget !== hoveredTarget) escapeSuppressed = false
    hoveredTarget = nextTarget
    syncActiveTarget()
  }

  const handleMouseOut = (event: MouseEvent) => {
    const sourceTarget = findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== hoveredTarget) return
    const nextTarget = findHintTarget(event.relatedTarget)
    if (nextTarget === sourceTarget) return

    hoveredTarget = null
    if (nextTarget) {
      hideActiveTooltip()
      return
    }
    if (focusedTarget) focusSuppressedByPointer = true
    syncActiveTarget()
  }

  const handleFocusIn = (event: FocusEvent) => {
    const nextTarget = findHintTarget(event.target)
    if (nextTarget !== focusedTarget) escapeSuppressed = false
    focusSuppressedByPointer = false
    focusedTarget = nextTarget
    focusAriaTarget = event.target instanceof HTMLElement ? event.target : focusedTarget
    syncActiveTarget()
  }

  const handleFocusOut = (event: FocusEvent) => {
    const sourceTarget = findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== focusedTarget) return
    const nextTarget = findHintTarget(event.relatedTarget)
    if (nextTarget !== focusedTarget) escapeSuppressed = false
    focusedTarget = nextTarget
    focusAriaTarget = focusedTarget && event.relatedTarget instanceof HTMLElement
      ? event.relatedTarget
      : focusedTarget
    syncActiveTarget()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !activeTarget) return
    escapeSuppressed = true
    hideActiveTooltip()
  }

  watch(options.enabled, enabled => {
    if (!enabled) {
      hoveredTarget = null
      focusedTarget = null
      focusAriaTarget = null
      escapeSuppressed = false
      focusSuppressedByPointer = false
      hideActiveTooltip()
    }
  })

  // 动态 Hint、显隐和行删除可能在没有新 DOM 事件时改变当前目标。
  onUpdated(() => {
    if (hoveredTarget || focusedTarget) syncActiveTarget(true)
  })

  onBeforeUnmount(() => {
    hideActiveTooltip()
    tooltip.destroy()
  })

  return {
    handleMouseOver,
    handleMouseOut,
    handleFocusIn,
    handleFocusOut,
    handleKeyDown
  }
}
