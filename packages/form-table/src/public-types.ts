import type { FormTableComponent, TableRow } from './types.public'

export * from './types.public'
export { defineFormTableColumns } from './defineFormTableColumns'

export declare function createFormTable<TRow extends TableRow = TableRow>(): FormTableComponent<TRow>

export declare const FormTable: FormTableComponent<TableRow>
declare const _default: FormTableComponent<TableRow>
export default _default
