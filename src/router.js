import { createRouter, createWebHistory } from 'vue-router'
import OverviewPage from './views/OverviewPage.vue'
import ProjectDetailPage from './views/ProjectDetailPage.vue'

const routes = [
  {
    path: '/',
    name: 'Overview',
    component: OverviewPage
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: ProjectDetailPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
