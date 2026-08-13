import type { FormTableFieldConfig } from './types/config'
import type { TableRow } from './types/base'

export type FormTableFieldDefinition<TRow extends TableRow> = <
  TConfig extends FormTableFieldConfig<TRow>
>(config: TConfig) => TConfig

/**
 * 创建一个按业务行类型校验 fieldKey 的配置助手；运行时原样返回字段配置。
 */
export function createFormTableField<TRow extends TableRow = TableRow>(): FormTableFieldDefinition<TRow> {
  return <TConfig extends FormTableFieldConfig<TRow>>(config: TConfig): TConfig => config
}
