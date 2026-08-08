import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/form-table',
      name: 'form-table',
      component: () => import('../views/FormTableView.vue')
    },
    {
      path: '/form-table-advanced',
      name: 'form-table-advanced',
      component: () => import('../views/FormTableAdvancedView.vue')
    },
    {
      path: '/form-table-docs',
      name: 'form-table-docs',
      component: () => import('../views/FormTableDocsView.vue')
    },
    {
      path: '/remote-schema',
      name: 'remote-schema',
      component: () => import('../views/RemoteSchemaView.vue')
    },
    {
      path: '/dynamic-slot-test',
      name: 'dynamic-slot-test',
      component: () => import('../views/DynamicSlotTestView.vue')
    },
    {
      path: '/row-column-operations',
      name: 'row-column-operations',
      component: () => import('../views/RowColumnOperationsView.vue')
    },
    {
      path: '/cell-merge',
      name: 'cell-merge',
      component: () => import('../views/CellMergeView.vue')
    },
    {
      path: '/enterprise-components',
      name: 'enterprise-components',
      component: () => import('../views/EnterpriseComponentsView.vue')
    },
    {
      path: '/debug',
      name: 'debug',
      component: () => import('../views/DebugView.vue')
    }
  ]
})

export default router
