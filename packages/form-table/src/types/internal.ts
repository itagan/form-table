import type { Ref } from 'vue'
import type { FormTableHintMode, FormTableHintTargets, TableRow } from './base'
import type { FormTableDefaultFieldHint } from './config'

/** 以下注入键仅用于 FormTable 内部组件通信。 */
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_UPDATE_KEY: unique symbol = Symbol('formTableUpdate')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
export const FORM_TABLE_HINT_MODE_KEY: unique symbol = Symbol('formTableHintMode')
export const FORM_TABLE_HINT_TARGETS_KEY: unique symbol = Symbol('formTableHintTargets')
export const FORM_TABLE_HINT_ROOT_KEY: unique symbol = Symbol('formTableHintRoot')
export const FORM_TABLE_DEFAULT_FIELD_HINT_KEY: unique symbol = Symbol('formTableDefaultFieldHint')

export type FormTableHintModeContext = Readonly<Ref<FormTableHintMode>>
export type FormTableHintTargetsContext = Readonly<Ref<FormTableHintTargets>>
export type FormTableHintRootContext = Readonly<Ref<HTMLElement | null>>
export type FormTableDefaultFieldHintContext<TRow extends TableRow = TableRow> = Readonly<
Ref<FormTableDefaultFieldHint<TRow> | undefined>
>
