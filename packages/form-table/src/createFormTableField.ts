import type { FormItemConfig } from './types/config'
import type { TableRow } from './types/base'

type FormTableDeclaredFields<T> = {
  [TKey in keyof T as string extends TKey
    ? never
    : number extends TKey
      ? never
      : TKey]: T[TKey]
}

type FormTableDeclaredStringKey<T> = Extract<keyof FormTableDeclaredFields<T>, string>
type FormTablePathDepth = 0 | 1 | 2 | 3 | 4
type FormTablePreviousDepth = [never, 0, 1, 2, 3]
type FormTableIsAny<T> = 0 extends (1 & T) ? true : false
type FormTablePathLeaf =
  | string | number | boolean | bigint | symbol | null | undefined | Date | RegExp
  | ((...args: never[]) => unknown)

type FormTableNestedFieldPath<TValue, TDepth extends FormTablePathDepth> =
  FormTableIsAny<TValue> extends true
    ? never
    : NonNullable<TValue> extends readonly (infer TItem)[]
      ? `[${number}]` | (
        TDepth extends 0
          ? never
          : FormTableFieldPathInternal<TItem, FormTablePreviousDepth[TDepth]> extends infer TNestedPath
            ? TNestedPath extends string
              ? `[${number}].${TNestedPath}`
              : never
            : never
      )
      : NonNullable<TValue> extends FormTablePathLeaf
        ? never
        : TDepth extends 0
          ? never
          : FormTableFieldPathInternal<NonNullable<TValue>, FormTablePreviousDepth[TDepth]>

type FormTableFieldPathInternal<TValue, TDepth extends FormTablePathDepth> = {
  [TKey in FormTableDeclaredStringKey<TValue>]:
    | TKey
    | (FormTableNestedFieldPath<TValue[TKey], TDepth> extends infer TNestedPath
      ? TNestedPath extends string
        ? TNestedPath extends `[${number}]${string}`
          ? `${TKey}${TNestedPath}`
          : `${TKey}.${TNestedPath}`
        : never
      : never)
}[FormTableDeclaredStringKey<TValue>]

/** 可选字段助手使用的严格业务路径；不参与 FormTable 核心配置类型。 */
export type FormTableFieldPath<TRow extends TableRow> = string extends keyof TRow
  ? string
  : FormTableFieldPathInternal<TRow, 4>

type FormTableFieldConfigWithPath<TConfig, TFieldPath extends string> =
  TConfig extends unknown ? Omit<TConfig, 'fieldKey'> & { fieldKey: TFieldPath } : never

/** createFormTableField 接受的严格配置；普通 FormItemConfig 继续使用 string。 */
export type FormTableFieldConfig<TRow extends TableRow = TableRow> = FormTableFieldConfigWithPath<
  FormItemConfig<TRow>,
  FormTableFieldPath<TRow>
>

export type FormTableFieldDefinition<TRow extends TableRow> = <
  TConfig extends FormTableFieldConfig<TRow>
>(config: TConfig) => TConfig

/**
 * 创建一个按业务行类型校验 fieldKey 的配置助手；运行时原样返回字段配置。
 */
export function createFormTableField<TRow extends TableRow = TableRow>(): FormTableFieldDefinition<TRow> {
  return <TConfig extends FormTableFieldConfig<TRow>>(config: TConfig): TConfig => config
}
