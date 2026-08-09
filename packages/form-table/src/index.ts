import type { PluginObject } from 'vue'
import FormTable from './index.vue'
export { defineFormTableColumns } from './defineFormTableColumns'

export * from './types.public'
export { FormTable }

/** Vue 2 插件入口，支持 Vue.use(FormTablePlugin) 全局注册。 */
const plugin: PluginObject<undefined> = {
  install(Vue) {
    Vue.component('FormTable', FormTable)
  }
}

export default FormTable
export { plugin as FormTablePlugin }
