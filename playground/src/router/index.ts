import Vue from 'vue'
import VueRouter from 'vue-router'
import examples from '../../examples.json'
import HomeView from '../views/HomeView.vue'

Vue.use(VueRouter)

const viewLoaders: Record<string, () => Promise<unknown>> = {
  FormTableView: () => import('../views/FormTableView.vue'),
  HintScenariosView: () => import('../views/HintScenariosView.vue'),
  FormTableAdvancedView: () => import('../views/FormTableAdvancedView.vue'),
  ElementColumnsView: () => import('../views/ElementColumnsView.vue'),
  CellSlotView: () => import('../views/CellSlotView.vue'),
  FormTableDocsView: () => import('../views/FormTableDocsView.vue'),
  PerformanceView: () => import('../views/PerformanceView.vue'),
  RemoteSchemaView: () => import('../views/RemoteSchemaView.vue'),
  FieldSlotVisibilityView: () => import('../views/FieldSlotVisibilityView.vue'),
  RowColumnOperationsView: () => import('../views/RowColumnOperationsView.vue'),
  CellMergeView: () => import('../views/CellMergeView.vue'),
  HeterogeneousDemandView: () => import('../views/HeterogeneousDemandView.vue'),
  ItinerarySimpleView: () => import('../views/ItinerarySimpleView.vue'),
  EnterpriseComponentsView: () => import('../views/EnterpriseComponentsView.vue'),
  CustomFieldTypesView: () => import('../views/CustomFieldTypesView.vue'),
  DirectComponentView: () => import('../views/DirectComponentView.vue'),
  CompositeBindingView: () => import('../views/CompositeBindingView.vue')
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
