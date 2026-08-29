import type { FormTableNavigationOptions } from '../types'
import { FORM_TABLE_FIELD_PROP_ATTRIBUTE } from './useFormTableFieldLocator'

interface FormTableKeyboardNavigationOptions {
  getOptions: () => FormTableNavigationOptions | undefined
  getMountedFields: () => HTMLElement[]
  focusElement: (element: HTMLElement) => boolean
}

const isModifiedEnter = (event: KeyboardEvent) => (
  event.ctrlKey || event.metaKey || event.altKey
)

const isIgnoredTarget = (target: HTMLElement) => Boolean(
  target.closest('textarea, [contenteditable="true"], button, [role="button"]')
)

/** 在当前实际挂载顺序中处理 Enter/Shift+Enter，不改变浏览器原生 Tab 行为。 */
export function useFormTableKeyboardNavigation(options: FormTableKeyboardNavigationOptions) {
  const handleNavigationKeydown = (event: KeyboardEvent) => {
    const navigationOptions = options.getOptions()
    if (
      !navigationOptions
      || navigationOptions.enabled === false
      || event.key !== 'Enter'
      || event.isComposing
      || event.keyCode === 229
      || isModifiedEnter(event)
      || !(event.target instanceof HTMLElement)
      || isIgnoredTarget(event.target)
    ) return

    const currentField = event.target.closest<HTMLElement>(`[${FORM_TABLE_FIELD_PROP_ATTRIBUTE}]`)
    if (!currentField) return
    const mountedFields = options.getMountedFields()
    const currentIndex = mountedFields.indexOf(currentField)
    if (currentIndex < 0) return

    event.preventDefault()
    const direction = event.shiftKey ? -1 : 1
    for (
      let index = currentIndex + direction;
      index >= 0 && index < mountedFields.length;
      index += direction
    ) {
      if (options.focusElement(mountedFields[index])) return
    }
  }

  return { handleNavigationKeydown }
}
