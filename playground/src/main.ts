import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import CompanyOrgSelector from './components/EnterpriseComponents/CompanyOrgSelector.vue'
import ApprovalStatusDisplay from './components/EnterpriseComponents/ApprovalStatusDisplay.vue'

Vue.use(ElementUI)

// 模拟公司组件库通过插件完成的全局注册，示例中使用字符串 renderer 解析。
Vue.component('corp-org-selector', CompanyOrgSelector)
Vue.component('biz-approval-status', ApprovalStatusDisplay)

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app')
