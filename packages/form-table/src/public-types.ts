import type { Component, PluginObject } from 'vue'
import type { FormTableComponent, TableRow } from './types.public'

export * from './types.public'
export { defineFormTableColumns } from './defineFormTableColumns'
export { createFormTableField } from './createFormTableField'

export declare function createFormTable<TRow extends TableRow = TableRow>(): FormTableComponent<TRow>

export declare const FormTable: Component
declare const _default: Component
export default _default
export declare const FormTablePlugin: PluginObject<undefined>
