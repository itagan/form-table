import type { Ref } from 'vue'
import type { FormTableHintMode, FormTableHintTargets, TableRow } from './base'
import type { FieldTypeRegistry, FormTableDefaultFieldHint } from './config'

/** 以下注入键仅用于 FormTable 内部组件通信。 */
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_UPDATE_KEY: unique symbol = Symbol('formTableUpdate')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
export const FORM_TABLE_HINT_CONTEXT_KEY: unique symbol = Symbol('formTableHintContext')
export const FORM_TABLE_FIELD_TYPES_KEY: unique symbol = Symbol('formTableFieldTypes')

export interface FormTableHintContext<TRow extends TableRow = TableRow> {
  mode: Readonly<Ref<FormTableHintMode>>
  targets: Readonly<Ref<FormTableHintTargets>>
  defaultFieldHint: Readonly<Ref<FormTableDefaultFieldHint<TRow> | undefined>>
}

export type FormTableFieldTypesRef<TRow extends TableRow = TableRow> = Readonly<Ref<
  FieldTypeRegistry<TRow>
>>
