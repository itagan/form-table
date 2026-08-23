import {
  FORM_TABLE_HINT_ATTRIBUTE,
  FORM_TABLE_HINT_FIELD_ATTRIBUTE,
  FORM_TABLE_HINT_ROOT_ATTRIBUTE,
  FORM_TABLE_HINT_TRIGGER_ATTRIBUTE
} from '../utils/hint'

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

/** 隔离 Hint DOM 目标解析和 content 回退诊断。 */
export function createHintTooltipTargetResolver(
  getContainer: () => HTMLElement | null
) {
  const warnedContentFallbacks = new Set<string>()

  const isOwnedByContainer = (element: HTMLElement | null): element is HTMLElement => {
    const container = getContainer()
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

  return {
    findHintTarget,
    isOwnedByContainer,
    resolveReferenceTarget
  }
}
