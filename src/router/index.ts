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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/form-table',
      name: 'form-table',
      // 按需引入FormTable演示页面
      component: () => import('../views/FormTableView.vue')
    },
    {
      path: '/form-table-advanced',
      name: 'form-table-advanced',
      // 按需引入FormTable高级演示页面
      component: () => import('../views/FormTableAdvancedView.vue')
    },
    {
      path: '/form-table-docs',
      name: 'form-table-docs',
      // FormTable 能力文档页面
      component: () => import('../views/FormTableDocsView.vue')
    },
    {
      path: '/dynamic-slot-test',
      name: 'dynamic-slot-test',
      // 动态插槽功能测试页面
      component: () => import('../views/DynamicSlotTestView.vue')
    }
  ]
})

export default router
