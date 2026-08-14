import type { Ref } from 'vue'

/** FormTable 单例模式依赖的 Element UI Tooltip 最小实例契约。 */
export interface FormTableHintTooltipRef {
  $refs?: {
    popper?: HTMLElement
  }
  referenceElm?: HTMLElement
  tooltipId?: string
  showPopper?: boolean
  setExpectedState?: (expectedState: boolean) => void
  handleShowPopper?: () => void
  handleClosePopper?: () => void
  doDestroy?: (forceDestroy?: boolean) => void
  updatePopper?: () => void
}

/**
 * 集中隔离 Element UI 2 Tooltip 的内部实例 API。
 * 这些能力在 peer 范围的 2.4.9 与当前 2.15.14 中保持一致。
 */
export function createElementTooltipAdapter(
  tooltipRef: Ref<FormTableHintTooltipRef | null>
) {
  const getInstance = () => tooltipRef.value

  return {
    getTooltipId: () => getInstance()?.tooltipId,
    isVisible: () => Boolean(getInstance()?.showPopper),
    hideImmediately: () => {
      const popper = getInstance()?.$refs?.popper
      if (popper) popper.style.display = 'none'
    },
    close: () => {
      const tooltip = getInstance()
      tooltip?.setExpectedState?.(false)
      tooltip?.handleClosePopper?.()
    },
    showFor: (target: HTMLElement) => {
      const tooltip = getInstance()
      if (!tooltip) return
      const popper = tooltip.$refs?.popper
      if (popper) popper.style.pointerEvents = 'none'
      tooltip.referenceElm = target
      tooltip.doDestroy?.()
      tooltip.setExpectedState?.(true)
      tooltip.handleShowPopper?.()
    },
    retarget: (target: HTMLElement) => {
      const tooltip = getInstance()
      if (!tooltip) return
      tooltip.referenceElm = target
      tooltip.doDestroy?.(true)
      tooltip.setExpectedState?.(true)
      tooltip.updatePopper?.()
    },
    update: () => getInstance()?.updatePopper?.(),
    destroy: () => getInstance()?.doDestroy?.(true)
  }
}
