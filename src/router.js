import { createRouter, createWebHistory } from 'vue-router'
import OverviewPage from './views/OverviewPage.vue'
import ProjectDetailPage from './views/ProjectDetailPage.vue'
import CategoryNetworkPage from './views/CategoryNetworkPage.vue'
import TRLHeatmapPage from './views/TRLHeatmapPage.vue'

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
  },
  {
    path: '/categories',
    name: 'CategoryNetwork',
    component: CategoryNetworkPage
  },
  {
    path: '/trl-heatmap',
    name: 'TRLHeatmap',
    component: TRLHeatmapPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
