import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createRequire } from 'module'
import { createElementTooltipAdapter } from '../elementTooltipAdapter'
import type { FormTableHintTooltipRef } from '../elementTooltipAdapter'

const loadModule = createRequire(import.meta.url)

const getComponentMethods = (component: any) => {
  const methods = new Set(Object.keys(component.methods || {}))
  ;(component.mixins || []).forEach((mixin: any) => {
    Object.keys(mixin.methods || {}).forEach(method => methods.add(method))
  })
  return methods
}

describe('Element UI Tooltip adapter', () => {
  it.each([
    ['minimum peer version 2.4.9', () => loadModule('element-ui-legacy/lib/tooltip').default],
    ['current development version 2.15.14', () => loadModule('element-ui/lib/tooltip').default]
  ])('keeps the required contract for %s', (_name, loadTooltip) => {
    const methods = getComponentMethods(loadTooltip())
    expect(Array.from(methods)).toEqual(expect.arrayContaining([
      'setExpectedState',
      'handleShowPopper',
      'handleClosePopper',
      'doDestroy',
      'updatePopper'
    ]))
  })

  it('centralizes reference, visibility, position, and destruction operations', () => {
    const popper = document.createElement('div')
    const instance: FormTableHintTooltipRef = {
      $refs: { popper },
      tooltipId: 'tooltip-id',
      showPopper: true,
      setExpectedState: vi.fn(),
      handleShowPopper: vi.fn(),
      handleClosePopper: vi.fn(),
      doDestroy: vi.fn(),
      updatePopper: vi.fn()
    }
    const adapter = createElementTooltipAdapter(ref(instance))
    const target = document.createElement('button')

    adapter.hideImmediately()
    expect(adapter.isVisible()).toBe(true)
    adapter.showFor(target)
    adapter.retarget(target)
    adapter.update()
    adapter.close()
    adapter.destroy()

    expect(popper.style.display).toBe('none')
    expect(instance.referenceElm).toBe(target)
    expect(instance.setExpectedState).toHaveBeenNthCalledWith(1, true)
    expect(instance.setExpectedState).toHaveBeenNthCalledWith(2, true)
    expect(instance.setExpectedState).toHaveBeenNthCalledWith(3, false)
    expect(instance.handleShowPopper).toHaveBeenCalledTimes(1)
    expect(instance.handleClosePopper).toHaveBeenCalledTimes(1)
    expect(instance.doDestroy).toHaveBeenNthCalledWith(1)
    expect(instance.doDestroy).toHaveBeenNthCalledWith(2, true)
    expect(instance.doDestroy).toHaveBeenNthCalledWith(3, true)
    expect(instance.updatePopper).toHaveBeenCalledTimes(2)
  })
})
