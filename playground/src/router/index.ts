import Vue from 'vue'
import VueRouter from 'vue-router'
import examples from '../../examples.json'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const viewLoaders: Record<string, () => Promise<unknown>> = {
  FormTableView: () => import('../views/FormTableView.vue'),
  FormTableAdvancedView: () => import('../views/FormTableAdvancedView.vue'),
  CellSlotView: () => import('../views/CellSlotView.vue'),
  FormTableDocsView: () => import('../views/FormTableDocsView.vue'),
  PerformanceView: () => import('../views/PerformanceView.vue'),
  RemoteSchemaView: () => import('../views/RemoteSchemaView.vue'),
  DynamicSlotTestView: () => import('../views/DynamicSlotTestView.vue'),
  RowColumnOperationsView: () => import('../views/RowColumnOperationsView.vue'),
  CellMergeView: () => import('../views/CellMergeView.vue'),
  HeterogeneousDemandView: () => import('../views/HeterogeneousDemandView.vue'),
  ItinerarySimpleView: () => import('../views/ItinerarySimpleView.vue'),
  EnterpriseComponentsView: () => import('../views/EnterpriseComponentsView.vue'),
  DebugView: () => import('../views/DebugView.vue')
}

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    ...examples.map(example => ({
      path: example.path,
      name: example.name,
      component: viewLoaders[example.view]
    }))
  ]
})

export default router
