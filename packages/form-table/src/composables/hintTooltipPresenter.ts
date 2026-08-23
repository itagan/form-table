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
  /** 仅移除本 Presenter 自己补入的 id，保留调用方原有 aria-describedby。 */
  added: boolean
}

/** 管理唯一 Tooltip 的展示、定位和 aria-describedby 生命周期。 */
export function createHintTooltipPresenter(options: HintTooltipPresenterOptions) {
  let activeTarget: HTMLElement | null = null
  let referenceTarget: HTMLElement | null = null
  let activeAriaTarget: HTMLElement | null = null
  let activeContent = ''
  let describedState: DescribedElementState | null = null

  /** 恢复接管前的 aria-describedby，不破坏同一元素上的其他辅助说明。 */
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
    // 业务目标和内容未变时只处理 DOM 布局变化，不重走 Tooltip 显隐周期。
    if (
      activeTarget === target
      && activeContent === content
      && activeAriaTarget === ariaTarget
    ) {
      if (referenceTarget !== nextReferenceTarget) {
        referenceTarget = nextReferenceTarget
        void nextTick(() => {
          // nextTick 前可能已经切换目标；过期任务不得重新指向旧节点。
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
        // Tooltip 已显示时直接换引用，避免先关闭再打开造成闪烁和延迟重置。
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
      // 尚未真正显示的延迟 Tooltip 必须立即取消，防止旧目标稍后弹出。
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
      // 展示动作延后到内容和引用 DOM 更新完成，并丢弃期间已过期的请求。
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
