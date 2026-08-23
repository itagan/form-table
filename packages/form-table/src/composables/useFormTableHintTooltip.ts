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

/** 在当前 FormTable 根节点委托提示事件，并协调目标、展示与生命周期模块。 */
export function useFormTableHintTooltip(options: UseFormTableHintTooltipOptions) {
  const tooltip = createElementTooltipAdapter(options.tooltipRef)
  const targetResolver = createHintTooltipTargetResolver(() => options.containerRef.value)
  const presenter = createHintTooltipPresenter({
    tooltip,
    content: options.content,
    resolveReferenceTarget: targetResolver.resolveReferenceTarget
  })
  let hoveredTarget: HTMLElement | null = null
  let focusedTarget: HTMLElement | null = null
  let focusAriaTarget: HTMLElement | null = null
  let escapeSuppressed = false
  let focusSuppressedByPointer = false
  let observedContainer: HTMLElement | null = null
  let observer: MutationObserver | null = null

  const syncActiveTarget = (forcePositionUpdate = false) => {
    if (escapeSuppressed) {
      presenter.hide()
      return
    }

    if (!targetResolver.isOwnedByContainer(hoveredTarget)) hoveredTarget = null
    if (!targetResolver.isOwnedByContainer(focusedTarget)) {
      focusedTarget = null
      focusAriaTarget = null
    }

    // 鼠标当前指向的目标优先；焦点只作为键盘兜底。
    // 指针主动离开 Hint 区域后，不因输入框仍保有焦点而让 Tooltip 常驻。
    const target = hoveredTarget || (focusSuppressedByPointer ? null : focusedTarget)
    const content = target?.getAttribute(FORM_TABLE_HINT_ATTRIBUTE) || ''
    if (!target || !content) {
      presenter.hide()
      return
    }

    const ariaTarget = !hoveredTarget
      && target === focusedTarget
      && targetResolver.isOwnedByContainer(focusAriaTarget)
      ? focusAriaTarget
      : target
    presenter.show(target, content, ariaTarget, forcePositionUpdate)
  }

  const handleMouseOver = (event: MouseEvent) => {
    const nextTarget = targetResolver.findHintTarget(event.target)
    if (nextTarget !== hoveredTarget) escapeSuppressed = false
    hoveredTarget = nextTarget
    syncActiveTarget()
  }

  const handleMouseOut = (event: MouseEvent) => {
    const sourceTarget = targetResolver.findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== hoveredTarget) return
    const nextTarget = targetResolver.findHintTarget(event.relatedTarget)
    if (nextTarget === sourceTarget) return

    hoveredTarget = null
    if (nextTarget) {
      hoveredTarget = nextTarget
      syncActiveTarget()
      return
    }
    if (focusedTarget) focusSuppressedByPointer = true
    syncActiveTarget()
  }

  const handleFocusIn = (event: FocusEvent) => {
    const nextTarget = targetResolver.findHintTarget(event.target)
    if (nextTarget !== focusedTarget) escapeSuppressed = false
    focusSuppressedByPointer = false
    focusedTarget = nextTarget
    focusAriaTarget = event.target instanceof HTMLElement ? event.target : focusedTarget
    syncActiveTarget()
  }

  const handleFocusOut = (event: FocusEvent) => {
    const sourceTarget = targetResolver.findHintTarget(event.target)
    if (!sourceTarget || sourceTarget !== focusedTarget) return
    const nextTarget = targetResolver.findHintTarget(event.relatedTarget)
    if (nextTarget !== focusedTarget) escapeSuppressed = false
    focusedTarget = nextTarget
    focusAriaTarget = focusedTarget && event.relatedTarget instanceof HTMLElement
      ? event.relatedTarget
      : focusedTarget
    syncActiveTarget()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !presenter.hasActiveTarget()) return
    escapeSuppressed = true
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
  }

  const addListeners = (container: HTMLElement) => {
    observedContainer = container
    container.addEventListener('mouseover', handleMouseOver)
    container.addEventListener('mouseout', handleMouseOut)
    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)
    container.addEventListener('keydown', handleKeyDown)
    observer = new MutationObserver(() => {
      if (hoveredTarget || focusedTarget) syncActiveTarget(true)
    })
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
    removeListeners()
    hoveredTarget = null
    focusedTarget = null
    focusAriaTarget = null
    escapeSuppressed = false
    focusSuppressedByPointer = false
    presenter.hide()
    if (container) addListeners(container)
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(() => {
    presenter.hide()
    removeListeners()
    tooltip.destroy()
  })
}
