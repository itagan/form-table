import { describe, expect, it } from 'vitest'
import { collectFieldTypeDefinitionDiagnostics } from '../fieldTypeDefinitionDiagnostics'
import { collectFieldTypeDiagnostics } from '../fieldTypeDiagnostics'

describe('field type diagnostics', () => {
  it('accepts valid definitions and reports their names as available', () => {
    const result = collectFieldTypeDefinitionDiagnostics({
      phone: { is: 'PhoneInput', props: { clearable: true } },
      money: {
        is: { name: 'MoneyInput' },
        model: {
          prop: 'amount',
          event: 'change',
          valueToProp: (_context: unknown, value: unknown) => value,
          valueFromEvent: (_context: unknown, value: unknown) => value
        },
        props: () => ({ currency: 'CNY' })
      }
    })

    expect(result).toEqual({
      diagnostics: [],
      availableTypeNames: ['phone', 'money']
    })
  })

  it('preserves reserved-name and invalid-definition diagnostics', () => {
    expect(collectFieldTypeDefinitionDiagnostics({
      input: { is: 'CustomInput' },
      missing: null
    }).diagnostics).toEqual([
      {
        key: 'reserved:input',
        message: '[FormTable] Field type "input" is reserved; the registered definition is ignored.'
      },
      {
        key: 'definition:missing',
        message: '[FormTable] Invalid field type "missing": definition must be an object.'
      }
    ])
  })

  it('reports unsupported keys, targets, props, and model members in stable order', () => {
    expect(collectFieldTypeDefinitionDiagnostics({
      broken: {
        is: '',
        props: true,
        model: {
          prop: 1,
          event: false,
          valueToProp: 'convert',
          valueFromEvent: 2
        },
        options: []
      },
      primitiveModel: { is: 'PrimitiveModel', model: 'input' }
    }).diagnostics).toEqual([
      {
        key: 'definition-keys:broken:options',
        message: '[FormTable] Invalid field type "broken": unsupported registration keys "options"; only is, model, and props are supported.'
      },
      {
        key: 'definition-is:broken',
        message: '[FormTable] Invalid field type "broken": "is" must be a non-empty component name or a component object.'
      },
      {
        key: 'definition-props:broken',
        message: '[FormTable] Invalid field type "broken": "props" must be an object or a synchronous function.'
      },
      {
        key: 'definition-model-prop:broken',
        message: '[FormTable] Invalid field type "broken": model.prop must be a string.'
      },
      {
        key: 'definition-model-event:broken',
        message: '[FormTable] Invalid field type "broken": model.event must be a string.'
      },
      {
        key: 'definition-model-valueToProp:broken',
        message: '[FormTable] Invalid field type "broken": model.valueToProp must be a synchronous function.'
      },
      {
        key: 'definition-model-valueFromEvent:broken',
        message: '[FormTable] Invalid field type "broken": model.valueFromEvent must be a synchronous function.'
      },
      {
        key: 'definition-model:primitiveModel',
        message: '[FormTable] Invalid field type "primitiveModel": "model" must be false or an object.'
      }
    ])
  })

  it('includes valid registered names in an unknown item diagnostic', () => {
    expect(collectFieldTypeDiagnostics(
      { phone: { is: 'PhoneInput' } },
      [{ key: 'contact', formItems: [{ key: 'primary', fieldKey: 'phone', type: 'missing' }] }]
    )).toEqual([{
      key: 'unknown:missing',
      message: '[FormTable] Unknown field type "missing" at column "contact", field "primary". Available custom types: "phone". Register it through fieldTypes or use type: "component".'
    }])
  })

  it('reports forbidden item overrides and the empty-registry fallback exactly', () => {
    expect(collectFieldTypeDiagnostics(
      { phone: { is: 'PhoneInput' } },
      [{ label: '联系方式', formItems: [{
        fieldKey: 'phone',
        type: 'phone',
        component: { resolveComponent: () => 'OtherInput', slot: 'phone' }
      }] }]
    )).toEqual([
      {
        key: 'item-key:phone:resolveComponent',
        message: '[FormTable] Custom field type "phone" cannot use item component.resolveComponent at column "联系方式", field "phone"; use type: "component" or "slot" for advanced rendering.'
      },
      {
        key: 'item-key:phone:slot',
        message: '[FormTable] Custom field type "phone" cannot use item component.slot at column "联系方式", field "phone"; use type: "component" or "slot" for advanced rendering.'
      }
    ])

    expect(collectFieldTypeDiagnostics(
      {},
      [{ formItems: [{ fieldKey: 'phone', type: 'missing' }] }]
    )).toEqual([{
      key: 'unknown:missing',
      message: '[FormTable] Unknown field type "missing" at column "#1", field "phone". No custom field types are registered on this instance. Register it through fieldTypes or use type: "component".'
    }])
  })
})
