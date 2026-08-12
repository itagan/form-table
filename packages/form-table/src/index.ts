import type { PluginObject } from 'vue'
import FormTable from './index.vue'
import type { FormTableComponent, TableRow } from './types.public'
export { defineFormTableColumns } from './defineFormTableColumns'

export * from './types.public'
export { FormTable }

/** 返回同一运行时组件的业务行泛型视图，不创建包装组件或额外实例。 */
export function createFormTable<TRow extends TableRow = TableRow>(): FormTableComponent<TRow> {
  return FormTable as unknown as FormTableComponent<TRow>
}

/** Vue 2 插件入口，支持 Vue.use(FormTablePlugin) 全局注册。 */
const plugin: PluginObject<undefined> = {
  install(Vue) {
    Vue.component('FormTable', FormTable)
  }
}

export default FormTable
export { plugin as FormTablePlugin }
