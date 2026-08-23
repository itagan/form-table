import { nextTick } from 'vue'
import type { Ref } from 'vue'

interface HintTooltipAdapter {
  close: () => void
  getTooltipId: () => string | undefined
  hideImmediately: () => void
  isVisible: () => boolean
  retarget: (target: HTMLElement) => void
  showFor: (target: HTMLElement) => void
  update: () => void
}

interface HintTooltipPresenterOptions {
  tooltip: HintTooltipAdapter
  content: Ref<string>
  resolveReferenceTarget: (target: HTMLElement) => HTMLElement
}

interface DescribedElementState {
  element: HTMLElement
  tooltipId: string
  added: boolean
}

/** 管理唯一 Tooltip 的展示、定位和 aria-describedby 生命周期。 */
export function createHintTooltipPresenter(options: HintTooltipPresenterOptions) {
  let activeTarget: HTMLElement | null = null
  let referenceTarget: HTMLElement | null = null
  let activeAriaTarget: HTMLElement | null = null
  let activeContent = ''
  let describedState: DescribedElementState | null = null

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
    const tooltipId = options.tooltip.getTooltipId()
    if (!element || !tooltipId) return
    if (describedState?.element === element && describedState.tooltipId === tooltipId) return

    clearDescription()
    const ids = new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean))
    const added = !ids.has(tooltipId)
    ids.add(tooltipId)
    element.setAttribute('aria-describedby', Array.from(ids).join(' '))
    describedState = { element, tooltipId, added }
  }

  const hide = () => {
    if (activeTarget) options.tooltip.close()
    activeTarget = null
    referenceTarget = null
    activeAriaTarget = null
    activeContent = ''
    clearDescription()
  }

  const show = (
    target: HTMLElement,
    content: string,
    ariaTarget: HTMLElement,
    forcePositionUpdate = false
  ) => {
    const nextReferenceTarget = options.resolveReferenceTarget(target)
    if (
      activeTarget === target
      && activeContent === content
      && activeAriaTarget === ariaTarget
    ) {
      if (referenceTarget !== nextReferenceTarget) {
        referenceTarget = nextReferenceTarget
        void nextTick(() => {
          if (activeTarget === target && referenceTarget === nextReferenceTarget) {
            options.tooltip.retarget(nextReferenceTarget)
          }
        })
      } else if (forcePositionUpdate) {
        void nextTick(() => options.tooltip.update())
      }
      return
    }

    const targetChanged = activeTarget !== target
    if (targetChanged) {
      if (activeTarget && options.tooltip.isVisible()) {
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
          ) options.tooltip.retarget(nextReferenceTarget)
        })
        return
      }
      options.tooltip.hideImmediately()
      if (activeTarget) options.tooltip.close()
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
        options.tooltip.showFor(nextReferenceTarget)
      } else {
        options.tooltip.update()
      }
    })
  }

  return {
    hasActiveTarget: () => Boolean(activeTarget),
    hide,
    show
  }
}
