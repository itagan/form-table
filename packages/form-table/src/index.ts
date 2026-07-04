import type { PluginObject } from 'vue'
import FormTable from './index.vue'

export * from './types.public'
export * from './configs'
export { FormTable }

const plugin: PluginObject<undefined> = {
  install(Vue) {
    Vue.component('FormTable', FormTable)
  }
}

export default FormTable
export { plugin as FormTablePlugin }
