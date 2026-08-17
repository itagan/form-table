import { nextTick, onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'
import {
  FORM_TABLE_HINT_ATTRIBUTE,
  FORM_TABLE_HINT_FIELD_ATTRIBUTE,
  FORM_TABLE_HINT_TRIGGER_ATTRIBUTE,
  FORM_TABLE_HINT_ROOT_ATTRIBUTE
} from '../utils/hint'
import { createElementTooltipAdapter } from '../utils/elementTooltipAdapter'
import type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'

export type { FormTableHintTooltipRef } from '../utils/elementTooltipAdapter'

interface UseFormTableHintTooltipOptions {
  containerRef: Readonly<Ref<HTMLElement | null>>
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
const FORM_ITEM_SELECTOR = '.el-form-item'
const FORM_ITEM_CONTENT_SELECTOR = '.el-form-item__content'
const FORM_ITEM_ERROR_SELECTOR = '.el-form-item__error'

/** 查找 FormItem 内容区中可用于触发和定位的直接根节点。 */
function findVisibleContentRoots(target: HTMLElement): HTMLElement[] {
  if (!target.matches(FORM_ITEM_SELECTOR)) return []
  const content = Array.from(target.children).find(element => (
    element instanceof HTMLElement && element.matches(FORM_ITEM_CONTENT_SELECTOR)
  ))
  if (!(content instanceof HTMLElement)) return []

  return Array.from(content.children).filter((element): element is HTMLElement => {
    if (!(element instanceof HTMLElement) || element.matches(FORM_ITEM_ERROR_SELECTOR)) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return !element.hidden
      && style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0
  })
}

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
  let observedContainer: HTMLElement | null = null
  let observer: MutationObserver | null = null
  const warnedContentFallbacks = new Set<string>()

  const isOwnedByContainer = (element: HTMLElement | null): element is HTMLElement => {
    const container = options.containerRef.value
    return Boolean(
      element
      && container
      && container.contains(element)
      && element.closest(HINT_ROOT_SELECTOR) === container
    )
  }

  const resolveContentTarget = (target: HTMLElement): HTMLElement => {
    const candidates = findVisibleContentRoots(target)
    if (candidates.length === 1) return candidates[0]

    if (import.meta.env.DEV) {
      const fieldKey = target.getAttribute(FORM_TABLE_HINT_FIELD_ATTRIBUTE) || '(unknown)'
      const reason = candidates.length === 0 ? 'empty' : 'multiple'
      const warningKey = `${fieldKey}\u0000${reason}`
      if (!warnedContentFallbacks.has(warningKey)) {
        warnedContentFallbacks.add(warningKey)
        console.warn(
          `[FormTable] Field "${fieldKey}" uses hintTrigger: "content", but ${candidates.length} visible content root elements were found. Falling back to el-form-item.`
        )
      }
    }
    return target
  }

  /** 默认字段只改变定位；content 字段同时使用唯一内容根节点限制触发区域。 */
  const resolveReferenceTarget = (target: HTMLElement): HTMLElement => {
    if (!target.matches(FORM_ITEM_SELECTOR)) return target
    if (target.getAttribute(FORM_TABLE_HINT_TRIGGER_ATTRIBUTE) === 'content') {
      return resolveContentTarget(target)
    }
    const candidates = findVisibleContentRoots(target)
    return candidates.length === 1 ? candidates[0] : target
  }

  const findHintTarget = (candidate: EventTarget | null): HTMLElement | null => {
    if (!(candidate instanceof Element)) return null
    const target = candidate.closest(HINT_SELECTOR)
    if (!(target instanceof HTMLElement) || !isOwnedByContainer(target)) return null
    if (target.getAttribute(FORM_TABLE_HINT_TRIGGER_ATTRIBUTE) !== 'content') return target

    const triggerTarget = resolveContentTarget(target)
    return triggerTarget === target || triggerTarget.contains(candidate) ? target : null
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
    const nextReferenceTarget = resolveReferenceTarget(target)
    if (
      activeTarget === target
      && activeContent === content
      && activeAriaTarget === ariaTarget
    ) {
      if (referenceTarget !== nextReferenceTarget) {
        referenceTarget = nextReferenceTarget
        void nextTick(() => {
          if (activeTarget === target && referenceTarget === nextReferenceTarget) {
            tooltip.retarget(nextReferenceTarget)
          }
        })
      } else if (forcePositionUpdate) {
        void nextTick(() => tooltip.update())
      }
      return
    }

    const targetChanged = activeTarget !== target
    if (targetChanged) {
      if (activeTarget && tooltip.isVisible()) {
        activeTarget = target
        referenceTarget = nextReferenceTarget
        activeAriaTarget = ariaTarget
        activeContent = content
        options.content.value = content
        describeElement(ariaTarget)
        void nextTick(() => {
          if (
            activeTarget === target
            && activeContent === content
            && referenceTarget === nextReferenceTarget
          ) tooltip.retarget(nextReferenceTarget)
        })
        return
      }
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
      if (activeTarget !== target || activeContent !== content) return
      if (referenceTarget !== nextReferenceTarget) {
        referenceTarget = nextReferenceTarget
        tooltip.showFor(nextReferenceTarget)
      } else {
        tooltip.update()
      }
    })
  }

  const syncActiveTarget = (forcePositionUpdate = false) => {
    if (escapeSuppressed) {
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
      hoveredTarget = nextTarget
      syncActiveTarget()
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
    hideActiveTooltip()
    if (container) addListeners(container)
  }, { immediate: true, flush: 'post' })

  onBeforeUnmount(() => {
    hideActiveTooltip()
    removeListeners()
    tooltip.destroy()
  })
}
