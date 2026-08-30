import type { Component } from 'vue'
import type { FormTableHintValue, TableRow } from '../index'

export const CustomInput: Component = { name: 'CustomInput' }
export const AlternativeInput: Component = { name: 'AlternativeInput' }
export const completeValueHint: FormTableHintValue = '完整字段值'
export const rows: TableRow[] = [{ name: 'Alice', profile: { city: '杭州' } }]
